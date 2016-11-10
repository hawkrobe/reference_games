var _ = require('underscore');
var fs = require('fs');
var converter = require("color-convert");
var DeltaE = require('../node_modules/delta-e');

var UUID = function() {
  var baseName = (Math.floor(Math.random() * 10) + '' +
        Math.floor(Math.random() * 10) + '' +
        Math.floor(Math.random() * 10) + '' +
        Math.floor(Math.random() * 10));
  var template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  var id = baseName + '-' + template.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
  return id;
};

var getLongFormTime = function() {
  var d = new Date();
  var fullTime = (d.getFullYear() + '-' + d.getMonth() + 1 + '-' +
        d.getDate() + '-' + d.getHours() + '-' + d.getMinutes() + '-' +
        d.getSeconds() + '-' + d.getMilliseconds());
  return fullTime;
};

var establishStream = function(game, streamName, outputFileName, header) {
  var streamLoc = "../data/" + game.expName + "/" + streamName + "/" + outputFileName;
  fs.writeFile(streamLoc, header, function (err) {if(err) throw err;});
  var stream = fs.createWriteStream(streamLoc, {'flags' : 'a'});
  game.streams[streamName] = stream;
};

var hsl2lab = function(hsl) {
  return converter.hsl.lab(hsl);
};

function fillArray(value, len) {
  var arr = [];
  for (var i = 0; i < len; i++) {
    arr.push(value);
  }
  return arr;
}

var checkInBounds = function(object, options) {
  return (object.x + (object.w || object.d) < options.width) &&
         (object.y + (object.h || object.d) < options.height);
};

var randomColor = function (options) {
  var h = ~~(Math.random() * 360);
  var s = ~~(Math.random() * 100);
  var l = _.has(options, 'fixedL') ? 50 : ~~(Math.random() * 100) ;
  return [h, s, l];
};

var randomSpline = function () {
  var numPoints = 4;
  return _.sample(_.range(50, 250), 2 * numPoints);
};

// returns an object with x, y, w, h fields
var randomRect = function(options) {
  if (_.isEmpty(options)) {
    throw "Error, must provide options to randomRect!";
  }

  var wRange = _.range(options.wMin, options.wMax);
  var hRange = _.range(options.hMin, options.hMax);

  var rect = randomPoint(options);
  rect.h = _.sample(wRange),
  rect.w = _.sample(hRange)

  if (!checkInBounds(rect, options)) {
    return this.randomRect(options);
  }

  return rect;
}

var randomCircle = function(options) {
  if (_.isEmpty(options)) {
    throw "Error, must provide options to randomCircle!";
  }

  //TODO, better error checking
  var dRange = _.range(options.dMin, options.dMax);
  if (_.isEmpty(dRange)) dRange = [options.dMin]; //hacky for now

  var circle = randomPoint(options);
  circle.d = _.sample(dRange);

  if (!checkInBounds(circle, options)) {
    return this.randomCircle(options);
  }

  return circle;
}

var randomPoint = function(options) {

  var xRange = _.range(options.xMin, options.xMax);
  var yRange = _.range(options.yMin, options.yMax);

  return {
    x: _.sample(xRange),
    y: _.sample(yRange)
  }
}

var colorDiff = function(color1, color2) {
  var subLAB = _.object(['L', 'A', 'B'], hsl2lab(color1));
  var tarLAB = _.object(['L', 'A', 'B'], hsl2lab(color2));
  var diff = Math.round(DeltaE.getDeltaE00(subLAB, tarLAB));
  return diff;
};

module.exports = {
  UUID : UUID,
  getLongFormTime : getLongFormTime,
  establishStream: establishStream,
  hsl2lab : hsl2lab,
  fillArray: fillArray,
  randomColor: randomColor,
  randomRect: randomRect,
  randomCircle: randomCircle,
  randomPoint: randomPoint,
  randomSpline: randomSpline,
  colorDiff : colorDiff
};
