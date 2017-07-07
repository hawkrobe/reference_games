/*  Copyright (c) 2012 Sven "FuzzYspo0N" Bergström, 2013 Robert XD Hawkins
    
    written by : http://underscorediscovery.com
    written for : http://buildnewgames.com/real-time-multiplayer/
    
    modified for collective behavior experiments on Amazon Mechanical Turk

    MIT Licensed.
*/
    var
        fs     = require('fs'),
        utils  = require(__base + 'sharedUtils/sharedUtils.js'),
        parser = require('xmldom').DOMParser,
        XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest,
        sendPostRequest = require('request').post;

// This is the function where the server parses and acts on messages
// sent from 'clients' aka the browsers of people playing the
// game. For example, if someone clicks on the map, they send a packet
// to the server with the coordinates of the click, which this
// function reads and applies.
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
    writeData(client, "clickedObj", message_parts);
    others[0].player.instance.send("s.feedback." + message_parts[1]); 
    target.instance.send("s.feedback." + message_parts[1]);
    
    setTimeout(function() {
      _.map(all, function(p){
        p.player.instance.emit('newRoundUpdate', {user: client.userid} );
      });
      gc.newRound();
    }, 4000);
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

function getIntendedTargetName(objects) {
  return _.filter(objects, function(x){
    return x.target_status == 'target';
  })[0]['subordinate']; 
}

function getObjectLocs(objects) {
  return _.flatten(_.map(objects, function(object) {
    return [object.subordinate,
	    object.speakerCoords.gridX,
	    object.listenerCoords.gridX];
  }));
}

var getObjectLocHeaderArray = function() {
  var arr =  _.map(_.range(1,5), function(i) {
    return _.map(['Name', 'SketcherLoc', 'ViewerLoc'], function(v) {
      return 'object' + i + v;
    });
  });
  return _.flatten(arr);
};

var writeData = function(client, type, message_parts) {
  var gc = client.game;
  var trialNum = gc.state.roundNum + 1; 
  var intendedName = getIntendedTargetName(gc.trialInfo.currStim);
  var line = {expid: gc.expid, gameid: gc.id, time: Date.now(), trialNum: trialNum,
	      workerId: client.workerid, assignmentId: client.assignmentid};
  
  console.log(message_parts);
  switch(type) {
  case "clickedObj" :
    var clickedName = message_parts[1];
    _.extend(line, {
      intendedName,
      clickedName,
      dataType: 'clickedObj',
      correct: intendedName == clickedName ? 1 : 0,
      pose : parseInt(message_parts[2]),
      condition : message_parts[3]
    }, _.zipObject(getObjectLocHeaderArray(), getObjectLocs(gc.trialInfo.currStim)));
    break;

  case "message" :
    _.extend(line, {
      intendedName,
      dataType: 'message',
      role: client.role,
      text: message_parts[1].replace(/~~~/g,'.')
    });
    break;
  }
  writeDataToCSV(gc, type, _.values(line));
  writeDataToMongo(line); 
};

var writeDataToCSV = function(gc, type, line) {
  gc.streams[type].write(line.join('\t') + "\n",
			 function (err) {if(err) throw err;});
};

var writeDataToMongo = function(line) {
  var postData = _.extend({
    dbname: '3dObjects',
    colname: 'chatbox_basic'
  }, line);
  sendPostRequest(
    'http://localhost:4000/db/insert',
    { json: postData },
    (error, res, body) => {
      if (!error && res.statusCode === 200) {
	      // console.log(`sent data to store: ${JSON.stringify(postData)}`);
        console.log(`sent data to store`);
      } else {
	      console.log(`error sending data to store: ${error} ${body}`);
      }
    }
  );
};

var startGame = function(game, player) {
  // Establish write streams
  var startTime = utils.getLongFormTime();
  var dataFileName = startTime + "_" + game.id + ".csv";
  var baseCols = ["gameid","time","trialNum"].join('\t');
  var objectLocHeader = utils.getObjectLocHeader();
  var clickedObjHeader = [baseCols, "intendedTarget","clickedObject", 
			  "outcome", "pose", "condition", objectLocHeader, "\n"].join('\t');
  var messageHeader = [baseCols, "sender","contents\n"].join('\t');
 utils.establishStream(game, "message", dataFileName, messageHeader);
  utils.establishStream(game, "clickedObj", dataFileName, clickedObjHeader);

  game.newRound();
};

var setCustomEvents = function(socket) {
  //empty
};

module.exports = {
  setCustomEvents : setCustomEvents,
  writeData : writeData,
  startGame : startGame,
  onMessage : onMessage
};
