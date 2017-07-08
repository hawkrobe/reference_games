/*  Copyright (c) 2012 Sven "FuzzYspo0N" Bergström, 2013 Robert XD Hawkins
    
    written by : http://underscorediscovery.com
    written for : http://buildnewgames.com/real-time-multiplayer/
    
    modified for collective behavior experiments on Amazon Mechanical Turk

    MIT Licensed.
*/

var
  fs          = require('fs'),
  utils       = require(__base + 'sharedUtils/sharedUtils.js');

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
      
  case 'advanceRound' :
    var selectedColor = message_parts.slice(1,4);
    var targetColor = gc.trialInfo.currStim;
    var score = gc.calcScore(selectedColor, targetColor);
//    writeData(client, "outcome", message_parts.concat(score));
    gc.previousRoundScore = score;
    gc.giveFeedback(selectedColor, targetColor);
    setTimeout(function(){
      gc.newRound();
    }, 3000);
    break;
  
  case 'playerTyping' :
    console.log("player is typing?", message_parts[1]);
    _.map(others, function(p) {
      p.player.instance.emit( 'playerTyping',
			      {typing: message_parts[1]});
    });
    break;
  
  case 'chatMessage' :
    if(client.game.player_count == 2 && !gc.paused) {
//      writeData(client, "message", message_parts);
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
  var line;
  switch(type) {
  case "outcome" :
    var color = message_parts.slice(1, 4);
    var score = message_parts[4];
    line = (id + ',' + Date.now() + ',' + roundNum + ',' +
	    gc.trialInfo.currStim.join(',') + ',' + color.join(',') + ',' + score + '\n');
    break;
    
  case "message" :
    var msg = message_parts[1].replace('~~~','.');
    line = (id + ',' + Date.now() + ',' + roundNum + ',' +
	    gc.trialInfo.currStim.join(',') + ',' + client.role + ',"' + msg + '"\n');
    break;
  }
  console.log(type + ":" + line);
  gc.streams[type].write(line, function (err) {if(err) throw err;});
};

var startGame = function(game, player) {
  console.log("starting game" + game.id);
  // Establish write streams
  var startTime = utils.getLongFormTime();
  var dataFileName = startTime + "_" + game.id + ".csv";
  utils.establishStream(game, "message", dataFileName,
		       "gameid,time,roundNum,targetColH, targetColS,"
			+ "targetColL, sender,contents\n");
  utils.establishStream(game, "outcome", dataFileName,
			"gameid,time,roundNum,targetColH, targetColS,"
			+ "targetColL, submittedColH, submittedColS,"
			+ "submittedColL,score\n");
  game.newRound();
};

module.exports = {
  writeData : writeData,
  startGame : startGame,
  onMessage : onMessage
};
