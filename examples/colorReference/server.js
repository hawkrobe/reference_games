var config = require('config');
var GameServer = require('reference_games');

var core = new GameServer(config);

core.trialList = require('trials');
core.customEvents = require('events');

core.launch();
