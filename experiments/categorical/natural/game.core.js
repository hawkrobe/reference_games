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
  else throw new ('mymodule requires underscore, see http://underscorejs.org');
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
  this.numRounds = 36;

  // How many mistakes have the pair made on the current trial?
  this.attemptNum = 0;

  // This will be populated with the tangram set
  this.objects = [];
  
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
        gameID: this.id
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
  var objectList = _.map(require('./stimuli/objectSet', _.clone));
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
  if(this.roundNum == this.numRounds - 1) {
    // If you've reached the planned number of rounds, end the game
    var local_game = this;
    _.map(local_game.get_active_players(), function(p){
      p.player.instance.disconnect();
    });
  } else {
    // Otherwise, get the preset list of tangrams for the new round
    this.roundNum += 1;
    console.log("now on round " + (this.roundNum + 1));
    this.objects = this.trialList[this.roundNum];
    this.server_send_update();
  }
};

game_core.prototype.makeTrialList = function () {
  var local_this = this;
  var conditionList = getRandomizedConditions();
  var trialList = [];
  var previousTargets = [];
  for (var i = 0; i < conditionList.length; i++) {
    var condition = conditionList[i];
    var objList = sampleObjects(condition, previousTargets); // Sample three objects 
    previousTargets.push(objList[0].name); // Keep track of targets seen
    var locs = sampleStimulusLocs(); // Sample locations for those objects
    trialList.push(_.map(_.zip(objList, locs.speaker, locs.listener), function(tuple) {
      var object = _.clone(tuple[0]);  
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


//scores the number of incorrect tangram matches between listener and speaker
//returns the correct score out of total tangrams
game_core.prototype.game_score = function(game_objects) {
   var correct = 0;
   var incorrect = 0;
   for(var i = game_objects.length; i--; i>=0) {
      if(game_objects[i].listenerCoords.gridX == game_objects[i].speakerCoords.gridX) {
        if(game_objects[i].listenerCoords.gridY == game_objects[i].speakerCoords.gridY) {
          correct = correct + 1;
        }
      }
      incorrect = incorrect + 1;
  }
  return correct;
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
    objects: this.objects
  };

  _.extend(state, {players: player_packet});
  _.extend(state, {instructions: this.instructions});
  if(player_packet.length == 2) {
    _.extend(state, {objects: this.objects});
  }

  //Send the snapshot to the players
  this.state = state;
  _.map(local_game.get_active_players(), function(p){
    p.player.instance.emit( 'onserverupdate', state);});
};

var sampleObjects = function(condition, earlierTargets) {
  var samplingInfo = {
    1 : {class: getObjectSubset("distrClass1"),
	 selector: firstClassSelector},
    2 : {class: getObjectSubset("distrClass2"),
	 selector: secondClassSelector},
    3 : {class: getObjectSubset("distrClass2"),
	 selector: thirdClassSelector}
  };
  
  var conditionParams = condition.slice(-2).split("");    
  var firstDistrInfo = samplingInfo[conditionParams[0]];
  var secondDistrInfo = samplingInfo[conditionParams[1]];
  var remainingTargets = getRemainingTargets(earlierTargets);
  
  var target = _.sample(remainingTargets);
  var firstDistractor = firstDistrInfo.selector(target, firstDistrInfo.class);
  var secondDistractor = secondDistrInfo.selector(target, secondDistrInfo.class);
  if(checkItem(condition,target,firstDistractor,secondDistractor)) {
    // attach "condition" to each stimulus object
    return _.map([target, firstDistractor, secondDistractor], function(x) {
      return _.extend(x, {condition: condition});
    });
  } else { // Try again if something is wrong
    return sampleObjects(condition, earlierTargets);
  }
};

var checkItem = function(condition, target, firstDistractor, secondDistractor) {
  var diffName = firstDistractor.name != secondDistractor.name;
  if(condition === "distr23") {
    var diffSuper = firstDistractor.superdomain != secondDistractor.superdomain;
    return diffName && diffSuper;
  } else if (condition === "distr33") {
    var diffTarget = (firstDistractor.superdomain != target.superdomain
		      && secondDistractor.superdomain != target.superdomain);
    return diffName && diffTarget;
  } else {
    return diffName;
  }
};

var getRemainingTargets = function(earlierTargets) {
  var criticalObjs = getObjectSubset("target");
  return _.filter(criticalObjs, function(x) {
    return !_.contains(earlierTargets, x.name );
  });
};

var getRandomizedConditions = function() {
  var conditions = [].concat(utils.fillArray("distr12", 9),
			     utils.fillArray("distr22", 9),
			     utils.fillArray("distr23", 9),
			     utils.fillArray("distr33", 9));
  return _.shuffle(conditions);
};

var sampleStimulusLocs = function() {
  var listenerLocs = _.shuffle([[1,1], [2,1], [3,1]]);
  var speakerLocs = _.shuffle([[1,1], [2,1], [3,1]]);
  return {listener : listenerLocs, speaker : speakerLocs};
};

var getObjectSubset = function(targetStatus) {
  return _.map(_.shuffle(_.filter(objectList, function(x){
    return x.targetStatus == targetStatus;
  })), _.clone);
};

var firstClassSelector = function(target, list) {
  return _.sample(_.filter(list, function(x) {
    return target.basiclevel === x.basiclevel;
  }));
};

var secondClassSelector = function(target, list) {
  return _.sample(_.filter(list, function(x) {
    return target.superdomain === x.superdomain;
  }));
};

var thirdClassSelector = function(target, list) {
  return _.extend(_.sample(list),{targetStatus : "distrClass3"});
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
  console.log("Did not find tangram from cell!")
}

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
