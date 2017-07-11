// reshuffles each element of cards into deck with probability p
function reshuffle(p, cards, deck) {
  let n = 0;
  cards.forEach(function(c) {
    if (Math.random() <= p) {
      n++;
      deck.push(c);
    }
  });
  Phaser.ArrayUtils.shuffle(deck);
  console.log(`${deck.length} cards left, ${n} reshuffled`);
}


/*
Determine end game here
*/
