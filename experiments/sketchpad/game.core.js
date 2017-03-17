/*  Copyright (c) 2012 Sven "FuzzYspo0N" Bergström, 
                  2013 Robert XD Hawkins
    
 written by : http://underscorediscovery.com
    written for : http://buildnewgames.com/real-time-multiplayer/
    
    substantially modified for collective behavior experiments on the web
    MIT Licensed.
*/

/*
  The main game class. This gets created on both server and
  client. Server creates one for each game that is hosted, and each
  client creates one for itself to play the game. When you set a
  variable, remember that it's only set in that instance.
*/
var has_require = typeof require !== 'undefined';

if( typeof _ === 'undefined' ) {
  if( has_require ) {
    _ = require('underscore');
    utils  = require('../sharedUtils/sharedUtils.js');
    console.log('got here');
  }
  else throw 'mymodule requires underscore, see http://underscorejs.org';
}

var game_core = function(options){
  // Store a flag if we are the server instance
  this.server = options.server ;
  
  // How many players in the game?
  this.players_threshold = 2;
  this.playerRoleNames = {
    role1 : 'speaker',
    role2 : 'listener'
  };
  
  //Dimensions of world in pixels and number of cells to be divided into;
  this.numHorizontalCells = 4;
  this.numVerticalCells = 1;
  this.cellDimensions = {height : 200, width : 200}; // in pixels
  this.cellPadding = 0;
  this.world = {height : (this.cellDimensions.height * this.numVerticalCells
              + this.cellPadding),
              width : (this.cellDimensions.width * this.numHorizontalCells
              + this.cellPadding)}; 
  
  // Number of total poses per object
  this.numPoses = 40;          

  // Which round are we on (initialize at -1 so that first round is 0-indexed)
  this.roundNum = -1;

  // Which trial are we on (initialize at -1 so that first round is 0-indexed)
  this.trialNum = -1;

  // How many rounds do we want people to complete?
  this.numRounds = 10;

  // How many trials per round (how many items in the menu)?
  this.numTrialsPerRound = this.numHorizontalCells*this.numVerticalCells;

  // How many total trials?
  this.numTotalTrials = this.numTrialsPerRound*this.numRounds;

  // How many mistakes have the pair made on the current trial?
  this.attemptNum = 0;

  // This will be populated with the tangram set
  this.trialInfo = {};
  
  if(this.server) {
    // If we're initializing the server game copy, pre-create the list of trials
    // we'll use, make a player object, and tell the player who they are
    this.id = options.id;
    this.expName = options.expName;
    this.player_count = options.player_count;
    this.trialList = this.makeTrialList();
    this.data = {
      id : this.id.slice(0,6),
      trials : [],
      catch_trials : [], system : {}, 
      subject_information : {
        gameID: this.id.slice(0,6),
	score: 0
      }
    };
    this.players = [{
      id: options.player_instances[0].id,
      instance: options.player_instances[0].player,
      player: new game_player(this,options.player_instances[0].player)
    }];
    this.streams = {};
    this.server_send_update();
  } else {
    // If we're initializing a player's local game copy, create the player object
    this.players = [{
      id: null,
      instance: null,
      player: new game_player(this)
    }];
  }
};

var game_player = function( game_instance, player_instance) {
  this.instance = player_instance;
  this.game = game_instance;
  this.role = '';
  this.message = '';
  this.id = '';
}; 

// server side we set some classes to global types, so that
// we can use them in other files (specifically, game.server.js)
if('undefined' != typeof global) {  
  var stimList = _.map(require('./stimList_subord_2', _.clone)); 
  // console.log(stimList);
  module.exports = global.game_core = game_core;
  module.exports = global.game_player = game_player;
}

// HELPER FUNCTIONS

// Method to easily look up player 
game_core.prototype.get_player = function(id) {
  var result = _.find(this.players, function(e){ return e.id == id; });
  return result.player;
};

