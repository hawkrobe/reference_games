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
    assert = require('assert');
    jsonfile = require('jsonfile')

    TRIALS_OBJECT_FROM_JSON = _.shuffle(require("./trials.json"));
    console.log(TRIALS_OBJECT_FROM_JSON);
    assert(_.isArray(TRIALS_OBJECT_FROM_JSON) && TRIALS_OBJECT_FROM_JSON.length == 50);
  }
  else throw 'mymodule requires underscore, see http://underscorejs.org';
}

var WORLD_HEIGHT = 400;
var WORLD_WIDTH = 600;
var LILY_SIZE = 50;
var NUM_BOXES = 5;
var BOX_SIZES = [{ w : 100, h : 100}, { w : 100, h : 200}, { w : 200, h : 100}, { w : 300, h : 50}];
var BOX_COLORS = ["blue", "red", "green", "yellow", "black"];
var COLOR_VARIETY = true;

var game_core = function(options){
  // Store a flag if we are the server instance
  this.server = options.server ;

  // Some config settings
  this.email = 'rxdh@stanford.edu';
  this.projectName = 'spatial';
  this.experimentName = 'boxes';
  this.iterationName = 'pilot0';
  this.anonymizeCSV = true;
  
  // save data to the following locations (allowed: 'csv', 'mongo')
  this.dataStore = ['csv'];

  
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

  this.numBoxes = NUM_BOXES;
  this.lilySize = LILY_SIZE;
  this.boxSizes = BOX_SIZES;
  this.boxColors = BOX_COLORS;
  this.colorVariety = COLOR_VARIETY;

    // Which round are we on (initialize at -1 so that first round is 0-indexed)
  this.roundNum = -1;

  // How many rounds do we want people to complete?
  this.numRounds = 15;

  // This will be populated with the tangram set
  this.trialInfo = {};

  if(this.server) {
    // If we're initializing the server game copy, pre-create the list of trials
    // we'll use, make a player object, and tell the player who they are
    this.id = options.id;
    this.expName = options.expName;
    this.player_count = options.player_count;
    this.trialList = this.makeTrialList() //_.shuffle(TRIALS_OBJECT_FROM_JSON);
    this.data = {
      id : this.id,
      trials : [],
      catch_trials : [],
      totalScore: 0,
      system : {},
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

game_core.prototype.newRound = function(delay) {
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
  var lilyPrior = uniformLilyPrior;
  var boxPrior = makeUniformBoxPrior(this.boxSizes, this.boxColors, this.colorVariety);

  return lilyRectangleWorldPrior(lilyPrior, boxPrior, this.numBoxes);
}

var makeUniformBoxPrior = function(possibleDimensions, possibleColors, colorVariety) {
    return function(i) {
        var dims = _.sample(possibleDimensions);
        var color = (colorVariety) ? possibleColors[i % possibleColors.length] : _.sample(possibleColors);
        var point = utils.randomPoint({
            xMin: 0,
            xMax: WORLD_WIDTH - dims.w,
            yMin: 0,
            yMax: WORLD_HEIGHT - dims.h
        });

        var rect = {
            x: point.x,
            y: point.y,
            w: dims.w,
            h: dims.h,
            color: color
        };

        return rect;
    }
}


var checkPartialIntersection = function(box1, box2) {
    var convertToBounds = function(object) {
        return {
            x1: object.x,
            x2: object.x + object.w,
            y1: object.y,
            y2: object.y + object.h
        }
    }

    var o1 = convertToBounds(box1);
    var o2 = convertToBounds(box2);

    return !((o1.x1 > o2.x1 && o1.x2 < o2.x2 && o1.y1 > o2.y1 && o1.y2 < o2.y2)
    || (o2.x1 > o1.x1 && o2.x2 < o1.x2 && o2.y1 > o1.y1 && o2.y2 < o1.y2)
    || (o1.x2 < o2.x1 || o1.x1 > o2.x2 || o1.y2 < o2.y1 || o1.y1 > o2.y2));
}

var uniformLilyPrior = function(boxes) {
    var point = utils.randomPoint({
        xMin : 0,
        xMax : WORLD_WIDTH - LILY_SIZE,
        yMin : 0,
        yMax : WORLD_HEIGHT - LILY_SIZE
    });

    var lily = {
        x : point.x,
        y : point.y,
        w : LILY_SIZE,
        h : LILY_SIZE
    };

    var hasIntersection = _.some(boxes, function(box) { return checkPartialIntersection(lily, box) });
    if (hasIntersection)
        return uniformLilyPrior(boxes);
    else
        return lily;
}

var checkBoxIntersection = function(box1, box2) {
    var convertToBounds = function(object) {
        return {
            x1: object.x,
            x2: object.x + object.w,
            y1: object.y,
            y2: object.y + object.h
        }
    }

    var o1 = convertToBounds(box1);
    var o2 = convertToBounds(box2);

    return ((o1.x1 >= o2.x1 && o1.x1 < o2.x2) || (o2.x1 >= o1.x1) && (o2.x1 < o1.x2)) &&
        ((o1.y1 < o2.y2 && o1.y1 >= o2.y1) || (o2.y1 < o1.y2 && o2.y1 >= o1.y1));
}

var lilyRectangleWorldPrior = function(lilyPrior, boxPrior, boxCount) {
    var makeBoxes = function(n, boxes) {
        if (n == 0)
            return boxes;

        var box = boxPrior(n);
        var hasIntersection = _.some(boxes, function(oBox) { return checkBoxIntersection(box, oBox) });
        if (hasIntersection) {
            return makeBoxes(n, boxes);
        } else {
            boxes.push(box);
            return makeBoxes(n-1, boxes);
        }
    }

    var boxes = makeBoxes(boxCount, []);
    var lily = lilyPrior(boxes);
    var world = { boxes: boxes, lily: lily };

    return world;
};
