/*  Copyright (c) 2012 Sven "FuzzYspo0N" Bergström, 2013 Robert XD Hawkins

    originally written for: http://buildnewgames.com/real-time-multiplayer/
    
    substantially modified for collective behavior experiments 

    MIT Licensed.
*/

global.__base = __dirname + '/';

var 
    use_https     = true,
    argv          = require('minimist')(process.argv.slice(2)),
    https         = require('https'),
    fs            = require('fs'),
    app           = require('express')(),
    _             = require('underscore'),
    Server        = require('./sharedUtils/serverBase.js');

var gameport;

if(argv.gameport) {
  gameport = argv.gameport;
  console.log('using port ' + gameport);
} else {
  gameport = 8888;
  console.log('no gameport specified: using 8888\nUse the --gameport flag to change');
}

if(argv.expname) {
  var exp = argv.expname.replace(/\/$/, "");
  var gameServer = new Server(exp);  
} else {
  throw new Error("missing arguments. Use --expname flag (e.g. 'node app.js --expname spatial')");
}

try {
  var privateKey  = fs.readFileSync('/etc/apache2/ssl/rxdhawkins.me.key'),
      certificate = fs.readFileSync('/etc/apache2/ssl/rxdhawkins.me.crt'),
      intermed    = fs.readFileSync('/etc/apache2/ssl/intermediate.crt'),
      options     = {key: privateKey, cert: certificate, ca: intermed},
      server      = require('https').createServer(options,app).listen(gameport),
      io          = require('socket.io')(server);
} catch (err) {
  console.log("cannot find SSL certificates; falling back to http");
  var server      = app.listen(gameport),
      io          = require('socket.io')(server);
}

var utils = require('./sharedUtils/sharedUtils.js');

var global_player_set = {};

// Log something so we know that server-side setup succeeded
console.log("info  - socket.io started");
console.log('\t :: Express :: Listening on port ' + gameport );

app.get( '/*' , function( req, res ) {
  var id = req.query.workerId;
  if(!id || id === 'undefined') {
    // If no worker id supplied (e.g. for demo), allow to continue
    return utils.serveFile(req, res);
  } else if(!valid_id(id)) {
    // If invalid id, block them    
    return utils.handleInvalidID(req, res);
  } else {
    // If the database shows they've already participated, block them
    utils.checkPreviousParticipant(id, (exists) => {
      return exists ? utils.handleDuplicate(req, res) : utils.serveFile(req, res);
    });
  }
}); 

// Socket.io will call this function when a client connects. We check
// to see if the client supplied a id. If so, we distinguish them by
// that, otherwise we assign them one at random
io.on('connection', function (client) {
  // Recover query string information and set condition
  var hs = client.request;
  var query = require('url').parse(hs.headers.referer, true).query;
  var id;
  if( !(query.workerId && query.workerId in global_player_set) ) {
    if(!query.workerId || query.workerId === 'undefined') {
      id = utils.UUID();
    } else {
      // useid from query string if exists
      global_player_set[query.workerId] = true;
      id = query.workerId; 
    }
    if(valid_id(id)) {
      initialize(query, client, id);
    }
  }
});

var valid_id = function(id) {
  return (id.length <= 15 && id.length >= 12) || id.length == 41;
};

var initialize = function(query, client, id) {
  // Assign properties to client
  client.userid = id;
  client.workerid = query.workerId ? query.workerId : '';
  client.assignmentid = query.assignmentId ? query.assignmentId : '';

  // Make contact with client
  client.emit('onconnected', { id: client.userid } );
  if(gameServer.setCustomEvents) {gameServer.setCustomEvents(client);};
  
  // Good to know when they connected
  console.log('\t socket.io:: player ' + client.userid + ' connected');

  //Pass off to game.server.js code
  gameServer.findGame(client);
  
  // Now we want set up some callbacks to handle messages that clients will send.
  // We'll just pass messages off to the server_onMessage function for now.
  client.on('message', function(m) {
    gameServer.onMessage(client, m);
  });
  
  // When this client disconnects, we want to tell the game server
  // about that as well, so it can remove them from the game they are
  // in, and make sure the other player knows that they left and so on.
  client.on('disconnect', function () {            
    console.log('\t socket.io:: client id ' + client.userid 
                + ' disconnected from game id ' + client.game.id);

    // in colorReference, we don't mind duplicates across games 
    if(exp == "colorReference" || exp == "colorReference/") {
      delete global_player_set[client.userid];
    }

    //If the client was in a game set by gameServer.findGame,
    //we can tell the game server to update that game state.
    if(client.userid && client.game && client.game.id) 
      gameServer.endGame(client.game.id, client.userid);            
  });
};

