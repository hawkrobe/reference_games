

//   Copyright (c) 2012 Sven "FuzzYspo0N" Bergström, 
//                   2013 Robert XD Hawkins
    
//     written by : http://underscorediscovery.com
//     written for : http://buildnewgames.com/real-time-multiplayer/
    
//     modified for collective behavior experiments on Amazon Mechanical Turk

//     MIT Licensed.


// /* 
//    THE FOLLOWING FUNCTIONS MAY NEED TO BE CHANGED
// */

// A window global for our game root variable.
var game = {};
// A window global for our id, which we can use to look ourselves up
var my_id = null;
var my_role = null;
// Keeps track of whether player is paying attention...
var visible;
var incorrect;
var dragging;
var waiting;

//test: let's try a variable selecting, for when the listener selects an object
// we don't need the dragging.
var selecting;

var client_ondisconnect = function(data) {
  submitInfoAndClose()
};

var submitInfoAndClose = function() {
  // Redirect to exit survey
  console.log("server booted")      
  game.viewport.style.display="none";
  $('#message_panel').hide();
  $('#submitbutton').hide();
  $('#roleLabel').hide();
  //$('#score').hide();
  $('#exit_survey').show();
};

/* 
 Note: If you add some new variable to your game that must be shared
 across server and client, add it both here and the server_send_update
 function in game.core.js to make sure it syncs 

 Explanation: This function is at the center of the problem of
 networking -- everybody has different INSTANCES of the game. The
 server has its own, and both players have theirs too. This can get
 confusing because the server will update a variable, and the variable
 of the same name won't change in the clients (because they have a
 different instance of it). To make sure everybody's on the same page,
 the server regularly sends news about its variables to the clients so
 that they can update their variables to reflect changes.
 */
var client_onserverupdate_received = function(data){  
  
  // Update client versions of variables with data received from
  // server_send_update function in game.core.js
  //data refers to server information
  if(data.players) {
    _.map(_.zip(data.players, game.players),function(z){
      z[1].id = z[0].id;  
    });
  }

  if (game.roundNum != data.roundNum) {
    game.currStim = _.map(data.trialInfo.currStim, function(obj) {
      console.log(obj);
      // Extract the coordinates matching your role
      var customCoords = (my_role == game.playerRoleNames.role1 ?
			  obj.speakerCoords : obj.listenerCoords);
      console.log(customCoords);
      // remove the speakerCoords and listenerCoords properties
      var customObj = _.chain(obj)
	    .omit('speakerCoords', 'listenerCoords')
	    .extend(obj, {trueX : customCoords.trueX, trueY : customCoords.trueY,
			  gridX : customCoords.gridX, gridY : customCoords.gridY,
			  box : customCoords.box})
	    .value();
      
      return customObj;
    });
  };
    
  // Get rid of "waiting" screen if there are multiple players
  if(data.players.length > 1) {
    $('#messages').empty();    
    game.get_player(my_id).message = "";
  }
  
  game.game_started = data.gs;
  game.players_threshold = data.pt;
  game.player_count = data.pc;
  game.roundNum = data.roundNum;
  game.data = data.dataObj;
  
  // Draw all this new stuff
  drawScreen(game, game.get_player(my_id));
}; 

// This is where clients parse socket.io messages from the server. If
// you want to add another event (labeled 'x', say), just add another
// case here, then call

//          this.instance.player_host.send("s.x. <data>")

