const Uuid = require('cassandra-driver').types.Uuid;
const config = require('../config/config');

module.exports = {
  async up(db) {
    global.migrationMsg = "create table";


    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    let query = "CREATE TABLE IF NOT EXISTS " + config.cassandra.table + " (id uuid PRIMARY KEY, qid text, quesry text)";


    cassandra.execute(query);


    return global.migrationMsg;
  },

  async down(db) {
    // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
