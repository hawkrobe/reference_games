/*  Copyright (c) 2012 Sven "FuzzYspo0N" Bergström, 2013 Robert XD Hawkins
    
    written by : http://underscorediscovery.com
    written for : http://buildnewgames.com/real-time-multiplayer/
    
    modified for collective behavior experiments on Amazon Mechanical Turk

    MIT Licensed.
*/
    var
        use_db      = false,
        game_server = module.exports = { games : {}, game_count:0, assignment:0},
        fs          = require('fs');
        clientTangramList = [];
        // totalScore = 0;
	    
    if (use_db) {
	    database    = require(__dirname + "/database"),
	    connection  = database.getConnection();
    }

global.window = global.document = global;
require('./game.core.js');
var utils = require('../../sharedUtils/sharedUtils.js');

// This is the function where the server parses and acts on messages
// sent from 'clients' aka the browsers of people playing the
// game. For example, if someone clicks on the map, they send a packet
// to the server (check the client_on_click function in game.client.js)
// with the coordinates of the click, which this function reads and
// applies.
game_server.server_onMessage = function(client,message) {
  // console.log("received message: " + message)
  //Cut the message up into sub components
  var message_parts = message.split('.');
  
  //The first is always the type of message
  var message_type = message_parts[0];
  
  //Extract important variables
  var gc = client.game.gamecore;
  var id = gc.instance.id.slice(0,6);
  var all = gc.get_active_players();
  var target = gc.get_player(client.userid);
  var others = gc.get_others(client.userid);


  switch(message_type) {
    
  case 'dropObj' :
    // parse the message
    var objIndex = message_parts[1];
    var swapIndex = message_parts[2];
    var objTrueX = message_parts[3];
    var objTrueY = message_parts[4];
    var swapObjTrueX = message_parts[5];
    var swapObjTrueY = message_parts[6];
    var objBox = message_parts[7];
    var swapObjBox = message_parts[8];


    // Update the local copy to match the new positions of these items!
    gc.objects[objIndex].matcherCoords.trueX = objTrueX;
    gc.objects[objIndex].matcherCoords.trueY = objTrueY;
    gc.objects[objIndex].matcherCoords.box = objBox;
    gc.objects[swapIndex].matcherCoords.trueX = swapObjTrueY;
    gc.objects[swapIndex].matcherCoords.trueY = swapObjTrueY;
    gc.objects[swapIndex].matcherCoords.box = swapObjBox;

    //get the gridX and gridY values
    var objCell = gc.getCellFromPixel(objTrueX, objTrueY);
    var swapObjCell = gc.getCellFromPixel(swapObjTrueX, swapObjTrueY);

    //Update local copy with correct gridX and gridY values
    gc.objects[objIndex].matcherCoords.gridX = objCell[0];
    gc.objects[objIndex].matcherCoords.gridY = objCell[1];
    gc.objects[swapIndex].matcherCoords.gridX = swapObjCell[0];
    gc.objects[swapIndex].matcherCoords.gridY = swapObjCell[1];  

    writeData(client, "dropObj", message_parts);
    break;
  
  case 'advanceRound' :
    var score = gc.game_score(gc.objects);
    var boxLocations = message_parts[1];
    console.log(boxLocations);
    writeData(client, "finalBoard", message_parts)
    _.map(all, function(p){
      p.player.instance.emit( 'newRoundUpdate', {user: client.userid, score: score});});
    gc.newRound()
    break;
  
  case 'playerTyping' :
    console.log("player is typing?", message_parts[1]);
    _.map(others, function(p) {
      p.player.instance.emit( 'playerTyping',
			      {typing: message_parts[1]});
    });
    break;
  
  case 'chatMessage' :
    if(client.game.player_count == 2 && !gc.paused) 
    writeData(client, "message", message_parts)
    // Update others
    var msg = message_parts[1].replace(/~~~/g,'.');
    _.map(all, function(p){
      p.player.instance.emit( 'chatMessage', {user: client.userid, msg: msg});});
    break;

  case 'h' : // Receive message when browser focus shifts
    target.visible = message_parts[1];
    break;
  }
};

