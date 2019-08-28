var db = require('../db');

let checkReqInCassandra = async function (reqBody, callback) {
    reqBody1 = JSON.stringify(reqBody)
    // db.reportIndexes.findOneAsync({apirequest:reqBody1},{select:['apiresponse']},{ allow_filtering: true },function(err,data){
    //     if(err){
    //         console.log('test')
    //         console.log(err)
    //         return callback(err,null)
    //     } else {
    //         console.log(data)
    //         return callback(null,data)
    //     }
    // })
    return new Promise(function (resolve, reject) {
        db.reportIndexes.findOneAsync({ apirequest: reqBody1 }, { allow_filtering: true }, function (errGetData, getData) {
            if (errGetData) {
                console.log('Error in Getting API Response and Request from cassandra')
                reject(errGetData)
            } else {
                console.log('Get API Response and Request from cassandra successfully')
                resolve(getData)
            }
        })
    })
}

let insertReqAndResInCassandra = async function (reqBody, resBody) {
    var insertData = new db.reportIndexes({
        apirequest: JSON.stringify(reqBody),
        apiresponse: JSON.stringify(resBody)
    });
    insertData.saveAsync()
        .then(function (insertRec) {
            // console.log(insertRec)
            console.log('API Request and Response inserted into cassandra successfully')
        })
        .catch(function (errInsertData) {
            console.log('Error in inserting API Request and Response into cassandra')
            console.log(errInsertData)
            return errInsertData;
        })
    // return new Promise(function (resolve, reject) {
    //     var insertData = new db.reportIndexes({
    //         apirequest: JSON.stringify(reqBody),
    //         apiresponse: JSON.stringify(resBody)
    //     });
    //     insertData.saveAsync(function(errInsertData,insertRec){
    //             if(errInsertData){
    //                 console.log('Error in inserting API Request and Response into cassandra')
    //                 console.log(errInsertData)
    //                 reject(errInsertData)
    //             } else {
    //                 console.log('API Request and Response inserted into cassandra successfully')
    //                 resolve(insertRec)
    //             }
    //     })
    // })
}
exports.checkReqInCassandra = checkReqInCassandra
exports.insertReqAndResInCassandra = insertReqAndResInCassandra