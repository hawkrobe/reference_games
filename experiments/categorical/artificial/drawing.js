// drawing.js
// This file contains functions to draw on the HTML5 canvas

// Draws a grid of cells on the canvas (evenly divided
var drawGrid = function(game){
    //size of canvas
    var cw = game.viewport.width;
    var ch = game.viewport.height;

    //padding around grid
    var p = game.cellPadding / 2;

    //grid width and height
    var bw = cw - (p*2) ;
    var bh = ch - (p*2) ;

    game.ctx.beginPath();

    // vertical lines
  for (var x = 0; x <= bw; x += Math.floor((cw - 2*p) / game.numHorizontalCells)) {
        game.ctx.moveTo(0.5 + x + p, p);
        game.ctx.lineTo(0.5 + x + p, bh + p);}

    // horizontal lines
    for (var x = 0; x <= bh; x += Math.floor((ch - 2*p) / game.numVerticalCells)) {
        game.ctx.moveTo(p, 0.5 + x + p);
        game.ctx.lineTo(bw + p, 0.5 + x + p);}

  game.ctx.lineWidth = '5';
  game.ctx.strokeStyle = "#000000";
  game.ctx.stroke();
};

// Loop through the object list and draw each one in its specified location
var drawObjects = function(game, player) {
    _.map(globalGame.objects, function(obj) {
      // game.ctx.globalCompositeOperation='destination-over';  // draw under highlight
      var customCoords = globalGame.my_role == "speaker" ? 'speakerCoords' : 'listenerCoords';
      var trueX = obj[customCoords]['trueX'];
      var trueY = obj[customCoords]['trueY'];
      var gridX = obj[customCoords]['gridX'];
      var gridY = obj[customCoords]['gridY'];
      // console.log(obj['subordinate'],customCoords,gridX,gridY,trueX,trueY);
      globalGame.ctx.drawImage(obj.img, trueX, trueY,obj.width, obj.height);
    });

};

var drawScreen = function(game, player) {
  // draw background
  game.ctx.fillStyle = "#FFFFFF";
  game.ctx.fillRect(0,0,game.viewport.width,game.viewport.height);

  // Draw message in center (for countdown, e.g.)
  if (player.message) {
    game.ctx.font = "bold 40pt Helvetica";
    game.ctx.fillStyle = 'blue';
    game.ctx.textAlign = 'center';
    wrapText(game, player.message,
             game.world.width/2, game.world.height/4,
             game.world.width*4/5,
             50);
  }
  else {
//    drawGrid(globalGame);
    drawObjects(globalGame, player);
  }
};

function drawSketcherFeedback(globalGame, scoreDiff, clickedObjName) {
  // textual feedback
  if (scoreDiff > 0) {
    // visual feedback
    highlightCell(globalGame, '#19A319', x => x.name == clickedObjName);
    setTimeout(() => {
      $('#feedback').html('Great job! Your partner correctly identified the target.');
    }, globalGame.feedbackDelay);
  } else {
    highlightCell(globalGame, '#C83232', x => x.name == clickedObjName);
    setTimeout(() => {
      $('#feedback').html('Too bad... Your partner thought the target was the object outlined in ' + 'red'.fontcolor('#C83232').bold() + '.');
    }, globalGame.feedbackDelay);
  }
};

function drawViewerFeedback(globalGame, scoreDiff, clickedObjName) {
  // viewer feedback
  highlightCell(globalGame, '#000000', x => x.name == clickedObjName);
  if (scoreDiff > 0) {
    highlightCell(globalGame, '#19A319', x => x.targetStatus == 'target');
    setTimeout(() => {
      $('#feedback').html('Great job! You correctly identified the target!');
    }, globalGame.feedbackDelay);
  } else {
    highlightCell(globalGame, '#C83232', x => x.targetStatus == 'target');
    setTimeout(() => {
      $('#feedback').html('Sorry... The target was the object outlined in '
			  + 'red'.fontcolor("#C83232").bold() + '.');
    }, globalGame.feedbackDelay);
  }
};

