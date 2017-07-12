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
    },
    create: function () {
        game.stage.backgroundColor = '#076324';
        game.physics.startSystem(Phaser.Physics.ARCADE);

        // initialize deck of cards as number array
        this.deck = Phaser.ArrayUtils.numberArray(0, 51);

        // shuffle the deck and print to console
        Phaser.ArrayUtils.shuffle(this.deck);
        console.log(this.deck);

        // deck and counter
        const deck = game.add.sprite(140, game.world.centerY, 'cardback');
        deck.anchor.set(0.5);
        deck.scale.set(options.cardScale);
        let counterString = '42 cards left';
        const counterStyle = { font: 'bold 20px Arial', fill: '#FFF', align: 'center' };
        const cardCounter = game.add.text(140, game.world.centerY + 100, counterString, counterStyle);
        cardCounter.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);
        cardCounter.anchor = new Phaser.Point(0.5, 0.5);

        // make hands for this player and that player
        this.myHand = this.makeHand(0, true);
        this.theirHand = this.makeHand(3, false);
        this.onTable = this.drawCards(6, 4);
        this.nextCardIndex = 10;

        // FOR TESTING
        // reshuffle(0.5, this.onTable, this.deck.slice(this.nextCardIndex, 52));

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
        this.turnText.setText(getTurnText());
        // toggle turn settings
        if (!isMyTurn){
            // set the button to disabled
            this.button.setFrames(3,3,3);
            this.button.inputEnabled = false;
            this.onTable.forEach(card => card.inputEnabled = false);
        } else {
            this.button.setFrames(0, 1, 2);
            this.button.inputEnabled = true;
            this.onTable.forEach(card => card.inputEnabled = true);
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
        shouldSwap = this.cardGroupOverlap(card, this.myHand, this.onTable) ||
                     this.cardGroupOverlap(card, this.onTable, this.myHand);
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
    }
}

function tint(cards) {
  cards.forEach(c => c.tint = 0xD3D3D3);
}

function untint(cards) {
  cards.forEach(c => c.tint = 0xFFFFFF);
}

function getTurnText(){
    let isPartner = isMyTurn ? '' : 'partner\'s '
    return 'It\'s your ' + isPartner + 'turn.'
}

function easeIn(card, pos) {
  game.add.tween(card).to(pos, 400, Phaser.Easing.Back.Out, true);
}
