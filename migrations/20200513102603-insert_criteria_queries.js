const Uuid = require('cassandra-driver').types.Uuid;

module.exports = {
  async up(db) {
    global.migrationMsg = "Insert criteria queries";
    
    
    if (!cassandra) {
      throw new Error("Cassandra connection not available.");
    }

    // let id = Uuid.random();

    let query = 'INSERT INTO reports.druidqueries (id, qid, query) VALUES (?, ?, ?)';
   
    let queries = 
      [{
        query: query,
        params: [Uuid.random().toString(), 'instance_criteria_report_query', '{"queryType":"groupBy","dataSource":"sl_observation","granularity":"all","dimensions":["questionName","questionAnswer","school","districtName","schoolName","remarks","entityType","observationName","observationId","questionResponseType","questionResponseLabel","questionId","questionExternalId","instanceId","instanceParentQuestion","instanceParentResponsetype","instanceParentId","questionSequenceByEcm","instanceParentExternalId","instanceParentEcmSequence","criteriaName","criteriaId","instanceParentCriteriaName","instanceParentCriteriaId"],"filter":{"type":"selector","dimension":"observationSubmissionId","value":""},"aggregations":[],"postAggregations":[],"limitSpec":{"type":"default","limit":10000,"columns":[{"dimension":"questionExternalId","direction":"ascending"}]},"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}']
      },{
        query: query,
        params: [Uuid.random().toString(), 'instance_score_criteria_report_query', '{"queryType":"groupBy","dataSource":"sl_observation_qa","dimensions":["questionName","schoolName","districtName","questionAnswer","questionExternalId","questionResponseType","minScore","maxScore","totalScore","scoreAchieved","observationName","criteriaName","criteriaId"],"aggregations":[{"type":"count","name":"count"}],"granularity":"all","postAggregations":[],"intervals":"1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00","filter":{"type":"and","fields":[{"type":"selector","dimension":"observationSubmissionId","value":""},{"type":"or","fields":[{"type":"selector","dimension":"questionResponseType","value":"radio"},{"type":"selector","dimension":"questionResponseType","value":"multiselect"},{"type":"selector","dimension":"questionResponseType","value":"slider"}]}]},"limitSpec":{"type":"default","limit":10000,"columns":[{"dimension":"count","direction":"descending"}]}}']
      },{
        query: query,
        params: [Uuid.random().toString(), 'entity_criteria_report_query', '{"queryType":"groupBy","dataSource":"sl_observation_dev","granularity":"all","dimensions":["completedDate","questionName","questionAnswer","school","schoolName","entityType","observationName","observationId","questionResponseType","questionResponseLabel","observationSubmissionId","questionId","questionExternalId","instanceId","instanceParentQuestion","instanceParentResponsetype","instanceParentId","instanceParentEcmSequence","instanceParentExternalId","criteriaName","criteriaId","instanceParentCriteriaName","instanceParentCriteriaId"],"filter":{"type":"and","fields":[{"type":"selector","dimension":"school","value":""},{"type":"selector","dimension":"observationId","value":""}]},"aggregations":[],"postAggregations":[],"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}']
      },{
        query: query,
        params: [Uuid.random().toString(), 'entity_score_criteria_report_query', '{"queryType":"groupBy","dataSource":"sl_observation_qa","dimensions":["questionName","questionExternalId","questionResponseType","minScore","maxScore","observationSubmissionId","school","schoolName","districtName","questionId","completedDate","observationName","criteriaName","criteriaId"],"aggregations":[{"type":"count","name":"count"}],"granularity":"all","postAggregations":[],"intervals":"1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00","filter":{"type":"and","fields":[{"type":"or","fields":[{"type":"selector","dimension":"questionResponseType","value":"radio"},{"type":"selector","dimension":"questionResponseType","value":"multiselect"},{"type":"selector","dimension":"questionResponseType","value":"slider"}]},{"type":"and","fields":[{"type":"selector","dimension":"school","value":"" },{"type":"selector","dimension":"observationId","value":""}]}]},"limitSpec":{"type":"default","limit":10000,"columns":[{"dimension":"count","direction":"descending"}]}}']
      },{
        query: query,
        params: [Uuid.random().toString(), 'observation_criteria_report_query', '{"queryType":"groupBy","dataSource":"sl_observation_dev","granularity":"all","dimensions":["questionName","questionAnswer","entityType","observationName","observationId","questionResponseType","questionResponseLabel","observationSubmissionId","questionId","questionExternalId","instanceId","instanceParentQuestion","instanceParentResponsetype","instanceParentId","instanceParentEcmSequence","instanceParentExternalId","criteriaName","criteriaId","instanceParentCriteriaName","instanceParentCriteriaId"],"filter":{"type":"selector","dimension":"observationId","value":""},"aggregations":[],"postAggregations":[],"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}']
      },{
        query: query,
        params: [Uuid.random().toString(), 'observation_score_criteria_report_query', '{"queryType":"groupBy","dataSource":"sl_observation_qa","dimensions":["school","schoolName","observationSubmissionId","completedDate","scoreAchieved","observationName","minScore","maxScore","questionName","questionExternalId","questionResponseType","criteriaName","criteriaId"],"aggregations":[{"type":"count","name":"count"}],"granularity":"all","postAggregations":[],"intervals":"1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00","filter":{"type":"and","fields":[{"type":"selector","dimension":"observationId","value":""},{"type":"or","fields":[{"type":"selector","dimension":"questionResponseType","value":"multiselect"},{"type":"selector","dimension":"questionResponseType","value":"radio"},{"type":"selector","dimension":"questionResponseType","value":"slider"}]}]},"limitSpec":{"type":"default","limit":10000,"columns":[{"dimension":"count","direction":"descending"}]}}']
      }];

      await cassandra.batch(queries, { prepare: true });

        return global.migrationMsg;
      },

      async down(db) {
        // return await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
      }
    };
