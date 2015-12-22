// drawing.js
// This file contains functions to draw on the HTML5 canvas

var drawScreen = function(game, player) {
  // draw background
  game.ctx.fillStyle = "#000000";
  game.ctx.fillRect(0,0,game.viewport.width,game.viewport.height);
  
  // Draw message in center (for countdown, e.g.)
  if (player.message) {
    game.ctx.font = "bold 23pt Helvetica";
    game.ctx.textAlign = 'center';
    wrapText(game, player.message, 
             game.world.width/2, game.world.height/4,
             game.world.width*4/5,
             25);
  } else if (game.colorPicker) {
    game.colorPicker.drawPicker();
    game.colorPicker.drawCurrColor();
  };
};

var colorPicker = function(game) {
  this.game = game;
  this.ctx = game.ctx;
  this.padding = 50;
  this.centerX = game.viewport.width / 4;
  this.centerY = game.viewport.height / 2 - (this.padding/2);
  this.radius = 100;
  this.discCursorX = this.centerX;
  this.discCursorY = this.centerY;
  this.lightnessCursor = 150;
  this.lightnessTop = 250;
  this.hue = 0;
  this.sat = 0;
  this.light = 50;
  this.drawPicker = function() {
    this.drawDisc();
    this.drawDiscCursor();
    this.drawLightnessRect();
    this.drawLightnessCursor();
  };
  this.drawCurrColor = function() {
    this.ctx.fillStyle = 'hsl('+this.hue+', ' + this.sat + '%, ' + this.light + '%)';
    this.ctx.fillRect(300 + this.padding, this.padding,
		      300 - this.padding * 2, 300 - this.padding * 2);
  };
};

colorPicker.prototype.discHitTest = function(x, y) {
  var dx = x - this.centerX;
  var dy = y - this.centerY;
  return dx * dx + dy * dy < this.radius * this.radius;
};

colorPicker.prototype.lightnessHitTest = function(x, y) {
  var dx = x - this.centerX;
  var dy = y - this.lightnessTop;
  console.log(dx, dy);
  return (Math.abs(dx) < (300 - this.padding * 2) &&
	  0 < dy && dy < this.padding/2);
};

colorPicker.prototype.setDiscCursor = function(x,y) {
  var dx = x - this.centerX;
  var dy = y - this.centerY;
  var R = this.radius - this.radius / 20;
  if(this.discHitTest(x,y)) {
    this.discCursorX = x;
    this.discCursorY = y;
    this.hue = angle(dx,dy);
    this.sat = (dx * dx + dy * dy) / this.radius / this.radius * 100;
    console.log("changed hue to " + this.hue);
    console.log("changed sat to " + this.sat);
  }
};

colorPicker.prototype.drawDiscCursor = function() {
  this.ctx.beginPath();
  this.ctx.arc(this.discCursorX, this.discCursorY, this.radius/20, 0, 2*Math.PI);
  this.ctx.stroke();
};

colorPicker.prototype.setLightness = function(x) {
  this.lightnessCursor = x;
  this.light = (x - this.padding) / 2;
};

colorPicker.prototype.drawLightnessCursor = function() {
  this.ctx.beginPath();
  this.ctx.rect(this.lightnessCursor-5, this.lightnessTop - 5,
		10, this.padding/2 + 10);
  this.ctx.stroke();
};

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
    gradient.addColorStop(0,'hsl('+angle+', 10%, 100%)');
    gradient.addColorStop(1,'hsl('+angle+', 100%, 50%)');
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }
};

colorPicker.prototype.drawLightnessRect = function() {
  var rectGradient = this.ctx.createLinearGradient(this.padding, this.lightnessTop,
						   300-this.padding, this.lightnessTop);
  rectGradient.addColorStop(0,  "hsl(" + this.hue + "," + this.sat + "%,0%)");
  rectGradient.addColorStop(0.5,"hsl(" + this.hue + "," + this.sat + "%,50%)");
  rectGradient.addColorStop(1,  "hsl(" + this.hue + "," + this.sat + "%,100%)");
  this.ctx.fillStyle=rectGradient;
  this.ctx.fillRect(this.padding,300-this.padding,
		    300 - (this.padding * 2), this.padding/2);
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

function angle(x, y) {
  return (x < 0) * 180 + Math.atan(-y / -x) * 180 / Math.PI;
}

// from https://github.com/MoOx/color-convert

function rgb2xyz(rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;

  // assume sRGB
  r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
  g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
  b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);

  var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
  var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
  var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

  return [x * 100, y * 100, z * 100];
}

function hsl2rgb(hsl) {
  var h = hsl[0] / 360;
  var s = hsl[1] / 100;
  var l = hsl[2] / 100;
  var t1;
  var t2;
  var t3;
  var rgb;
  var val;

  if (s === 0) {
    val = l * 255;
    return [val, val, val];
  }

  if (l < 0.5) {
    t2 = l * (1 + s);
  } else {
    t2 = l + s - l * s;
  }

  t1 = 2 * l - t2;

  rgb = [0, 0, 0];
  for (var i = 0; i < 3; i++) {
    t3 = h + 1 / 3 * -(i - 1);
    if (t3 < 0) {
      t3++;
    }
    if (t3 > 1) {
      t3--;
    }

    if (6 * t3 < 1) {
      val = t1 + (t2 - t1) * 6 * t3;
    } else if (2 * t3 < 1) {
      val = t2;
    } else if (3 * t3 < 2) {
      val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
    } else {
      val = t1;
    }

    rgb[i] = val * 255;
  }

  return rgb;
}

function rgb2lab(rgb) {
  var xyz = rgb2xyz(rgb);
  var x = xyz[0];
  var y = xyz[1];
  var z = xyz[2];
  var l;
  var a;
  var b;

  x /= 95.047;
  y /= 100;
  z /= 108.883;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

  l = (116 * y) - 16;
  a = 500 * (x - y);
  b = 200 * (y - z);

  return [l, a, b];
}
