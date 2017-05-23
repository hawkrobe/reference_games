/*  Copyright (c) 2012 Sven "FuzzYspo0N" Bergström, 2013 Robert XD Hawkins
    
    written by : http://underscorediscovery.com
    written for : http://buildnewgames.com/real-time-multiplayer/
    
    modified for collective behavior experiments on Amazon Mechanical Turk

    MIT Licensed.
*/
    var
        fs    = require('fs'),
        utils = require('../sharedUtils/sharedUtils.js');

// This is the function where the server parses and acts on messages
// sent from 'clients' aka the browsers of people playing the
// game. For example, if someone clicks on the map, they send a packet
// to the server (check the client_on_click function in game.client.js)
// with the coordinates of the click, which this function reads and
// applies.
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
    gc.incrementBonus(message_parts[2]);
    writeData(client, "clickedObj", message_parts);
    others[0].player.instance.send("s.highlightObjSpeaker." + message_parts[3]);
    target.instance.send("s.highlightObjListener." + message_parts[3]);
    setTimeout(function() {
      _.map(all, function(p){
        p.player.instance.emit( 'newRoundUpdate', {user: client.userid, bonus: gc.bonus} );
      });
      gc.newRound();
    }, 1000);
    
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
      writeData(client, "message", message_parts);
      // Update others
      var msg = message_parts[1].replace(/~~~/g,'.');
      _.map(all, function(p){
	p.player.instance.emit( 'chatMessage', {user: client.userid, msg: msg});});
    }
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
  switch(type) {
  case "clickedObj" :
    var clickedObjCondition = message_parts[1];
    var clickedObjName = message_parts[2];
    var clickedObjTargetStatus = message_parts[3];
    var clickedObjSpeakerLocs = message_parts[4];
    var clickedObjListenerLocs = message_parts[5];
    var clickedObjParentClass1 = message_parts[6];
    var clickedObjPaentClass2 = message_parts[7];

    var alternative1Name = message_parts[8]; 
    var alternative1TargetStatus = message_parts[9];
    var alternative1SpeakerLocs = message_parts[10];
    var alternative1ListenerLocs = message_parts[11];
    var alternativeParentClass1 = message_parts[12];
    var alternativeParentClass2 = message_parts[13];

    var alternative2Name = message_parts[14]; 
    var alternative2TargetStatus = message_parts[15];
    var alternative2SpeakerLocs = message_parts[16];
    var alternative2ListenerLocs = message_parts[17];
    var alternative2ParentClass1 = message_parts[18];
    var alternative2ParentClass2 = message_parts[19];
    
    var line = (id + ',' + Date.now() + ',' + roundNum  + ',' + clickedObjCondition 
      + "," + clickedObjName + "," + clickedObjTargetStatus + "," + clickedObjSpeakerLocs 
      + "," + clickedObjListenerLocs + ',' + clickedObjParentClass1 + ',' + clickedObjPaentClass2 
      + "," + alternative1Name + "," + alternative1TargetStatus + "," + alternative1SpeakerLocs 
      + "," + alternative1ListenerLocs + ',' + alternativeParentClass1 + ',' + alternativeParentClass2 
      + "," + alternative2Name + "," + alternative2TargetStatus + "," + alternative2SpeakerLocs 
      + "," + alternative2ListenerLocs + ',' + alternative2ParentClass1 + ',' + alternative2ParentClass2 +  ',' +  gc.bonus + '\n');
    console.log("clickedObj: " + line);

    break;

    // case "nonClickedObj" :
    //   var nonClickedObjName = message_parts[1];
    //   var nonCickedObjTargetStatus = message_parts[2];
    //   var nonClickedObjSpeakerLocs = message_parts[3];
    //   var nonClickedObjListenerLocs = message_parts[4];
    //   var nonClickedObjCondition = message_parts[5];
    //   var line = (id + ',' + Date.now() + ',' + roundNum + ',' + nonClickedObjName + "," + 
    //     nonClickedObjTargetStatus + "," + nonClickedObjSpeakerLocs + "," + nonClickedObjListenerLocs + "," + nonClickedObjCondition + '\n');
    //   console.log("nonClickedObj: " + line);
    //   gc.nonClickObjStream.write(line, function (err) {if(err) throw err;});
    //   break;

  case "message" :
    var msg = message_parts[1].replace('~~~','.');
    var line = (id + ',' + Date.now() + ',' + roundNum + ',' + client.role + ',"' + msg + '"\n');
    console.log("message:" + line);
    break;
  }
  gc.streams[type].write(line, function (err) {if(err) throw err;});
};

// /* 
//    The following functions should not need to be modified for most purposes
// */

var startGame = function(game, player) {
  // Establish write streams
  var startTime = utils.getLongFormTime();
  var dataFileName = startTime + "_" + game.id + ".csv";
  utils.establishStream(game, "message", dataFileName,
			"gameid,time,roundNum,sender,contents\n");
  utils.establishStream(game, "clickedObj", dataFileName,
			"gameid, time, roundNum, condition," +
			"nameClickedObj, targetStatusClickedObj, spLocsClickedObj, " +
			"lisLocsClickedObj, class1ClickedObj, " +
			"class2ClickedObj, alt1Name, alt1TargetStatus, " +
			"alt1SpLocs, alt1LisLocs, alt1Class1, alt1Class2, " +
			"alt2Name, alt2TargetStatus, alt2SpLocs, alt2LisLocs, " +
			"alt2Class1, alt2Class2, bonus\n");
  game.newRound();
};

module.exports = {
  writeData : writeData,
  startGame : startGame,
  onMessage : onMessage
};
