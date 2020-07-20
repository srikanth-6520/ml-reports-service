const Uuid = require('cassandra-driver').types.Uuid;
const config = require('../config/config');

module.exports = {
  async up(db) {
    global.migrationMsg = "Insert entity observation query";
    
    
    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    let id = Uuid.random();

    let query = 'INSERT INTO ' + config.cassandra.keyspace + '.' + config.cassandra.table +' (id, qid, query) VALUES (?, ?, ?)';
   
    let queries = 
      [{
        query: query,
        params: [id.toString(), 'entity_observation_query', '{"queryType":"groupBy","dataSource":"sl_observation_dev","granularity":"all","dimensions":["completedDate","questionName","questionAnswer","school","schoolName","entityType","observationName","observationId","questionResponseType","questionResponseLabel","observationSubmissionId","questionId","questionExternalId","instanceId","instanceParentQuestion","instanceParentResponsetype","instanceParentId","instanceParentEcmSequence","instanceParentExternalId"],"filter":{"type":"and","fields":[{"type":"selector","dimension":"school","value":""},{"type":"selector","dimension":"observationId","value":""}]},"aggregations":[],"postAggregations":[],"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}']
      }];

      await cassandra.batch(queries, { prepare: true });
      
      return global.migrationMsg;
      },

      async down(db) {
        // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
      }
    };