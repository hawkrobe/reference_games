/**
 * Returns a new card sprite and adds it to the game
 *
 * @param {Number} cardIndex the index of the card in the deck
 * @param {Number} x x coordinate of the card
 * @param {Number} y y coordinate of the card
 */
function makeCard(cardIndex, x, y, game, obj) {
  let card = game.add.sprite(x, y, 'cards', obj.deck[cardIndex]);
  card.scale.set(options.cardScale);
  card.anchor = new Phaser.Point(0.5,0.5);

  // enable drag and drop
  game.physics.arcade.enable(card);
  card.inputEnabled = true;
  card.input.enableDrag();
  card.origPos = card.position.clone();
  card.events.onDragStart.add(obj.startDrag, obj);
  card.events.onDragStop.add(obj.stopDrag, obj);

  return card;
}

/**
 * Returns a 3-card array and adds it to the game
 *
 * @param {Number} startIndex the index to begin the hand in the deck
 * @param {boolean} thisPlayer whether or not the hand is meant for this player
 */
function makeHand(startIndex, thisPlayer, game, obj) {
    if (thisPlayer) {
      let hand = [0, 1, 2].map(i =>
          makeCard(startIndex + i, game.world.centerX + (i - 1) * cardGap, game.world.centerY + 200, game, obj));
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
}

/**
 * Returns a 4-card array and adds it to the game in the table position
 *
 * @param {Number} startIndex the index to begin the table in the deck
 * @param {Number} numCards number of cards to draw (should be 4)
 */
function drawCards(startIndex, numCards, game, obj) {
    let drawn = [0, 1, 2, 3].map(i =>
        makeCard(startIndex + i, game.world.centerX + (i - 1.5) * cardGap, game.world.centerY, game, obj));
    return drawn;
}

/**
 * Returns true if a card belonging to some group overlaps with a card from another group
 *
 * @param {sprite} card the card sprite
 * @param {Array<sprite>} newGroup group to check overlap
 * @param {Array<sprite>} oldGroup group currently containing card
 */
function cardGroupOverlap(card, newGroup, oldGroup, game) {
  let oldIndex = oldGroup.indexOf(card);
  for (let i = 0; i < newGroup.length; i++) {
    if (game.physics.arcade.overlap(newGroup[i], card, swapPos) && oldIndex != -1) {
      let temp = newGroup[i];
      oldGroup[oldIndex] = temp;
      newGroup[i] = card;
      return true;
    }
  }
}

/**
 * Swaps the positions of two card sprites
 */
function swapPos(card1, card2) {
  // animations
  addTint([card1, card2]);
  easeIn(card1, card2.origPos);
  easeIn(card2, card1.origPos);
  setTimeout(function () {removeTint([card1, card2])}, 700);

  let temp = card1.origPos;
  card1.origPos = card2.origPos;
  card2.origPos = temp;
}

/**
 * Adds tint to a list of card sprites
 */
function addTint(cards) {
  cards.forEach(c => c.tint = 0xD3D3D3);
}

/**
 * Removes tint from a list of card sprites
 */
function removeTint(cards) {
  cards.forEach(c => c.tint = 0xFFFFFF);
}

/**
 * Gives easing to movement of card sprite
 */
function easeIn(card, pos) {
  game.add.tween(card).to(pos, 400, Phaser.Easing.Back.Out, true);
}
