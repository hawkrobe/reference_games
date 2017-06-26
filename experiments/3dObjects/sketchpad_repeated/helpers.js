// jefan 2/17/2017
// helpers

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

// add entry to dictionary object
function addEntry(dict,key,value) {
  for (i=0; i<dict.length; i++) {
      dict[i][key] = value;   
  } 
  return dict;  
}