// Method to get list of players that aren't the given id
game_core.prototype.get_others = function(id) {
  var otherPlayersList = _.filter(this.players, function(e){ return e.id != id; });
  var noEmptiesList = _.map(otherPlayersList, function(p){return p.player ? p : null;});
  return _.without(noEmptiesList, null);
};

// Returns all players
game_core.prototype.get_active_players = function() {
  var noEmptiesList = _.map(this.players, function(p){return p.player ? p : null;});
  return _.without(noEmptiesList, null);
};

// Advance to the next round
game_core.prototype.newRound = function() {
  // If you've reached the planned number of rounds, end the game  
  if(this.roundNum == this.numRounds - 1) {
    _.map(this.get_active_players(), function(p){
      p.player.instance.disconnect();});
  } else {
    // Otherwise, get the preset list of tangrams for the new round
    this.roundNum += 1;
    this.trialInfo = {currStim: this.trialList[this.roundNum]};
    this.server_send_update();
  }
};

game_core.prototype.getRandomizedConditions = function() {  
  var numCats = 4;
  var numObjs = 8;  
  var condition = _.shuffle(["closer","further"])[0]; // session-level variable

  var category = new Array;
  var object = new Array;
  var pose = new Array;
  var tmp = _.shuffle(_.range(0,8)).slice(-4);

  if (condition=="closer") {
    this_cat = _.shuffle(_.range(0,4))[0];
    tmpc = []; for (k=0; k<this.numTrialsPerRound; k++) {tmpc = tmpc.concat(this_cat);};
    for (j=0; j<this.numRounds; j++) {
      category.push(tmpc);
      object.push(_.shuffle(tmp));
    };
  } else if (condition = "further") { 
      category = category.concat(_.shuffle(_.range(0,4)));
      object = object.concat(_.shuffle(tmp));
      zipped = new Array; _zipped = new Array;  
      _zipped = _.zip(category,object); // link category# & object# to ensure you are sampling same objects
      for (j=0; j<this.numRounds; j++) {
        zipped.push(_.shuffle(_zipped)); // zipped becomes numRounds x numTrialsPerRound x 2(cat,obj)
      };
      catl = new Array; objl = new Array;  
      for (a=0;a<this.numRounds;a++) {  
        _catl = new Array;  _objl = new Array;      
        for (b=0;b<this.numTrialsPerRound;b++) {
          _catl = _catl.concat(zipped[a][b][0]);
          _objl = _objl.concat(zipped[a][b][1]);
        };
        catl.push(_catl);
        objl.push(_objl);
      };
      category = catl;
      object = objl;
  }; 
  // shuffle poses
  multiples = Math.floor(this.numTotalTrials/this.numPoses); // num times #poses
  remainder =  this.numTotalTrials % this.numPoses;
  _pose = new Array;
  for (k=0; k<multiples; k++) {
    _pose = _pose.concat(_.shuffle(_.range(this.numPoses)));
  }
  _pose = _pose.concat(_.shuffle(_.range(this.numPoses).slice(0,remainder)));
  for (r=0;r<this.numRounds;r++){
    pose.push(_pose.slice( r*this.numTrialsPerRound, (r+1)*this.numTrialsPerRound  ))
  }
  
  design_dict = {condition:condition,
                 category:category,
                 object:object,                 
                 pose:pose};

  return design_dict;
};

game_core.prototype.sampleStimulusLocs = function() {
  var listenerLocs = _.shuffle([[1,1], [2,1], [3,1], [4,1]]);
  var speakerLocs = _.shuffle([[1,1], [2,1], [3,1], [4,1]]);
  return {listener : listenerLocs, speaker : speakerLocs};
};


// jefan 2/17/2017

// extracts all the values of the javascript dictionary by key
function extractEntries(dict,key) {
    vec = []
    for (i=0; i<dict.length; i++) {
        vec.push(dict[i][key]);    
    } 
    return vec;
}

// finds matches to specific value given key
function matchingValue(dict,key,value) {
  vec = []
  for (i=0; i<dict.length; i++) {
    if (dict[i][key]==value) {      
        vec.push(dict[i]);    
    }
  } 
  return vec;
}


