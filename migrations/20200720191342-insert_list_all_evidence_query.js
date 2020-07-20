const Uuid = require('cassandra-driver').types.Uuid;
const config = require('../config/config');

module.exports = {
  async up(db) {
    global.migrationMsg = "Insert list all evidence query";
    
    
    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    let id = Uuid.random();

    let query = 'INSERT INTO ' + config.cassandra.keyspace + '.' + config.cassandra.table +' (id, qid, query) VALUES (?, ?, ?)';
   
    let queries = 
      [{
        query: query,
        params: [id.toString(), 'list_all_evidence_query', '{"queryType":"groupBy","dataSource":"sl_observation","granularity":"all","dimensions":["questionName","questionId","questionExternalId","remarks","fileName","fileSourcePath"],"filter":{},"aggregations":[],"postAggregations":[],"limitSpec":{"type":"default","limit":10000,"columns":[{"dimension":"questionExternalId","direction":"ascending"}]},"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}']
      }];

      await cassandra.batch(queries, { prepare: true });
      
      return global.migrationMsg;
      },

      async down(db) {
        // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
      }
    };