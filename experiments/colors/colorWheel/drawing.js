// drawing.js
// This file contains functions to draw on the HTML5 canvas

var drawScreen = function(game, player) {
  // draw background
  game.ctx.fillStyle = "#000000";
  game.ctx.fillRect(0,0,game.viewport.width,game.viewport.height);
  game.ctx.font = "bold 23pt Helvetica";
  game.ctx.textAlign = 'center';
  
  // Draw message in center (for countdown, e.g.)
  if (player.message) {
    wrapText(game, player.message, 
             game.world.width/2, game.world.height/4,
             game.world.width*4/5,
             25);
  }
  else if (game.roundNum >= 0) {
    updateInterface(game);
  }
  if (game.colorPicker) {
    game.colorPicker.drawPicker();
    drawSwatchWithText(game, game.colorPicker.getCurrColor(), "Your choice", "right");
  }
  else if (game.currStim) {
    drawSwatchWithText(game, game.currStim, "Target color", "left");
  }
};

var updateInterface = function(game) {
  if(game.roundNum  >= game.numRounds) {
    $('#roundnumber').empty();
    $('#instructs').empty().append("Round " + (game.roundNum) + 
				   " score: " + game.score);
  } else {
    $('#roundnumber').empty().append("Round ", game.roundNum + 1,
				     "/", game.numRounds);
  }
    console.log(game.score);
  if(game.score !== undefined) {
    $('#score').empty().append("Round ", game.roundNum,  
			       " score: ", game.score, "/", game.maxScore);
  }
};

var drawSwatchWithText = function(game, colorArr, text, location) {
  var padding = 50;
  var xLoc = location === "left" ? 0 : 300;
  // Erase background
  game.ctx.fillStyle = "#000000";
  game.ctx.fillRect(xLoc, 0, 300, game.viewport.height);
  // Draw text
  game.ctx.fillStyle = "white";
  game.ctx.fillText(text, xLoc + 150, 40);
  // Draw outline
  game.ctx.beginPath();
  game.ctx.strokeStyle = "white";
  game.ctx.lineWidth = "2";
  game.ctx.rect(xLoc + padding - 2, padding - 2,
		    300 - padding * 2 + 4, 300 - padding * 2 + 4);  
  game.ctx.stroke();
  // Draw Swatch
  game.ctx.fillStyle = ('hsl(' + colorArr[0] + ',' + colorArr[1] +
			'%, ' + colorArr[2] + '%)');
  game.ctx.fillRect(xLoc + padding, padding,
		    300 - padding * 2, 300 - padding * 2);  
  
};

var colorPicker = function(game) {
  this.game = game;
  this.ctx = game.ctx;
  this.padding = 50;
  this.centerX = game.viewport.width / 4;
  this.centerY = game.viewport.height / 2;// - (this.padding/2);
  this.radius = 110;
//  this.lightnessTop = 250;
  this.drawPicker = function() {
    this.drawDisc();
    this.drawDiscCursor();
    // this.drawLightnessRect();
    // this.drawLightnessCursor();
  };
  this.reset = function() {
    this.discCursorX = this.centerX;
    this.discCursorY = this.centerY;
//    this.lightnessCursor = 150;
    this.hue = 0;
    this.sat = 0;
    this.light = 50;
  };
};

colorPicker.prototype.getCurrColor = function() {
  return [this.hue, this.sat, this.light];
};

colorPicker.prototype.discHitTest = function(x, y) {
  var dx = x - this.centerX;
  var dy = y - this.centerY;
  return dx * dx + dy * dy < this.radius * this.radius;
};

// colorPicker.prototype.lightnessHitTest = function(x, y) {
//   var dx = x - this.centerX;
//   var dy = y - this.lightnessTop;
//   console.log(dx, dy);
//   return (Math.abs(dx) < (300 - this.padding * 2)/2 &&
// 	  0 < dy && dy < this.padding/2);
// };

colorPicker.prototype.setDiscCursor = function(x,y) {
  var dx = x - this.centerX;
  var dy = y - this.centerY;
  var R = this.radius - this.radius / 20;
  if(this.discHitTest(x,y)) {
    this.discCursorX = x;
    this.discCursorY = y;
    this.hue = (angle(dx,dy) + 360) % 360;
    this.sat = (dx * dx + dy * dy) / this.radius / this.radius * 100;
  }
};

colorPicker.prototype.drawDiscCursor = function() {
  this.ctx.beginPath();
  this.ctx.arc(this.discCursorX, this.discCursorY, this.radius/20, 0, 2*Math.PI);
  this.ctx.stroke();
};

// colorPicker.prototype.setLightness = function(x, y) {
//   if(this.lightnessHitTest(x, y)) {
//     this.lightnessCursor = x;
//     this.light = (x - this.padding) / 2;
//   }
// };

// colorPicker.prototype.drawLightnessCursor = function() {
//   this.ctx.beginPath();
//   this.ctx.rect(this.lightnessCursor-5, this.lightnessTop - 5,
// 		10, this.padding/2 + 10);
//   this.ctx.stroke();
// };

colorPicker.prototype.drawDisc = function() {
  var counterClockwise = false;

  this.ctx.beginPath();
  this.ctx.strokeStyle = "#FFFFFF";
  this.ctx.lineWidth = 5;
  this.ctx.arc(this.centerX, this.centerY, this.radius + 4, 0, Math.PI * 2);
  this.ctx.stroke();
  this.ctx.lineWidth = 1;
  
  for(var angle=0; angle<=360; angle+=0.5){
    var startAngle = (angle-2)*Math.PI/180;
    var endAngle = angle * Math.PI/180;
    this.ctx.beginPath();
    this.ctx.moveTo(this.centerX, this.centerY);
    this.ctx.arc(this.centerX, this.centerY, this.radius,
		 startAngle, endAngle, counterClockwise);
    this.ctx.closePath();
    var gradient = this.ctx.createRadialGradient(this.centerX,this.centerY,0,
						 this.centerX,this.centerY,this.radius);
    gradient.addColorStop(0,'hsl('+angle+', 0%, 50%)');
    gradient.addColorStop(1,'hsl('+angle+', 100%, 50%)');
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }
};

// colorPicker.prototype.drawLightnessRect = function() {
//   var rectGradient = this.ctx.createLinearGradient(this.padding, this.lightnessTop,
// 						   300-this.padding, this.lightnessTop);
//   rectGradient.addColorStop(0,  "hsl(" + this.hue + "," + this.sat + "%,0%)");
//   rectGradient.addColorStop(0.5,"hsl(" + this.hue + "," + this.sat + "%,50%)");
//   rectGradient.addColorStop(1,  "hsl(" + this.hue + "," + this.sat + "%,100%)");
//   this.ctx.fillStyle=rectGradient;
//   this.ctx.fillRect(this.padding,300-this.padding,
// 		    300 - (this.padding * 2), this.padding/2);
// };

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

var angle = function(x, y) {
  return (x < 0) * 180 + Math.atan(-y / -x) * 180 / Math.PI;
};