var highlightCell = function(game, color, condition) {
  var targetObjects = _.filter(game.objects, condition);
  var customCoords = game.my_role == "speaker" ? 'speakerCoords' : 'listenerCoords';
  for (var i = 0; i < targetObjects.length; i++){
    var coords = targetObjects[i][customCoords];
    var upperLeftX = game.getPixelFromCell(coords).upperLeftX;
    var upperLeftY = game.getPixelFromCell(coords).upperLeftY;
    game.ctx.globalCompositeOperation='source-over';
    if (upperLeftX != null && upperLeftY != null) {
      game.ctx.beginPath();
      game.ctx.lineWidth="20";
      game.ctx.strokeStyle=color;
      game.ctx.rect(upperLeftX +10 , upperLeftY +10 ,game.cellDimensions.width-20,game.cellDimensions.height-20);
      game.ctx.stroke();
    }
  }
};

function disableLabels(game) {
  interact('p').unset();
  interact('#chatarea').unset();
}

function enableLabels(game) {
  var labels = document.querySelector('#message_panel');
  var startPos = null;
  var dropCenter = null;
  interact('p', {context: labels})
    .draggable({
      restrict: {
      	restriction: "parent",
      	endOnly: true,
      	elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
      },
      onstart: function(event) {
      	var rect = interact.getElementRect(event.target);

      	// record center point when starting the very first a drag
      	startPos = {
          x: rect.left + rect.width  / 2,
          y: rect.top  + rect.height / 2
      	}

      	event.interactable.draggable({
          snap: {
            targets: [startPos]
          }
      	});
      },

      snap: {
        targets: [startPos],
        range: Infinity,
        relativePoints: [ { x: 0.5, y: 0.5 } ],
        endOnly: true
      },
      onmove: dragMoveListener
    });
  
  interact('#chatarea')
    .dropzone({
      accept: '.draggable',
      overlap: .5,
      ondragenter: function (event) {
	var draggableElement = event.relatedTarget,
            dropzoneElement  = event.target,
            dropRect         = interact.getElementRect(dropzoneElement);
	
        dropCenter = {
          x: dropRect.left + dropRect.width  / 2,
          y: dropRect.top  + dropRect.height / 2
        };
	
        event.draggable.draggable({
          snap: {
            targets: [dropCenter]
          }
        });
      },
      ondrop: function(event) {
	$('#chatarea').css('background-color', '#32CD32');
	var timeElapsed = new Date() - game.roundStartTime;
	game.socket.send('drop.' + event.relatedTarget.innerHTML + '.' + timeElapsed);
	interact('p', {context: labels}).draggable(false);
      }
    });
  
};

// This is a helper function to write a text string onto the HTML5 canvas.
// It automatically figures out how to break the text into lines that will fit
// Input:
//    * game: the game object (containing the ctx canvas object)
//    * text: the string of text you want to writ
//    * x: the x coordinate of the point you want to start writing at (in pixels)
//    * y: the y coordinate of the point you want to start writing at (in pixels)
//    * maxWidth: the maximum width you want to allow the text to span (in pixels)
//    * lineHeight: the vertical space you want between lines (in pixels)
function wrapText(game, text, x, y, maxWidth, lineHeight) {
  var cars = text.split("\n");
  game.ctx.fillStyle = 'white';
  game.ctx.fillRect(0, 0, game.viewport.width, game.viewport.height);
  game.ctx.fillStyle = 'red';

  for (var ii = 0; ii < cars.length; ii++) {

    var line = "";
    var words = cars[ii].split(" ");

    for (var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + " ";
      var metrics = game.ctx.measureText(testLine);
      var testWidth = metrics.width;

      if (testWidth > maxWidth) {
        game.ctx.fillText(line, x, y);
        line = words[n] + " ";
        y += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    game.ctx.fillText(line, x, y);
    y += lineHeight;
  }
}
