const mongoose = require('mongoose');
const logger = console;

// Connect to DB
const db = {
  uri: 'mongodb://dev-db:27000/upsert_tests',
  options: {
    replSet: 'rs0',
    user: '',
    pass: '',
    autoReconnect: true,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000
  },
  showDebug: false
};

mongoose.plugin(require('../')); // add a global plugin

mongoose.connect(db.uri, db.options);

mongoose.Promise = Promise;

mongoose.connection.on('connected', () => {
  if (db.showDebug)
    logger.info(`Mongoose default connection open to ${db.uri}`);
});

// If the connection throws an error
mongoose.connection.on('error', (err) => {
  if (db.showDebug)
    logger.error(`Mongoose default connection error: ${err}`);
  process.exit(1);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', () => {
  if (db.showDebug)
    logger.info('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    if (db.showDebug)
      logger.info('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
});

