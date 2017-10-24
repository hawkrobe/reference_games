/*
  Procedural generation of shape worlds for a language reference game.
  Each world consits of three objects. Each object is defined as a vector
  that enumerates:
    1) Affine transformation for each shape in the object
    2) Which shape(s) exist within the object (rectangle, triangle, circle)
    3) What color(s) are applied to each of the shapes
*/

var genWorlds = function(){

}

var genWorld = function() {
  return null; 
}

// Generate a specific object (amalgamation of objects)
// Params:
// obj_decr:
// {
//   "rectangle": {
//     "color_range": [(R1, R2), (G1, G2), (B1, B2)],
//     "size_range": {
//       "width": [w1, w2],
//       "height": [h1, h2],
//     },
//   },
//   "circle": {
//     "color_range": [(R1, R2), (G1, G2), (B1, B2)],
//     "size_range": {
//       "radius": r,
//     },
//   },
//   "triangle": {
//     "color_range": [(R1, R2), (G1, G2), (B1, B2)],
//     "strokes": {
//       "1": [(x1, y1), (x2, y2)],
//       "2": [(x1, y1), (x2, y2)],
//     },
//   },
// }
var genObject = function(
  obj_descr
) {

  // Check whether desired shape can be drawn successfully.
  // Throws an error if shape description is invalid.
  var isValidShape = function(shapeName, shape_descr) {

    // Check whether shape's color range is valid
    var isValidColorRange = function(colorRange) {
      for (c in colorRange) {
        if (c[1] > c[0]) return False;
        else if (!c[0] >= 0 || !c[1] <= 255) return False;
      }
      return True;
    }

    // Check whether shape's dimensions are valid
    // TODO: Implement these stubs
    var isValidRectangle = function(shape_descr) {
      return True;
    }
    var isValidCircle = function(shape_descr) {
      return True;
    }
    var isValidTriangle = function(shape_descr) {
      return True;
    }

    // Evaluate shape validity
    if (!isValidColorRange(shape_descr['color_range'])) throw "Invalid Color Range";
    if (shapeName.indexOf("rectangle") >= 0) {
      if (!isValidRectangle(shape_descr)) throw "Invalid Rectangle Dimensions";
    } else if (shapeName.indexOf("circle") >= 0) {
      if (!isValidCircle(shape_descr)) throw "Invalid Circle Dimensions";
    } else if (shapeName.indexOf("triangle") >= 0) {
      if (!isValidTriangle(shape_descr)) throw "Invalid Triangle Dimensions";
    } else {
      throw "Desired shape " + shapeName + " unknown!";
    }
  }

  // Construct object in world
  for (shapeName in Object.keys(obj_descr)) {
    isValidShape(shapeName, obj_descr[shapeName]);
    if (shapeName.indexOf("rectangle") >= 0) {
      var linearTransform = genLinearTransform();
      var rectanglePoints = genRectanglePoints();
      var shiftedPoints = applyLinearTransform(rectanglePoints);


    } else if (shapeName.indexOf("circle") >= 0) {
    } else if (shapeName.indexOf("triangle") >= 0) {
    }    
  }
}


var drawRectangle = function(rectangle) {
  game.ctx.beginPath();
  game.ctx.rect(rectangle.x, rectangle.y, rectangle.w, rectangle.h);
  game.ctx.fillStyle = rectangle.color;
  game.ctx.fill();
  game.ctx.stroke();
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
      drawBoxes(game);
      //drawPlaza(game);

      if (game.my_role === game.playerRoleNames.role1) {
        /*if (game.roundNum <= 2) { //trial only
          drawTarget(game, game.currStim.lily.x, game.currStim.lily.y);
        }*/
        drawLily(game, game.currStim.lily);
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
