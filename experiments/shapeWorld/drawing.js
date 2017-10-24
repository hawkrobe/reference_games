/*
  Procedural generation of shape worlds for a language reference game.
  Each world consits of three objects. Each object is defined as a vector
  that enumerates:
    1) Affine transformation for each shape in the object
    2) Which shape(s) exist within the object (rectangle, triangle, circle)
    3) What color(s) are applied to each of the shapes
*/


var genWorlds = function(ctx){

}


var genWorld = function(ctx) {
  var objDescr = {
    "rectangle": {
      "color_range": [[21, 131], [0, 255], [212, 255]],
      "size_range": {
        "x": 0,
        "y": 0,
        "w": [10, 100],
        "h": [20, 300]
      },
    },
  };

  genObject(
    ctx,
    objDescr,
    .23
  );
}

// Generate a specific object (amalgamation of objects)
// Params:
// ctx: HTML5 Canvas
// objDescr:
// {
//   "rectangle": {
//     "color_range": [(R1, R2), (G1, G2), (B1, B2)],
//     "size_range": {
//       "x": val,
//       "y": val,
//       "width": val,
//       "height": val
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
// compactness: bound on how tightly conjoined the shapes
//              are in this world
var genObject = function(
  ctx,
  objDescr,
  compactness
) {
  // Check whether desired shape can be drawn successfully.
  // Throws an error if shape description is invalid.
  var isValidShape = function(shapeName, shapeDescr) {
    // Check whether shape's color range is valid
    var isValidColorRange = function(colorRange) {
      for (var i = 0; i < colorRange.length; i++) {
        var c = colorRange[i];
        if (c[0] > c[1]) return false;
        else if (c[0] < 0 || c[1] > 255) return false;
      }
      return true;
    }

    // Check whether shape's dimensions are valid
    // TODO: Implement these stubs
    var isValidRectangle = function(shapeDescr) {
      if (shapeDescr['size_range']['w'][0] > shapeDescr['size_range']['w'][1]) return false;
      if (shapeDescr['size_range']['h'][0] > shapeDescr['size_range']['h'][1]) return false;
      return true;     
    }
    var isValidCircle = function(shapeDescr) {
      return true;
    }
    var isValidTriangle = function(shapeDescr) {
      return true;
    }

    // Evaluate shape validity
    if (!isValidColorRange(shapeDescr['color_range'])) throw "Invalid Color Range";
    if (shapeName.indexOf("rectangle") >= 0) {
      if (!isValidRectangle(shapeDescr)) throw "Invalid Rectangle Dimensions";
    } else if (shapeName.indexOf("circle") >= 0) {
      if (!isValidCircle(shapeDescr)) throw "Invalid Circle Dimensions";
    } else if (shapeName.indexOf("triangle") >= 0) {
      if (!isValidTriangle(shapeDescr)) throw "Invalid Triangle Dimensions";
    } else {
      throw "Desired shape " + shapeName + " unknown!";
    }
  }

  // Generate color according to color range
  var genColor = function(colorRange) {
    return "rgb(" +
      getRandomIntInclusive(colorRange[0][0], colorRange[0][1]) + "," + 
      getRandomIntInclusive(colorRange[1][0], colorRange[1][1]) + "," + 
      getRandomIntInclusive(colorRange[2][0], colorRange[2][1]) + ")"
  }

  // Construct object in world
  for (shapeName in objDescr) {
    var shape = objDescr[shapeName];
    isValidShape(shapeName, objDescr[shapeName]);

    if (shapeName.indexOf("rectangle") >= 0) {
      var color = genColor(shape['color_range']);
      drawRectangle(shape['size_range'], ctx, color);

      // var linearTransform = genLinearTransform();
      // var rectanglePoints = genRectanglePoints();
      // var shiftedPoints = applyLinearTransform(rectanglePoints);
    } else if (shapeName.indexOf("circle") >= 0) {
    } else if (shapeName.indexOf("triangle") >= 0) {
    }    
  }
}

// Random Number Generation
var getRandomIntInclusive = function(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

var drawRectangle = function(rectangle, ctx, color) {
  ctx.beginPath();
  ctx.rect(
    rectangle.x,
    rectangle.y,
    getRandomIntInclusive(rectangle.w[0], rectangle.w[1]),
    getRandomIntInclusive(rectangle.h[0], rectangle.h[1])
  );
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.fill();
  ctx.stroke();
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


// ------------------------------------------------------------------------
// Testing Shape Generator
// ------------------------------------------------------------------------
var testShapeGenerator = function(){
  var canvas = document.getElementById('myCanvas');
  var ctx = canvas.getContext('2d');
  genWorld(ctx);
}
testShapeGenerator();