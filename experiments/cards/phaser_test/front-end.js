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
        game.load.spritesheet('cards', 'cards.png', options.cardSheetWidth, options.cardSheetHeight);
        game.load.image('cardback', 'cardback.png', options.cardSheetWidth, options.cardSheetHeight);
        game.load.spritesheet('end-turn', 'end-turn-button.png', 188, 46);
        //  for Google webfonts
        game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');
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
        this.myHand = this.makeHand(0, true);
        this.theirHand = this.makeHand(3, false);
        this.table = this.drawCards(6, 4);
        this.nextCardIndex = 10;
        this.cardsAdded = 0;

        // text stating how many cards are left in the deck and how many were reshuffled in the previous round
        const counterStyle = { font: 'Arial', fontSize: 20, fill: '#FFF', align: 'center' };
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
    makeHand: function (startIndex, thisPlayer) {
        if (thisPlayer) {
          let hand = [0, 1, 2].map(i =>
              this.makeCard(startIndex + i, game.world.centerX + (i - 1) * cardGap, game.world.centerY + 200));
          return hand;
        }
        else {
          let hand = [0, 1, 2].forEach(function(i) {
              let c = game.add.sprite(game.world.centerX + (i - 1) * cardGap, game.world.centerY - 200, 'cardback');
              c.scale.set(options.cardScale);
              c.anchor = new Phaser.Point(0.5,0.5)
          });
          return hand;
        }
    },
    drawCards: function (startIndex, numCards) {
        let onTable = [0, 1, 2, 3].map(i =>
            this.makeCard(startIndex + i, game.world.centerX + (i - 1.5) * cardGap, game.world.centerY));
        return onTable;
    },
    makeCard: function(cardIndex, x, y) {
      // initialize card
      let card = game.add.sprite(x, y, 'cards', this.deck[cardIndex]);
      card.scale.set(options.cardScale);
      card.anchor = new Phaser.Point(0.5,0.5);

      // enable drag and drop
      game.physics.arcade.enable(card);
      card.inputEnabled = true;
      card.input.enableDrag();
      card.origPos = card.position.clone();
      card.events.onDragStart.add(this.startDrag, this);
      card.events.onDragStop.add(this.stopDrag, this);

      return card;
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
        shouldSwap = this.cardGroupOverlap(card, this.myHand, this.table) ||
                     this.cardGroupOverlap(card, this.table, this.myHand);
      }
      else {
        for (let i = 0; i < this.myHand.length; i++) {
          shouldSwap = shouldSwap || game.physics.arcade.overlap(this.myHand[i], card, this.swapPos);
        }
      }
      if (!shouldSwap) {
        easeIn(card, card.origPos);
      }
    },
    cardGroupOverlap: function(card, newGroup, oldGroup) {
      let oldIndex = oldGroup.indexOf(card);
      for (let i = 0; i < newGroup.length; i++) {
        if (game.physics.arcade.overlap(newGroup[i], card, this.swapPos) && oldIndex != -1) {
          let temp = newGroup[i];
          oldGroup[oldIndex] = temp;
          newGroup[i] = card;
          return true;
        }
      }
    },
    swapPos: function(card1, card2){
      // animations
      tint([card1, card2]);
      easeIn(card1, card2.origPos);
      easeIn(card2, card1.origPos);
      setTimeout(function () {untint([card1, card2])}, 700);

      let temp = card1.origPos;
      card1.origPos = card2.origPos;
      card2.origPos = temp;
    },
    nextTurn: function(){
        isMyTurn = !isMyTurn;

        // reshuffle cards
        [this.cardsLeft, this.cardsAdded] = reshuffle(0.5, this.table, this.deck.slice(this.nextCardIndex, 52));
        this.table = this.drawCards(this.nextCardIndex, 4);
        this.nextCardIndex += 4;
    }
}

function tint(cards) {
  cards.forEach(c => c.tint = 0xD3D3D3);
}

function untint(cards) {
  cards.forEach(c => c.tint = 0xFFFFFF);
}

function easeIn(card, pos) {
  game.add.tween(card).to(pos, 400, Phaser.Easing.Back.Out, true);
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
