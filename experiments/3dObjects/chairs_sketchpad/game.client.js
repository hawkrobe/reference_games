//////// jefan debugging 3/17/17
//////// originally from colorReference & original sketchpad

//   Copyright (c) 2012 Sven "FuzzYspo0N" Bergström,
//                   2013 Robert XD Hawkins

//     written by : http://underscorediscovery.com
//     written for : http://buildnewgames.com/real-time-multiplayer/

//     modified for collective behavior experiments on Amazon Mechanical Turk

//     MIT Licensed.

// A window global for our game root variable.
var globalGame = {};

// A window global for our id, which we can use to look ourselves up
var my_id = null;
var my_role = null;

// Keeps track of whether player is paying attention...
var incorrect;
var dragging;
var waiting;

//test: let's try a variable selecting, for when the listener selects an object
// we don't need the dragging.
var selecting;

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
    _.map(_.zip(data.players, globalGame.players),function(z){
      z[1].id = z[0].id;
    });
  }

  // If your objects are out-of-date (i.e. if there's a new round), set up
  // machinery to draw them
  if (globalGame.roundNum != data.roundNum) {
    var alreadyLoaded = 0; 
    $('#occluder').show();
    // globalGame.drawingAllowed = false;
    globalGame.objects = _.map(data.objects, function(obj) {
      // Extract the coordinates matching your role
      var customCoords = globalGame.my_role == "sketcher" ? obj.speakerCoords : obj.listenerCoords;
      // remove the speakerCoords and listenerCoords properties
      var customObj = _.chain(obj)
	    .omit('speakerCoords', 'listenerCoords')
	    .extend(obj, {trueX : customCoords.trueX, trueY : customCoords.trueY,
			  gridX : customCoords.gridX, gridY : customCoords.gridY,
			  box : customCoords.box})
	    .value();

      var imgObj = new Image(); //initialize object as an image (from HTML5)
      imgObj.src = customObj.url; // tell client where to find it
      imgObj.onload = function(){ // Draw image as soon as it loads (this is a callback)
        globalGame.ctx.drawImage(imgObj, parseInt(customObj.trueX), parseInt(customObj.trueY),
				  customObj.width, customObj.height);
          if (globalGame.my_role === globalGame.playerRoleNames.role1) {
            highlightCell(globalGame, '#d15619', function(x) {return x.target_status == 'target';});
          }
          alreadyLoaded += 1
          if (alreadyLoaded == 3) {
            setTimeout(function() {
              $('#occluder').hide();
              globalGame.drawingAllowed = true;
            },750);
          }
      };
      return _.extend(customObj, {img: imgObj});
    });
  };


  // Get rid of "waiting" screen and allow drawing if there are multiple players
  if(data.players.length > 1) {
    $('#messages').empty();
    globalGame.get_player(globalGame.my_id).message = "";
  }

  globalGame.game_started = data.gs;
  globalGame.players_threshold = data.pt;
  globalGame.player_count = data.pc;
  globalGame.roundNum = data.roundNum;
  // update data object on first round, don't overwrite (FIXME)
  if(!_.has(globalGame, 'data')) {
    globalGame.data = data.dataObj;
  }

  // Draw all this new stuff
  drawScreen(globalGame, globalGame.get_player(globalGame.my_id));
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
      ondisconnect();
      console.log("received end message...");
      $('#sketchpad').hide();
      break;

    case 'feedback' :
      // Prevent them from sending messages b/w trials
      $('#chatbox').attr("disabled", "disabled");
      var clickedObjName = commanddata;

      // update local score
      var target = _.filter(globalGame.objects, function(x){
	return x.target_status == 'target';
      })[0];
      var scoreDiff = target.filename == clickedObjName ? 1 : 0;
      globalGame.data.subject_information.score += scoreDiff;
      // draw feedback
      if (globalGame.my_role === globalGame.playerRoleNames.role1) {
	       drawSketcherFeedback(globalGame, scoreDiff, clickedObjName);
      } else {
	       drawViewerFeedback(globalGame, scoreDiff, clickedObjName);
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
      console.log("cancelling timeout");
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
  document.getElementById('sketchpad').focus();
};

