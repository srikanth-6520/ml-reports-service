var ExpressCassandra = require('express-cassandra');
var config = require('./config/config')

var models = ExpressCassandra.createClient({
    clientOptions: {
        contactPoints: [config.cassandra.host],
        protocolOptions: { port: config.cassandra.port },
        keyspace: config.cassandra.keyspace,
        queryOptions: {consistency: ExpressCassandra.consistencies.one}
    },
    ormOptions: {
        defaultReplicationStrategy : {
            class: 'SimpleStrategy',
            replication_factor: 1
        },
        migration: 'safe',
    }
});

var MyModel = models.loadSchema(config.cassandra.table, {
    fields:{
        id : "uuid",
        qid : "text",
        query : "text"
    },
    key:["id"]
});

var reportIndexes = models.loadSchema(config.cassandra.apiReqAndResTable, {
    fields:{
        id : {
            type: "uuid",
            default: {"$db_function": "uuid()"}
        },
        apirequest : 'text',
        apiresponse : 'text',
        downloadpdfpath : 'text'
    },
    key:['id']
});

var assessmentModel = models.loadSchema(config.cassandra.assessmentTable, {
    fields:{
        id : {
            type: "uuid",
            default: {"$db_function": "uuid()"}
        },
        apirequest : 'text',
        apiresponse : 'text',
        downloadpdfpath : 'text'
    },
    key:['id']
});

// var migrationModel = models.loadSchema(config.cassandra.migrationTable, {
//     fields:{
//         id : {
//             type: "uuid",
//             default: {"$db_function": "uuid()"}
//         },
//         filename : 'text',
//         appliedat : 'timestamp',
//         message : 'text'
//     },
//     key:['id']
// });

// MyModel or models.instance.Person can now be used as the model instance


// sync the schema definition with the cassandra database table
// if the schema has not changed, the callback will fire immediately
// otherwise express-cassandra will try to migrate the schema and fire the callback afterwards
MyModel.syncDB(function(err, result) {
    if (err) throw err;
    // result == true if any database schema was updated
    // result == false if no schema change was detected in your models
    
});

reportIndexes.syncDB(function(err, result) {
    if (err) throw err;
});

assessmentModel.syncDB(function(err, result) {
    if (err) throw err;
});

// migrationModel.syncDB(function(err, result) {
//     if (err) throw err;
// });


module.exports = {
    MyModel : MyModel,
    reportIndexes : reportIndexes,
    assessmentModel : assessmentModel
    // migrationModel : migrationModel
}