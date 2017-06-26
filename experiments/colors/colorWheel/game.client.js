

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
var globalGame = {};
// A window global for our id, which we can use to look ourselves up
var my_id = null;
var my_role = null;
// Keeps track of whether player is paying attention...
var visible;
var dragging;

var client_onserverupdate_received = function(data){  

  // Update client versions of variables with data received from
  // server_send_update function in game.core.js
  //data refers to server information
  if(data.players) {
    _.map(_.zip(data.players, globalGame.players),function(z){
      z[1].id = z[0].id;  
    });
  }
  
  globalGame.currStim = data.trialInfo.currStim;

  // Get rid of "waiting" screen if there are multiple players
  if(data.players.length > 1) {
    globalGame.get_player(globalGame.my_id).message = "";
    // 'new round' stuff -- assumes server only sends message at beginning of round
    $('#messages').empty();
    if(globalGame.colorPicker) {
      globalGame.colorPicker.reset();
    }
  }

  globalGame.game_started = data.gs;
  globalGame.players_threshold = data.pt;
  globalGame.player_count = data.pc;
  globalGame.roundNum = data.roundNum;
  globalGame.data = data.dataObj;
  globalGame.score = data.score;
    
  // Draw all this new stuff
  drawScreen(globalGame, globalGame.get_player(globalGame.my_id));
}; 

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
      ondisconnect();
      console.log("received end message...");
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
      globalGame.players.push({id: commanddata,
			       player: new game_player(globalGame)}); break;
    }
  } 
}; 

var customSetup = function(game){
  game.socket.on('feedback', function(data){
    if(my_role === game.playerRoleNames.role1) {
      drawSwatchWithText(game, data.selected, "They chose...", "right");
    } else if (my_role === game.playerRoleNames.role2) {
      drawSwatchWithText(game, data.target, "True color", "left");
    }
  });

  $(document).ready(function() {
    $("#submitbutton").click(function(){
      var color = _.map(game.colorPicker.getCurrColor(),
			function(v) {return Math.round(v);});
      game.socket.send('advanceRound.' + color.join('.'));
    });
  });
  
};

var client_onjoingame = function(num_players, role) {
  // Need client to know how many players there are, so they can set up the appropriate data structure
  _.map(_.range(num_players - 1), function(i){
    globalGame.players.unshift({id: null, player: new game_player(globalGame)});
  });

  // Update w/ role (can only move stuff if agent)
  $('#roleLabel').append(role + '.');
  my_role = role;
  globalGame.get_player(globalGame.my_id).role = my_role;

  // Initialize interface elements
  if(role === globalGame.playerRoleNames.role1) {
    $('#instructs').append("Send messages to help your partner guess your color. "
			   + "Please do not refresh page!");
    $("#submitbutton").remove();
    globalGame.get_player(globalGame.my_id).message = 'Waiting for other player to connect...';
  } else {
    $('#instructs').append("Use the color wheel to guess your partner's color. "
			   + "Please do not refresh page!");
    $("#submitbutton").show();
    globalGame.colorPicker = new colorPicker(globalGame);
    globalGame.viewport.addEventListener("mousedown", mouseDownListener, false);
  }
};    

/*
 MOUSE EVENT LISTENERS
 */

function mouseDownListener(evt) {
  //getting mouse position correctly, being mindful of resizing that
  //may have occured in the browser:
  var bRect = globalGame.viewport.getBoundingClientRect();
  var mouseX = (evt.clientX - bRect.left)*(globalGame.viewport.width/bRect.width);
  var mouseY = (evt.clientY - bRect.top)*(globalGame.viewport.height/bRect.height);
  
  //find which shape was clicked
  if (globalGame.colorPicker.discHitTest(mouseX, mouseY)) {
    globalGame.colorPicker.setDiscCursor(mouseX, mouseY);
    dragging = "disc";
  }
  // } else if(game.colorPicker.lightnessHitTest(mouseX, mouseY)) {
  //   console.log("clicked on lightness bar @ " + mouseX + "," + mouseY);
  //   game.colorPicker.setLightness(mouseX);
  //   dragging = "lightness";
  // }
  if (dragging) {
    window.addEventListener("mousemove", mouseMoveListener, false);
  }

  globalGame.viewport.removeEventListener("mousedown", mouseDownListener, false);
  window.addEventListener("mouseup", mouseUpListener, false);
  drawScreen(globalGame, globalGame.get_player(globalGame.my_id));
  
  //code below prevents the mouse down from having an effect on the main browser window:
  if (evt.preventDefault) {
    evt.preventDefault();
  } //standard
  else if (evt.returnValue) {
    evt.returnValue = false;
  } //older IE
  return false;
}

function mouseUpListener(evt) {    
  globalGame.viewport.addEventListener("mousedown", mouseDownListener, false);
  window.removeEventListener("mouseup", mouseUpListener, false);
  var bRect = globalGame.viewport.getBoundingClientRect();
  var mouseX = (evt.clientX - bRect.left)*(globalGame.viewport.width/bRect.width);
  var mouseY = (evt.clientY - bRect.top)*(globalGame.viewport.height/bRect.height);

  if (dragging == "disc") {
    globalGame.colorPicker.setDiscCursor(mouseX, mouseY);
    dragging = false;
    window.removeEventListener("mousemove", mouseMoveListener, false);
  }
  // } else if (dragging == "lightness") {
  //   game.colorPicker.setLightness(mouseX);
  //   dragging = false;
  //   window.removeEventListener("mousemove", mouseMoveListener, false);
  // }
  drawScreen(globalGame, globalGame.get_player(globalGame.my_id));
}

function mouseMoveListener(evt) {
  //getting mouse position correctly 
  var bRect = globalGame.viewport.getBoundingClientRect();
  var mouseX = (evt.clientX - bRect.left)*(globalGame.viewport.width/bRect.width);
  var mouseY = (evt.clientY - bRect.top)*(globalGame.viewport.height/bRect.height);

  //clamp x and y positions to prevent object from dragging outside of canvas
  if(dragging == "disc") {
    globalGame.colorPicker.setDiscCursor(mouseX, mouseY);
  // } else if(dragging == "lightness") {
  //   globalGame.colorPicker.setLightness(mouseX, mouseY);
  }

  // Draw it
  drawScreen(globalGame, globalGame.get_player(globalGame.my_id));
}

function hitTest(shape,mx,my) {
  var dx = mx - shape.trueX;
  var dy = my - shape.trueY;
  return (0 < dx) && (dx < shape.width) && (0 < dy) && (dy < shape.height);
}
