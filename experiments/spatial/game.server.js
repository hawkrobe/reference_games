/*  Copyright (c) 2012 Sven "FuzzYspo0N" Bergström, 2013 Robert XD Hawkins

    written by : http://underscorediscovery.com
    written for : http://buildnewgames.com/real-time-multiplayer/

    modified for collective behavior experiments on Amazon Mechanical Turk

    MIT Licensed.
*/
    var
        fs    = require('fs'),
        utils = require(__base + 'sharedUtils/sharedUtils.js');

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
  switch(message_type) {

  case 'clickedObj' :
    // Write event to file
//    writeData(client, "clickedObj", message_parts);

    var mouseX = parseInt(message_parts[1]);
    var mouseY = parseInt(message_parts[2]);
    var lilyW = parseInt(message_parts[3]);
    var lilyH = parseInt(message_parts[4]);
    var lilyX = parseInt(message_parts[5]);
    var lilyY = parseInt(message_parts[6]);

    //calculate the penalty, which affects the amount the score goes up
    var distanceFn = function distance(x1, y1, x2, y2) {
      console.log("x1 " + x1 + " y1 " + y1 + " x2 " + x2 + " y2 "+ y2);
      return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow(y2 - y1, 2));
    }
    var distance = distanceFn(mouseX, mouseY, lilyX + lilyW/2.0, lilyY + lilyH/2.0);

    console.log("dist " + distance + " lilyW " + lilyW + " lilyH " + lilyH + " mouseX " + mouseX + " mouseY" + mouseY + " lilyX " + lilyX + " lilyY " + lilyY);

    if (distance < lilyW * .5) {
      gc.data.totalScore += 1;
    } else if (distance < lilyW * 1.5) {
      gc.data.totalScore +=  1 - (distance - lilyW * .5)/(lilyW * 1.5 - lilyW * .5);
    }
			   /*distance > 150 ? 0 :
			   1 - (distance-50)/100);*/

    // Give feedback to players
    var feedbackMsg = "s.feedback." + [lilyX, lilyY, mouseX, mouseY, gc.data.totalScore.toFixed(2)].join('.');
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
//      writeData(client, "message", message_parts);
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
  var id = gc.id;
  switch(type) {
  case "clickedObj" :
    var line = (id + ',' + Date.now() + ',' + roundNum  + ',' +
    message_parts.slice(1).join(',') + '\n');
    console.log("clickedObj:" + line);
    break;


  case "message" :
    var msg = message_parts[1].replace('~~~','.');
    var line = (id + ',' + Date.now() + ',' + roundNum + ',' + client.role + ',"' + msg + '"\n');
    console.log("message:" + line);
    break;
  }
  gc.streams[type].write(line, function (err) {if(err) throw err;});
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
  // Establish write streams
  var startTime = utils.getLongFormTime();
  var dataFileName = startTime + "_" + game.id + ".csv";
  utils.establishStream(game, "message", dataFileName,
      "gameid,time,roundNum,sender,contents\n");

  var dims = ["gameid,time,roundNum,mouseX,mouseY,lilyW,lilyH,lilyX,lilyY"];
  for (var i = 0; i < game.numBoxes; i++) {
    dims.push("boxW" + i);
    dims.push("boxH" + i);
    dims.push("boxX" + i);
    dims.push("boxY" + i);
    dims.push("boxC" + i);
  }

  var dimsStr = dims.join(",") + "\n";

  utils.establishStream(game, "clickedObj", dataFileName, dimsStr);
      /* FIXME - Old - remove later
      "gameid,time,roundNum," +
      "redH,redW,redX,redY," +
      "blueH,blueW,blueX,blueY," +
      "plazaD,plazaX,plazaY," +
      "lilyX,lilyY," +
      "mouseX, mouseY" +
      "\n"*);*/
  game.newRound(0);
};

module.exports = {
  writeData : writeData,
  startGame : startGame,
  onMessage : onMessage
};
