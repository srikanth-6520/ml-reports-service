let config = require('../../../../config/config');
const cassandra = require('cassandra-driver');

module.exports = {
    async connect() {

    const client = new cassandra.Client({
      contactPoints: [config.cassandra.host],
      localDataCenter: 'datacenter1',
      keyspace: config.cassandra.keyspace
    });

    return client;

}
}