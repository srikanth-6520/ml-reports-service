const db = require('../db');
const cassandra = require('express-cassandra');

let insertQueryToCassandra = async function () {
        let obj = {
            id: cassandra.uuid(),
            qid: 'list_my_solutions_query',
            query:'{"queryType":"groupBy","dataSource":"sl_observation","granularity":"all","dimensions":["solutionId","solutionName","totalScore"],"filter":{"type":"and","fields":[{"type":"selector","dimension":"","value":""},{"type":"selector","dimension":"createdBy","value":""}]},"aggregations":[],"postAggregations":[],"intervals":["1901-01-01T00:00:00+00:00/2101-01-01T00:00:00+00:00"]}'
        }

        let insertData = new db.MyModel(obj);
        insertData.saveAsync()
            .then(function (result) {
                console.log('query inserted into cassandra successfully')
            })
            .catch(function (err) {
                console.log('Error in inserting query into cassandra');
            })
}

insertQueryToCassandra();

