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
    utils  = require('../sharedUtils/sharedUtils.js');
  }
  else throw 'mymodule requires underscore, see http://underscorejs.org';
}

var game_core = function(options){
  // Store a flag if we are the server instance
  this.server = options.server ;

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

  // This will be populated with the tangram set
  this.trialInfo = {};

  if(this.server) {
    // If we're initializing the server game copy, pre-create the list of trials
    // we'll use, make a player object, and tell the player who they are
    this.id = options.id;
    this.expName = options.expName;
    this.player_count = options.player_count;
    this.trialList = this.makeTrialList();
    console.log(this.trialList);
    this.data = {
      id : this.id.slice(0,6),
      trials : [],
      catch_trials : [],
      system : {},
      totalScore : 0,
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
  this.instance = player_instance;
  this.game = game_instance;
  this.role = '';
  this.message = '';
  this.id = '';
};

// server side we set some classes to global types, so that
// we can use them in other files (specifically, game.server.js)
if('undefined' != typeof global) {
  module.exports = global.game_core = game_core;
  module.exports = global.game_player = game_player;
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

game_core.prototype.advanceRound = function(delay) {
  var players = this.get_active_players();
  var localThis = this;
  setTimeout(function() {
    // If you've reached the planned number of rounds, end the game
    if(localThis.roundNum == localThis.numRounds - 1) {
      _.forEach(players, function(p){
	p.player.instance.disconnect();
      });
    } else {
      // Tell players
      _.forEach(players, function(p){
	p.player.instance.emit( 'newRoundUpdate' );
      });
      // Otherwise, get the preset list of tangrams for the new round
      localThis.roundNum += 1;
      localThis.trialInfo = {currStim: localThis.trialList[localThis.roundNum]};
      console.log(localThis.trialInfo);
      localThis.server_send_update();
    }
  }, delay);
};

game_core.prototype.makeTrialList = function () {
  var local_this = this;
  var trialList = [];

  for (var i = 0; i < this.numRounds; i++) {
    var world = this.sampleTrial(); // Sample a world state
    trialList.push(world);
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

game_core.prototype.sampleTrial = function() {
  var options = {
    //for rect (and point)
    xMin: 0,
    xMax: 500,
    yMin: 0,
    yMax: 500,
    wMin: 50,
    wMax: 250,
    hMin: 50,
    hMax: 250,

    //circle
    dMin: 25,
    dMax: 25
  };

  //the random functions handle bounds checking for us
  var getRandomRect = function getRandomRect() {
    return utils.randomRect(options);
  }

  var getRandomCircle = function getRandomCircle() {
    return utils.randomCircle(options);
  }

  var getRandomPoint = function getRandomPoint() {
    return utils.randomPoint(options);
  }

  var world = {
    red: getRandomRect(),
    blue: getRandomRect(),
    plaza: getRandomCircle(),
    lily: getRandomPoint()
  };

  if (!checkWorld(world, options)) {
    //the world is invalid, so we just resample

    return this.sampleTrial();
  }

  return world;
};

var checkWorld = function(world, options) {

  //takes two rects with x, y, w, h parameters
  var existsIntersection = function(object1, object2) {
    //convert to bounding points
    var convertToBounds = function(object) {
      return {
        x1: object.x,
        x2: object.x + object.w,
        y1: object.y,
        y2: object.y + object.h
      }
    }

    var between = function(min, max, value) { //TODO: is there a more canonical way to do this? a la underscore?
      return value <= max && value >= min;
    }

    var object1Bounds = convertToBounds(object1);
    var object2Bounds = convertToBounds(object2);

    return between(object1Bounds.x1, object1Bounds.x2, object2Bounds.x1) ||
           between(object1Bounds.x1, object1Bounds.x2, object2Bounds.x2) ||
           between(object1Bounds.y1, object1Bounds.y2, object2Bounds.y1) ||
           between(object1Bounds.y1, object1Bounds.y2, object2Bounds.y2);
  }

  return !existsIntersection(world.red, world.blue);
};

// // maps a grid location to the exact pixel coordinates
// // for x = 1,2,3,4; y = 1,2,3,4
// game_core.prototype.getPixelFromCell = function (x, y) {
//   return {
//     centerX: (this.cellPadding/2 + this.cellDimensions.width * (x - 1)
//         + this.cellDimensions.width / 2),
//     centerY: (this.cellPadding/2 + this.cellDimensions.height * (y - 1)
//         + this.cellDimensions.height / 2),
//     upperLeftX : (this.cellDimensions.width * (x - 1) + this.cellPadding/2),
//     upperLeftY : (this.cellDimensions.height * (y - 1) + this.cellPadding/2),
//     width: this.cellDimensions.width,
//     height: this.cellDimensions.height
//   };
// };

// // maps a raw pixel coordinate to to the exact pixel coordinates
// // for x = 1,2,3,4; y = 1,2,3,4
// game_core.prototype.getCellFromPixel = function (mx, my) {
//   var cellX = Math.floor((mx - this.cellPadding / 2) / this.cellDimensions.width) + 1;
//   var cellY = Math.floor((my - this.cellPadding / 2) / this.cellDimensions.height) + 1;
//   return [cellX, cellY];
// };

// game_core.prototype.getTangramFromCell = function (gridX, gridY) {
//   for (i=0; i < this.objects.length; i++) {
//     if (this.objects[i].gridX == gridX && this.objects[i].gridY == gridY) {
//       var tangram = this.objects[i];
//       var tangramIndex = i;
//       // return tangram;
//       return i;
//     }
//   }
//   console.log("Did not find tangram from cell!");
// };

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

