let gameOptions = {
    gameWidth: 1000,
    gameHeight: 700,
    cardSheetWidth: 334,
    cardSheetHeight: 440,
    cardScale: 0.3
}

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
    game.state.add("PlayGame", playGame)
    game.state.start("PlayGame");
}

let playGame = function(game) {}
playGame.prototype = {
    preload: function() {
        game.load.spritesheet('cards', 'cards.png', gameOptions.cardSheetWidth, gameOptions.cardSheetHeight);
        game.load.image('menu', 'menu.png', 270, 180);
    },
    create: function() {
        // initialize deck of cards as number array
        this.deck = Phaser.ArrayUtils.numberArray(0, 51);
        // shuffle the deck and print to console
        Phaser.ArrayUtils.shuffle(this.deck);
        console.log(this.deck);
        // make cards
        this.cardsInGame = [this.makeCard(0), this.makeCard(1), this.makeCard(2)];
        this.nextCardIndex = 3;   
    },
    makeCard: function(cardIndex) {
        // initialize card
        let card = game.add.sprite(gameOptions.cardSheetWidth * gameOptions.cardScale / 2, game.height / 2, 'cards');
        card.anchor.setTo(-5.5 + 1.5*cardIndex, 0.5);
        card.scale.set(gameOptions.cardScale);
        card.frame = this.deck[cardIndex];

        // trigger action menu on click
        card.inputEnabled = true;
        card.events.onInputUp.add(function () {
            game.paused = true;
            // add the menu
            menu = game.add.sprite(gameOptions.gameWidth/2, gameOptions.gameHeight/2, 'menu');
            menu.anchor.setTo(-1.5 + 1.5*cardIndex, -0.1);
        });

        game.input.onDown.add(this.unpause, self);

        return card;
    },
    unpause: function(event) {
        // Only act if paused
        if(game.paused){
            // Calculate the corners of the menu
            var x1 = gameOptions.gameWidth/2 - 270/2, x2 = gameOptions.gameWidth/2 + 270/2,
                y1 = gameOptions.gameHeight/2 - 180/2, y2 = gameOptions.gameHeight/2 + 180/2;

            // Check if the click was inside the menu
            if(event.x > x1 && event.x < x2 && event.y > y1 && event.y < y2 ){
                console.log('you have clicked on the menu')
            }
            else{
                // Remove the menu and the label
                menu.destroy();
                // choiseLabel.destroy();

                // Unpause the game
                game.paused = false;
            }
        }
    }
}


// var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create });

// var w = 800, h = 600;

// function preload() {
//     game.load.image('diamond', 'assets/sprites/diamond.png');
//     game.load.image('menu', 'assets/buttons/number-buttons-90x90.png', 270, 180);
// }

// function create() {
//     /*
//         Code from example diamond burst
//     */
//     game.stage.backgroundColor = '#337799';
//     emitter = game.add.emitter(game.world.centerX, 100, 200);
//     emitter.makeParticles('diamond');
//     emitter.start(false, 5000, 20);


//     /*
//         Code for the pause menu
//     */

//     // Create a label to use as a button
//     pause_label = game.add.text(w - 100, 20, 'Pause', { font: '24px Arial', fill: '#fff' });
//     pause_label.inputEnabled = true;
//     pause_label.events.onInputUp.add(function () {
//         // When the paus button is pressed, we pause the game
//         game.paused = true;

//         // Then add the menu
//         menu = game.add.sprite(w/2, h/2, 'menu');
//         menu.anchor.setTo(0.5, 0.5);

//         // And a label to illustrate which menu item was chosen. (This is not necessary)
//         choiseLabel = game.add.text(w/2, h-150, 'Click outside menu to continue', { font: '30px Arial', fill: '#fff' });
//         choiseLabel.anchor.setTo(0.5, 0.5);
//     });

//     // Add a input listener that can help us return from being paused
//     game.input.onDown.add(unpause, self);

//     // And finally the method that handels the pause menu
//     function unpause(event){
//         // Only act if paused
//         if(game.paused){
//             // Calculate the corners of the menu
//             var x1 = w/2 - 270/2, x2 = w/2 + 270/2,
//                 y1 = h/2 - 180/2, y2 = h/2 + 180/2;

//             // Check if the click was inside the menu
//             if(event.x > x1 && event.x < x2 && event.y > y1 && event.y < y2 ){
//                 // The choicemap is an array that will help us see which item was clicked
//                 var choisemap = ['one', 'two', 'three', 'four', 'five', 'six'];

//                 // Get menu local coordinates for the click
//                 var x = event.x - x1,
//                     y = event.y - y1;

//                 // Calculate the choice 
//                 var choise = Math.floor(x / 90) + 3*Math.floor(y / 90);

//                 // Display the choice
//                 choiseLabel.text = 'You chose menu item: ' + choisemap[choise];
//             }
//             else{
//                 // Remove the menu and the label
//                 menu.destroy();
//                 choiseLabel.destroy();

