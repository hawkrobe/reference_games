var fs = require('fs');
var babyparse = require('babyparse');
var _ = require("../../../experiments/node_modules/underscore");
var converter = require("../../../experiments/node_modules/color-convert");

function readCSV(filename){
  return babyparse.parse(fs.readFileSync(filename, 'utf8'),
			 {header : true}).data;
};

function writeCSV(jsonCSV, filename){
  fs.writeFileSync(filename, babyparse.unparse(jsonCSV) + "\n");
};

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

var csv = readCSV("./colorReferenceClicks.csv");

var newCSV = _.map(csv, function(row) {
  var rowVals = _.values(row);
  var targetCol = _.indexOf(rowVals, "target");
  var alt1Col = _.indexOf(rowVals, "distr1");
  var alt2Col = _.indexOf(rowVals, "distr2");  
  var targetHSL = _.map([1,2,3], function(i) {return rowVals[targetCol + i]; });
  var alt1HSL = _.map([1,2,3], function(i) {return rowVals[alt1Col + i]; });
  var alt2HSL = _.map([1,2,3], function(i) {return rowVals[alt2Col + i]; });
  return _.extend(row, {
    targetX :  targetHSL[1] * Math.cos(toRadians(targetHSL[0])),
    targetY :  targetHSL[1] * Math.sin(toRadians(targetHSL[0])),
    targetHex:"#" + converter.hsl.hex(targetHSL),
    alt1X :  alt1HSL[1] * Math.cos(toRadians(alt1HSL[0])),
    alt1Y :  alt1HSL[1] * Math.sin(toRadians(alt1HSL[0])),
    alt1Hex:"#" + converter.hsl.hex(alt1HSL),
    alt2X :  alt2HSL[1] * Math.cos(toRadians(alt2HSL[0])),
    alt2Y :  alt2HSL[1] * Math.sin(toRadians(alt2HSL[0])),
    alt2Hex:"#" + converter.hsl.hex(alt2HSL),
    clickX : row.clickColS * Math.cos(toRadians(row.clickColH)),
    clickY : row.clickColS * Math.sin(toRadians(row.clickColH)),
    clickHex : "#" + converter.hsl.hex(row.clickColH, row.clickColS, row.clickColL)
  });
});

writeCSV(newCSV, "extendedColorReferenceClicks.csv");
