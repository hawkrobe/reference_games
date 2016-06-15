module.exports = function(env) {
  var PythonShell = require('python-shell');
  var converter = require("color-convert");

  var getScore = function(s, k, a, netInput) {
    var pyshell = new PythonShell("wppl-color/netInterface.py", {
      mode: 'json'
    });
    var jsonObj = {utterance: netInput.utterance,
		   color: converter.hex.hsv(netInput.color)};
    var output = 0;
    
    pyshell.on('message', function(score) {
      console.log(score);
      output += score[0];
    }).send(jsonObj).end(function(err) {
      if(err) console.log(err);
      console.log(output);
      var trampoline = k(s, output);
      while (trampoline){
	trampoline =trampoline();
      }
    });
  };

  //   // {utterance, color
  //   pyshell.stdout.on('data', function (data) {
  //     
  //   });
  //   pyshell.send(converter.hex.hsv(netInput));
  // };

  return {
    // Adjust exports here
    getScore: getScore
  };
};
