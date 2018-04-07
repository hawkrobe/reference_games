var ROUNDS_PER_GAME = 50;
var NUM_GAMES = parseInt(process.argv[2]);
var OUTPUT_DIRECTORY = process.argv[3];
var GRID_DIMENSION = parseInt(process.argv[4]);
var NUM_OBJS = parseInt(process.argv[5]);

_ = require('underscore');
assert = require('assert');
jsonfile = require('jsonfile');
mkdirp = require('mkdirp');
fs = require('fs');
utils = require('../../sharedUtils/sharedUtils.js');
trial = require('../trial.js');

/**
 * Shuffles array in place.
 * From https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
}

function makeGameTrials(numRounds) {
  var trialList = [];
  for (var i = 0; i < numRounds; i++) {
    var condition = undefined;
    if (i < numRounds/3.0)
      condition = trial.CONDITION_FAR;
    else if (i < 2.0*numRounds/3.0)
      condition = trial.CONDITION_SPLIT;
    else
      condition = trial.CONDITION_CLOSE;

    trialList.push(trial.makeRandom(NUM_OBJS, condition, GRID_DIMENSION));
  }

  shuffle(trialList);

  return trialList;
}

function makeDataPoint(gameId, roundNum, roundObj) {
  var stateTime = Date.now();
  var stateDataPoint = {
    eventType : "state",
    type : "StateColorGrid",
    gameid: gameId,
    time : stateTime,
    roundNum : roundNum,
    state : JSON.stringify(roundObj)
  };

  return stateDataPoint;
}

mkdirp.sync(OUTPUT_DIRECTORY, err => {if (err) console.error(err);});

for (var i = 0; i < NUM_GAMES; i++) {
  var trials = makeGameTrials(ROUNDS_PER_GAME);
  var gameDataStr = _.keys(makeDataPoint(i, 0, trials[0])).join('\t') + '\n';

  for (var j = 0; j < ROUNDS_PER_GAME; j++) {
    var dataPoint = makeDataPoint(i, j, trials[j]);
    gameDataStr += _.values(dataPoint).join('\t') + "\n";
  }

  var fileName =  i + ".csv";
  var filePath = [OUTPUT_DIRECTORY, fileName].join('/');
  var stream = fs.createWriteStream(filePath);
  stream.write(gameDataStr, err => {if(err) throw err;});
  stream.end();
}
