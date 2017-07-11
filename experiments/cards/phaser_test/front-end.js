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
let isMyTurn = false;
let self = this;

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
        this.thisHand = this.makeHand(0, true);
        this.thatHand = this.makeHand(3, false);
        this.onTable = this.draw(6, 4);
        this.nextCardIndex = 6;

        // text stating whose turn it is
        const bar = game.add.graphics();
        const barWidth = game.world.width;
        const barHeight = 75;
        const barYOffset = game.world.height - barHeight;
        bar.beginFill('#000', 0.2);
        bar.drawRect(0, barYOffset, barWidth, barHeight);

        const turnTextStyle = { font: 'bold 32px Arial', fill: '#FFF', boundsAlignH: 'center', boundsAlignV: 'middle' };
        let isPartner = isMyTurn ? '' : 'partner\'s '
        turnText = game.add.text(0, 0, 'It\'s your ' + isPartner + 'turn.', turnTextStyle);
        turnText.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);
        turnText.setTextBounds(0, barYOffset, barWidth, barHeight);

        const button = game.add.button(game.world.width - options.turnButtonWidth, 
                                        game.world.height - options.turnButtonHeight, 
                                        'end-turn', this.nextTurn, this, 0, 1, 2);
        // const button = game.add.button(game.world.centerX, 
        //                                 game.world.centerY, 
        //                                 'end-turn', this.nextTurn, this, 0, 1, 2);
        // button.anchor.set(0.5);
    },
    // startIndex = index in this.deck where hand should start
    // thisPlayer = true if this player, false if that player
    makeHand: function (startIndex, thisPlayer) {
        let dy = thisPlayer ? 200 : -200;
        let hand = [0, 1, 2].map(i =>
            this.makeCard(startIndex + i, game.world.centerX + (i - 1) * cardGap, game.world.centerY + dy));
        return hand;
    },
    draw: function (startIndex, numCards) {
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
      card.originalPosition = card.position.clone();
      card.events.onDragStart.add(this.startDrag, this);
      card.events.onDragStop.add(this.stopDrag, this);

      return card;
    },
    startDrag: function(card, pointer){
      game.world.bringToTop(card);
      card.tint = 0xFFFF00;
      // for debugging
      loc = this.thisHand.indexOf(card) != -1 ? 'hand' : 'table';
      console.log(loc);
    },
    stopDrag: function (card, pointer) {
        // unhighlight dragged card
        card.tint = 0xFFFFFF;

      // check for overlap in cards on table and within hand
      if (!(this.cardGroupOverlap(card, this.thisHand, this.onTable) ||
          this.cardGroupOverlap(card, this.onTable, this.thisHand))) {
        card.position.copyFrom(card.originalPosition);
      }
    },
    // let handInd = this.thisHand.findIndex(h => game.physics.arcade.overlap(h,card,this.swapPos));
    // let tableInd = this.onTable.findIndex(t => game.physics.arcade.overlap(t,card,this.swapPos));
    cardGroupOverlap: function(card, newGroup, oldGroup) {
      let oldIndex = oldGroup.indexOf(card);
      for (let i = 0; i < newGroup.length; i++) {
        if(game.physics.arcade.overlap(newGroup[i], card, this.swapPos) && oldIndex != -1) {
          let temp = newGroup[i];
          oldGroup[oldIndex] = temp;
          newGroup[i] = card;
          return true;
        }
      }
    },
    swapPos: function(card1, card2){
      card1.position.copyFrom(card2.originalPosition);
      card2.position.copyFrom(card1.originalPosition);

      let temp = card1.originalPosition;
      card1.originalPosition = card2.originalPosition;
      card2.originalPosition = temp;
    }
}
