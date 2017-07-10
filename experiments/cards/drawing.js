var drawScreen = function(game, player) {
  // draw background
  game.ctx.fillStyle = "#FFFFFF";
  game.ctx.fillRect(0,0,game.viewport.width,game.viewport.height);
};

const gameoptions = {
    cardsheetwith = 334,
    cardsheetheight = 440,
    cardscale = 0.8
}

let game = new Phaser.game({preload: preload, create: create, update: update});

function preload(){
    // game.load.spritesheet("cards", "images/cards.png", gameoptions.cardsheetwith, gameoptions.cardsheetheight);
    // game.scale.scalemode = phaser.scalemanager.show_all;
    // game.scale.pagealignhorizontally = true;
    // game.scale.pagealignvertically = true;
}

function create(){
    game.stage.backgroundcolor = "#FFFFFF";
    // this.deck = phaser.arrayutils.numberarray(0, 51);
    // phaser.arrayutils.shuffle(this.deck);
    // this.cardsingame = [this.makecard(0), this.makecard(1)];
    // this.nextcardindex = 2;
    // var tween = game.add.tween(this.cardsingame[0]).to({
    //     x: game.width / 2
    // }, 500, phaser.easing.cubic.out, true);
    // game.input.ondown.add(this.beginswipe, this);
}
function update(){
}
