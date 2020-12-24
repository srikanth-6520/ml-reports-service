const Uuid = require('cassandra-driver').types.Uuid;
const config = require('../config/config');

module.exports = {
  async up(db) {
    global.migrationMsg = "create table";


    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    let truncateTable = "DROP TABLE IF EXISTS " + process.env.CASSANDRA_KEYSPACE + "." + process.env.CASSANDRA_TABLE;

    await cassandra.execute(truncateTable);

    let query = "CREATE TABLE IF NOT EXISTS " + process.env.CASSANDRA_TABLE + " (id uuid PRIMARY KEY, qid text, query text)";

    await cassandra.execute(query);


    return global.migrationMsg;
  },

  async down(db) {
    // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
