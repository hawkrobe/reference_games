var _ = require('lodash');
var fs = require('fs');
var babyparse = require('babyparse');
// var JSONStream = require('JSONStream');
// var es = require('event-stream');


function _logsumexp(a) {
  var m = Math.max.apply(null, a);
  var sum = 0;
  for (var i = 0; i < a.length; ++i) {
    sum += (a[i] === -Infinity ? 0 : Math.exp(a[i] - m));
  }
  return m + Math.log(sum);
}

var normalizeWithEdgeCases = function(n, truth, sum) {
  // console.log('truth:' +JSON.stringify(truth))
  // console.log('sum:' + sum);
  // if(sum <= 0) {
  //   return -Number.MIN_VALUE;//Math.log(1/n);
  // } else if (truth === -Infinity) {
  //   return -Number.MIN_VALUE;
  // } else {

  return ad.scalar.sub(truth, ad.scalar.log(sum));
//  }
}

var states = ['blueSquare1', 'blueSquare2', 'redSquare1', 'redSquare2',
	      'spottedCircle1', 'spottedCircle2', 'stripedCircle1', 'stripedCircle2'];
var utterances = _.map(_.range(1,17), function(i) {return 'word' + i;});

var getLexiconElement = function(lexicon, utt, target) {
  var utt_i = _.indexOf(utterances, utt);
  var target_i = _.indexOf(states, target);
  var lexiconElement = T.get(lexicon, utt_i * states.length + target_i);
  return lexiconElement;
};

// P(target | sketch) \propto e^{scale * sim(t, s)}
// => log(p) = scale * sim(target, sketch) - log(\sum_{i} e^{scale * sim(t, s)})
var getL0score = function(target, utt, context, lexicon) {
  var scores = [];
  var sum = 0;
  var truth = getLexiconElement(lexicon, utt, target);
  for(var i=0; i<context.length; i++){
    sum = ad.scalar.add(sum,
			ad.scalar.exp(getLexiconElement(lexicon, utt, context[i])));
  }
  return normalizeWithEdgeCases(context.length, truth, sum);
};

var getSpeakerScore = function(trueUtt, targetObj, context, lexicon, params) {
  var scores = [];
  var sum = 0;
  var truth = ad.scalar.mul(params.alpha, getL0score(targetObj, trueUtt, context, lexicon));
  for(var i=0; i< params.utterances.length; i++){
    var inf = getL0score(targetObj, params.utterances[i], context, lexicon);
    sum = ad.scalar.sum(sum, ad.scalar.exp(ad.scalar.mul(params.alpha, inf)));
  }
  return normalizeWithEdgeCases(params.utterances.length, truth, sum);
};

function readCSV(filename){
  return babyparse.parse(fs.readFileSync(filename, 'utf8'),
			 {header:true, skipEmptyLines:true}).data;
};

function writeCSV(jsonCSV, filename){
  fs.writeFileSync(filename, babyparse.unparse(jsonCSV) + '\n');
}

function appendCSV(jsonCSV, filename){
  fs.appendFileSync(filename, babyparse.unparse(jsonCSV) + '\n');
}

var supportWriter = function(s, p, handle) {
  var sLst = _.toPairs(s);
  var l = sLst.length;

  for (var i = 0; i < l; i++) {
    fs.writeSync(handle, sLst[i].join(',')+','+p+'\n');
  }
};

var predictiveSupportWriter = function(s, p, handle) {
  var l = s.length;
  for (var i = 0; i < l; i++) {
    fs.writeSync(handle, s[i] + '\n');
  }
};

// Note this is highly specific to a single type of erp
var bayesianErpWriter = function(erp, filePrefix) {
  var supp = erp.support();
  
  if(_.has(supp[0], 'predictives')) {
    var predictiveFile = fs.openSync(filePrefix + "Predictives.csv", 'w');
    fs.writeSync(predictiveFile, ['game', "condition", 'trueSketch', "Target",
				  "Distractor1", "Distractor2", "Distractor3",
				  "coarseGrainedTrueSketch", "coarseGrainedPossibleSketch",
				  "modelProb"] + '\n');
  }
  if(_.has(supp[0], 'params')) {
    var paramFile = fs.openSync(filePrefix + "Params.csv", 'w');
    fs.writeSync(paramFile, ["perception", "pragmatics", "production", "alpha",
			     "simScaling", "pragWeight","costWeight",
			     "logLikelihood", "posteriorProb"] + '\n');
  }
  
  supp.forEach(function(s) {
    if(_.has(s, 'predictives'))
      predictiveSupportWriter(s.predictives, erp.score(s), predictiveFile);
    if(_.has(s, 'params'))
      supportWriter(s.params, erp.score(s), paramFile);
  });
  if(_.has(supp[0], 'predictives')) {
    fs.closeSync(predictiveFile);
  }
  if(_.has(supp[0], 'params')) {
    fs.closeSync(paramFile);
  }
  console.log('writing complete.');
};

var getSubset = function(data, properties) {
  var matchProps = _.matches(properties);
  return _.filter(data, matchProps);
};

var locParse = function(filename) {
  return babyparse.parse(fs.readFileSync(filename, 'utf8'),
       {header: true,
        skipEmptyLines : true}).data;
};

module.exports = {
  getSubset, getL0score, getSpeakerScore, getLexiconElement,
  bayesianErpWriter, writeCSV, readCSV, locParse
};
