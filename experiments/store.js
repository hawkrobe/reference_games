'use strict';

const _ = require('lodash');
const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const mongodb = require('mongodb');
const path = require('path');
const sendPostRequest = require('request').post;
const colors = require('colors/safe');

const app = express();
const MongoClient = mongodb.MongoClient;
const port = 4000;
const mongoCreds = require('./auth.json');
const mongoURL = `mongodb://${mongoCreds.user}:${mongoCreds.password}@localhost:27017/`;
const handlers = {};


function makeMessage(text) {
  return `${colors.blue('[store]')} ${text}`;
}

function log(text) {
  console.log(makeMessage(text));
}

function error(text) {
  console.error(makeMessage(text));
}

function failure(response, text) {
  const message = makeMessage(text);
  console.error(message);
  return response.status(500).send(message);
}

function success(response, text) {
  const message = makeMessage(text);
  console.log(message);
  return response.send(message);
}

function mongoConnectWithRetry(delayInMilliseconds, callback) {
  MongoClient.connect(mongoURL, (err, connection) => {
    if (err) {
      console.error(`Error connecting to MongoDB: ${err}`);
      setTimeout(() => mongoConnectWithRetry(delayInMilliseconds, callback), delayInMilliseconds);
    } else {
      log('connected succesfully to mongodb');
      callback(connection);
    }
  });
}

// Keep track of which games have used each stim
function recordStimUse(stimdb, gameid, idList) {
  _.forEach(idList, id => {
    stimdb.update({_id: id}, {
      $push : {games : gameid},
      $inc  : {numGames : 1}
    }, {multi: true}, function(err, items) {
      // do something when done?
    });
  });
}

// // this function isn't currently being used, but might be once there are >1 databases
// function getDatabaseList(connection, callback) {
//    connection.admin().listDatabases(function(err, result) {
//       if (err) {
//         console.error('Error listing databases from this MongoDB connection');
//       } else {
//         log('success: got list of databases from this mongo connection')
//         callback(result.databases);
//       }
//    })
// }

// // also not being used, but might be later to scale to new db/cols
// function getCollectionList(db, callback) {
//     db.listCollections().toArray(function(err, collections) {
//         // collections is an array of collection info objects that look like:
//         // { name: 'test', options: {} }
//         if (err) {
//           console.error(`Error retrieving collections: ${err}`)
//         } else {
//           log('success: retrieved collection information from this database');
//           callback(collections);
//         }
//     });
// }

function serve() {

  mongoConnectWithRetry(2000, (connection) => {

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.post('/db/exists', (request, response) => {            

      if (!request.body) {
        return failure(response, '/db/exists needs post request body');
      }
      const databaseName = request.body.dbname;
      const database = connection.db(databaseName);
      const query = request.body.query;
      const projection = request.body.projection;

      // hardcoded for now (TODO: get list of collections in db)
      var collectionList = ['sketchpad_basic','sketchpad_repeated',
			    'chatbox_basic', //'chairs_chatbox',
			    'artificialLanguage']; 

      function checkCollectionForHits(collectionName, query, projection, callback) {
        const collection = database.collection(collectionName);        
        collection.find(query, projection).limit(1).toArray((err, items) => {          
          callback(!_.isEmpty(items));
        });  
      }

      function checkEach(collectionList, checkCollectionForHits, query,
			 projection, evaluateTally) {
        var doneCounter = 0;
        var results = 0;          
        collectionList.forEach(function (collectionName) {
          checkCollectionForHits(collectionName, query, projection, function (res) {
            log(`got request to find_one in ${collectionName} with` +
                ` query ${JSON.stringify(query)} and projection ${JSON.stringify(projection)}`);          
            doneCounter += 1;
            results+=res;
            if (doneCounter === collectionList.length) {
              evaluateTally(results);
            }
          });
        });
      }
      function evaluateTally(hits) {
        console.log("hits: ", hits);
        response.json(hits>0);
      }

      checkEach(collectionList, checkCollectionForHits, query, projection, evaluateTally);

    });

    app.post('/db/insert', (request, response) => {
      if (!request.body) {
        return failure(response, '/db/insert needs post request body');
      }
      log(`got request to insert into ${request.body.colname}`);
      
      const databaseName = request.body.dbname;
      const collectionName = request.body.colname;
      if (!collectionName) {
        return failure(response, '/db/insert needs collection');
      }
      if (!databaseName) {
        return failure(response, '/db/insert needs database');
      }

      const database = connection.db(databaseName);
      
      // Add collection if it doesn't already exist
      if (!database.collection(collectionName)) {
        console.log('creating collection ' + collectionName);
        database.createCollection(collectionName);
      }

      const collection = database.collection(collectionName);

      const data = _.omit(request.body, ['colname', 'dbname']);
      // log(`inserting data: ${JSON.stringify(data)}`);
      collection.insert(data, (err, result) => {
        if (err) {
          return failure(response, `error inserting data: ${err}`);
        } else {
          return success(response, `successfully inserted data. result: ${JSON.stringify(result)}`);
        }
      });
    });

    app.post('/db/getstims', (request, response) => {
      if (!request.body) {
        return failure(response, '/db/getstims needs post request body');
      }
      log(`got request to get stims from ${request.body.dbname}/${request.body.colname}`);
      
      const databaseName = request.body.dbname;
      const collectionName = request.body.colname;
      if (!collectionName) {
        return failure(response, '/db/getstims needs collection');
      }
      if (!databaseName) {
        return failure(response, '/db/getstims needs database');
      }

      const database = connection.db(databaseName);
      const collection = database.collection(collectionName);

      collection.aggregate([
    	{ $group : {_id : "$numGames", count: { $sum: 1 }}}
          ], (err, results) => {console.log('counts...'); console.log(results)});
          
          // get a random sample of stims that haven't appeared more than k times
          collection.aggregate([
    	{ $addFields : { numGames: { $size: '$games'} } }, 
    	// { $group : { _id : "$family", numGames: {$avg : "$numGames"},
    	// 	     family: { $push: "$$ROOT" } } },
    	{ $sort : { numGames : 1} },	
    	{ $limit : request.body.numRounds }
          ], (err, results) => {
    	if(err) {
    	  console.log(err);
    	} else {
    	  
    	  recordStimUse(collection, request.body.gameid, _.map(results, '_id'));
    	  response.send(results);
    	}
      });
    });

    app.listen(port, () => {
      log(`running at http://localhost:${port}`);
    });
    
  });
  
}

serve();
