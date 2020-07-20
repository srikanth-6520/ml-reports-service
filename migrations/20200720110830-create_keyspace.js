const Uuid = require('cassandra-driver').types.Uuid;
const config = require('../config/config');

module.exports = {
  async up(db) {
    global.migrationMsg = "Create keyspace";
    
    
    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    let query = "CREATE KEYSPACE IF NOT EXISTS " + config.cassandra.keyspace + " WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1' }";

    cassandra.execute(query);

    return global.migrationMsg;
  },

      async down(db) {
        // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
      }
    };