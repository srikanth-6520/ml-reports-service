const Uuid = require('cassandra-driver').types.Uuid;
const config = require('../config/config');

module.exports = {
  async up(db) {
    global.migrationMsg = "Update list assessment programs query";
    
    
    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    const query = 'SELECT id FROM ' + config.cassandra.keyspace + '.' + config.cassandra.table + ' WHERE qid = ? ALLOW FILTERING';
    const result = await cassandra.execute(query, [ 'list_assessment_programs_query' ], { prepare: true });
    const row = result.rows;
   
   
    let queries = 
      [{
        query: 'UPDATE ' + config.cassandra.keyspace + '.' + config.cassandra.table + ' SET query=? WHERE id=?',
        params: ['{"queryType":"groupBy","dataSource":"sl_assessment","granularity":"all","dimensions":["programName","programId","programDescription","programExternalId","solutionName","solutionId","solutionDescription","solutionExternalId"],"filter":{"type":"and","fields":[{"type":"selector","dimension":"","value":""},{"type":"or","fields":[{"type":"and","fields":[{"type":"selector","dimension":"userId","value":""},{"type":"selector","dimension":"isAPrivateProgram","value":true}]},{"type":"selector","dimension":"isAPrivateProgram","value":false}]}]},"aggregations":[],"postAggregations":[],"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}',row[0].id]
      }];

      await cassandra.batch(queries, { prepare: true });

      return global.migrationMsg;
    },

    async down(db) {
      // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
    }
};
