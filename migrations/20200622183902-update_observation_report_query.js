const Uuid = require('cassandra-driver').types.Uuid;
const config = require('../config/config');

module.exports = {
  async up(db) {
    global.migrationMsg = "Update observation report query";
    
    
    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    const query = 'SELECT id FROM ' + config.cassandra.keyspace + '.' + config.cassandra.table + ' WHERE qid = ? ALLOW FILTERING';
    const result = await cassandra.execute(query, [ 'observation_report_query' ], { prepare: true });
    const row = result.rows;
   
    if (row.length > 0) {
      
    let queries = 
      [{
        query: 'UPDATE ' + config.cassandra.keyspace + '.' + config.cassandra.table + ' SET query=? WHERE id=?',
        params: ['{"queryType":"groupBy","dataSource":"sl_observation","granularity":"all","dimensions":["questionName","questionAnswer","entityType","observationName","observationId","questionResponseType","questionResponseLabel","observationSubmissionId","questionId","questionExternalId","instanceId","instanceParentQuestion","instanceParentResponsetype","instanceParentId","instanceParentEcmSequence","instanceParentExternalId"],"filter":{"type":"and","fields":[{"type":"selector","dimension":"observationId","value":""}]},"aggregations":[],"postAggregations":[],"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}',row[0].id]
      }];

      await cassandra.batch(queries, { prepare: true });

      }
      else {
        let id = Uuid.random();
        let query = 'INSERT INTO ' + config.cassandra.keyspace + '.' + config.cassandra.table +' (id, qid, query) VALUES (?, ?, ?)';
        
        let queries = 
        [{
          query: query,
          params: [id.toString(), 'observation_report_query','{"queryType":"groupBy","dataSource":"sl_observation","granularity":"all","dimensions":["questionName","questionAnswer","entityType","observationName","observationId","questionResponseType","questionResponseLabel","observationSubmissionId","questionId","questionExternalId","instanceId","instanceParentQuestion","instanceParentResponsetype","instanceParentId","instanceParentEcmSequence","instanceParentExternalId"],"filter":{"type":"and","fields":[{"type":"selector","dimension":"observationId","value":""}]},"aggregations":[],"postAggregations":[],"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}']
        }];
  
        await cassandra.batch(queries, { prepare: true });
      }

      return global.migrationMsg;
    },

    async down(db) {
      // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
    }
};
