const Uuid = require('cassandra-driver').types.Uuid;
const config = require('../config/config');

module.exports = {
  async up(db) {
    global.migrationMsg = "Insert survey submission report query";
    
    
    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    const query = 'SELECT id FROM ' + process.env.CASSANDRA_KEYSPACE + '.' + process.env.CASSANDRA_TABLE + ' WHERE qid = ? ALLOW FILTERING';
    const result = await cassandra.execute(query, ['survey_submission_report_query'], { prepare: true });
    const row = result.rows;

    if (!row.length) {

    let id = Uuid.random();

    let query = 'INSERT INTO ' + process.env.CASSANDRA_KEYSPACE + '.' + process.env.CASSANDRA_TABLE +' (id, qid, query) VALUES (?, ?, ?)';
   
    let queries = 
      [{
        query: query,
        params: [id.toString(), 'survey_submission_report_query','{"queryType":"groupBy","dataSource":"sl_survey","granularity":"all","dimensions":["surveySubmissionId","solutionId","solutionName","questionName","questionAnswer","remarks","surveyId","questionResponseType","questionResponseLabel","questionId","questionExternalId","instanceId","instanceParentQuestion","instanceParentResponsetype","instanceParentId","questionSequenceByEcm","instanceParentExternalId","instanceParentEcmSequence","completedDate"],"filter":{"type":"and","fields":[{"type":"selector","dimension":"surveySubmissionId","value":""}]},"aggregations":[],"postAggregations":[],"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}']
      }];

      await cassandra.batch(queries, { prepare: true });

      }
      
      return global.migrationMsg;
      },

      async down(db) {
        // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
      }
    };