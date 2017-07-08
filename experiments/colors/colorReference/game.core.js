/*  Copyright (c) 2012 Sven "FuzzYspo0N" Bergström, 
                  2013 Robert XD Hawkins
    
 written by : http://underscorediscovery.com
    written for : http://buildnewgames.com/real-time-multiplayer/
    
    substantially modified for collective behavior experiments on the web
    MIT Licensed.
*/

/*
  The main game class. This gets created on both server and
  client. Server creates one for each game that is hosted, and each
  client creates one for itself to play the game. When you set a
  variable, remember that it's only set in that instance.
*/
var has_require = typeof require !== 'undefined';

if( typeof _ === 'undefined' ) {
  if( has_require ) {
    _ = require('underscore');
    utils  = require(__base + 'sharedUtils/sharedUtils.js');
  }
  else throw 'mymodule requires underscore, see http://underscorejs.org';
}

var game_core = function(options){
  // Store a flag if we are the server instance
  this.server = options.server ;
  this.email = 'rxdh@stanford.edu';
  this.expid = 'pilot0';

  // save data to the following locations (allowed: 'csv', 'mongo')
  this.dataStore = [];
  
  // How many players in the game?
  this.players_threshold = 2;
  this.playerRoleNames = {
    role1 : 'speaker',
    role2 : 'listener'
  };
  
  //Dimensions of world in pixels and numberof cells to be divided into;
  this.numHorizontalCells = 3;
  this.numVerticalCells = 1;
  this.cellDimensions = {height : 300, width : 300}; // in pixels
  this.cellPadding = 0;
  this.world = {height : (this.cellDimensions.height * this.numVerticalCells
              + this.cellPadding),
              width : (this.cellDimensions.width * this.numHorizontalCells
              + this.cellPadding)}; 
  
  // Which round are we on (initialize at -1 so that first round is 0-indexed)
  this.roundNum = -1;

  // How many rounds do we want people to complete?
  this.numRounds = 50;

  // How many mistakes have the pair made on the current trial?
  this.attemptNum = 0;

  // This will be populated with the tangram set
  this.trialInfo = {};
  
  if(this.server) {
    // If we're initializing the server game copy, pre-create the list of trials
    // we'll use, make a player object, and tell the player who they are
    this.id = options.id;
    this.expName = options.expName;
    this.player_count = options.player_count;
    this.trialList = this.makeTrialList();
    this.data = {
      id : this.id,
      trials : [],
      catch_trials : [], system : {}, 
      subject_information : {
        gameID: this.id,
	score: 0
      }
    };
    this.players = [{
      id: options.player_instances[0].id,
      instance: options.player_instances[0].player,
      player: new game_player(this,options.player_instances[0].player)
    }];
    this.streams = {};
    this.server_send_update();
  } else {
    // If we're initializing a player's local game copy, create the player object
    this.players = [{
      id: null,
      instance: null,
      player: new game_player(this)
    }];
  }
};

var game_player = function( game_instance, player_instance) {
  this.instance = player_instance;
  this.game = game_instance;
  this.role = '';
  this.message = '';
  this.id = '';
}; 

// server side we set some classes to global types, so that
// we can use them in other files (specifically, game.server.js)
if('undefined' != typeof global) {
  module.exports = {game_core, game_player};  
}

// HELPER FUNCTIONS

// Method to easily look up player 
game_core.prototype.get_player = function(id) {
  var result = _.find(this.players, function(e){ return e.id == id; });
  return result.player;
};

// Method to get list of players that aren't the given id
game_core.prototype.get_others = function(id) {
  var otherPlayersList = _.filter(this.players, function(e){ return e.id != id; });
  var noEmptiesList = _.map(otherPlayersList, function(p){return p.player ? p : null;});
  return _.without(noEmptiesList, null);
};

// Returns all players
game_core.prototype.get_active_players = function() {
  var noEmptiesList = _.map(this.players, function(p){return p.player ? p : null;});
  return _.without(noEmptiesList, null);
};

// Advance to the next round
game_core.prototype.newRound = function() {
  // If you've reached the planned number of rounds, end the game  
  if(this.roundNum == this.numRounds - 1) {
    _.map(this.get_active_players(), function(p){
      p.player.instance.disconnect();});
  } else {
    // Otherwise, get the preset list of tangrams for the new round
    this.roundNum += 1;
    this.trialInfo = {currStim: this.trialList[this.roundNum]};
    this.server_send_update();
  }
};

game_core.prototype.getRandomizedConditions = function() {
  var numEach = this.numRounds / 3;
  var conditions = [].concat(utils.fillArray("equal", numEach),
			     utils.fillArray("closer", numEach),
			     utils.fillArray("further", numEach));
  return _.shuffle(conditions);
};

game_core.prototype.sampleStimulusLocs = function() {
  var listenerLocs = _.shuffle([[1,1], [2,1], [3,1]]);
  var speakerLocs = _.shuffle([[1,1], [2,1], [3,1]]);
  return {listener : listenerLocs, speaker : speakerLocs};
};

