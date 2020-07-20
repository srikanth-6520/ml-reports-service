const Uuid = require('cassandra-driver').types.Uuid;
const config = require('../config/config');

module.exports = {
  async up(db) {
    global.migrationMsg = "Insert content downloaded by user query";
    
    
    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    let id = Uuid.random();

    let query = 'INSERT INTO ' + config.cassandra.keyspace + '.' + config.cassandra.table +' (id, qid, query) VALUES (?, ?, ?)';
   
    let queries = 
      [{
        query: query,
        params: [id.toString(), 'content_downloaded_by_user_query','{"queryType":"topN","dataSource":"sl_telemetry","aggregations":[{"fieldName":"content_identifier","fieldNames":["content_identifier"],"type":"count","name":"COUNT(content_identifier)"}],"granularity":"all","postAggregations":[],"intervals":"1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00","filter":{"type":"and","fields":[{"type":"selector","dimension":"User_id","value":"2b73b6d0-3b1f-4235-917f-5ee03df9450f"},{"type":"and","fields":[{"type":"selector","dimension":"Event_subtype","value":"ContentDownload-Success"},{"type":"not","field":{"type":"selector","dimension":"content_identifier","value":null}}]}]},"threshold":5,"metric":"COUNT(content_identifier)","dimension":"content_name"}']
      }];

      await cassandra.batch(queries, { prepare: true });
      
      return global.migrationMsg;
      },

      async down(db) {
        // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
      }
    };