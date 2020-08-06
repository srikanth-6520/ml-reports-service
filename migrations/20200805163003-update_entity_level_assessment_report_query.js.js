const Uuid = require('cassandra-driver').types.Uuid;
const config = require('../config/config');

module.exports = {
  async up(db) {
    global.migrationMsg = "Update entity level assessment report query";
    
    
    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    const query = 'SELECT id FROM ' + config.cassandra.keyspace + '.' + config.cassandra.table + ' WHERE qid = ? ALLOW FILTERING';
    const result = await cassandra.execute(query, [ 'entity_level_assessment_report_query' ], { prepare: true });
    const row = result.rows;
   
    if (row.length > 0) {
    let queries = 
      [{
        query: 'UPDATE ' + config.cassandra.keyspace + '.' + config.cassandra.table + ' SET query=? WHERE id=?',
        params: ['{"queryType":"groupBy","dataSource":"sl_assessments","granularity":"all","dimensions":["submissionId","completedDate","domainName","criteriaDescription","level","label","programName","solutionName","childExternalid","childName","childType"],"filter":{"type":"and","fields":[{"type":"selector","dimension":"","value":""},{"type":"selector","dimension":"programId","value":""},{"type":"selector","dimension":"solutionId","value":""},{"type":"selector","dimension":"childType","value":"criteria"}]},"aggregations":[{"fieldName":"domainName","fieldNames":["domainName"],"type":"count","name":"domainNameCount"}],"postAggregations":[],"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}',row[0].id]
      }];

      await cassandra.batch(queries, { prepare: true });

    }

      return global.migrationMsg;
    },

    async down(db) {
      // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
    }
};
