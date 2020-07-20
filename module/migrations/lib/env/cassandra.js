const config = require('../../../../config/config');
const cassandra = require('cassandra-driver');

module.exports = {
    async connect() {

    const client = new cassandra.Client({
      contactPoints: [config.cassandra.host],
      localDataCenter: 'datacenter1'
    });

    // let createKeyspace = "CREATE KEYSPACE IF NOT EXISTS " + config.cassandra.keyspace + " WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1' }";

    // client.execute(createKeyspace);

    // let createTable = "CREATE TABLE IF NOT EXISTS " + config.cassandra.keyspace + "." + config.cassandra.table + " (id uuid PRIMARY KEY, qid text, query text)";
    
    // client.execute(createTable);

    // return client;

}
}