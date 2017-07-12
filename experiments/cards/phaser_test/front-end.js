const options = {
    gameWidth: 1000,
    gameHeight: 700,
    cardSheetWidth: 334,
    cardSheetHeight: 440,
    cardScale: 0.3,
    turnButtonWidth: 188,
    turnButtonHeight: 46
}

window.onload = function () {
    game = new Phaser.Game(options.gameWidth, options.gameHeight, Phaser.WEBGL);
    game.state.add("PlayGame", playGame)
    game.state.start("PlayGame");
}

let playGame = function (game) { }
let isMyTurn = true;

// horizontal gap between cards
const cardGap = 120;

playGame.prototype = {
    preload: function () {
        game.load.spritesheet('cards', 'images/cards.png', options.cardSheetWidth, options.cardSheetHeight);
        game.load.image('cardback', 'images/cardback.png', options.cardSheetWidth, options.cardSheetHeight);
        game.load.spritesheet('end-turn', 'images/end-turn-button.png', 188, 46);
    },
    create: function () {
        game.stage.backgroundColor = '#076324';
        game.physics.startSystem(Phaser.Physics.ARCADE);

        // initialize deck of cards as number array
        this.deck = Phaser.ArrayUtils.numberArray(0, 51);

        // shuffle the deck and print to console
        Phaser.ArrayUtils.shuffle(this.deck);
        console.log(this.deck);

        // deck sprite
        const deckSprite = game.add.sprite(140, game.world.centerY, 'cardback');
        deckSprite.anchor.set(0.5);
        deckSprite.scale.set(options.cardScale);

        // make hands for this player and that player
        this.myHand = makeHand(0, true, game, this);
        this.theirHand = makeHand(3, false, game, this);
        this.table = drawCards(6, 4, game, this);
        this.nextCardIndex = 10;
        this.cardsAdded = 0;

        // text stating how many cards are left in the deck and how many were reshuffled in the previous round
        const counterStyle = { font: '20px Arial', fill: '#FFF', align: 'center' };
        this.cardsLeftText = game.add.text(140, game.world.centerY + 100, getCounterText(this.cardsLeft, 'left'), counterStyle);
        this.cardsAddedText = game.add.text(140, game.world.centerY - 100, getCounterText(this.cardsAdded, 'added'), counterStyle);
        const counterTexts = [this.cardsLeftText, this.cardsAddedText];
        counterTexts.forEach(function (text) {
          text.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);
          text.anchor = new Phaser.Point(0.5, 0.5);
        });

        // text stating whose turn it is
        const bar = game.add.graphics();
        const barWidth = game.world.width;
        const barHeight = 75;
        const barYOffset = game.world.height - barHeight;
        bar.beginFill('#000', 0.2);
        bar.drawRect(0, barYOffset, barWidth, barHeight);

        const turnTextStyle = { font: 'bold 32px Arial', fill: '#FFF', boundsAlignH: 'center', boundsAlignV: 'middle' };
        this.turnText = game.add.text(0, 0, getTurnText(), turnTextStyle);
        this.turnText.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);
        this.turnText.setTextBounds(0, barYOffset, barWidth, barHeight);

        // end turn button
        const centerInBar = (barHeight - options.turnButtonHeight) / 2;
        const horizontalPad = centerInBar;
        this.button = game.add.button(game.world.width - options.turnButtonWidth - horizontalPad,
                                        game.world.height - options.turnButtonHeight - centerInBar,
                                        'end-turn', this.nextTurn, this, 0, 1, 2);
    },
    update : function() {
        // update card counters
        this.cardsLeft = 52 - this.nextCardIndex + this.cardsAdded;
        this.cardsLeftText.setText(getCounterText(this.cardsLeft, 'left'));
        this.cardsAddedText.setText(getCounterText(this.cardsAdded, 'added'));

        this.turnText.setText(getTurnText());
        // toggle turn settings
        if (!isMyTurn){
            // set the button to disabled
            this.button.setFrames(3,3,3);
            this.button.inputEnabled = false;
            this.table.forEach(card => card.inputEnabled = false);
        } else {
            this.button.setFrames(0, 1, 2);
            this.button.inputEnabled = true;
            this.table.forEach(card => card.inputEnabled = true);
        }
    },
    startDrag: function(card, pointer){
      game.world.bringToTop(card);
      card.scale.set(options.cardScale*1.1);
      // for debugging
      loc = this.myHand.indexOf(card) != -1 ? 'hand' : 'table';
      console.log(loc);
    },
    stopDrag: function(card, pointer) {
      card.scale.set(options.cardScale);
      let shouldSwap = false;
      if (isMyTurn) {
        shouldSwap = cardGroupOverlap(card, this.myHand, this.table, game) ||
                     cardGroupOverlap(card, this.table, this.myHand, game);
      }
      else {
        for (let i = 0; i < this.myHand.length; i++) {
          shouldSwap = shouldSwap || game.physics.arcade.overlap(this.myHand[i], card, swapPos);
        }
      }
      if (!shouldSwap) {
        easeIn(card, card.origPos);
      }
    },
    nextTurn: function(){
        isMyTurn = !isMyTurn;
        // reshuffle cards
        [this.cardsLeft, this.cardsAdded] = reshuffle(0.5, this.table, this.deck.slice(this.nextCardIndex, 52));
        this.table = drawCards(this.nextCardIndex, 4, game, this);
        this.nextCardIndex += 4;
    }
}

function getTurnText(){
    let isPartner = isMyTurn ? '' : 'partner\'s '
    return 'It\'s your ' + isPartner + 'turn.'
}

function getCounterText(num, counterType) {
  let plural = (num == 1) ? '' : 's';
  let descrip = (counterType == 'left') ? 'left in deck' : 'reshuffled';
  return `${num} card${plural} ${descrip}`;
}
