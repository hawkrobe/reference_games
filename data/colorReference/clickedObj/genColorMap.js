var fs = require('fs');
var babyparse = require('babyparse');
var _ = require("../../../experiments/node_modules/underscore");
var converter = require("../../../experiments/node_modules/color-convert");

function writeCSV(jsonCSV, filename){
  fs.writeFileSync(filename, babyparse.unparse(jsonCSV) + "\n");
};

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

var rangeH = _.range(0, 360,2);
var rangeS = _.range(0, 100,5); 

var newCSV = _.flatten(_.map(rangeH, function(H) {
  return _.map(rangeS, function(S) {
    return {x : S * Math.cos(toRadians(H)),
	    y : S * Math.sin(toRadians(H)),
	    hex : "#" + converter.hsl.hex(H, S, 50)};
  });
}));

writeCSV(newCSV, "colorMap.csv");
