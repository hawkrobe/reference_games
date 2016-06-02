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
  var targetH = rowVals[targetCol + 1];  
  var targetS = rowVals[targetCol + 2];
  var targetL = rowVals[targetCol + 3];  
  return _.extend(row, {
    targetX :  targetS * Math.cos(toRadians(targetH)),
    targetY :  targetS * Math.sin(toRadians(targetH)),
    targetHex:"#" + converter.hsl.hex(targetH, targetS, targetL),
    clickX : row.clickColS * Math.cos(toRadians(row.clickColH)),
    clickY : row.clickColS * Math.sin(toRadians(row.clickColH)),
    clickHex : "#" + converter.hsl.hex(row.clickColH, row.clickColS, row.clickColL)
  });
});

writeCSV(newCSV, "extendedColorReferenceClicks.csv");
