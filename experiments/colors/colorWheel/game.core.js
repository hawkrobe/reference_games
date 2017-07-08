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

if(typeof _ === 'undefined') {
  if(has_require) {
    _      = require('underscore');
    utils  = require(__base + 'sharedUtils/sharedUtils.js');
  } else {
    throw 'this experiment requires underscore, see http://underscorejs.org';
  }
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
    role1 : 'director',
    role2 : 'matcher'
  };
  
  // Dimensions of world in pixels and numberof cells to be divided into;
  this.numHorizontalCells = 2;
  this.numVerticalCells = 1;
  this.cellDimensions = {height : 300, width : 300}; // in pixels
  this.cellPadding = 0;
  this.world = {height: (this.cellDimensions.height * this.numVerticalCells
			 + this.cellPadding),
		width : (this.cellDimensions.width * this.numHorizontalCells
			 + this.cellPadding)}; 
  
  // Which round are we on (initialize at -1 so that first round is 0-indexed)
  this.roundNum = -1;
  this.maxScore = 30;
  
  // How many rounds do we want people to complete?
  this.numRounds = 25;

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
      id : this.id.slice(0,6),
      trials : [],
      catch_trials : [],
      system : {}, 
      totalScore : {},
      subject_information : {
	gameID: this.id.slice(0,6)
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
  //Store the instance, if any (only the server copy will have one)
  this.instance = player_instance;
  // Store the game instance, so players can access it
  this.game = game_instance;
  // The player will be assigned to director or matcher
  this.role = '';
  // This will be displayed in big letters on a plain white screen
  this.message = '';
  // This will be set to the player's id, once it is known
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
  return _.without(_.map(_.filter(this.players, function(e){return e.id != id;}), 
       function(p){return p.player ? p : null;}), null);
};

// Returns all players
game_core.prototype.get_active_players = function() {
  return _.without(_.map(this.players, function(p){
    return p.player ? p : null;}), null);
};

game_core.prototype.giveFeedback = function(selectedColor, targetColor) {
  _.map(this.get_active_players(), function(p){
    p.player.instance.emit('feedback', {selected: selectedColor, target: targetColor});
  });  
};

// Advance to the next round
game_core.prototype.newRound = function() {
  // If you've reached the planned number of rounds, end the game
  if(this.roundNum == this.numRounds - 1) {
    _.map(this.get_active_players(), function(p){
      p.player.instance.disconnect();});
  } else {
    this.roundNum += 1;
    this.trialInfo = {currStim: this.trialList[this.roundNum]};
    this.server_send_update();
  }
};

// Randomly sets tangram locations for each round
game_core.prototype.makeTrialList = function () {
  var trialList =_.map(_.range(this.numRounds), function(i) { 
    return utils.randomColor();
  });
  return(trialList);
};

//scores the number of incorrect tangram matches between matcher and director
//returns the correct score out of total tangrams
game_core.prototype.calcScore = function(submitted, target) {
  var diff = utils.colorDiff(submitted, target);
  console.log("diff is " + diff);
  console.log(this.maxScore - diff > 0 ? this.maxScore - diff : 0);
  return (diff < 10 ? this.maxScore :
	  this.maxScore - diff + 10 > 0 ? this.maxScore - diff + 10 : 
	  0);
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
    score    : this.previousRoundScore,
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

// (4.22208334636).fixed(n) will return fixed point value to n places, default n = 3
// Number.prototype.fixed = function(n) { n = n || 3; return parseFloat(this.toFixed(n)); };

