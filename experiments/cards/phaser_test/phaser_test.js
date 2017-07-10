let gameOptions = {
    gameWidth: 1000,
    gameHeight: 700,
    cardSheetWidth: 334,
    cardSheetHeight: 440,
    cardScale: 0.3
}

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight, Phaser.WEBGL);
    game.state.add("PlayGame", playGame)
    game.state.start("PlayGame");
}

let playGame = function(game) {}
let isMyTurn = false;

playGame.prototype = {
    preload: function() {
        game.load.spritesheet('cards', 'cards.png', gameOptions.cardSheetWidth, gameOptions.cardSheetHeight);
        game.load.image('cardback', 'cardback.png', 150, 200);
    },
    create: function() {
        game.stage.backgroundColor = '#076324';
        // initialize deck of cards as number array
        this.deck = Phaser.ArrayUtils.numberArray(0, 51);

        // shuffle the deck and print to console
        Phaser.ArrayUtils.shuffle(this.deck);
        console.log(this.deck);

        // make hands for this player and that player
        this.thisHand = this.makeHand(0, true);
        this.thatHand = this.makeHand(3, false);
        this.onTable = this.draw(6, 4);
        this.nextCardIndex = 6;   


        let deck = game.add.sprite(0.25, 0.25, 'cardback');
        let counterString = 52-10 + ' cards left';
        console.log(counterString);
        let cardCounter = new Text(game, -3, 3, counterString, {font: '30px Arial', fill: '#ffffff'})

        // this.nextCardIndex = 6;   
        let bar = game.add.graphics();
        bar.beginFill(0x000000, 0.2);
        bar.drawRect(0,100,game.world.width,100);

        let style = {font : 'bold 32px Arial', fill:'#FFF', boundsAlignH:'center', boundsAlignV:'middle'};
        isPartner = isMyTurn ? '' : 'partner\'s ' 
        text=game.add.text(0,0,'It is your ' + isPartner + 'turn', style);
        text.setShadow(3,3,'rgba(0,0,0,0.5)', 2);
        text.setTextBounds(0,100,game.world.width,100);
    },
    // startIndex = index in this.deck where hand should start
    // thisPlayer = true if this player, false if that player
    makeHand: function(startIndex, thisPlayer) {
        let handy = thisPlayer ? -1 : 2;
        let hand = [startIndex, startIndex+1, startIndex+2].map(i => this.makeCard(i, i-startIndex-5, handy));
        return hand;
    },
    draw: function(startIndex, numCards) {
        let onTable = [startIndex, startIndex+1, startIndex+2, startIndex+3].map(i =>
                        this.makeCard(i, i-startIndex-5.5, 0.55));
        return onTable;
    },
    makeCard: function(cardIndex, x, y) {
        let card = game.add.sprite(gameOptions.cardSheetWidth * gameOptions.cardScale / 2, game.height / 2, 'cards', this.deck[cardIndex]);
        card.scale.set(gameOptions.cardScale);
        card.anchor = new Phaser.Point(x,y);
        return card;
    },
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