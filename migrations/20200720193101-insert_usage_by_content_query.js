const Uuid = require('cassandra-driver').types.Uuid;
const config = require('../config/config');

module.exports = {
  async up(db) {
    global.migrationMsg = "Insert usage by content query";
    
    
    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    let id = Uuid.random();

    let query = 'INSERT INTO ' + config.cassandra.keyspace + '.' + config.cassandra.table +' (id, qid, query) VALUES (?, ?, ?)';
   
    let queries = 
      [{
        query: query,
        params: [id.toString(), 'usage_by_content_query','{"queryType":"topN","dataSource":"sl_telemetry","aggregations":[{"fieldName":"UserId","fieldNames":["UserId"],"type":"count","name":"Total Users Viewed"}],"granularity":"all","postAggregations":[],"intervals":"1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00","filter":{"type":"not","field":{"type":"selector","dimension":"content_name","value":null}},"threshold":5,"metric":"Total Users Viewed","dimension":"content_name"}']
      }];

      await cassandra.batch(queries, { prepare: true });
      
      return global.migrationMsg;
      },

      async down(db) {
        // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
      }
    };