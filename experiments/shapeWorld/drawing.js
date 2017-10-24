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


var genWorld = function(canvas) {
  var ctx = canvas.getContext('2d');
  var objDescr = {
    "rectangle": {
      "color_range": [[21, 131], [0, 255], [212, 255]],
      "size_range": {
        "x": canvas.width / 2,
        "y": canvas.height / 2,
        "w": [10, 40],
        "h": [20, 40]
      },
    },
  };

  var obj = genObject(ctx, objDescr, .23);
  return obj;
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
    var r = getRandomIntInclusive(colorRange[0][0], colorRange[0][1]);
    var g = getRandomIntInclusive(colorRange[1][0], colorRange[1][1]);
    var b = getRandomIntInclusive(colorRange[2][0], colorRange[2][1]);
    var rgbString = "rgb(" + r+ "," + g + "," + b + ")"
    return [rgbString, [r, g, b]];
  }

  var object = []
  for (shapeName in objDescr) {
    // Define shape properties
    var shape = objDescr[shapeName];
    isValidShape(shapeName, objDescr[shapeName]);
    var colorInfo = genColor(shape['color_range']);
    var affineTransform = getAffineTranform();

    // Draw Shape
    if (shapeName.indexOf("rectangle") >= 0) {
      drawRectangle(shape['size_range'], ctx, colorInfo[0], affineTransform);
    } else if (shapeName.indexOf("circle") >= 0) {
      drawCircle(shape['size_range'], ctx, colorInfo[0], affineTransform);
    } else if (shapeName.indexOf("triangle") >= 0) {
      drawTriangle(shape['size_range'], ctx, colorInfo[0], affineTransform);
    } 

    // Store shape details
    shapeDetails = {
      'type': shapeToIndex(shapeName),
      'initial_x': shape['size_range']['x'],
      'initial_y': shape['size_range']['y'],
      'affine_transform': affineTransform,
      'color': colorInfo[1],
    }
    console.log(shapeDetails);
    object.push(shapeDetails);
  }

  return object
}

// Shape to index
var shapeToIndex = function(shapeName) {
  if (shapeName.indexOf("rectangle") >= 0) {
    return 0;
  } else if (shapeName.indexOf("circle") >= 0) {
    return 1;
  } else if  (shapeName.indexOf("triangle") >= 0) {
    return 2;
  } else {
    return -1;
  }
}

// Random Number Generation
var getRandomIntInclusive = function(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

// Affine transformation
var getAffineTranform = function() {
  var rotationAngle = (Math.PI / 180) * getRandomIntInclusive(0, 360);
  var xTranslate = getRandomIntInclusive(-10, 10);
  var yTranslate = getRandomIntInclusive(-10, 10);
  var xReflection = getRandomIntInclusive(0, 1) ? -1: 1;
  var yReflection = getRandomIntInclusive(0, 1) ? -1 : 1;
  return {
    "rotationAngle": rotationAngle,
    "xTranslate": xTranslate,
    "yTranslate": yTranslate,
    "xReflection": xReflection,
    "yReflection": yReflection,
  }
}

var drawRectangle = function(rectangle, ctx, color, affineTransform) {
  // Draw rectangle
  ctx.beginPath();
  ctx.scale(affineTransform['xReflection'], affineTransform['yReflection']);
  ctx.rotate(affineTransform['rotationAngle'])
  ctx.rect(
    rectangle.x + affineTransform['xTranslate'],
    rectangle.y + affineTransform['yTranslate'],
    getRandomIntInclusive(rectangle.w[0], rectangle.w[1]),
    getRandomIntInclusive(rectangle.h[0], rectangle.h[1])
  );
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.fill();
  ctx.stroke();

  // Reset context to defaults
  ctx.scale(0, 0);
  ctx.rotate(0);
}

var drawCircle = function(circle, ctx, color, affineTransform) {
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

var drawTriangle = function(triangle, ctx, color, affineTransform) {
  return true;
}

// ------------------------------------------------------------------------
// Testing Shape Generator
// ------------------------------------------------------------------------
var testShapeGenerator = function(){
  var canvas = document.getElementById('myCanvas');
  var object = genWorld(canvas);
  console.log(object);
}
testShapeGenerator();