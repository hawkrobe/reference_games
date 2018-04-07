

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
// Keeps track of whether player is paying attention...
var incorrect;
var dragging;
var waiting;

var SPEAKER_INSTRUCTIONS = "Send messages to tell the listener which object is the target.";
var LISTENER_INSTRUCTIONS = "Click on the target object which the speaker is telling you about.";

//test: let's try a variable selecting, for when the listener selects an object
// we don't need the dragging.
var selecting;

var client_onserverupdate_received = function(data){

  // Update client versions of variables with data received from
  // server_send_update function in game.core.js
  //data refers to server information
  if(data.players) {
    _.map(_.zip(data.players, globalGame.players),function(z){
      z[1].id = z[0].id;
    });
  }

  if (globalGame.roundNum != data.roundNum) {
    globalGame.currStim =  data.trialInfo.currStim;
  };

  // Get rid of "waiting" screen if there are multiple players
  if(data.players.length > 1) {
    $('#messages').empty();
    $("#chatbox").removeAttr("disabled");
    $('#chatbox').focus();
    globalGame.get_player(globalGame.my_id).message = "";
  }

  globalGame.game_started = data.gs;
  globalGame.players_threshold = data.pt;
  globalGame.player_count = data.pc;
  globalGame.roundNum = data.roundNum;
  globalGame.data = data.dataObj;

  if ((globalGame.roundNum > 2) && (globalGame.my_role === globalGame.playerRoleNames.role1)) { //TRIAL OVER
    $('#instructs').empty()
      .append(SPEAKER_INSTRUCTIONS);
  }

  // Draw all this new stuff
  drawScreen(globalGame);
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
      //ondisconnect(); FIXME? This doesn't need to be called here?
      console.log("received end message...");
      break;

    case 'feedback' :
      $("#chatbox").attr("disabled", "disabled");

      //update the score, TODO: update styling to be prettier
      globalGame.data.totalScore = parseFloat(commands[6]); //+ '.' + commands[7]); //HACKY

      $('#score').empty()
        .append("Bonus: $" + (globalGame.data.totalScore * 0.01).toFixed(2));

      drawTargetBox(globalGame);
      break;

    case 'alert' : // Not in database, so you can't play...
      alert('You did not enter an ID');
      window.location.replace('http://nodejs.org'); break;

    case 'join' : //join a game requested
      var num_players = commanddata;
      client_onjoingame(num_players, commands[3]); break;

    case 'add_player' : // New player joined... Need to add them to our list.
      console.log("adding player" + commanddata);
      clearTimeout(globalGame.timeoutID);
      if(hidden === 'hidden') {
        flashTitle("GO!");
      }
      globalGame.players.push({id: commanddata,
             player: new game_player(globalGame)}); break;
    }
  }
};

var client_addnewround = function(game) {
  $('#roundnumber').append(game.roundNum);
};

var customSetup = function(game) {
  // Set up new round on client's browsers after submit round button is pressed.
  // This means clear the chatboxes, update round number, and update score on screen
  game.socket.on('newRoundUpdate', function(data){

    // FIXME Hack to reverse roles
    if (game.roundNum >= 0) {
      if (globalGame.get_player(globalGame.my_id).role === "speaker") {
        client_setrole("listener");
      } else {
        client_setrole("speaker");
      }
    }
    //alert(globalGame.playerRoleNames.role1);
    //alert("My role: " + globalGame.get_player(globalGame.my_id).role);
    //alert("Role 0: " + globalGame.players[0].role);
    //alert("Role 1: " + globalGame.players[1].role);
    //if (globalGame.get_player(globalGame.my_id).role)
    //client_setrole();

    $('#messages').empty();
    if(game.roundNum + 2 > game.numRounds) {
      $('#roundnumber').empty();
      $('#instructs').empty()
        .append("Round\n" + (game.roundNum + 1) + "/" + game.numRounds);
    } else {
      $('#roundnumber').empty()
        .append("Round\n" + (game.roundNum + 2) + "/" + game.numRounds);
    }
  });
};

