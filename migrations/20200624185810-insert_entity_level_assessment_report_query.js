const Uuid = require('cassandra-driver').types.Uuid;
const config = require('../config/config');

module.exports = {
  async up(db) {
    global.migrationMsg = "Insert entity level assessment report query";
    
    
    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    // let id = Uuid.random();

    let query = 'INSERT INTO ' + config.cassandra.keyspace + '.' + config.cassandra.table +' (id, qid, query) VALUES (?, ?, ?)';
   
    let queries = 
      [{
        query: query,
        params: [Uuid.random().toString(), 'entity_level_assessment_report_query', '{"queryType":"groupBy","dataSource":"sl_assessments","granularity":"all","dimensions":["submissionId","completedDate","domainName","criteriaDescription","level","programName","solutionName"],"filter":{"type":"and","fields":[{"type":"selector","dimension":"","value":""},{"type":"selector","dimension":"programId","value":""},{"type":"selector","dimension":"solutionId","value":""}]},"aggregations":[{"fieldName":"domainName","fieldNames":["domainName"],"type":"count","name":"domainNameCount"}],"postAggregations":[],"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}']
      }];

      await cassandra.batch(queries, { prepare: true });

        return global.migrationMsg;
    },

    async down(db) {
      // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
    }
};