//                 // Unpause the game
//                 game.paused = false;
//             }
//         }
//     };
// }



// function toggleMenu(){
//      if(menuGroup.y == 0){
//           var menuTween = game.add.tween(menuGroup).to({
//                y: -180     
//           }, 500, Phaser.Easing.Bounce.Out, true);
//      }
//      if(menuGroup.y == -180){
//           var menuTween = game.add.tween(menuGroup).to({
//                y: 0    
//           }, 500, Phaser.Easing.Bounce.Out, true);     
//      }
// }

// let game;
// let gameOptions = {
//     gameWidth: 750,
//     gameHeight: 1334,
//     cardSheetWidth: 334,
//     cardSheetHeight: 440,
//     cardScale: 0.8
// }
// window.onload = function() {
//     game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
//     game.state.add("PlayGame", playGame)
//     game.state.start("PlayGame");
// }
// let playGame = function(game) {}
// playGame.prototype = {
//     preload: function() {
//         game.load.spritesheet("cards", "cards.png", gameOptions.cardSheetWidth, gameOptions.cardSheetHeight);
//         game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
//         game.scale.pageAlignHorizontally = true;
//         game.scale.pageAlignVertically = true;
//     },
//     create: function() {
//         game.stage.backgroundColor = "#4488AA";
//         this.deck = Phaser.ArrayUtils.numberArray(0, 51);
//         Phaser.ArrayUtils.shuffle(this.deck);
//         this.cardsInGame = [this.makeCard(0), this.makeCard(1)];
//         this.nextCardIndex = 2;
//         let neonate = game.add.neonate(this.cardsInGame[0]).to({
//             x: game.width / 2
//         }, 500, Phaser.Easing.Cubic.Out, true);
//         game.input.onDown.add(this.beginSwipe, this);
//     },
//     makeCard: function(cardIndex) {
//         let card = game.add.sprite(gameOptions.cardSheetWidth * gameOptions.cardScale / -2, game.height / 2, "cards");
//         card.anchor.set(0.5);
//         card.scale.set(gameOptions.cardScale);
//         card.frame = this.deck[cardIndex];
//         return card;
//     },
//     beginSwipe: function(e) {
//         game.input.onDown.remove(this.beginSwipe, this);
//         game.input.onUp.add(this.endSwipe, this);
//     },
//     endSwipe: function(e) {
//         game.input.onUp.remove(this.endSwipe, this);
//         let swipeTime = e.timeUp - e.timeDown;
//         let swipeDistance = Phaser.Point.subtract(e.position, e.positionDown);
//         let swipeMagnitude = swipeDistance.getMagnitude();
//         let swipeNormal = Phaser.Point.normalize(swipeDistance);
//         if(swipeMagnitude > 20 && swipeTime < 1000 && Math.abs(swipeNormal.y) > 0.8) {
//             if(swipeNormal.y > 0.8) {
//                 this.handleSwipe(1);
//             }
//             if(swipeNormal.y < -0.8) {
//                 this.handleSwipe(-1);
//             }
//         } else {
//             game.input.onDown.add(this.beginSwipe, this);
//         }
//     },
//     handleSwipe: function(dir) {
//         let cardToMove = (this.nextCardIndex + 1) % 2;
//         this.cardsInGame[cardToMove].y += dir * gameOptions.cardSheetHeight * gameOptions.cardScale * 1.1;
//         let neonate = game.add.neonate(this.cardsInGame[cardToMove]).to({
//             x: game.width / 2
//         }, 500, Phaser.Easing.Cubic.Out, true);
//         neonate.onComplete.add(function() {
//             game.time.events.add(Phaser.Timer.SECOND, this.moveCards, this)
//         }, this)
//     },
//     moveCards: function() {
//         let cardToMove = this.nextCardIndex % 2;
//         let moveOutTween = game.add.neonate(this.cardsInGame[cardToMove]).to({
//             x: game.width + gameOptions.cardSheetWidth * gameOptions.cardScale
//         }, 500, Phaser.Easing.Cubic.Out, true);
//         cardToMove = (this.nextCardIndex + 1) % 2
//         let moveDownTween = game.add.neonate(this.cardsInGame[cardToMove]).to({
//             y: game.height / 2
//         }, 500, Phaser.Easing.Cubic.Out, true);
//         moveDownTween.onComplete.add(function() {
//             let cardToMove = this.nextCardIndex % 2
//             this.cardsInGame[cardToMove].frame = this.deck[this.nextCardIndex];
//             this.nextCardIndex = (this.nextCardIndex + 1) % 52;
//             this.cardsInGame[cardToMove].x = gameOptions.cardSheetWidth * gameOptions.cardScale / -2;
//             game.input.onDown.add(this.beginSwipe, this);
//         }, this)
//     }
// }