// The corresponding function where the server parses messages from
// clients, look for "server_onMessage" in game.server.js.
var client_onMessage = function(data) {

  var commands = data.split('.');
  var command = commands[0];
  var subcommand = commands[1] || null;
  var commanddata = commands[2] || null;

  switch(command) {
  case 's': //server message
    switch(subcommand) {    
    case 'end' :
      // Redirect to exit survey
      submitInfoAndClose();
      console.log("received end message...")
      break;

    case 'feedback' :
      var objToHighlight;
      var upperLeftX;
      var upperLeftY;
      var strokeColor;
      if (my_role === game.playerRoleNames.role1) {
	var clickedObjStatus = commanddata;
	console.log("name: " + commanddata);
	objToHighlight = _.filter(game.currStim, function(x){
	  return x.targetStatus == clickedObjStatus;
	})[0];
	console.log(objToHighlight);
	upperLeftX = objToHighlight.speakerCoords.gridPixelX;
	upperLeftY = objToHighlight.speakerCoords.gridPixelY;
	strokeColor = "green";      
      } else {
	objToHighlight = _.filter(game.currStim, function(x){
	  return x.targetStatus == "target";
	})[0];
	upperLeftX = objToHighlight.listenerCoords.gridPixelX;
	upperLeftY = objToHighlight.listenerCoords.gridPixelY;
	strokeColor = "green";	
      }
      console.log(objToHighlight);
      if (upperLeftX != null && upperLeftY != null) {
        game.ctx.beginPath();
        game.ctx.lineWidth="10";
        game.ctx.strokeStyle=strokeColor;
        game.ctx.rect(upperLeftX+5, upperLeftY+5,290,290); 
        game.ctx.stroke();
      }
      break;

    case 'alert' : // Not in database, so you can't play...
      alert('You did not enter an ID'); 
      window.location.replace('http://nodejs.org'); break;

    case 'join' : //join a game requested
      var num_players = commanddata;
      client_onjoingame(num_players, commands[3]); break;

    case 'add_player' : // New player joined... Need to add them to our list.
      console.log("adding player" + commanddata);
      if(hidden === 'hidden') {
        flashTitle("GO!");
      }
      game.players.push({id: commanddata, player: new game_player(game)}); break;

    case 'begin_game' :
      client_newgame(); break;

    }
  } 
}; 

// When loading the page, we store references to our
// drawing canvases, and initiate a game instance.
window.onload = function(){
  //Create our game client instance.
  game = new game_core({});
  
  //Connect to the socket.io server!
  client_connect_to_server(game);
  
  //Fetch the viewport
  game.viewport = document.getElementById('viewport');

  //Adjust its size
  game.viewport.width = game.world.width;
  game.viewport.height = game.world.height;

  //Fetch the rendering contexts
  game.ctx = game.viewport.getContext('2d');

  //Set the draw style for the font
  game.ctx.font = '11px "Helvetica"';

  document.getElementById('chatbox').focus();

};

var client_addnewround = function(game) {
  $('#roundnumber').append(game.roundNum);
};

var called = false; // global variable called checks whether a chatmessage was sent. initially set to false

// Associates callback functions corresponding to different socket messages
var client_connect_to_server = function(game) {
  //Store a local reference to our connection to the server
  game.socket = io.connect();

  // Tell other player if someone is typing...
  $('#chatbox').change(function() {
    var sentTyping = false;
    if($('#chatbox').val() != "" && !sentTyping) {
      game.socket.send('playerTyping.true');
      sentTyping = true;
      console.log("typing");
    } else if($("#chatbox").val() == "") {
      game.socket.send('playerTyping.false');
      sentTyping = false;
      console.log("not typing");
    }
  });
  
  // Tell server when client types something in the chatbox
  $('form').submit(function(){
    var origMsg = $('#chatbox').val()
    // console.log("submitting message to server");
    var msg = 'chatMessage.' + origMsg.replace(/\./g, '~~~');
    if($('#chatbox').val() != '') {
      game.socket.send(msg);
      $('#chatbox').val('');
    }
    return false;   
  });

  game.socket.on('playerTyping', function(data){
    console.log(data);
    if(data.typing == "true") {
      $('#messages').append('<span class="typing-msg">Other player is typing...</span>');
    } else {
      $('.typing-msg').remove();
    }
  });

  

  // Update messages log when other players send chat
  game.socket.on('chatMessage', function(data){
    called = true; // A message was sent! thus, set called to true
    var otherRole = (my_role === game.playerRoleNames.role1 ?
		     game.playerRoleNames.role2 :
		     game.playerRoleNames.role1);
    var source = data.user === my_id ? "You" : otherRole;
    var col = source === "You" ? "#363636" : "#707070";
    $('.typing-msg').remove();
    $('#messages').append($('<li style="padding: 5px 10px; background: ' + col + '">')
			  .text(source + ": " + data.msg));
    $('#messages').stop().animate({
      scrollTop: $("#messages")[0].scrollHeight
    }, 800);
  });
    
  // Set up new round on client's browsers after submit round button is pressed. 
  // This means clear the chatboxes, update round number, and update score on screen
  game.socket.on('newRoundUpdate', function(data){
    $('#messages').empty();
    if(game.roundNum+2 > game.numRounds) {
      $('#roundnumber').empty();
      $('#instructs').empty().append("Round\n" + (game.roundNum + 1) + "/" + game.numRounds);
    } else {
      $('#roundnumber').empty().append("Round\n", game.roundNum + 2, "/" + game.numRounds);
    }
  });

  //so that we can measure the duration of the game
  game.startTime = Date.now();
  
  //When we connect, we are not 'connected' until we have an id
  //and are placed in a game by the server. The server sends us a message for that.
  game.socket.on('connect', function(){}.bind(game));
  //Sent when we are disconnected (network, server down, etc)
  game.socket.on('disconnect', client_ondisconnect.bind(game));
  //Sent each tick of the server simulation. This is our authoritive update
  game.socket.on('onserverupdate', client_onserverupdate_received);
  //Handle when we connect to the server, showing state and storing id's.
  game.socket.on('onconnected', client_onconnected.bind(game));
  //On message from the server, we parse the commands and send it to the handlers
  game.socket.on('message', client_onMessage.bind(game));
}; 

