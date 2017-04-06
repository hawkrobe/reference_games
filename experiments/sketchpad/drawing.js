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

    game.ctx.lineWidth = 5;
    game.ctx.strokeStyle = "#000000";
    game.ctx.stroke();
};

// Loop through the object list and draw each one in its specified location
var drawObjects = function(game, player) {
    _.map(globalGame.objects, function(obj) { 
      //console.log("game.objects according to drawing.drawObjects" + game.objects);
      // game.ctx.globalCompositeOperation='destination-over';  // draw under highlight
      var customCoords = globalGame.my_role == "sketcher" ? 'speakerCoords' : 'listenerCoords';
      var trueX = obj[customCoords]['trueX'];
      var trueY = obj[customCoords]['trueY'];
      var gridX = obj[customCoords]['gridX'];
      var gridY = obj[customCoords]['gridY'];      
      console.log(obj['subordinate'],customCoords,gridX,gridY,trueX,trueY);
      globalGame.ctx.drawImage(obj.img, trueX, trueY,obj.width, obj.height);
    });

};


// var highlightCell = function(game, player) {
//   // look through game.objects
//   // find the one with targetStatus = "target"
//   // set upperLeftX, upperLeftY to its X and Y
//   //console.log("game.objects according to drawing" + game.objects);
//   if (player.role == game.playerRoleNames.role1){
//     var targetObjects = _.filter(game.objects, function(x){
//       return x.target_status == "target";
//     });
//     for (var n = 0; n < targetObjects.length; n++){
//       var upperLeftX = targetObjects[n].speakerCoords.gridPixelX;
//       var upperLeftY = targetObjects[n].speakerCoords.gridPixelY;
//       if (upperLeftX != null && upperLeftY != null) {
//         game.ctx.beginPath();
//         game.ctx.lineWidth="20";
//         game.ctx.strokeStyle="green";
//         game.ctx.rect(upperLeftX, upperLeftY,200,200); 
//         game.ctx.stroke();
//       }
//     }
//   }
// };

// ///// this version of highlightCell function edited from tangrams_sequential/drawing.js
// var highlightCell = function(game, player, color, condition) {  
//   var targetObjects = _.filter(globalGame.objects, condition);
//   console.log('got to highlightCell inside drawing.js ... targetObjects: ');
//   console.log(targetObjects);
//   console.log(targetObjects[0]);
//   var customCoords = game.my_role == "sketcher" ? 'speakerCoords' : 'listenerCoords';
//   for (var i = 0; i < targetObjects.length; i++){
//     var gridX = targetObjects[i][customCoords]['gridX'];
//     var gridY = targetObjects[i][customCoords]['gridY'];
//     var upperLeftX = game.getPixelFromCell(gridX, gridY).upperLeftX;
//     var upperLeftY = game.getPixelFromCell(gridX, gridY).upperLeftY;
//     game.ctx.globalCompositeOperation='source-over';
//     if (upperLeftX != null && upperLeftY != null) {
//       game.ctx.beginPath();
//       game.ctx.lineWidth="10";
//       game.ctx.strokeStyle=color;
//       game.ctx.rect(upperLeftX + 5, upperLeftY + 5,game.cellDimensions.width-10,game.cellDimensions.height-10); 
//       game.ctx.stroke();
//     }
//   }
// };

///// this version of highlightCell function edited from tangrams_sequential/drawing.js
//// almost same as copy above except instances of game replaced by globalGame
var highlightCell = function(game, color, condition) {  
  var targetObjects = _.filter(globalGame.objects, condition);
  console.log('got to highlightCell inside drawing.js ... targetObjects: ');  
  if (targetObjects.length>0) {
    console.log(targetObjects[0]['subordinate'], targetObjects[0]['basic'],targetObjects[0]['gridX']);
    console.log(targetObjects[0]['url']);
  };
  var customCoords = globalGame.my_role == "sketcher" ? 'speakerCoords' : 'listenerCoords';
  for (var i = 0; i < targetObjects.length; i++){           
    var gridX = targetObjects[i][customCoords]['gridX'];
    var gridY = targetObjects[i][customCoords]['gridY'];
    var upperLeftX = globalGame.getPixelFromCell(gridX, gridY).upperLeftX;
    var upperLeftY = globalGame.getPixelFromCell(gridX, gridY).upperLeftY;
    console.log(gridX,gridY,upperLeftX,upperLeftY);
    globalGame.ctx.globalCompositeOperation='source-over';
    if (upperLeftX != null && upperLeftY != null) {
      globalGame.ctx.beginPath();
      globalGame.ctx.lineWidth="10";
      globalGame.ctx.strokeStyle=color;
      globalGame.ctx.rect(upperLeftX +5 , upperLeftY +5 ,globalGame.cellDimensions.width-10,globalGame.cellDimensions.height-10); 
      globalGame.ctx.stroke();
    }
  }
};



var drawScreen = function(game, player) {
  // console.log('got to drawScreen!')
  // draw background
  game.ctx.strokeStyle = "#FFFFFF";
  game.ctx.fillStyle = "rgba(0, 0, 0, 0.1)";  
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
    drawGrid(globalGame); 
    drawObjects(globalGame, player);  
    // if (globalGame.my_role === globalGame.playerRoleNames.role1) {
    //     highlightCell(globalGame, player, '#d15619', 
    //     function(x) {return x.target_status == 'target';});
    // }
  }
};


// Make sketchpad class using global 'paper' functions
function Sketchpad() {
  paper.setup('sketchpad');
  view.viewSize = new Size(500, 500);
}

Sketchpad.prototype.setupTool = function() {
  var tool = new Tool();
  tool.onMouseDown = function(event) {
    globalGame.path = new Path({
      segments: [event.point],
      strokeColor: 'black'
    });
  };

  tool.onMouseDrag = function(event) {
    globalGame.path.add(event.point);
  };

  tool.onMouseUp = function(event) {
    // Simplify path to reduce data sent
    globalGame.path.simplify(10);

    // Send stroke to listener's viewer
    globalGame.socket.emit('stroke', {
      path: globalGame.path.exportJSON({asString: true})
    });
  };
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
  // game.ctx.fillStyle = 'red';

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