var customSetup = function(game) {
  game.sketchpad = new Sketchpad();

  $(document).ready(function() {
    $("#submitbutton").click(function(){
      if (globalGame.currStrokeNum > 0) { // only allow submit button to be pressed if at least one stroke made
        var finished = ['doneDrawing',1];
        globalGame.socket.send(finished.join('.'));
      } else {
        $('#feedback').html("Please make your sketch.");
      }
    });
  });

  // Set up new round on client's browsers after submit round button is pressed.
  // This means clear the canvas, update round number, and update score on screen
  game.socket.on('newRoundUpdate', function(data){
    // Reset sketchpad each round
    project.activeLayer.removeChildren();

    // reset drawing stuff
    globalGame.doneDrawing = false;
    globalGame.path = [];
    
    // Reset stroke counter
    globalGame.currStrokeNum = 0;

    // occluder box animation now controlled within client_onserverupdate_received
    // // fade in occluder box, wait a beat, then fade it out (then allow drawing)
    // $("#occluder").show(0)
    //               .delay(3000)
    //               .hide(0, function() {
    //                 globalGame.drawingAllowed = true;
    //               });

    if (globalGame.my_role === globalGame.playerRoleNames.role2) {
      $("#loading").fadeIn('fast');
    }

    // clear feedback blurb
    $('#feedback').html(" ");
    $('#turnIndicator').html(" ");

    // Update display
    var score = game.data.subject_information.score;
    if(game.roundNum + 2 > game.numRounds) {
      $('#roundnumber').empty();
      $('#sketchpad').hide();
      $('#instructs').html('Thanks for participating in our experiment! ' +
        "Before you submit your HIT, we'd like to ask you a few questions.");
      $('#roundnumber').empty()	
        .append("Round\n" + (game.roundNum + 1) + " of " + game.numRounds);
    } else {
      $('#roundnumber').empty()
        .append("Round\n" + (game.roundNum + 2) + " of " + game.numRounds);
    }
    $('#score').empty().append(score + ' of ' + (game.roundNum + 1) + ' correct for a bonus of $'
			       + ((score * 3)/100).toFixed(2));
  });

  game.socket.on('stroke', function(packet) {

    jsonData = packet[0]
    message = packet[1]
    // first, allow listener to respond
    game.messageSent = true;
    // draw it
    var path = new Path();
    path.importJSON(jsonData);

    globalGame.socket.send(message.join('.'));

  });

  game.socket.on('mutualDoneDrawing', function(role) {
    // console.log('the doneness of drawing is mutual knowledge');
    globalGame.doneDrawing = true;
    globalGame.drawingAllowed = false;
    if (globalGame.my_role === globalGame.playerRoleNames.role1) {
      $('#feedback').html(" ");
      setTimeout(function(){$('#turnIndicator').html("Your partner's turn to guess the target!");},globalGame.feedbackDelay);
    } else if (globalGame.my_role === globalGame.playerRoleNames.role2) {
      $("#loading").fadeOut('fast');
      setTimeout(function(){$('#turnIndicator').html('Your turn: Select the target!');},globalGame.feedbackDelay);
    }
  });

};

var client_onjoingame = function(num_players, role) {
  // set role locally
  globalGame.my_role = role;
  globalGame.get_player(globalGame.my_id).role = globalGame.my_role;

  // this.browser = BrowserDetect.browser;
  // this.version = BrowserDetect.version;
  // this.OpSys = BrowserDetect.OS;

  _.map(_.range(num_players - 1), function(i){
    globalGame.players.unshift({id: null, player: new game_player(globalGame)});
  });

  // Update w/ role
  $('#roleLabel').append(role + '.');
  if (role === globalGame.playerRoleNames.role1) {
    txt = "target";
    $('#instructs').html("<p>Make a sketch of the target (orange)" +
      " so that your partner can tell which it is. " +
      " When you are done, click SUBMIT. </p>" +
      "<p> To draw: Click & drag on canvas OR hold down Shift key while moving cursor. </p>" +
      "<p> Important: Please do NOT resize browser window or change zoom during the game.</p>".bold());
      $("#submitbutton").show();
  } else if (role === globalGame.playerRoleNames.role2) {
    $('#instructs').html("<p>Your partner is going to draw one of these four objects." +
      " When they are done, click on the object they sketched. </p>" +
      " <p> Important: Please do NOT resize browser window or change zoom during the game.</p>".bold());
    $("#loading").show();
  }

  if(num_players == 1) {
    // Set timeout only for first player...
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

    globalGame.get_player(globalGame.my_id).message = ('Drawing will begin \n after another player connects... \n '
						       + 'Please do not refresh the page!');
  }



  // set mouse-tracking event handler
  if(role === globalGame.playerRoleNames.role2) {
    globalGame.viewport.addEventListener("click", responseListener, false);
  } else {
    globalGame.sketchpad.setupTool();
  }
};

