// Indexed by object set ID

// target objects ("kistch items" -- atypical to two different categories)
var frog_teapot = {
  url: 'stimuli/img_0.jpg', name: "frog_teapot", distr: "atypical", target: 1, is_parent: false,
  class_1: "frog", class_2: "teapot", width: 227, height: 227, parent_class_of: [],
};
var panda_backpack = {
  url: 'stimuli/img_1.jpg', name: "panda_backpack", distr: "atypical", target: 1, is_parent: false,
  class_1: "panda", class_2: "backpack", width: 227, height: 227, parent_class_of: [], 
};
var apple_chair = {
  url: 'stimuli/img_2.jpg', name: "apple_chair", distr: "atypical", target: 1, is_parent: false,
  class_1: "apple", class_2: "chair", width: 227, height: 227, parent_class_of: [], 
};
var swan_measuring_cup = {
  url: 'stimuli/img_3.jpg', name: "swan_measuring_cup", distr: "atypical", target: 1, is_parent: false,
  class_1: "swan", class_2: "measuring_cup", width: 227, height: 227, parent_class_of: [],
};
var basketball_hoop_charm = {
  url: 'stimuli/img_4.jpg', name: "basketball_hoop_charm", distr: "atypical", target: 1, is_parent: false,
  class_1: "basketball_hoop", class_2: "charm", width: 227, height: 227, parent_class_of: [],
};
var lightouse_lamp = {
  url: 'stimuli/img_5.jpg', name: "lightouse_lamp", distr: "atypical", target: 1, is_parent: false,
  class_1: "lighthouse", class_2: "lamp", width: 227, height: 227, parent_class_of: [],
};

// target objects (typical items)
var frog = {
  url: 'stimuli/img_6.jpg', name: "frog", distr: "parent_class_1", target: 2, is_parent: true,
  class_1: "frog", class_2: null, width: 227, height: 227, parent_class_of: ['frog_teapot'],
};
var panda = {
  url: 'stimuli/img_7.jpg', name: "panda", distr: "parent_class_1", target: 2, is_parent: true,
  class_1: "panda", class_2: null, width: 227, height: 227, parent_class_of: ['panda_backpack'],
};
var apple = {
  url: 'stimuli/img_8.jpg', name: "apple", distr: "parent_class_1", target: 2, is_parent: true,
  class_1: "apple", class_2: null, width: 227, height: 227, parent_class_of: ['apple_chair'],
};
var swan = {
  url: 'stimuli/img_9.jpg', name: "swan", distr: "parent_class_1", target: 2, is_parent: true,
  class_1: "swan", class_2: null, width: 227, height: 227, parent_class_of: ['swan_measuring_cup'],
};
var basketball_hoop = {
  url: 'stimuli/img_10.jpg', name: "basketball_hoop", distr: "parent_class_1", target: 2, is_parent: true,
  class_1: "basketball_hoop", class_2: null, width: 227, height: 227, parent_class_of: ['basketball_hoop_charm'],
};
var lighthouse = {
  url: 'stimuli/img_11.jpg', name: "lighthouse", distr: "parent_class_1", target: 2, is_parent: true,
  class_1: "lighthouse", class_2: null, width: 227, height: 227, parent_class_of: ['lightouse_lamp'],
};
var teapot = {
  url: 'stimuli/img_12.jpg', name: "teapot", distr:"parent_class_2", target: 3, is_parent: true,
  class_1: null, class_2: 'teapot', width: 227, height: 227, parent_class_of: ['frog_teapot'],
};
var backpack = {
  url: 'stimuli/img_13.jpg', name: "backpack", distr:"parent_class_2", target: 3, is_parent: true,
  class_1: null, class_2: "backpack", width: 227, height: 227, parent_class_of: ['panda_backpack'],
};
var chair = {
  url: 'stimuli/img_14.jpg', name: "chair", distr:"parent_class_2", target: 3, is_parent: true,
  class_1: null, class_2: "chair", width: 227, height: 227, parent_class_of: ['apple_chair'],
};
var measuring_cup = {
  url: 'stimuli/img_15.jpg', name: "measuring_cup", distr:"parent_class_2", target: 3, is_parent: true,
  class_1: null, class_2: "measuring_cup", width: 227, height: 227, parent_class_of: ['swan_measuring_cup'],
};
var charm = {
  url: 'stimuli/img_16.jpg', name: "charm", distr:"parent_class_2", target: 3, is_parent: true,
  class_1: null, class_2: "charm", width: 227, height: 227, parent_class_of: ['basketball_hoop_charm'],
};
var lamp = {
  url: 'stimuli/img_17.jpg', name: "lamp", distr:"parent_class_2", target: 3, is_parent: true,
  class_1: null, class_2: "lamp", width: 227, height: 227, parent_class_of: ['lightouse_lamp'],
};

var objectList = [
  frog_teapot, panda_backpack, apple_chair, swan_measuring_cup, basketball_hoop_charm, lightouse_lamp, 
  frog, panda, apple, swan, basketball_hoop, lighthouse,
  teapot, backpack, chair, measuring_cup, charm, lamp,
];

module.exports = objectList;

