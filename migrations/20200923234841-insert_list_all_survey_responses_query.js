const Uuid = require('cassandra-driver').types.Uuid;

module.exports = {
  async up(db) {
    global.migrationMsg = "Insert list all survey responses query";


    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    const query = 'SELECT id FROM ' + process.env.CASSANDRA_KEYSPACE + '.' + process.env.CASSANDRA_TABLE + ' WHERE qid = ? ALLOW FILTERING';
    const result = await cassandra.execute(query, ['list_all_responses'], { prepare: true });
    const row = result.rows;

    if (!row.length) {

      let id = Uuid.random();

      let query = 'INSERT INTO ' + process.env.CASSANDRA_KEYSPACE + '.' + process.env.CASSANDRA_TABLE + ' (id, qid, query) VALUES (?, ?, ?)';

      let queries =
        [{
          query: query,
          params: [id.toString(), 'list_all_responses', '{"queryType":"scan","dataSource":"dev_sl_surveys","resultFormat":"list","filter":{"type":"and","fields":[{"type":"selector","dimension":"solutionId","value":""},{"type":"selector","dimension":"questionExternalId","value":""}]},"columns":["questionName","questionAnswer","surveySubmissionId","completedDate"],"intervals":["1901-01-01/2101-01-01"]}']
        }];

      await cassandra.batch(queries, { prepare: true });

    }

    return global.migrationMsg;
  },

  async down(db) {
    // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};