/*
 MOUSE EVENT LISTENERS
 */

function responseListener(evt) {
  // console.log('got to responseListener inside game.client.js');
  var bRect = globalGame.viewport.getBoundingClientRect();
  var mouseX = (evt.clientX - bRect.left)*(globalGame.viewport.width/bRect.width);
  var mouseY = (evt.clientY - bRect.top)*(globalGame.viewport.height/bRect.height);
  // only allow to respond after message has been sent
  if (globalGame.messageSent) {
    // find which shape was clicked
    _.forEach(globalGame.objects, function(obj) {
      // console.log('responseListener: globalGame.doneDrawing',globalGame.doneDrawing);
      if (hitTest(obj, mouseX, mouseY) && globalGame.doneDrawing) {
        globalGame.messageSent = false;


        // highlightCell(globalGame, globalGame.get_player(globalGame.my_id), 'black',
        //               function(x){return x.subordinate == obj.subordinate;});


        // Send packet about trial to server
        var dataURL = document.getElementById('sketchpad').toDataURL();
        dataURL = dataURL.replace('data:image/png;base64,','');
        var currPose = globalGame.objects[0]['pose'];  
        var currCondition = globalGame.objects[0]['condition']; 
        var packet = ["clickedObj", obj.filename, dataURL, currPose, currCondition];
        // console.log(packet);
        globalGame.socket.send(packet.join('.'));

        if (globalGame.my_role == "viewer") {
          var clickedName = packet[1];
          var intendedName = getIntendedTargetName(globalGame.objects);
          var correct = intendedName == clickedName ? 1 : 0;
          var pngString = packet[2];
          var objectLocs = getObjectLocs(globalGame.objects);
          var trialNum = globalGame.roundNum + 1;
          var gameID = globalGame['data']['id'];
          var timestamp = Date.now();          

          // send data to mongodb (also see writeData:clickedObj in game.server)
          dbline = {role: globalGame.my_role,
                    playerID: globalGame.my_id,
                    gameID: gameID,
                    timestamp: timestamp,
                    trialNum: trialNum,
                    responseType: 'clickedObj',
                    intendedName: intendedName,
                    clickedName: clickedName,
                    correct: correct,
                    objectLocs: objectLocs,
                    pngString: pngString,
                    currPose: currPose,
                    currCondition: currCondition,
                    dbname:globalGame.dbname,
                    colname:globalGame.colname};

          // console.log(dbline);
          // jef 4/22/17: do NOT send data to mongo db until SSL certificate
          // in place 
          // $.ajax({
          //  type: 'GET',
          //  url: 'http://138.197.213.237:9919/savedecision',
          //  dataType: 'jsonp',
          //  traditional: true,
          //  contentType: 'application/json; charset=utf-8',
          //  data: dbline,
          //  timeout: 2000,
          //  retryLimit: 3,
          //  data: dbline,
          //  error: function(x, t, m) {
          //   if(t==="timeout") {
          //     console.log("got timeout, press on anyway...");
          //     this.retryLimit--;
          //     $.ajax(this);
          //     return;

          //   } else {
          //       console.log(t);
          //       this.retryLimit--;
          //       $.ajax(this);    
          //       return;                      
          //   }
          // },
          //  success: function(msg) {
          //             console.log('clickObj response: upload success!');
          //           }
          // });

        }; //

      }
    });
  }
  return false;
};

function getObjectLocs(objects) {
  return _.flatten(_.map(objects, function(object) {
    return [object.filename,
      object.speakerCoords.gridX,
      object.listenerCoords.gridX];
  }));
}

function getIntendedTargetName(objects) {
  return _.filter(objects, function(x){
    return x.target_status == 'target';
  })[0]['filename'];
}

function hitTest(shape,mx,my) {
  var dx = mx - shape.trueX;
  var dy = my - shape.trueY;
  return (0 < dx) && (dx < shape.width) && (0 < dy) && (dy < shape.height);
}
