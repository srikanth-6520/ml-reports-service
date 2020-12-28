const Uuid = require('cassandra-driver').types.Uuid;

module.exports = {
  async up(db) {
    global.migrationMsg = "Insert get evidence query";


    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    const query = 'SELECT id FROM ' + process.env.CASSANDRA_KEYSPACE + '.' + process.env.CASSANDRA_TABLE + ' WHERE qid = ? ALLOW FILTERING';
    const result = await cassandra.execute(query, ['get_evidence_query'], { prepare: true });
    const row = result.rows;

    if (!row.length) {

      let id = Uuid.random();

      let query = 'INSERT INTO ' + process.env.CASSANDRA_KEYSPACE + '.' + process.env.CASSANDRA_TABLE + ' (id, qid, query) VALUES (?, ?, ?)';

      let queries =
        [{
          query: query,
          params: [id.toString(), 'get_evidence_query', '{"queryType":"groupBy","dataSource":"sl_observation_evidence_dev","granularity":"all","dimensions":["fileSourcePath","questionExternalId","observationSubmissionId","school","observationId","evidence_count","total_evidences","fileName"],"filter":{},"aggregations":[],"postAggregations":[],"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}']
        }];

      await cassandra.batch(queries, { prepare: true });

    }

    return global.migrationMsg;
  },

  async down(db) {
    // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};