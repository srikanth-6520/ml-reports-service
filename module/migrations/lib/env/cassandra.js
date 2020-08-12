//const config = require(__dirname +'/../../../../config/config');
const cassandra = require('cassandra-driver');

module.exports = {
    async connect() {

    const client = new cassandra.Client({
      contactPoints: [process.env.host],
      localDataCenter: 'datacenter1',
      keyspace: process.env..keyspace
    });
    console.log(config);
    return client;

}
}
