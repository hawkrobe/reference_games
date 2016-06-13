var PythonShell = require('python-shell');

var pyshell = new PythonShell('netInterface.py', {
  mode: 'json'
});

var output = '';
pyshell.stdout.on('data', function (data) {
  console.log(data);
});

pyshell
  .send({ a: 'b' })
  .send(null)
  .send([1, 2, 3])
  .end(function (err) {
    if (err) console.log(err);
  });
