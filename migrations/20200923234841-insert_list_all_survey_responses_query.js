const Uuid = require('cassandra-driver').types.Uuid;
const config = require('../config/config');

module.exports = {
  async up(db) {
    global.migrationMsg = "Insert list all survey responses query";
    
    
    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    const query = 'SELECT id FROM ' + config.cassandra.keyspace + '.' + config.cassandra.table + ' WHERE qid = ? ALLOW FILTERING';
    const result = await cassandra.execute(query, ['list_all_responses'], { prepare: true });
    const row = result.rows;

    if (!row.length) {

    let id = Uuid.random();

    let query = 'INSERT INTO ' + config.cassandra.keyspace + '.' + config.cassandra.table +' (id, qid, query) VALUES (?, ?, ?)';
   
    let queries = 
      [{
        query: query,
        params: [id.toString(), 'list_all_responses','{"queryType":"groupBy","dataSource":"sl_survey","dimensions":["questionName","questionAnswer","surveySubmissionId"],"aggregations":[],"granularity":"all","postAggregations":[],"intervals":"1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00","filter":{"type":"and","fields":[{"type":"selector","dimension":"solutionId","value":""},{"type":"selector","dimension":"questionExternalId","value":""}]}}']
      }];

      await cassandra.batch(queries, { prepare: true });

      }
      
      return global.migrationMsg;
      },

      async down(db) {
        // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
      }
    };