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
    assert = require('assert');
    jsonfile = require('jsonfile')

    TRIALS_OBJECT_FROM_JSON = require("../spatialReference/trials.json");
    console.log(TRIALS_OBJECT_FROM_JSON);
    assert(_.isArray(TRIALS_OBJECT_FROM_JSON) && TRIALS_OBJECT_FROM_JSON.length == 50);
  }
  else throw 'mymodule requires underscore, see http://underscorejs.org';
}

var WORLD_HEIGHT = 400;
var WORLD_WIDTH = 600;

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
  this.world = {
    height: WORLD_HEIGHT,
    width: WORLD_WIDTH
  };
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
    this.trialList = _.shuffle(TRIALS_OBJECT_FROM_JSON);
    this.data = {
      id : this.id.slice(0,6),
      trials : [],
      catch_trials : [],
      totalScore: 0,
      system : {},
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

    // jsonfile.writeFile("trials1.json", this.trialList, function (err) {
    //   console.error(err)
    // });

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

// game_core.prototype.noisify = function(trialList) {
//   var noise = 10;

//   //TODO this is so slow.. even necessary?

//   return _.map(trialList, function(world) {
//     return _.mapObject(world, function(shape) {
//       if (_.isString(shape)) return shape;

//       return _.mapObject(shape, function (value) {

//         var sign = _.sample([-1, 1]);
//         var amount = Math.floor(_.random(0, 100) / noise);

//         return value + (sign * amount);
//       });
//     });
//   });
// }

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
    xMin: 50,
    xMax: 600,
    yMin: 50,
    yMax: 400,
    wMin: 50,
    wMax: 350,
    hMin: 50,
    hMax: 350,

    //circle
    dMin: 100,
    dMax: 100,

    width: WORLD_WIDTH,
    height: WORLD_HEIGHT
  };

  //the random functions handle bounds checking for us
  var getRandomRect = function getRandomRect() {
    return utils.randomRect(options);
  }

  var getRandomCircle = function getRandomCircle(world) {
    var plazaOptions = _.clone(options);
    var mode = _.random(1,3);

    if (mode == 1) { //plaza somewhere near red
      options.xMin = world.red.x;
      options.xMax = world.red.x + world.red.w;
      options.yMin = world.red.y;
      options.yMax = world.red.y + world.red.h;

    } else if (mode == 2) { //plaza somewhere near blue
      options.xMin = world.blue.x;
      options.xMax = world.blue.x + world.blue.w;
      options.yMin = world.blue.y;
      options.yMax = world.blue.y + world.blue.h;
    }

    return utils.randomCircle(plazaOptions);
  }

  var getRandomPoint = function getRandomPoint(world) {
    var lilyOptions = _.clone(options);
    var mode = _.random(1,3);

    if (mode == 1) { //lily somewhere near red
      options.xMin = world.red.x;
      options.xMax = world.red.x + world.red.w;
      options.yMin = world.red.y;
      options.yMax = world.red.y + world.red.h;

    } else if (mode == 2) { //lily somewhere near blue
      options.xMin = world.blue.x;
      options.xMax = world.blue.x + world.blue.w;
      options.yMin = world.blue.y;
      options.yMax = world.blue.y + world.blue.h;
    } else if (mode == 3) { //lily somewhere near plaza
      options.xMin = world.plaza.x;
      options.xMax = world.plaza.x + world.plaza.w;
      options.yMin = world.plaza.y;
      options.yMax = world.plaza.y + world.plaza.h;
    }

    return utils.randomPoint(lilyOptions);
  }

  var world = {
    red: getRandomRect(),
    blue: getRandomRect(),
  };

  world.plaza = getRandomCircle(world);
  world.lily = getRandomPoint(world);

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

    var o1 = convertToBounds(object1);
    var o2 = convertToBounds(object2);

    return ((o1.x1 >= o2.x1 && o1.x1 < o2.x2) || (o2.x1 >= o1.x1) && (o2.x1 < o1.x2)) &&
           ((o1.y1 < o2.y2 && o1.y1 >= o2.y1) || (o2.y1 < o1.y2 && o2.y1 >= o1.y1))
  }

  return !existsIntersection(world.red, world.blue);
};
