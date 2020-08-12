const Uuid = require('cassandra-driver').types.Uuid;
//const config = require('../config/config');

module.exports = {
  async up(db) {
    global.migrationMsg = "Insert test query 7";
    
    
    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }
    
    const query = 'SELECT id FROM ' + process.env.keyspace + '.' + process.env.table + ' WHERE qid = ? ALLOW FILTERING';
    const result = await cassandra.execute(query, ['test_query_7'], { prepare: true });
    const row = result.rows;

    if (!row.length) {

    let id = Uuid.random();

    let query = 'INSERT INTO ' + process.env..keyspace + '.' + process.env.table +' (id, qid, query) VALUES (?, ?, ?)';
   
    let queries = 
      [{
        query: query,
        params: [id.toString(), 'test_query_7','{"queryType":"groupBy","dataSource":"sl_observations_dev","granularity":"all","dimensions":["solutionId","solutionName","questionName","questionAnswer","observationName","observationId","questionResponseType","questionResponseLabel","observationSubmissionId","questionId","questionExternalId","instanceId","instanceParentQuestion","instanceParentResponsetype","instanceParentId"],"filter":{"type":"and","fields":[{"type":"selector","dimension":"","value":""},{"type":"selector","dimension":"solutionId","value":""}]},"aggregations":[],"postAggregations":[],"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}']
      }];

      await cassandra.batch(queries, { prepare: true });

      }
      
      return global.migrationMsg;
      },

      async down(db) {
        // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
      }
    };
