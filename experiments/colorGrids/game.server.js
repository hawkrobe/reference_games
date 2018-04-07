/*  Copyright (c) 2012 Sven "FuzzYspo0N" Bergström, 2013 Robert XD Hawkins

    written by : http://underscorediscovery.com
    written for : http://buildnewgames.com/real-time-multiplayer/

    modified for collective behavior experiments on Amazon Mechanical Turk

    MIT Licensed.
*/
    var
        fs    = require('fs'),
        utils = require(__base + 'sharedUtils/sharedUtils.js'),
        trial = require(__base + 'shapeGrids/trial.js');

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
  var id = gc.id;
  var all = gc.get_active_players();
  var target = gc.get_player(client.userid);
  var others = gc.get_others(client.userid);
  var roundNum = gc.state.roundNum + 1;

  switch(message_type) {

  case 'clickedObj' :
    // Write event to file
    var lClicked = parseInt(message_parts[1]);
    var mouseX = parseInt(message_parts[2]);
    var mouseY = parseInt(message_parts[3]);
    var trialObj = JSON.parse(message_parts.slice(4).join("."));
    var lTarget = trialObj.listenerOrder.indexOf(trialObj.target);

    var actionTime = Date.now();
    var actionDataPoint = {
      eventType : "action",
      type : "ActionColorGrid",
      gameid: id,
      time : actionTime,
      roundNum : roundNum,
      action : JSON.stringify({
        lClicked : lClicked,
        mouseX : mouseX,
        mouseY : mouseY,
        condition : trialObj.condition
      })
    };

    var stateTime = Date.now();
    var stateDataPoint = {
      eventType : "state",
      type : "StateColorGrid",
      gameid: id,
      time : stateTime,
      roundNum : roundNum,
      state : JSON.stringify(trialObj)
    };

    utils.writeDataToCSV(gc, actionDataPoint);
    utils.writeDataToCSV(gc, stateDataPoint);

    var line = (id + ',' + Date.now() + ',' + roundNum  + ',' + message_parts.slice(1).join(',') + '\n');
    console.log("clickedObj:" + line);
    console.log("lTarget " + lTarget + " lClicked " + lClicked);

    if (lTarget == lClicked) {
      gc.data.totalScore += 1;
    }

    // Give feedback to players
    var feedbackMsg = "s.feedback." + [lClicked, lTarget, mouseX, mouseY, gc.data.totalScore.toFixed(2)].join('.');
    console.log("Sending feedback message: ", feedbackMsg);

    others[0].player.instance.send(feedbackMsg);
    target.instance.send(feedbackMsg);

    // Continue
    gc.newRound(3000);
    break;

  case 'playerTyping' :
    _.map(others, function(p) {
      p.player.instance.emit( 'playerTyping', {typing: message_parts[1]});
    });
    break;

  case 'chatMessage' :
    if(client.game.player_count == 2 && !gc.paused) {
      // FIXME Hack to swap roles..
      var role = client.role;
      if (roundNum % 2 === 0) {
        if (role === "speaker") {
          role = "listener";
        } else {
          role = "speaker";
        }
      }

      var msg = message_parts[1].replace('~~~','.');
      var line = (id + ',' + Date.now() + ',' + roundNum + ',' + role + ',"' + msg + '"\n');
      var utteranceTime = Date.now();
      var dataPoint = {
        eventType : "utterance",
        gameid: id,
        time : utteranceTime,
        roundNum : roundNum,
        obj : JSON.stringify({
          type : "Utterance",
          sender : role,
          contents : msg,
          time : utteranceTime
        })
      };

      utils.writeDataToCSV(gc, dataPoint);
      console.log("message:" + line);

      // Update others
      var msg = message_parts[1].replace(/~~~/g,'.');
      _.map(all, function(p){ p.player.instance.emit( 'chatMessage', {user: client.userid, msg: msg});});
    }
    break;

  case 'h' : // Receive message when browser focus shifts
    target.visible = message_parts[1];
    break;
  }
};

var getStim = function(game, targetStatus) {
  return _.filter(game.trialInfo.currStim, function(x){
    return x.targetStatus == targetStatus;
  })[0]['color'];
};

// /*
//    The following functions should not need to be modified for most purposes
// */

var startGame = function(game, player) {
  // Establish write streams (Old version)
  /*
  var startTime = utils.getLongFormTime();
  var dataFileName = startTime + "_" + game.id + ".csv";
  utils.establishStream(game, "message", dataFileName,
      "gameid,time,roundNum,sender,contents\n");

  var dimsStr = "gameid,time,roundNum,lClicked,mouseX,mouseY," + trial.getDimensionNamesString(",") + "\n";
  utils.establishStream(game, "clickedObj", dataFileName, dimsStr);
  */

  game.newRound(0);
};

module.exports = {
  startGame : startGame,
  onMessage : onMessage
};
