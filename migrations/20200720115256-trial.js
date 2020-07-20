const config = require('../config/config');
const cassandra = require('cassandra-driver');

module.exports = {
  async up(db) {
    global.migrationMsg = "Create keyspace";
    
    const client = new cassandra.Client({
      contactPoints: [config.cassandra.host],
      localDataCenter: 'datacenter1',
      keyspace : config.cassandra.keyspace
    });

    // let query = "CREATE KEYSPACE IF NOT EXISTS reportsData  WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1' }";
     
    // let query = "CREATE TABLE IF NOT EXISTS reportsData  WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1' }";
   
      let query;
      query = "CREATE TABLE reportsData (id uuid PRIMARY KEY, qid text, query text)";
       client.execute(query, function(e, res) {
        console.log("entered");
      });
   
    return global.migrationMsg;
  },

      async down(db) {
        // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
      }
    };