// // customizations to load in 3D objects to menu
// first load in stim dictionary
// data = $.ajax({
//   url: "stimList_subord3D.js",
//   dataType: "script",
//   success: success
// }).done(function(data) {thonk = data;});

// // data = $.getScript( "stimList_subord3D.js").done(function(data) {thonk = data;});
// stimList = JSON.parse(thonk);
// basic_cats = _.unique(_.map(stimList, function(entry){ return entry['basic']}));

// cat_dict = new Object();
// basic_subord_dict = _.map(basic_cats, function(key){ 
//   subords = _.unique(extractEntries(matchingValue(stimList,'basic',key),'subordinate'))
//   console.log(key,subords);
//   cat_dict[key] = subords;
//   return cat_dict });

// // for demo version, just focus on birds
// basic = 'birds';
// session_objs = cat_dict[basic];
// condition = 'narrow'; // possible conditions are 'narrow' and 'broad'
// _filelist = extractEntries(matchingValue(stimList,'basic',basic),'filename');
// _poses = _.unique(extractEntries(matchingValue(stimList,'basic',basic),'pose'));
// _objs = _.unique(extractEntries(matchingValue(stimList,'basic',basic),'subordinate'));
// _fileurls = _.map(_filelist,function (fname) {return "https://s3.amazonaws.com/sketchloop-images-subord/" + fname + ".png"});
// _allfilenames = extractEntries(stimList,'filename');
// _allfileurls = _.map(_allfilenames, function (fname) {return "https://s3.amazonaws.com/sketchloop-images-subord/" + fname + ".png"});


game_core.prototype.makeTrialList = function () { 
  var local_this = this;
  var design_dict = this.getRandomizedConditions();
  var condition = design_dict['condition'];
  var categoryList = design_dict['category'];
  var _objectList = design_dict['object'];
  var poseList = design_dict['pose'];

  var trialList = [];
  for (var i = 0; i < categoryList.length; i++) { // "i" indexes round number
 
    for (var j = 0; j < categoryList[0].length; j++) { // "j" indexes trial number

      // sample four object images that are unique and follow the condition constraints
      var objList = sampleTrial(i,j,categoryList,_objectList,poseList);
      // sample locations for those objects
      var locs = this.sampleStimulusLocs(); // Sample locations for those objects      
      
      // construct trial list
      trialList.push(_.map(_.zip(objList, locs.speaker, locs.listener), function(tuple) {
        var object = _.clone(tuple[0]);
        object.width = local_this.cellDimensions.width;
        object.height = local_this.cellDimensions.height;      
        var speakerGridCell = local_this.getPixelFromCell(tuple[1][0], tuple[1][1]); 
        var listenerGridCell = local_this.getPixelFromCell(tuple[2][0], tuple[2][1]);
        
        object.speakerCoords = {
        	gridX : tuple[1][0],
        	gridY : tuple[1][1],
        	trueX : speakerGridCell.centerX - object.width/2,
        	trueY : speakerGridCell.centerY - object.height/2,
        	gridPixelX: speakerGridCell.centerX - 100,
        	gridPixelY: speakerGridCell.centerY - 100
              };
              object.listenerCoords = {
        	gridX : tuple[2][0],
        	gridY : tuple[2][1],
        	trueX : listenerGridCell.centerX - object.width/2,
        	trueY : listenerGridCell.centerY - object.height/2,
        	gridPixelX: listenerGridCell.centerX - 100,
        	gridPixelY: listenerGridCell.centerY - 100
        };
        return object;

      }));
  
    }
  };

  return(trialList);
};

game_core.prototype.server_send_update = function(){
  //Make a snapshot of the current state, for updating the clients
  var local_game = this;
  
  // Add info about all players
  var player_packet = _.map(local_game.players, function(p){
    return {id: p.id,
            player: null};
  });
  
  var state = {
    gs : this.game_started,   // true when game's started
    pt : this.players_threshold,
    pc : this.player_count,
    dataObj  : this.data,
    roundNum : this.roundNum,
    trialInfo: this.trialInfo
  };

  _.extend(state, {players: player_packet});
  _.extend(state, {instructions: this.instructions});

  //Send the snapshot to the players
  this.state = state;
  _.map(local_game.get_active_players(), function(p){
    p.player.instance.emit( 'onserverupdate', state);});
};

