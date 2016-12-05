// drawing.js
// This file contains functions to draw on the HTML5 canvas

var drawPlaza = function(game) {

  //http://stackoverflow.com/questions/6295564/html-canvas-dotted-stroke-around-circle
  var calcPointsCirc = function calcPointsCirc(cx,cy, rad, dashLength)
  {
      var n = rad/dashLength,
          alpha = Math.PI * 2 / n,
          pointObj = {},
          points = [],
          i = -1;

      while( i < n )
      {
          var theta = alpha * i,
              theta2 = alpha * (i+1);

          points.push({x : (Math.cos(theta) * rad) + cx, y : (Math.sin(theta) * rad) + cy, ex : (Math.cos(theta2) * rad) + cx, ey : (Math.sin(theta2) * rad) + cy});
          i+=2;
      }
      return points;
  }

  var drawCircle = function(circle) {
    var pointArray = calcPointsCirc(circle.x, circle.y, circle.d / 2.0, 0.5);
    game.ctx.strokeStyle = 'black'
    game.ctx.beginPath();

    for(p = 0; p < pointArray.length; p++){
        game.ctx.moveTo(pointArray[p].x, pointArray[p].y);
        game.ctx.lineTo(pointArray[p].ex, pointArray[p].ey);
        game.ctx.stroke();
    }

    game.ctx.closePath();
  }

  drawCircle(game.currStim.plaza);
};

var drawSectors = function(game) {
  var drawRect = function drawRect(rect, color) {
    game.ctx.beginPath();
    game.ctx.rect(rect.x, rect.y, rect.w, rect.h);
    game.ctx.fillStyle = color;
    game.ctx.fill();
    game.ctx.stroke();
  }

  drawRect(game.currStim.red, 'red');
  drawRect(game.currStim.blue, 'blue');
};

var drawLily = function(game, x, y) {
  var img = new Image;
  img.onload = function() {
    game.ctx.drawImage(img, x-20, y-20); //adjust for size of lily
  }
  img.src = "lotus.png"
}

var drawPoint = function(game, x, y) {
  game.ctx.beginPath();
  game.ctx.rect(x - 5, y - 5, 10, 10);
  game.ctx.fillStyle = 'yellow';
  game.ctx.fill();
  game.ctx.stroke();
}

var drawTarget = function(game, x, y) {
  game.ctx.beginPath();
  game.ctx.arc(x, y, 50, 0, 2 * Math.PI);
  game.ctx.fillStyle = "rgba(200, 200, 200, 0.25)";
  game.ctx.fill();
  game.ctx.stroke();
}

var drawScreen = function(game, player) {
  // draw background
  game.ctx.fillStyle = "#FFFFFF";
  game.ctx.fillRect(0,0,game.viewport.width,game.viewport.height);

  // Draw message in center (for countdown, e.g.)
  if (player.message) {
    game.ctx.font = "bold 23pt Helvetica";
    game.ctx.fillStyle = 'blue';
    game.ctx.textAlign = 'center';
    wrapText(game, player.message,
             game.world.width/2, game.world.height/4,
             game.world.width*4/5,
             25);
  }
  else {
    console.log(game);
    if (!_.isEmpty(game.currStim)) {
      drawSectors(game, player);
      drawPlaza(game);

      if (game.my_role === game.playerRoleNames.role1) {
        if (game.roundNum <= 2) { //trial only
          drawTarget(game, game.currStim.lily.x, game.currStim.lily.y);
        }
        drawLily(game, game.currStim.lily.x, game.currStim.lily.y);
      }
    }
  }

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
