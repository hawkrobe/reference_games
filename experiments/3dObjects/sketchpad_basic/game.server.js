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

  case 'stroke' :
    // Send json format to partner (FIXME: they'll send it back to be written...)
    _.map(others, function(p) {
      p.player.instance.emit( 'stroke', message_parts[3].replace(/~~~/g, '.'));  
    });                                                     

    break;
  case 'clickedObj' :
//    writeData(client, "clickedObj", message_parts);
    others[0].player.instance.send("s.feedback." + message_parts[1]); 
    target.instance.send("s.feedback." + message_parts[1]);
    
    setTimeout(function() {
      _.map(all, function(p){
        p.player.instance.emit('newRoundUpdate', {user: client.userid} );
      });
      gc.newRound();
    }, 4000);
    break; 
  
  case 'h' : // Receive message when browser focus shifts
    target.visible = message_parts[1];
    break;

  case 'doneDrawing' : // sketcher has declared that drawing is finished
    drawing_status = message_parts[1];
    console.log('drawing submitted: ', drawing_status);
      _.map(all, function(p){
        p.player.instance.emit('mutualDoneDrawing', {user: client.userid} );
      });

  }
};

const flatten = arr => arr.reduce(
  (acc, val) => acc.concat(
    Array.isArray(val) ? flatten(val) : val
  ),
  []
);

/*
  Associates events in onMessage with callback returning json to be saved
  {
    <eventName>: (client, message_parts) => {<datajson>}
  }
  Note: If no function provided for an event, no data will be written
*/
var dataOutput = function() {
  function getIntendedTargetName(objects) {
    return _.filter(objects, x => x.target_status == 'target')[0]['subordinate'];
  }

  function getObjectLocs(objects) {
    return _.flatten(_.map(objects, o => {
      return [o.subordinate, o.speakerCoords.gridX, o.listenerCoords.gridX];
    }));
  }

  var getObjectLocHeaderArray = function() {
    return _.flatten(_.map(_.range(1,5), i => {
      return _.map(['Name', 'SketcherLoc', 'ViewerLoc'], v => 'object' + i + v);
    }));
  };
  
  function commonOutput (client, message_data) {
    return {
      iterationName: client.game.iterationName,
      gameid: client.game.id,
      time: Date.now(),
      trialNum : client.game.state.roundNum + 1,
      workerId: client.workerid,
      assignmentId: client.assignmentid
    };
  };

  var clickedObjOutput = function(client, message_data) {
    var objects = client.game.trialInfo.currStim;
    var intendedName = getIntendedTargetName(objects);
    var objLocations = _.zipObject(getObjectLocHeaderArray(), getObjectLocs(objects));
    var output =  _.extend(
      commonOutput(client, message_data),
      objLocations, {
      intendedName,
      clickedName: message_data[1],
      correct: intendedName === message_data[1],
      pngString: message_data[2],
      pose: parseInt(message_data[3]),
      condition : message_data[4],
      score : message_data[5]
      }
    );
    console.log(JSON.stringify(_.pick(output, ['repetition', 'correct']), null, 3));
    return output;
  };

  var strokeOutput = function(client, message_data) {
    var xmlDoc = new parser().parseFromString(message_data[2].replace(/~~~/g, '.'));
    var svgData = xmlDoc.documentElement.getAttribute('d');
    var objects = client.game.trialInfo.currStim;
    var intendedName = getIntendedTargetName(objects);
    var output = _.extend(
      commonOutput(client, message_data), {
      intendedName,
      svgData,
      currStrokeNum: message_data[1],
      shiftKeyUsed: message_data[4],
      score: message_data[5]
      }
    );
    console.log(JSON.stringify(output, null, 3));
    return output;
  };
  
  return {
    'stroke' : strokeOutput,
    'clickedObj' : clickedObjOutput
  };
}();

var setCustomEvents = function(socket) {};

module.exports = {
  setCustomEvents : setCustomEvents,
  onMessage : onMessage,
  dataOutput : dataOutput
};