var client_onconnected = function(data) {
  //The server responded that we are now in a game. Remember who we are
  my_id = data.id;
  game.players[0].id = my_id;
    drawScreen(game, game.get_player(my_id));
};

var client_onjoingame = function(num_players, role) {
  // set role locally
  my_role = role;
  game.get_player(my_id).role = my_role;

  _.map(_.range(num_players - 1), function(i){
    game.players.unshift({id: null, player: new game_player(game)});
  });
  
  // Update w/ role (can only move stuff if agent)
  $('#roleLabel').append(role + '.');
  if(role === game.playerRoleNames.role1) {
    console.log("first statistifed");
    $('#instructs').append("Send messages to tell the listener which object " + 
			   "is the target.");
  } else if(role === game.playerRoleNames.role2) {
    $('#instructs').append("Click on the target object which the speaker " +
			   "is telling you about.");
  }

  if(num_players == 1) {
    game.get_player(my_id).message = ('Waiting for another player to connect... '
				      + 'Please do not refresh the page!'); 
  }

  // set mouse-tracking event handler
  if(role === game.playerRoleNames.role2) {
    console.log("setting listener");
    game.viewport.addEventListener("click", mouseClickListener, false);
  }
};    

/*
 MOUSE EVENT LISTENERS
 */

function mouseClickListener(evt) {
  var bRect = game.viewport.getBoundingClientRect();
  var mouseX = (evt.clientX - bRect.left)*(game.viewport.width/bRect.width);
  var mouseY = (evt.clientY - bRect.top)*(game.viewport.height/bRect.height);
  //alert('called: ' + called);
  if (called){ // if message was not sent, don't do anything
    for (var i=0; i < game.currStim.length; i++) {
      var obj = game.currStim[i];
      if (hitTest(obj, mouseX, mouseY)) {
        called = false;
        //highlight the object that was clicked:
        var upperLeftXListener = obj.listenerCoords.gridPixelX;
        var upperLeftYListener = obj.listenerCoords.gridPixelY;
        if (upperLeftXListener != null && upperLeftYListener != null) {
          game.ctx.beginPath();
          game.ctx.lineWidth="10";
          game.ctx.strokeStyle="black";
          game.ctx.rect(upperLeftXListener+5, upperLeftYListener+5,290,290); 
          game.ctx.stroke();
        }
	// Tell the server about it
        var alt1 = _.sample(_.without(game.currStim, obj));
        var alt2 = _.sample(_.without(game.currStim, obj, alt1));
        game.socket.send("clickedObj." + obj.condition + "." +
			 obj.targetStatus + "." + obj.color.join('.') + "." +
			 obj.speakerCoords.gridX + "." + obj.listenerCoords.gridX +"." +
			 alt1.targetStatus + "." + alt1.color.join('.') + "." +
			 alt1.speakerCoords.gridX+"."+alt1.listenerCoords.gridX+"." +
			 alt2.targetStatus + "." + alt2.color.join('.') + "." +
			 alt2.speakerCoords.gridX+"."+alt2.listenerCoords.gridX + ".");
	
      }
    }
  }
};

