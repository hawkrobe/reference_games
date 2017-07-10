let options = {
    gameWidth: 1000,
    gameHeight: 700,
    cardSheetWidth: 334,
    cardSheetHeight: 440,
    cardScale: 0.3
}

window.onload = function() {
    game = new Phaser.Game(options.gameWidth, options.gameHeight, Phaser.WEBGL);
    game.state.add("PlayGame", playGame)
    game.state.start("PlayGame");
}

let playGame = function(game) {}
let isMyTurn = false;

// horizontal gap between cards
let cardGap = 120;

playGame.prototype = {
    preload: function() {
        game.load.spritesheet('cards', 'cards.png', options.cardSheetWidth, options.cardSheetHeight);
        game.load.image('cardback', 'cardback.png', options.cardSheetWidth, options.cardSheetHeight);
    },
    create: function() {
        game.stage.backgroundColor = '#076324';
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

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

        // deck and counter
        let deck = game.add.sprite(140, this.game.world.centerY, 'cardback');
        deck.anchor.set(0.5);
        deck.scale.set(0.32);
        let counterString = '42 cards left';
        let counterStyle = {font: 'bold 20px Arial', fill: '#FFF', align: 'center'};
        let cardCounter = game.add.text(140,this.game.world.centerY+100, counterString, counterStyle);
        cardCounter.anchor = new Phaser.Point(0.5,0.5);
  
        // text stating whose turn it is
        let bar = game.add.graphics();
        let barWidth = game.world.width;
        let barHeight = 100;
        let barYOffset = game.world.height - barHeight;
        bar.beginFill(0x000000, 0.2);
        bar.drawRect(0, barYOffset, barWidth, barHeight);

        let style = {font : 'bold 32px Arial', fill:'#FFF', boundsAlignH:'center', boundsAlignV:'middle'};
        isPartner = isMyTurn ? '' : 'partner\'s ' 
        text = game.add.text(0,0,'It\'s your ' + isPartner + 'turn.', style);
        text.setShadow(3,3,'rgba(0,0,0,0.5)', 2);
        text.setTextBounds(0, barYOffset, barWidth, barHeight);
    },
    // startIndex = index in this.deck where hand should start
    // thisPlayer = true if this player, false if that player
    makeHand: function(startIndex, thisPlayer) {
        let dy = thisPlayer ? -200 : 200;
        let hand = [0,1,2].map(i => 
                    this.makeCard(startIndex+i, this.game.world.centerX + (i-1)*cardGap, this.game.world.centerY + dy));
        return hand;
    },
    draw: function(startIndex, numCards) {
        let onTable = [0,1,2,3].map(i =>
                        this.makeCard(startIndex+i, this.game.world.centerX + (i-1.5)*cardGap, this.game.world.centerY));
        return onTable;
    },
    makeCard: function(cardIndex, x, y) {
        let card = game.add.sprite(x, y, 'cards', this.deck[cardIndex]);
        card.scale.set(options.cardScale);
        card.anchor = new Phaser.Point(0.5,0.5);

        // enable drag and drop
        this.game.physics.arcade.enable(card);
        card.inputEnabled = true;
        card.input.enableDrag();
        // card.events.onDragStart.add(onDragStart, this);
        // card.events.onDragStop.add(onDragStop, this);

        card.originalPosition = card.position.clone();
        card.events.onDragStop.add(function(sprite1){
          this.stopDrag(sprite1, card);
        }, this);

        return card;
    },

    // snaps card back into original position after drag
    stopDrag: function(sprite1, sprite2){
    if (!this.game.physics.arcade.overlap(sprite1, sprite2, function() {
        sprite1.input.draggable = false;
        sprite1.position.copyFrom(sprite2.position); 
        sprite1.anchor.setTo(sprite2.anchor.x, sprite2.anchor.y); 
    }));
    sprite1.position.copyFrom(sprite1.originalPosition);
    },
}

// function onDragStart(sprite, pointer) {
//     result = "Dragging " + sprite.key + "..."
//     console.log(result);
// }

// function onDragStop(sprite, pointer) {
//     result = sprite.key + " dropped at x:" + pointer.x + " y: " + pointer.y;
//     console.log(result);
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