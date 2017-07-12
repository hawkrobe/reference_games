// reshuffles each element of cards into deck with probability p
// returns (#cards left in dec, #cards added back to the deck)
function reshuffle(p, cards, deck) {
  let n = 0;
  cards.forEach(function(c) {
    if (Math.random() <= p) {
      n++;
      deck.push(c); // MIGHT HAVE TO PUSH FRAME OR INDEX INSTEAD
    }
    c.kill();
  });
  Phaser.ArrayUtils.shuffle(deck);
  return [deck.length, n];
}


const cardsInSuit = 12;
/**
 * Determines if there is a straight among the 2 hands in a standard 52 card deck
 *
 * @param {Number} cardsInSuit the number of cards in each suit
 * @param {Array.<Number>} hand1 values in the first hand
 * @param {Array.<Number>} hand2 values in the second hand
 */
function hasWrappedStraight(hand1, hand2){
    // let the suit start as the suit of the first card
    let firstSuit = getSuit(hand1[0]);
    let allCards = hand1.concat(hand2);
    let matchingSuits = allCards.every(cardVal => {
        return firstSuit == getSuit(cardVal);
    });
    if (!matchingSuits) return false;

    simplified = allCards.map(a => a % cardsInSuit).sort((a,b)=> a> b);
    let breaks = 0;
    let hasBeg = simplified.includes(0);
    let hasEnd = simplified.includes(cardsInSuit - 1);
    for(let i = 1; i < simplified.length; i++){
        if (simplified[i] != simplified[i-1] + 1){
            breaks++;
        }
        if (breaks > 1) return false;
    }
    if (breaks == 1) return hasBeg && hasEnd;
    else return true;
}

/**
 * Get the suit value of each card in a standard 52 card deck
 * @param cardValue an integer [0-51]
 */
function getSuit(cardValue){
    return Math.trunc(cardValue / cardsInSuit);
}
