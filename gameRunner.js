var MongoClient = require('mongodb').MongoClient;
var Q = require('q');
var Game = require('./Game.js');
var move = require('./hero.js');

// var mongoConnectionURL = process.env.CUSTOMCONNSTR_MONGO_URI;// || 'mongodb://localhost/javascriptBattle'
var mongoConnectionURL = 'mongodb://localhost/javascriptBattle';

var openGameDatabase = function() {
  return Q.ninvoke(MongoClient, 'connect', mongoConnectionURL).then(function(db) {
    console.log('open!');
    return db.collection('jsBattleGameData');
  });
};

var addGameDataToDatabase = function(collection, gameData, date) {
  gameData.date = date;
  return Q.ninvoke(collection, 'insert', gameData).then(function(docs) {
    console.log('~~~~~~');
    console.log(docs);
    console.log('~~~~~~');
  }, function(err) {
    console.log(err);
  });
};

var getDateString = function() {
  var d = new Date();
  var result = (d.getMonth() + 1).toString();
  result += '/' + d.getDate();
  result += '/' + d.getFullYear();
  return result;
};

var resolveGameAndSaveTurnsToDB = function(promiseToWaitFor, mongoCollection, game) {
  console.log(game.turn);
  if (promiseToWaitFor === undefined) {
    resolveGameAndSaveTurnsToDB(Q.ninvoke(mongoCollection, 'insert', game), mongoCollection, game);
  } else {
    promiseToWaitFor.then(function(collection) {
      if (!game.ended) {
        game.handleHeroTurn(move(game));

        //Get today's date in string form
        var date = getDateString();

        //Manually set the ID so Mongo doesn't just keep writing to the same document
        game._id = game.turn + '|' + date;
        
        promiseToWaitFor.then(function() {
          setTimeout(function() {
            resolveGameAndSaveTurnsToDB(Q.ninvoke(mongoCollection, 'insert', game), mongoCollection, game)
          }, 10000);
        });
      }
    }).catch(function(err) {
      console.log(err);
    });
  }
};

var runGame = function() {
  //Set up the game board
  var game = new Game();
  game.addHero(0,0);
  game.addHero(0,4);

  game.addHealthWell(2,2);
  
  game.addImpassable(2,1);
  game.addImpassable(2,3);

  game.addDiamondMine(0,2);
  game.addDiamondMine(2,0);
  game.addDiamondMine(4,2);
  game.addDiamondMine(2,4);

  //Open up the database connection
  var openDatabasePromise = openGameDatabase();

  //After opening the database promise, 
  openDatabasePromise.then(function(collection) {

    resolveGameAndSaveTurnsToDB(undefined, collection, game);

  }).catch(function(err) {
    console.log(err);
  });
};

runGame();