var getObjectSubset = function(basicCat) {
  return _.map(_.shuffle(_.filter(_objectList, function(x){
    return x.basic == basicCat;
  })), _.clone);
};

var getRemainingTargets = function(earlierTargets) {
  var criticalObjs = getObjectSubset("target");
  return _.filter(criticalObjs, function(x) {
    return !_.contains(earlierTargets, x.name );
  });
};

var sampleTrial = function(roundNum,trialNum,categoryList,_objectList,poseList) {
  // // NEW OBJECT STUFF 
  theseCats = categoryList[roundNum];
  theseObjs = _objectList[roundNum];
  thisPose = poseList[roundNum][trialNum];
  var im0 = _.filter(stimList, function(s){ return ( (s['cluster']==theseCats[0]) && (s['object']==theseObjs[0]) && (s['pose']==thisPose) ) })[0];
  var im1 = _.filter(stimList, function(s){ return ( (s['cluster']==theseCats[1]) && (s['object']==theseObjs[1]) && (s['pose']==thisPose) ) })[0];
  var im2 = _.filter(stimList, function(s){ return ( (s['cluster']==theseCats[2]) && (s['object']==theseObjs[2]) && (s['pose']==thisPose) ) })[0];
  var im3 = _.filter(stimList, function(s){ return ( (s['cluster']==theseCats[3]) && (s['object']==theseObjs[3]) && (s['pose']==thisPose) ) })[0];
  var im_all = [im0,im1,im2,im3]; 
  var target = im_all[trialNum]; // actual target on this trial
  notTargs = _.filter(_.range(4), function(x) { return x!=trialNum});
  var firstDistractor = im_all[notTargs[0]];
  var secondDistractor = im_all[notTargs[1]];
  var thirdDistractor = im_all[notTargs[2]];

  return [target, firstDistractor, secondDistractor, thirdDistractor];

  // if (condition=='closer') {
  //   tmp = _.shuffle(cat_dict['birds']);
  //   curr_pose = _.shuffle(_poses)[0];
  //   var target = {basic: 'birds', subord:tmp[0], targetStatus:"target", pose: curr_pose, condition: condition};
  //   var firstDistractor = {basic: 'birds', subord:tmp[1], targetStatus:"distr1", pose: curr_pose, condition: condition};
  //   var secondDistractor = {basic: 'birds', subord:tmp[2], targetStatus:"distr2", pose: curr_pose, condition: condition};
  //   return _.map([target, firstDistractor, secondDistractor], function(x) {      
  //     return _.extend(x, {condition: condition})});

  // } else if (condition == 'further') {
  //   console.log('this condition is not yet supported!');
  // }

  // // // // OLD COLOR STUFF
  // var opts = {fixedL : true};
  // var target = {color: utils.randomColor(opts), targetStatus : "target"};
  // var firstDistractor = {color: utils.randomColor(opts), targetStatus: "distr1"};
  // var secondDistractor = {color: utils.randomColor(opts), targetStatus: "distr2"};
  // if(checkItem(condition,target,firstDistractor,secondDistractor)) {
  //   // attach "condition" to each stimulus object
  //   return _.map([target, firstDistractor, secondDistractor], function(x) {
  //     return _.extend(x, {condition: condition});
  //   });
  // } else { // Try again if something is wrong
  //   return sampleTrial(condition);
  // }

};