function hitTest(shape,mx,my) {
    var dx = mx - shape.trueX;
    var dy = my - shape.trueY;
    return (0 < dx) && (dx < shape.width) && (0 < dy) && (dy < shape.height)
}

// This gets called when someone selects something in the menu during the exit survey...
// collects data from drop-down menus and submits using mmturkey
function dropdownTip(data){
  var commands = data.split('::');
  switch(commands[0]) {
  case 'human' :
    $('#humanResult').show();
    game.data.subject_information = _.extend(game.data.subject_information, 
					     {'thinksHuman' : commands[1]}); break;
  case 'language' :
    game.data.subject_information = _.extend(game.data.subject_information, 
					     {'nativeEnglish' : commands[1]}); break;
  case 'partner' :
    game.data.subject_information = _.extend(game.data.subject_information,
                {'ratePartner' : commands[1]}); break;
  case 'submit' :
    game.data.subject_information = _.extend(game.data.subject_information, 
				   {'comments' : $('#comments').val(), 
				    'role' : my_role,
				    'totalLength' : Date.now() - game.startTime});
    var urlParams;
    var match,
	pl     = /\+/g,  // Regex for replacing addition symbol with a space
	search = /([^&=]+)=?([^&]*)/g,
	decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
	query  = location.search.substring(1);

    urlParams = {};
    while ((match = search.exec(query)))
      urlParams[decode(match[1])] = decode(match[2]);
    
    if(_.size(urlParams) == 4) {
      window.opener.turk.submit(game.data, true);
      window.close(); 
    } else {
      console.log(game.data);
      // var URL = 'http://web.stanford.edu/~rxdh/psych254/replication_project/forms/end.html?id=' + my_id;
      // window.location.replace(URL);
    }
    break;
  }
}

// // Automatically registers whether user has switched tabs...
(function() {
  document.hidden = hidden = "hidden";

  // Standards:
  if (hidden in document)
    document.addEventListener("visibilitychange", onchange);
  else if ((hidden = "mozHidden") in document)
    document.addEventListener("mozvisibilitychange", onchange);
  else if ((hidden = "webkitHidden") in document)
    document.addEventListener("webkitvisibilitychange", onchange);
  else if ((hidden = "msHidden") in document)
    document.addEventListener("msvisibilitychange", onchange);
  // IE 9 and lower:
  else if ('onfocusin' in document)
    document.onfocusin = document.onfocusout = onchange;
  // All others:
  else
    window.onpageshow = window.onpagehide = window.onfocus 
    = window.onblur = onchange;
})();

function onchange (evt) {
  var v = 'visible', h = 'hidden',
      evtMap = { 
        focus:v, focusin:v, pageshow:v, blur:h, focusout:h, pagehide:h 
      };
  evt = evt || window.event;
  if (evt.type in evtMap) {
    document.body.className = evtMap[evt.type];
  } else {
    document.body.className = evt.target.hidden ? "hidden" : "visible";
  }
  visible = document.body.className;
  game.socket.send("h." + document.body.className);
};

(function () {

  var original = document.title;
  var timeout;

  window.flashTitle = function (newMsg, howManyTimes) {
    function step() {
      document.title = (document.title == original) ? newMsg : original;
      if (visible === "hidden") {
        timeout = setTimeout(step, 500);
      } else {
        document.title = original;
      }
    };
    cancelFlashTitle(timeout);
    step();
  };

  window.cancelFlashTitle = function (timeout) {
    clearTimeout(timeout);
    document.title = original;
  };

}());
