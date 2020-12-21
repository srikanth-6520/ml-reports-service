/**
 * name : index.js
 * author : Deepa
 * created-date : 21-December-2020
 * Description : Configurations related information.
*/

//Dependencies
const config = require('./config');

/**
  * Mongodb Database configuration.
  * @function
  * @name mongodb_connect
  * @param {Object} configuration - mongodb database configuration.
*/

const mongodb_connect = function (configuration) {
   
    global.database = require("./db/mongodb")(
      configuration
    );
  
    global.ObjectId = database.ObjectId;
    global.Abstract = require("../common/abstract");
  
};
  

  // Configuration data.
   const configuration = {
    mongodb: {
      host : config.mongodb.host,
      port : config.mongodb.port,
      database : config.mongodb.db
    }
  };
  
  mongodb_connect(configuration.mongodb);
 
  module.exports = configuration;
  