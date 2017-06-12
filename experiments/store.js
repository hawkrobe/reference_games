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
const mongoURL = 'mongodb://localhost:27017/';
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

function serve() {

  mongoConnectWithRetry(2000, (connection) => {

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.post('/db/exists', (request, response) => {
      if (!request.body) {
	return failure(response, '/db/exists needs post request body');
      }
      const databaseName = request.body.dbname;
      const collectionName = request.body.colname;
      if (!collectionName) {
	return failure(response, '/db/exists needs collection');
      }
      if (!databaseName) {
	return failure(response, '/db/exist needs database');
      }

      const database = connection.db(databaseName);
      console.log(request.body);
      const query = request.body.query;
      const projection = request.body.projection;
      const collection = database.collection(collectionName);

      log(`got request to findOne in ${collectionName} with` +
	  ` query ${JSON.stringify(query)} and projection ${JSON.stringify(projection)}`);
      collection.find(query, projection).limit(1).toArray((err, items) => {
	console.log('got items ' + JSON.stringify(items));
	response.json(!_.isEmpty(items));
      });
    });

    // app.post('/db/find', (request, response) => {
    //   if (!request.body) {
    // 	return failure(response, '/db/find needs post request body');
    //   }
    //   const databaseName = request.body.dbname
    //   const collectionName = request.body.colname;
    //   if (!collectionName) {
    // 	return failure(response, '/db/find needs collection');
    //   }
    //   const query = request.body.query || {};
    //   const projection = request.body.projection;
    //   const collection = database.collection(collectionName);
    //   log(`got request to find in ${collectionName} with` +
    // 	  ` query ${JSON.stringify(query)} and projection ${JSON.stringify(projection)}`);
    //   collection.find(query, projection).toArray().then((data) => {
    // 	response.json(data);
    //   });
    // });

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
      log(`inserting data: ${JSON.stringify(data)}`);
      collection.insert(data, (err, result) => {
	if (err) {
	  return failure(response, `error inserting data: ${err}`);
	} else {
	  return success(response, `successfully inserted data. result: ${JSON.stringify(result)}`);
	}
      });
    });

    app.listen(port, () => {
      log(`running at http://localhost:${port}`);
    });
    
  });
  
}

serve();
