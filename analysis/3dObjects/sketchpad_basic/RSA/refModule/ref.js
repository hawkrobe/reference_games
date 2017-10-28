var _ = require('lodash');
var fs = require('fs');
var babyparse = require('babyparse');
// var JSONStream = require('JSONStream');
// var es = require('event-stream');

var getSimilarities = function(name) {
  return {
    'strict-mid-pragmatics' : require('./json/strict-similarity-pragmatics-fixedpose_conv4_2.json'),
    'nonstrict-high-sketchy' : require('./json/nonstrict-similarity-sketchy-fixedpose_fc7.json')
  };
};

var getCosts = function(name) {
  return require('./json/costs-' + name + '.json');
};

var getPossibleSketches = function(costs) {
  return _.keys(costs);
};

var getL0score = function(target, sketch, context, params) {
  var similarities = params.similarities[params.similarityMetric];
  var sum = 0;
  for(var i=0; i<context.length; i++){
    sum += Math.exp(params.simScale * similarities[context[i]][sketch]);
  }
  return Math.log(Math.exp(params.simScale * similarities[target][sketch])) - Math.log(sum);
};

var getS1score = function(trueSketch, targetObj, context, params) {
  var possibleSketches = params.possibleSketches;
  var sum = 0;
  for(var i=0; i<possibleSketches.length; i++){
    var sketch = possibleSketches[i];
    var inf = getL0score(targetObj, sketch, context, params);
    var cost = params.costs[sketch][0];
    var utility = (1-params.costWeight) * inf - params.costWeight * cost;
    sum += Math.exp(params.alpha * utility);
  }
  var trueUtility = ((1-params.costWeight) * getL0score(targetObj, trueSketch, context, params)
		     - params.costWeight * params.costs[trueSketch][0]);
  
  return Math.log(Math.exp(params.alpha * trueUtility)) - Math.log(sum);
}

var getS0score = function(trueSketch, targetObj, params) {
  var possibleSketches = params.possibleSketches;
  var similarities = params.similarities[params.similarityMetric];  
  var sum = 0;
  for(var i=0; i<possibleSketches.length; i++){
    var sketch = possibleSketches[i];
    var inf = similarities[targetObj][sketch];
    var cost = params.costs[sketch][0];
    var utility = (1-params.costWeight) * inf - params.costWeight * cost;
    sum += Math.exp(params.alpha * utility);
  }
  var trueUtility = ((1-params.costWeight) * similarities[targetObj][trueSketch]
		     - params.costWeight * params.costs[trueSketch][0]);
  
  return Math.log(Math.exp(params.alpha * trueUtility)) - Math.log(sum);
}

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

// Note this is highly specific to a single type of erp
var bayesianErpWriter = function(erp, filePrefix) {
  
  var predictiveFile = fs.openSync(filePrefix + "Predictives.csv", 'w');
  fs.writeSync(predictiveFile, ["condition", "Target", "Distractor1", "Distractor2", "Distractor3", 
				"value", "prob", "posteriorProb"] + '\n');

  var paramFile = fs.openSync(filePrefix + "Params.csv", 'w');
  fs.writeSync(paramFile, ["similarityMetric,", "speakerModel", "alpha", "typWeight", "costWeight", "logLikelihood", "posteriorProb"] + '\n');

  var supp = erp.support();
 
  supp.forEach(function(s) {
    supportWriter(s.predictive, erp.score(s), predictiveFile);
    supportWriter(s.params, erp.score(s), paramFile);
  });
  fs.closeSync(predictiveFile);
  fs.closeSync(paramFile);
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
  getSimilarities, getPossibleSketches, getCosts, getSubset,
  getL0score, getS1score, getS0score,
  bayesianErpWriter, writeCSV, readCSV, locParse
};
