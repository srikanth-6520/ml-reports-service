const db = require('../db');
const cassandra = require('express-cassandra');
var path = require('path');
var scriptName = path.basename(__filename);

let insertQueryToCassandra = async function () {

    const query = 'INSERT INTO reports.druidqueries (id, qid, query) VALUES (?, ?, ?)'

    var queries = [
        {
            query: query,
            params: [cassandra.uuid(), 'entity_observation_report_query', '{"queryType":"groupBy","dataSource":"sl_observations_dev","granularity":"all","dimensions":["questionName","questionAnswer","observationName","observationId","questionResponseType","questionResponseLabel","observationSubmissionId","questionId","questionExternalId","instanceId","instanceParentQuestion","instanceParentResponsetype","instanceParentId"],"filter":{"type":"and","fields":[{"type":"selector","dimension":"","value":""},{"type":"selector","dimension":"observationId","value":""}]},"aggregations":[],"postAggregations":[],"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}']
        },
        {
            query: query,
            params: [cassandra.uuid(), 'entity_observation_report_query', '{"queryType":"groupBy","dataSource":"sl_observations_dev","granularity":"all","dimensions":["questionName","questionAnswer","observationName","observationId","questionResponseType","questionResponseLabel","observationSubmissionId","questionId","questionExternalId","instanceId","instanceParentQuestion","instanceParentResponsetype","instanceParentId"],"filter":{"type":"and","fields":[{"type":"selector","dimension":"","value":""},{"type":"selector","dimension":"observationId","value":""}]},"aggregations":[],"postAggregations":[],"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}']
        }
    ]


    db.MyModel.execute_batch(queries, function (err) {
        if (err) {
            let obj = {
                filename: scriptName,
                appliedat: new Date(),
                message: "failed to insert queries",
            }

            logMigrationStatus(obj);
        }
        else {
            let obj = {
                filename: scriptName,
                appliedat: new Date(),
                message: "Successfully inserted the queries",
            }

            logMigrationStatus(obj);
        }
    })
}

//Function for logging the status of migration
let logMigrationStatus = async function (reqBody) {
    return new Promise(function (resolve, reject) {

        var insertData = new db.migrationModel(reqBody);
        insertData.saveAsync()
            .then(function (result) {
                console.log('migration status logged successfully');
            })
            .catch(function (err) {
                console.log('error in logging migration status');
            })
    })
}


insertQueryToCassandra();