var writeData = function(client, type, message_parts) {
  var gc = client.game.gamecore;
  var roundNum = gc.state.roundNum + 1;
  var id = gc.instance.id.slice(0,6);
  var line;
  switch(type) {
    case "dropObj" :
      var dropObjBox = message_parts[7];
      var dropObjName = message_parts[9];
      var score = gc.game_score(gc.objects);  
      line = (id + ',' + Date.now() + ',' + roundNum + ',' + score + ',' +
	      dropObjName + ',' + dropObjBox + '\n');
      break;

    case "message" :
      var msg = message_parts[1].replace('~~~','.');
      line = (id + ',' + Date.now() + ',' + roundNum + ',' +
	      client.role + ',"' + msg + '"\n');
      break;

    case "finalBoard" :
      var board = message_parts[1];
      var score = gc.game_score(gc.objects);       //compute score with updated board
      line = (id + ',' + Date.now() + ',' + roundNum + ',' +
	      board + ',' + score + '\n');
      break;
  }
  console.log(type + ":" + line);
  gc.streams[type].write(line, function (err) {if(err) throw err;});
};

// /* 
//    The following functions should not need to be modified for most purposes
// */

game_server.startGame = function(game, player) {
  console.log("starting game");
  // Establish write streams
  var startTime = utils.getLongFormTime();
  var dataFileName = startTime + "_" + game.id;
  utils.establishStream(game.gamecore, "message", dataFileName,
		       "gameid,time,roundNum,sender,contents\n");
  utils.establishStream(game.gamecore, "dropObj", dataFileName,
		       "gameid,time,roundNum,score,name,draggedTo\n");
  utils.establishStream(game.gamecore, "finalBoard", dataFileName,
		       "gameid,time,roundNum,A,B,C,D,E,F,G,H,I,J,K,L,score\n");
  game.gamecore.player_count = game.player_count;
  game.gamecore.newRound();
  game.gamecore.server_send_update();
};

// This is the important function that pairs people up into 'rooms'
// all independent of one another.
game_server.findGame = function(player) {
  this.log('looking for a game. We have : ' + this.game_count);
  //if there are any games created, add this player to it!
  if(this.game_count) {
    var joined_a_game = false;
    for (var gameid in this.games) {
      if(!this.games.hasOwnProperty(gameid)) continue;
      var game = this.games[gameid];
      var gamecore = game.gamecore;
      if(game.player_count < gamecore.players_threshold) {
	// End search
	joined_a_game = true;

	// player_instances is array of actual client handles,
	// players is array of player objects
	game.player_count++;
	game.player_instances.push({id: player.userid,
				    player: player});
	game.gamecore.players.push({id: player.userid, 
				    player: new game_player(gamecore,player)});

        // Attach game to player so server can look at it later,
	// notify new player that they're joining game
        player.game = game;
        player.role = 'matcher';
        player.send('s.join.' + gamecore.players.length + '.' + player.role);

        // notify existing players that someone new is joining
        _.map(gamecore.get_others(player.userid), function(p){
	  p.player.instance.send( 's.add_player.' + player.userid);
	});
	
	// Start game
	this.startGame(game);
      } else if (!joined_a_game) {
	this.createGame(player);
      }
    } 
  }
  else { 
    //no games? create one!
    this.createGame(player);
  }
}; 

// Will run when first player connects
game_server.createGame = function(player) {
  var players_threshold = 2;

//  var start_time = utils.getLongFormTime();
  var gameID = utils.UUID();

//  var name = start_time + '_' + gameID;
  
  //Create a new game instance
  var game = {
    //generate a new id for the game
    id : gameID,           
    //store list of players in the game
    player_instances: [{id: player.userid, player: player}],
    //for simple checking of state
    player_count: 1             
  };
  
  //Create a new game core instance (defined in game.core.js)
  game.gamecore = new game_core(game);

  // Tell the game about its own id
  game.gamecore.game_id = gameID;
  game.gamecore.players_threshold = players_threshold
  game.gamecore.player_count = 1
  
  // assign role
  player.game = game;
  player.role = 'director';
  player.send('s.join.' + game.gamecore.players.length + '.' + player.role)
  this.log('player ' + player.userid + ' created a game with id ' + player.game.id);

  // add to game collection
  this.games[ game.id ] = game;
  this.game_count++;
  
  game.gamecore.server_send_update()
  return game;
}; 

// we are requesting to kill a game in progress.
// This gets called if someone disconnects
game_server.endGame = function(gameid, userid) {
  var thegame = this.games[gameid];
  if(thegame) {
    _.map(thegame.gamecore.get_others(userid),function(p) {
      p.player.instance.send('s.end');
    });
    delete this.games[gameid];
    this.game_count--;
    this.log('game removed. there are now ' + this.game_count + ' games' );
  } else {
    this.log('that game was not found!');
  }   
}; 

//A simple wrapper for logging so we can toggle it,
//and augment it for clarity.
game_server.log = function() {
    console.log.apply(this,arguments);
};

