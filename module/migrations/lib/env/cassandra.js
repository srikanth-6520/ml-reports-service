const config = require('../../../../config/config');
const cassandra = require('cassandra-driver');

module.exports = {
    async connect() {

    const client = new cassandra.Client({
      contactPoints: [process.env.CASSANDR_HOST],
      localDataCenter: 'datacenter1',
      keyspace: process.env.CASSANDRA_KEYSPACE
    });

    return client;

}
}