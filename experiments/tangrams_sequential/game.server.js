/*  Copyright (c) 2012 Sven "FuzzYspo0N" Bergström, 2013 Robert XD Hawkins
    
    written by : http://underscorediscovery.com
    written for : http://buildnewgames.com/real-time-multiplayer/
    
    modified for collective behavior experiments on Amazon Mechanical Turk

    MIT Licensed.
 */

var 
  fs          = require('fs'),
  utils       = require('../sharedUtils/sharedUtils.js');

// The server parses and acts on messages sent from 'clients'
var onMessage = function(client,message) {
  //Cut the message up into sub components
  var message_parts = message.split('.');
  
  //The first is always the type of message
  var message_type = message_parts[0];
  
  //Extract important variables
  var gc = client.game;
  var id = gc.id.slice(0,6);
  var all = gc.get_active_players();
  var target = gc.get_player(client.userid);
  var others = gc.get_others(client.userid);

  switch(message_type) {
    
  case 'clickedObj' :
    writeData(client, "clickedObj", message_parts);
    others[0].player.instance.send('s.feedback.' + message_parts[1]);
    target.instance.send('s.feedback.' + message_parts[1]);
    // TODO: trigger feedback
    setTimeout(function() {
      _.forEach(all, function(p){
	p.player.instance.emit( 'newRoundUpdate', {user: client.userid});
      });
      gc.newRound();
    }, 3000);
    break;
  
  case 'playerTyping' :
    _.map(others, function(p) {
      p.player.instance.emit( 'playerTyping',
			      {typing: message_parts[1]});
    });
    break;
  
  case 'chatMessage' :
    if(client.game.player_count == 2 && !gc.paused) {
      writeData(client, "message", message_parts);
    }
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
  var gc = client.game;
  var roundNum = gc.state.roundNum + 1;
  var id = gc.id.slice(0,6);
  var score = gc.game_score(gc.trialInfo.currStim);  
  var line;
  switch(type) {
  case "clickedObj" :
    // parse the message
    var objName = message_parts[1];
    var objBox = message_parts[2];
    line = [id, Date.now(), roundNum, score, objName, objBox];
    break;

  case "message" :
    var msg = message_parts[1].replace('~~~','.');
    line = [id, Date.now(), roundNum, client.role, msg];
    break;
  }
  console.log(type + ":" + line.join(','));
  gc.streams[type].write(line.join(',') + "\n", function (err) {if(err) throw err;});
};

var startGame = function(game, player) {
  console.log("starting game" + game.id);
  // Establish write streams
  var startTime = utils.getLongFormTime();
  var dataFileName = startTime + "_" + game.id;
  utils.establishStream(game, "message", dataFileName,
		       "gameid,time,roundNum,sender,contents\n");
  utils.establishStream(game, "clickedObj", dataFileName,
		       "gameid,time,roundNum,score,objName,objBox\n");
  game.newRound();
  game.server_send_update();
};

module.exports = {
  writeData : writeData,
  startGame : startGame,
  onMessage : onMessage
};