var sampleObjects = function(condition, earlierTargets) {
  var samplingInfo = {
    1 : {class: getObjectSubset("birds"),
   selector: firstClassSelector},
    2 : {class: getObjectSubset("birds"),
   selector: secondClassSelector},
    3 : {class: getObjectSubset("birds"),
   selector: thirdClassSelector}
  };
  
  var conditionParams = condition.slice(-2).split("");    
  var firstDistrInfo = samplingInfo[conditionParams[0]];
  var secondDistrInfo = samplingInfo[conditionParams[1]];
  var remainingTargets = getRemainingTargets(earlierTargets);
  
  var target = _.sample(remainingTargets);
  var firstDistractor = firstDistrInfo.selector(target, firstDistrInfo.class);
  var secondDistractor = secondDistrInfo.selector(target, secondDistrInfo.class);
  if(checkItem(condition,target,firstDistractor,secondDistractor)) {
    // attach "condition" to each stimulus object
    return _.map([target, firstDistractor, secondDistractor], function(x) {
      return _.extend(x, {condition: condition});
    });
  } else { // Try again if something is wrong
    return sampleObjects(condition, earlierTargets);
  }
};





// NOT NECESSARY FOR SKETCHPAD TASK??
var checkItem = function(condition, target, firstDistractor, secondDistractor) {
  var f = 5; // floor difference
  var t = 20; // threshold
  var targetVsDistr1 = utils.colorDiff(target.color, firstDistractor.color);
  var targetVsDistr2 = utils.colorDiff(target.color, secondDistractor.color);
  var distr1VsDistr2 = utils.colorDiff(firstDistractor.color, secondDistractor.color);
  if(targetVsDistr1 < f || targetVsDistr2 < f || distr1VsDistr2 < f) {
    return false;
  } else if(condition === "equal") {
    return targetVsDistr1 > t && targetVsDistr2 > t && distr1VsDistr2 > t;
  } else if (condition === "closer") {
    return targetVsDistr1 < t && targetVsDistr2 < t && distr1VsDistr2 < t;
  } else if (condition === "further") {
    return targetVsDistr1 < t && targetVsDistr2 > t && distr1VsDistr2 > t;
  } else {
    throw "condition name (" + condition + ") not known";
  }
};

var firstClassSelector = function(target, list) {
  return _.sample(_.filter(list, function(x) {
    return target.basic === x.basiclevel;
  }));
};

var secondClassSelector = function(target, list) {
  return _.sample(_.filter(list, function(x) {
    return target.superdomain === x.superdomain;
  }));
};

var thirdClassSelector = function(target, list) {
  return _.extend(_.sample(list),{targetStatus : "distrClass3"});
};


// maps a grid location to the exact pixel coordinates
// for x = 1,2,3,4; y = 1,2,3,4
game_core.prototype.getPixelFromCell = function (x, y) {
  return {
    centerX: (this.cellPadding/2 + this.cellDimensions.width * (x - 1)
        + this.cellDimensions.width / 2),
    centerY: (this.cellPadding/2 + this.cellDimensions.height * (y - 1)
        + this.cellDimensions.height / 2),
    upperLeftX : (this.cellDimensions.width * (x - 1) + this.cellPadding/2),
    upperLeftY : (this.cellDimensions.height * (y - 1) + this.cellPadding/2),
    width: this.cellDimensions.width,
    height: this.cellDimensions.height
  };
};

// maps a raw pixel coordinate to to the exact pixel coordinates
// for x = 1,2,3,4; y = 1,2,3,4
game_core.prototype.getCellFromPixel = function (mx, my) {
  var cellX = Math.floor((mx - this.cellPadding / 2) / this.cellDimensions.width) + 1;
  var cellY = Math.floor((my - this.cellPadding / 2) / this.cellDimensions.height) + 1;
  return [cellX, cellY];
};



// readjusts trueX and trueY values based on the objLocation and width and height of image (objImage)
game_core.prototype.getTrueCoords = function (coord, objLocation, objImage) {
  var trueX = this.getPixelFromCell(objLocation.gridX, objLocation.gridY).centerX - objImage.width/2;
  var trueY = this.getPixelFromCell(objLocation.gridX, objLocation.gridY).centerY - objImage.height/2;
  if (coord == "xCoord") {
    return trueX;
  }
  if (coord == "yCoord") {
    return trueY;
  }
};
  