game_core.prototype.makeTrialList = function () {
  var local_this = this;
  var conditionList = this.getRandomizedConditions();
  var trialList = [];
  for (var i = 0; i < conditionList.length; i++) {
    var condition = conditionList[i];
    var objList = sampleTrial(condition); // Sample three objects 
    var locs = this.sampleStimulusLocs(); // Sample locations for those objects
    trialList.push(_.map(_.zip(objList, locs.speaker, locs.listener), function(tuple) {
      var object = _.clone(tuple[0]);
      object.width = local_this.cellDimensions.width;
      object.height = local_this.cellDimensions.height;      
      var speakerGridCell = local_this.getPixelFromCell(tuple[1][0], tuple[1][1]); 
      var listenerGridCell = local_this.getPixelFromCell(tuple[2][0], tuple[2][1]);
      object.speakerCoords = {
	gridX : tuple[1][0],
	gridY : tuple[1][1],
	trueX : speakerGridCell.centerX - object.width/2,
	trueY : speakerGridCell.centerY - object.height/2,
	gridPixelX: speakerGridCell.centerX - 150,
	gridPixelY: speakerGridCell.centerY - 150
      };
      object.listenerCoords = {
	gridX : tuple[2][0],
	gridY : tuple[2][1],
	trueX : listenerGridCell.centerX - object.width/2,
	trueY : listenerGridCell.centerY - object.height/2,
	gridPixelX: listenerGridCell.centerX - 150,
	gridPixelY: listenerGridCell.centerY - 150
      };
      return object;
    }));
  };
  return(trialList);
};

game_core.prototype.server_send_update = function(){
  //Make a snapshot of the current state, for updating the clients
  var local_game = this;
  
  // Add info about all players
  var player_packet = _.map(local_game.players, function(p){
    return {id: p.id,
            player: null};
  });
  
  var state = {
    gs : this.game_started,   // true when game's started
    pt : this.players_threshold,
    pc : this.player_count,
    dataObj  : this.data,
    roundNum : this.roundNum,
    trialInfo: this.trialInfo
  };

  _.extend(state, {players: player_packet});
  _.extend(state, {instructions: this.instructions});

  //Send the snapshot to the players
  this.state = state;
  _.map(local_game.get_active_players(), function(p){
    p.player.instance.emit( 'onserverupdate', state);});
};

var sampleTrial = function(condition) {
  var opts = {fixedL : true};
  var target = {color: utils.randomColor(opts), targetStatus : "target"};
  var firstDistractor = {color: utils.randomColor(opts), targetStatus: "distr1"};
  var secondDistractor = {color: utils.randomColor(opts), targetStatus: "distr2"};
  if(checkItem(condition,target,firstDistractor,secondDistractor)) {
    // attach "condition" to each stimulus object
    return _.map([target, firstDistractor, secondDistractor], function(x) {
      return _.extend(x, {condition: condition});
    });
  } else { // Try again if something is wrong
    return sampleTrial(condition);
  }
};

var checkItem = function(condition, target, firstDistractor, secondDistractor) {
  var f = 5; // floor difference
  var t = 20; // threshold
  var targetVsDistr1 = utils.colorDiff(target.color, firstDistractor.color);
  var targetVsDistr2 = utils.colorDiff(target.color, secondDistractor.color);
  var distr1VsDistr2 = utils.colorDiff(firstDistractor.color, secondDistractor.color);
  if(targetVsDistr1 < f || targetVsDistr2 < f || distr1VsDistr2 < f) {
    return false;
  } else if(condition === "equal") {
    return targetVsDistr1 > t && targetVsDistr2 > t && distr1VsDistr2 > t;
  } else if (condition === "closer") {
    return targetVsDistr1 < t && targetVsDistr2 < t && distr1VsDistr2 < t;
  } else if (condition === "further") {
    return targetVsDistr1 < t && targetVsDistr2 > t && distr1VsDistr2 > t;
  } else {
    throw "condition name (" + condition + ") not known";
  }
};

// maps a grid location to the exact pixel coordinates
// for x = 1,2,3,4; y = 1,2,3,4
game_core.prototype.getPixelFromCell = function (x, y) {
  return {
    centerX: (this.cellPadding/2 + this.cellDimensions.width * (x - 1)
        + this.cellDimensions.width / 2),
    centerY: (this.cellPadding/2 + this.cellDimensions.height * (y - 1)
        + this.cellDimensions.height / 2),
    upperLeftX : (this.cellDimensions.width * (x - 1) + this.cellPadding/2),
    upperLeftY : (this.cellDimensions.height * (y - 1) + this.cellPadding/2),
    width: this.cellDimensions.width,
    height: this.cellDimensions.height
  };
};

// maps a raw pixel coordinate to to the exact pixel coordinates
// for x = 1,2,3,4; y = 1,2,3,4
game_core.prototype.getCellFromPixel = function (mx, my) {
  var cellX = Math.floor((mx - this.cellPadding / 2) / this.cellDimensions.width) + 1;
  var cellY = Math.floor((my - this.cellPadding / 2) / this.cellDimensions.height) + 1;
  return [cellX, cellY];
};

game_core.prototype.getTangramFromCell = function (gridX, gridY) {
  for (i=0; i < this.objects.length; i++) {
    if (this.objects[i].gridX == gridX && this.objects[i].gridY == gridY) {
      var tangram = this.objects[i];
      var tangramIndex = i;
      // return tangram;
      return i;
    }
  }
  console.log("Did not find tangram from cell!");
};

// readjusts trueX and trueY values based on the objLocation and width and height of image (objImage)
game_core.prototype.getTrueCoords = function (coord, objLocation, objImage) {
  var trueX = this.getPixelFromCell(objLocation.gridX, objLocation.gridY).centerX - objImage.width/2;
  var trueY = this.getPixelFromCell(objLocation.gridX, objLocation.gridY).centerY - objImage.height/2;
  if (coord == "xCoord") {
    return trueX;
  }
  if (coord == "yCoord") {
    return trueY;
  }
};
  