var client_setrole = function(role) {
  // set role locally
  globalGame.my_role = role;
  globalGame.get_player(globalGame.my_id).role = globalGame.my_role;

  // Update w/ role (can only move stuff if agent)
  $('#roleLabel').html(' You are the ' + role + '.');
  if(role === globalGame.playerRoleNames.role1) {
    $('#instructs').html(SPEAKER_INSTRUCTIONS);
  } else if(role === globalGame.playerRoleNames.role2) {
    $('#instructs').html(LISTENER_INSTRUCTIONS);
  }

  // set mouse-tracking event handler
  if(role === "listener") {
    globalGame.viewport.addEventListener("click", mouseClickListener, false);
    globalGame.viewport.addEventListener("mousemove", mouseMoveListener, false);
    globalGame.viewport.addEventListener("mouseleave", mouseLeaveListener, false);
    globalGame.viewport.addEventListener("mouseenter", mouseEnterListener, false);
  } else {
    globalGame.viewport.removeEventListener("click", mouseClickListener, false);
    globalGame.viewport.removeEventListener("mousemove", mouseMoveListener, false);
    globalGame.viewport.removeEventListener("mouseleave", mouseLeaveListener, false);
    globalGame.viewport.removeEventListener("mouseenter", mouseEnterListener, false);
  }
}

var client_onjoingame = function(num_players, role) {
  _.map(_.range(num_players - 1), function(i){
    globalGame.players.unshift({id: null, player: new game_player(globalGame)});
  });

  if(num_players == 1) {
    this.timeoutID = setTimeout(function() {
      if(_.size(this.urlParams) == 4) {
        this.submitted = true;
        window.opener.turk.submit(this.data, true);
        window.close();
      } else {
        console.log("would have submitted the following :");
        console.log(this.data);
      }
    }, 1000 * 60 * 15);
    $("#chatbox").attr("disabled", "disabled");
    globalGame.get_player(globalGame.my_id).message = ('Waiting for another player to connect... '
              + 'Please do not refresh the page!');
  }

  client_setrole(role);
};

/*
 MOUSE EVENT LISTENERS
 */
function mouseMoveListener(evt) {
  if (!globalGame.messageSent || globalGame.recentClickedRound == globalGame.roundNum)
    return;

  var bRect = globalGame.viewport.getBoundingClientRect();
  var mouseX = Math.floor((evt.clientX - bRect.left)*(globalGame.viewport.width/bRect.width));
  var mouseY = Math.floor((evt.clientY - bRect.top)*(globalGame.viewport.height/bRect.height));

  var hover = getHoverIndex(globalGame, mouseX, mouseY);
  if (globalGame.hover !== hover) {
    clearScreen(globalGame);
    drawScreen(globalGame, mouseX, mouseY);
    globalGame.hover = hover;
  }
}

function mouseLeaveListener(evt) {
  if (globalGame.messageSent && globalGame.recentClickedRound !== globalGame.roundNum) {
    clearScreen(globalGame);
    drawScreen(globalGame);
  }

  globalGame.hover = undefined;
}

function mouseEnterListener(evt) {
  mouseMoveListener(evt);
}

function mouseClickListener(evt) {
  var bRect = globalGame.viewport.getBoundingClientRect();
  var mouseX = Math.floor((evt.clientX - bRect.left)*(globalGame.viewport.width/bRect.width));
  var mouseY = Math.floor((evt.clientY - bRect.top)*(globalGame.viewport.height/bRect.height));

  if (globalGame.messageSent) { // if message was not sent, don't do anything
    globalGame.messageSent = false;
    var clickedObj = drawClickedBox(globalGame, mouseX, mouseY);
    globalGame.socket.send(["clickedObj", clickedObj, mouseX, mouseY, JSON.stringify(globalGame.currStim)].join("."));
    globalGame.recentClickedRound = globalGame.roundNum;
  }
};
