const Uuid = require('cassandra-driver').types.Uuid;
const config = require('../config/config');

module.exports = {
  async up(db) {
    global.migrationMsg = "Insert get survey evidence query";


    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    const query = 'SELECT id FROM ' + config.cassandra.keyspace + '.' + config.cassandra.table + ' WHERE qid = ? ALLOW FILTERING';
    const result = await cassandra.execute(query, ['get_survey_evidence_query'], { prepare: true });
    const row = result.rows;

    if (!row.length) {

      let id = Uuid.random();

      let query = 'INSERT INTO ' + config.cassandra.keyspace + '.' + config.cassandra.table + ' (id, qid, query) VALUES (?, ?, ?)';

      let queries =
        [{
          query: query,
          params: [id.toString(), 'get_survey_evidence_query', '{"queryType":"groupBy","dataSource":"sl_survey_evidence_dev","granularity":"all","dimensions":["fileSourcePath","questionExternalId","surveySubmissionId","surveyId","evidence_count","total_evidences","fileName","solutionId"],"filter":{ "type": "selector", "dimension": "", "value": ""},"aggregations":[],"postAggregations":[],"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}']
        }];

      await cassandra.batch(queries, { prepare: true });

    }

    return global.migrationMsg;
  },

  async down(db) {
    // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};