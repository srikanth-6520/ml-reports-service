const Uuid = require('cassandra-driver').types.Uuid;
const config = require('../config/config');

module.exports = {
  async up(db) {
    global.migrationMsg = "Update instance observation query";
    
    
    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    const query = 'SELECT id FROM ' + process.env.CASSANDRA_KEYSPACE + '.' + process.env.CASSANDRA_TABLE + ' WHERE qid = ? ALLOW FILTERING';
    const result = await cassandra.execute(query, [ 'instance_observation_query' ], { prepare: true });
    const row = result.rows;
   
    if(row.lenth > 0) {

    let queries = 
      [{
        query: 'UPDATE ' + process.env.CASSANDRA_KEYSPACE + '.' + process.env.CASSANDRA_TABLE + ' SET query=? WHERE id=?',
        params: ['{"queryType":"groupBy","dataSource":"sl_observation","granularity":"all","dimensions":["questionName","questionAnswer","school","districtName","schoolName","remarks","entityType","observationName","observationId","questionResponseType","questionResponseLabel","questionId","questionExternalId","instanceId","instanceParentQuestion","instanceParentResponsetype","instanceParentId","questionSequenceByEcm","instanceParentExternalId","instanceParentEcmSequence"],"filter":{"type":"and","fields":[{"type":"selector","dimension":"observationSubmissionId","value":""}]},"aggregations":[],"postAggregations":[],"limitSpec":{"type":"default","limit":10000,"columns":[{"dimension":"questionExternalId","direction":"ascending"}]},"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}',row[0].id]
      }];

      await cassandra.batch(queries, { prepare: true });

     }
     else {
      let id = Uuid.random();
      let query = 'INSERT INTO ' + process.env.CASSANDRA_KEYSPACE + '.' + process.env.CASSANDRA_TABLE +' (id, qid, query) VALUES (?, ?, ?)';
      
      let queries = 
      [{
        query: query,
        params: [id.toString(), 'instance_observation_query','{"queryType":"groupBy","dataSource":"sl_observation","granularity":"all","dimensions":["questionName","questionAnswer","school","districtName","schoolName","remarks","entityType","observationName","observationId","questionResponseType","questionResponseLabel","questionId","questionExternalId","instanceId","instanceParentQuestion","instanceParentResponsetype","instanceParentId","questionSequenceByEcm","instanceParentExternalId","instanceParentEcmSequence"],"filter":{"type":"and","fields":[{"type":"selector","dimension":"observationSubmissionId","value":""}]},"aggregations":[],"postAggregations":[],"limitSpec":{"type":"default","limit":10000,"columns":[{"dimension":"questionExternalId","direction":"ascending"}]},"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}']
      }];

      await cassandra.batch(queries, { prepare: true });
     }

      return global.migrationMsg;
    },

    async down(db) {
      // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
    }
};
