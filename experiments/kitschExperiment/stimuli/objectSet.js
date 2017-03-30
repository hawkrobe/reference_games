// Indexed by object set ID

// target objects ("kistch items" -- atypical to two different categories)
var frog_teapot = {
  url: 'stimuli/img_0.jpg', name: "frog_teapot", atypical: True,
  class_1: "frog", class_2: "teapot", width: 227, height: 227,
};
var panda_backpack = {
  url: 'stimuli/img_1.jpg', name: "panda_backpack", atypical: True,
  class_1: "panda", class_2: "backpack", width: 227, height: 227,
};
var apple_chair = {
  url: 'stimuli/img_2.jpg', name: "apple_chair", atypical: True,
  class_1: "apple", class_2: "chair", width: 227, height: 227,
};
var swan_measuring_cup = {
  url: 'stimuli/img_3.jpg', name: "swan_measuring_cup", atypical: True,
  class_1: "swan", class_2: "measuring_cup", width: 227, height: 227,
};
var basketball_hoop_charm = {
  url: 'stimuli/img_4.jpg', name: "basketball_hoop_charm", atypical: True,
  class_1: "basketball_hoop", class_2: "charm", width: 227, height: 227,
};
var lightouse_lamp = {
  url: 'stimuli/img_5.jpg', name: "lightouse_lamp", atypical: True,
  class_1: "lighthouse", class_2: "lamp", width: 227, height: 227,
};

// target objects (typical items)
var frog = {
  url: 'stimuli/img_6.jpg', name: "frog", atypical: False,
  class_1: "frog", class_2: None, width: 227, height: 227,
};
var panda = {
  url: 'stimuli/img_7.jpg', name: "panda", atypical: False,
  class_1: "panda", class_2: None, width: 227, height: 227,
};
var apple = {
  url: 'stimuli/img_8.jpg', name: "apple", atypical: False,
  class_1: "apple", class_2: None, width: 227, height: 227,
};
var swan = {
  url: 'stimuli/img_9.jpg', name: "swan", atypical: False,
  class_1: "swan", class_2: None, width: 227, height: 227,
};
var basketball_hoop = {
  url: 'stimuli/img_10.jpg', name: "basketball_hoop", atypical: False,
  class_1: "basketball_hoop", class_2: None, width: 227, height: 227,
};
var lighthouse = {
  url: 'stimuli/img_11.jpg', name: "lighthouse", atypical: False,
  class_1: "lighthouse", class_2: None, width: 227, height: 227,
};
var teapot = {
  url: 'stimuli/img_12.jpg', name: "teapot", atypical: False,
  class_1: "teapot", class_2: None, width: 227, height: 227,
};
var backpack = {
  url: 'stimuli/img_13.jpg', name: "backpack", atypical: False,
  class_1: "backpack", class_2: None, width: 227, height: 227,
};
var chair = {
  url: 'stimuli/img_14.jpg', name: "chair", atypical: False,
  class_1: "chair", class_2: None, width: 227, height: 227,
};
var measuring_cup {
  url: 'stimuli/img_15.jpg', name: "measuring_cup", atypical: False,
  class_1: "measuring_cup", class_2: None, width: 227, height: 227,
};
var charm = {
  url: 'stimuli/img_16.jpg', name: "charm", atypical: False,
  class_1: "charm", class_2: None, width: 227, height: 227,
};
var lamp = {
  url: 'stimuli/img_17.jpg', name: "lamp", atypical: False,
  class_1: "lamp", class_2: None, width: 227, height: 227,
};

var objectList = [
  frog_teapot, panda_backpack, apple_chair, swan_measuring_cup, basketball_hoop_charm, lightouse_lamp, 
  frog, panda, apple, swan, basketball_hoop, lighthouse,
  teapot, backpack, chair, measuring_cup, charm, lamp,
];

module.exports = objectList;




