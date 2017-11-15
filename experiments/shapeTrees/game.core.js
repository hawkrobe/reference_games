/*  Copyright (c) 2012 Sven "FuzzYspo0N" Bergström,
                  2013 Robert XD Hawkins

 written by : http://underscorediscovery.com
    written for : http://buildnewgames.com/real-time-multiplayer/

    substantially modified for collective behavior experiments on the web
    MIT Licensed.
*/


var WORLD_WIDTH = 600;
var WORLD_HEIGHT = 400;

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
    jsonfile = require('jsonfile');
    trial = require(__base + 'shapeTrees/trial.js');

    /* Possibly use something like this later
     * But currently trials.json contains stuff from
     * spatial game, just as an example.
     * TRIALS_OBJECT_FROM_JSON = _.shuffle(require("./trials.json"));
     * console.log(TRIALS_OBJECT_FROM_JSON);
     * assert(_.isArray(TRIALS_OBJECT_FROM_JSON) && TRIALS_OBJECT_FROM_JSON.length == 50);
    */
  }
  else throw 'mymodule requires underscore, see http://underscorejs.org';
}

var game_core = function(options){
  // Store a flag if we are the server instance
  this.server = options.server ;

  // Some config settings
  this.email = 'wmcdowel@stanford.edu';
  this.projectName = 'shapeTrees';
  this.experimentName = 'shapes';
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

  // Which round are we on (initialize at -1 so that first round is 0-indexed)
  this.roundNum = -1;

  // How many rounds do we want people to complete?
  this.numRounds = 15;

  // This will be populated with the current trial
  this.trialInfo = {};

  this.world = { width : WORLD_WIDTH, height : WORLD_HEIGHT };

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

      localThis.server_send_update();
    }
  }, delay);
};

/**
 * Shuffles array in place.
 * From https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
}

game_core.prototype.makeTrialList = function () {
  var local_this = this;
  var trialList = [];
  for (var i = 0; i < this.numRounds; i++) {
    trialList.push(trial.makeRandom(i, this.numRounds));
  };

  shuffle(trialList);

  return trialList;
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
