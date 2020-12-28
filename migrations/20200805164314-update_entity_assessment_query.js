const Uuid = require('cassandra-driver').types.Uuid;

module.exports = {
  async up(db) {
    global.migrationMsg = "Update entity assessment query";


    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    const query = 'SELECT id FROM ' + process.env.CASSANDRA_KEYSPACE + '.' + process.env.CASSANDRA_TABLE + ' WHERE qid = ? ALLOW FILTERING';
    const result = await cassandra.execute(query, ['entity_assessment_query'], { prepare: true });
    const row = result.rows;

    if (row.length > 0) {
      let queries =
        [{
          query: 'UPDATE ' + process.env.CASSANDRA_KEYSPACE + '.' + process.env.CASSANDRA_TABLE + ' SET query=? WHERE id=?',
          params: ['{"queryType":"groupBy","dataSource":"sl_assessment_data","granularity":"all","dimensions":["domainName","level","programName","criteriaDescription","childExternalid","childName","childType"],"filter":{"type":"and","fields":[{"type":"selector","dimension":"","value":""},{"type":"selector","dimension":"programId","value":""},{"type":"selector","dimension":"solutionId","value":""},{"type":"selector","dimension":"childType","value":"criteria"}]},"aggregations":[{"fieldName":"","fieldNames":[],"type":"count","name":""}],"postAggregations":[],"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}', row[0].id]
        }];

      await cassandra.batch(queries, { prepare: true });

    }
    else {

      let id = Uuid.random();
      let query = 'INSERT INTO ' + process.env.CASSANDRA_KEYSPACE + '.' + process.env.CASSANDRA_TABLE + ' (id, qid, query) VALUES (?, ?, ?)';

      let queries =
        [{
          query: query,
          params: [id.toString(), 'entity_assessment_query', '{"queryType":"groupBy","dataSource":"sl_assessment_data","granularity":"all","dimensions":["domainName","level","programName","criteriaDescription","childExternalid","childName","childType"],"filter":{"type":"and","fields":[{"type":"selector","dimension":"","value":""},{"type":"selector","dimension":"programId","value":""},{"type":"selector","dimension":"solutionId","value":""},{"type":"selector","dimension":"childType","value":"criteria"}]},"aggregations":[{"fieldName":"","fieldNames":[],"type":"count","name":""}],"postAggregations":[],"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}']
        }];

      await cassandra.batch(queries, { prepare: true });
    }

    return global.migrationMsg;
  },

  async down(db) {
    // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
