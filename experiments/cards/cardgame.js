constants
const gameOptions = {
    cardSheetWith = 334,
    cardSheetHeight = 440,
    cardScale = 0.8
}
let game = new Phaser.Game({preload: preload, create: create, update: update});

function preload(){
    game.load.spritesheet("cards", "images/cards.png", gameOptions.cardSheetWith, gameOptions.cardSheetHeight);
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
}

function create(){

}
function update(){

}