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
    sendPostRequest = require('request').post;
    _ = require('lodash');
    utils  = require(__base + 'sharedUtils/sharedUtils.js');
  }
  else throw 'mymodule requires underscore, see http://underscorejs.org';
}

var game_core = function(options){
  this.server = options.server ;
  this.email = 'sketchloop@gmail.com';
  this.projectName = '3dObjects';
  this.experimentName = 'chairs_chatbox';
  this.iterationName = 'close_only';

  // save data to the following locations (allowed: 'csv', 'mongo')
  this.dataStore = ['csv', 'mongo'];
  this.anonymizeCSV = true;
  
  // How many players in the game?
  this.players_threshold = 2;
  this.playerRoleNames = {
    role1 : 'speaker',
    role2 : 'listener'
  };


  //Dimensions of world in pixels and number of cells to be divided into;
  this.numHorizontalCells = 3;
  this.numVerticalCells = 1;
  this.cellDimensions = {height : 200, width : 200}; // in pixels
  this.cellPadding = 0;
  this.world = {height : (this.cellDimensions.height * this.numVerticalCells
              + this.cellPadding),
              width : (this.cellDimensions.width * this.numHorizontalCells
              + this.cellPadding)}; 


  // track shift key drawing tool use 
  this.shiftKeyUsed = 0; // "1" on trials where used, "0" otherwise

  // Number of total poses per object
  this.numPoses = 1;          

  // Which round (a.k.a. "trial") are we on (initialize at -1 so that first round is 0-indexed)
  this.roundNum = -1;

  // How many rounds do we want people to complete?
  this.numRounds = 70;

  // toggle on if you want to ONLY run close trials
  this.closeOnly = 1;  

  // How many objects per round (how many items in the menu)?
  this.numItemsPerRound = this.numHorizontalCells*this.numVerticalCells;

  // Items x Rounds?
  this.numItemsxRounds = this.numItemsPerRound*this.numRounds;

  // This will be populated with the set of objects
  this.trialInfo = {roles: _.values(this.playerRoleNames)};
  
  if(this.server) {
    // If we're initializing the server game copy, pre-create the list of trials
    // we'll use, make a player object, and tell the player who they are
    this.id = options.id;
    this.expName = options.expName;
    this.player_count = options.player_count;

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

    // Before starting game, get stim list from db
    var that = this;
    sendPostRequest('http://localhost:4000/db/getstims', {
      json: {dbname: 'stimuli', colname: 'chairs1k',
	     numRounds: this.numRounds, gameid: this.id}
    }, (error, res, body) => {
      if(!error && res.statusCode === 200) {
      	that.stimList = _.shuffle(body);
      	that.trialList = that.makeTrialList();
      	that.server_send_update();
      } else {
	console.log(`error getting stims: ${error} ${body}`);
	console.log(`falling back to local stimList`);
	var closeFamilies = require('./stimList_chairs').closeByFamily;
	that.stimList = _.flatten(_.sampleSize(closeFamilies, that.numRounds));
	that.trialList = that.makeTrialList();
	that.server_send_update();
      }
    });
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
    // Otherwise, get the preset list of objects for the new round
    this.roundNum += 1;
    this.trialInfo = {
      currStim: this.trialList[this.roundNum],
      roles: _.zipObject(_.map(this.players, p =>p.id),
			 _.reverse(_.values(this.trialInfo.roles)))
    };
    this.objects = this.trialList[this.roundNum];
    this.server_send_update();
  }
};


game_core.prototype.sampleStimulusLocs = function() {
  var listenerLocs = _.shuffle([[1,1], [2,1], [3,1]]);
  var speakerLocs = _.shuffle([[1,1], [2,1], [3,1]]);

  // // temporarily turn off shuffling to make sure that it has to do with this
  // var listenerLocs = [[1,1], [2,1], [3,1], [4,1]];
  // var speakerLocs = [[1,1], [2,1], [3,1], [4,1]];
  return {listener : listenerLocs, speaker : speakerLocs};
};


game_core.prototype.makeTrialList = function () { 
  // if ((this.numRounds % 3 ==0) && (this.closeOnly==false)) {
  //   //sample 23 of each condition and randomize
  //   f = _.times(this.numRounds/3,function() {return "far"});
  //   c = _.times(this.numRounds/3,function() {return "close"});
  //   s = _.times(this.numRounds/3,function() {return "split"});
  //   var conditionList = _.shuffle(f.concat(c).concat(s));   

  // } else {
  //   // iff you only want to run close trials, this next block restricts it to them
  //   c = _.times(this.numRounds,function() {return "close"});    
  //   var conditionList = _.shuffle(c);
  // }

  return _.map(this.stimList, stim => {
    var condition = stim.condition;
    var family = stim.family;
    var numObjs = this.numHorizontalCells * this.numVerticalCells;

    // sample locations for those objects
    var locs = this.sampleStimulusLocs();
	  
    // construct trial list (in sets of complete rounds)
    return _.zipWith(_.range(numObjs), locs.speaker, locs.listener, (i, sloc, lloc) => {
      var filename = stim.filename[i].split(".")[0],
	  url = stim.url[i],
	  member = stim.member[i],
	  shapenet_id = stim.shapenet_id[i],
	  target_status = stim.target_status[i];
      var width = this.cellDimensions.width;
      var height = this.cellDimensions.height;      
      var speakerGridCell = this.getPixelFromCell(sloc[0], sloc[1]); 
      var listenerGridCell = this.getPixelFromCell(lloc[0], lloc[1]);
      return {
	condition, family,
	filename, url, member, shapenet_id, target_status,
	width, height,
	speakerCoords : {
          gridX : sloc[0],
          gridY : sloc[1],
          trueX : speakerGridCell.centerX - width/2,
          trueY : speakerGridCell.centerY - height/2,
          gridPixelX: speakerGridCell.centerX - 100,
          gridPixelY: speakerGridCell.centerY - 100
	},
	listenerCoords : {
          gridX : lloc[0],
	  gridY : lloc[1],
          trueX : listenerGridCell.centerX - width/2,
          trueY : listenerGridCell.centerY - height/2,
          gridPixelX: listenerGridCell.centerX - 100,
          gridPixelY: listenerGridCell.centerY - 100
	}
      };
    });
  });
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
    trialInfo: this.trialInfo,
    objects: this.objects,
    gameID: this.id
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



// // readjusts trueX and trueY values based on the objLocation and width and height of image (objImage)
// game_core.prototype.getTrueCoords = function (coord, objLocation, objImage) {
//   var trueX = this.getPixelFromCell(objLocation.gridX, objLocation.gridY).centerX - objImage.width/2;
//   var trueY = this.getPixelFromCell(objLocation.gridX, objLocation.gridY).centerY - objImage.height/2;
//   if (coord == "xCoord") {
//     return trueX;
//   }
//   if (coord == "yCoord") {
//     return trueY;
//   }
// };
  
