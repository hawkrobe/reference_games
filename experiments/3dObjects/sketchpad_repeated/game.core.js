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
    utils  = require(__base + 'sharedUtils/sharedUtils.js');
  }
  else throw 'mymodule requires underscore, see http://underscorejs.org';
}

var game_core = function(options){
  // Store a flag if we are the server instance
  this.server = options.server ;
  this.email = 'sketchloop@gmail.com';
  
  // How many players in the game?
  this.players_threshold = 2;
  this.playerRoleNames = {
    role1 : 'sketcher',
    role2 : 'viewer'
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
  

  // track shift key drawing tool use 
  this.shiftKeyUsed = 0; // "1" on trials where used, "0" otherwise

  // define dbname and colname
  this.dbname = '3dObjects';
  this.colname = 'sketchpad_repeated';

  // Number of total poses per object
  this.numPoses = 40;          

  // Which stroke number are we on?  
  this.currStrokeNum = 0;  

  // Is the sketcher done with their drawing?
  this.doneDrawing = false;

  // Is the sketcher allowed to draw?
  this.drawingAllowed = false;

  // time (in ms) to wait before giving feedback
  this.feedbackDelay = 300;

  // Which round (a.k.a. "trial") are we on (initialize at -1 so that first round is 0-indexed)
  this.roundNum = -1;

  // How many rounds do we want people to complete?
  this.numRounds = 56;

  // How many objects per round (how many items in the menu)?
  this.numItemsPerRound = this.numHorizontalCells*this.numVerticalCells;

  // Items x Rounds?
  this.numItemsxRounds = this.numItemsPerRound*this.numRounds;

  // This will be populated with the set of objects
  this.trialInfo = {};
  
  if(this.server) {
    console.log('sent server update bc satisfied this.server')
    // If we're initializing the server game copy, pre-create the list of trials
    // we'll use, make a player object, and tell the player who they are
    this.id = options.id;
    this.expName = options.expName;
    this.player_count = options.player_count;
    this.trialList = this.makeTrialList();
    this.data = {
      id : this.id,
      trials : [],
      catch_trials : [], system : {},
      subject_information : {
	gameID: this.id,
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
    // console.log('got to newRound in game.core.js and not the final round');
    // Otherwise, get the preset list of objects for the new round
    this.roundNum += 1;
    this.trialInfo = {currStim: this.trialList[this.roundNum]};
    this.objects = this.trialList[this.roundNum];
    this.server_send_update();
  }
};

game_core.prototype.getRandomizedConditions = function() {  
  ///// May 31: implementing re-design (see README.md)

  var numCats = 4;
  var numObjs = 8; 
  // make randomization matrix: take 4x8 matrix with range(0,8) on the rows, and indpt shuffle within row  
  var tmp = new Array;
  for (i=0;i<numCats;i++) {
    tmp.push(_.shuffle(_.range(0,8)));
  }
  
  // So now we generate the 8 unique menus:
  // First, take left 4x4 matrix and define each column to be 4 different "menus" 
  var menuList = new Array;
  for (i=0;i<numCats;i++) { 
    _menu = new Array;
    for (j=0;j<numCats;j++) { 
      _menu.push(tmp[j][i])
    } 
    menuList.push(_menu);      
  }
  // Then, take right 4x4 matrix and define each row to be 4 different "menus"
  // this way, each object is drawn exactly once, and objects always appear with the same distractors
  for (i=0;i<numObjs-numCats;i++) {
    menuList.push(tmp[i].slice(4,8));
  }

  // copy four times to get the object matrix 
  _object = menuList.concat(menuList).concat(menuList).concat(menuList);

  // now let's make the category matrix
  arr = new Array;
  _(4).times(function(n){arr.push(_.range(0,4))});
  tmp = _.range(0,4);
  for (i=0;i<tmp.length;i++) {
    arr.push(_.times(4, function() { return tmp[i]; }));
  }

  // copy 4 times to get full category matrix
  _category = arr.concat(arr).concat(arr).concat(arr);

  // now make pose matrix (on each trial, all objects share same pose, )
  _pose = _.shuffle(_.range(this.numPoses)).slice(0,32);  
  // for (i=0;i<_poses.length;i++) {
  //   pose.push(_.times(4, function() { return _poses[i]; }));
  // }

  // now make condition matrix
  f = _.times(4,function() {return "further"});
  c = _.times(4,function() {return "closer"});
  tmp = f.concat(c);
  _condition = tmp.concat(tmp).concat(tmp).concat(tmp);

  // now create target vector
  _target = new Array;
  for (i=0;i<4;i++) {
    _target = _target.concat(_.times(8,function() {return i}));
  }

  // MAY 31 2017: NEW FOR REPEATED REFERENCE EXPERIMENT 

  // zip together the various trial metadata vectors 
  zipped = _.zip(_object,_category,_pose,_condition,_target);

  // sample one of the "closer" quartets and one "further" quartet to make repeat (4 times)
  to_repeat_further = _.shuffle(_.range(0,4))[0];
  to_repeat_closer = _.shuffle(_.range(4,8))[0];

  // inds of zipped that correspond to the critical further & closer quartets that will be repeated
  period = _.map(_.range(0,4), function(num){ return num * 8; });
  f_inds = new Array;
  c_inds = new Array;
  for (i=0;i<period.length;i++) {
    f_inds = f_inds.concat(to_repeat_further+period[i]);
    c_inds = c_inds.concat(to_repeat_closer+period[i]);
  }

  // inds of zipped that correspond to the further-once and closer-once trials (which act as "filler" for this experiment)
  filler_further = _.difference(_.range(0,4), [to_repeat_further]);
  filler_closer = _.difference(_.range(4,8), [to_repeat_closer]);

  filler_f_inds = new Array;
  filler_c_inds = new Array;
  for (i=0;i<4;i++) {
    filler_f_inds = filler_f_inds.concat(_.map(filler_further, function(num){ return num + period[i]; }));
    filler_c_inds = filler_c_inds.concat(_.map(filler_closer, function(num){ return num + period[i]; }));
  }
  // shuffle filler_f_inds
  filler_f_inds = _.shuffle(filler_f_inds);
  filler_c_inds = _.shuffle(filler_c_inds);

  // now construct your four epochs of 14 trials each (4 repeated-further, 4 repeated-closer, 3 once-further, 3 once-closer)
  num_epochs = 4;
  all_epochs = new Array;
  for (j=0;j<num_epochs;j++) {
    curr_epoch = new Array;
    // append the further repeat trials
    for (i=0;i<f_inds.length;i++) {
      curr_epoch.push(zipped[f_inds[i]].concat(j).concat('repeated')); // j is concated to capture 'epoch number'
    }
    // // append the closer repeat trials
    for (i=0;i<c_inds.length;i++) {
      curr_epoch.push(zipped[c_inds[i]].concat(j).concat('repeated'));
    }
    filler_range = _.range(j*3,j*3+3);
    // console.log(filler_range);
    // grab the next 3 further filler (once) trials and append
    for (i=0;i<filler_range.length;i++) {
      curr_epoch.push(zipped[filler_f_inds[filler_range[i]]].concat(j).concat('once'));
    }    
    // // grab the next 3 closer filler (once) trials and append
    for (i=0;i<filler_range.length;i++) {
      curr_epoch.push(zipped[filler_c_inds[filler_range[i]]].concat(j).concat('once'));
    } 
    // shuffle curr_epoch before appending to all_epoch list
    curr_epoch_shuffled = _.shuffle(curr_epoch);
    all_epochs = all_epochs.concat(curr_epoch_shuffled);     
  }

  // this block deprecated for repeated reference experiment
  // // now shuffle the rows of condition & object matrices using same set of indices
  // var _zipped;
  // _zipped = _.shuffle(_.zip(_object,_category,_pose,_condition,_target));

  var condition = new Array; 
  var category = new Array;
  var object = new Array;
  var pose = new Array;
  var target = new Array; // target assignment
  var epoch = new Array;
  var repeated = new Array;

  for (j=0;j<all_epochs.length;j++) {
    object.push(all_epochs[j][0]);
    category.push(all_epochs[j][1]);
    pose.push(all_epochs[j][2]);
    condition.push(all_epochs[j][3]);
    target.push(all_epochs[j][4]);
    epoch.push(all_epochs[j][5]);
    repeated.push(all_epochs[j][6]);
  }
  // final output: design_dict contains category, object, pose matrices (each 56x4 [rounds by item])
  // condition: 56x1 
  var design_dict;
  design_dict = {condition:condition,
                 category:category,
                 object:object,                 
                 pose:pose,
                 target:target,
                 epoch:epoch,
                 repeated:repeated};


  // console.log(design_dict);
  return design_dict;  

};

game_core.prototype.sampleStimulusLocs = function() {
  var listenerLocs = _.shuffle([[1,1], [2,1], [3,1], [4,1]]);
  var speakerLocs = _.shuffle([[1,1], [2,1], [3,1], [4,1]]);

  // // temporarily turn off shuffling to make sure that it has to do with this
  // var listenerLocs = [[1,1], [2,1], [3,1], [4,1]];
  // var speakerLocs = [[1,1], [2,1], [3,1], [4,1]];
  return {listener : listenerLocs, speaker : speakerLocs};
};


game_core.prototype.makeTrialList = function () { 
  var local_this = this;
  var design_dict = this.getRandomizedConditions();
  var categoryList = design_dict['category'];
  var _objectList = design_dict['object'];
  var poseList = design_dict['pose'];
  var targetList = design_dict['target'];
  var conditionList = design_dict['condition'];
  var epochList = design_dict['epoch'];
  var repeatedList = design_dict['repeated'];

  var objList = new Array;
  var locs = new Array;

  var trialList = [];
  for (var i = 0; i < categoryList.length; i++) { // "i" indexes round number    
    // sample four object images that are unique and follow the condition constraints
    var objList = sampleTrial(i,categoryList,_objectList,poseList,targetList,conditionList,epochList,repeatedList);      
    // sample locations for those objects
    var locs = this.sampleStimulusLocs(); 
    // construct trial list (in sets of complete rounds)
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
    trialInfo: this.trialInfo,
    objects: this.objects,
    gameID: this.id
  };

  _.extend(state, {players: player_packet});
  _.extend(state, {instructions: this.instructions});
  if(player_packet.length == 2) {
    _.extend(state, {objects: this.objects});
  }
  // console.log('printing state variable from server_send_update');
  // console.log(state);
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




var sampleTrial = function(roundNum,categoryList,_objectList,poseList,targetList,conditionList,epochList,repeatedList) {    
  theseCats = categoryList[roundNum];
  theseObjs = _objectList[roundNum];
  thisPose = poseList[roundNum];
  thisTarget = targetList[roundNum];
  thisCondition = conditionList[roundNum];
  thisEpoch = epochList[roundNum];
  thisRepeated = repeatedList[roundNum]

  var im0 = _.filter(stimList, function(s){ return ( (s['cluster']==theseCats[0]) && (s['object']==theseObjs[0]) && (s['pose']==thisPose) ) })[0];
  var im1 = _.filter(stimList, function(s){ return ( (s['cluster']==theseCats[1]) && (s['object']==theseObjs[1]) && (s['pose']==thisPose) ) })[0];
  var im2 = _.filter(stimList, function(s){ return ( (s['cluster']==theseCats[2]) && (s['object']==theseObjs[2]) && (s['pose']==thisPose) ) })[0];
  var im3 = _.filter(stimList, function(s){ return ( (s['cluster']==theseCats[3]) && (s['object']==theseObjs[3]) && (s['pose']==thisPose) ) })[0]; 

  var im_all = [im0,im1,im2,im3]; 
  var target = im_all[thisTarget]; // actual target on this trial
  var notTargs = _.filter(_.range(4), function(x) { return x!=thisTarget});
  var firstDistractor = im_all[notTargs[0]]; 
  var secondDistractor = im_all[notTargs[1]];
  var thirdDistractor = im_all[notTargs[2]];
  _target_status = ["distractor","distractor","distractor","distractor"];
  var target_status = _target_status[thisTarget] = "target"; 
  _.extend(target,{target_status: "target", condition: thisCondition, epoch: thisEpoch, repeated: thisRepeated});
  _.extend(firstDistractor,{target_status: "distr1", condition: thisCondition, epoch: thisEpoch, repeated: thisRepeated}); 
  _.extend(secondDistractor,{target_status: "distr2", condition: thisCondition, epoch: thisEpoch, repeated: thisRepeated});
  _.extend(thirdDistractor,{target_status: "distr3", condition: thisCondition, epoch: thisEpoch, repeated: thisRepeated});
  return [target, firstDistractor, secondDistractor, thirdDistractor];

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



// // readjusts trueX and trueY values based on the objLocation and width and height of image (objImage)
// game_core.prototype.getTrueCoords = function (coord, objLocation, objImage) {
//   var trueX = this.getPixelFromCell(objLocation.gridX, objLocation.gridY).centerX - objImage.width/2;
//   var trueY = this.getPixelFromCell(objLocation.gridX, objLocation.gridY).centerY - objImage.height/2;
//   if (coord == "xCoord") {
//     return trueX;
//   }
//   if (coord == "yCoord") {
//     return trueY;
//   }
// };
  
