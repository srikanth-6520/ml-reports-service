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

let insertReqAndResInCassandra = async function (reqBody, resBody,downloadPath=null) {
    return new Promise(function (resolve, reject) {
        
        var obj = {
            apirequest: JSON.stringify(reqBody),
            apiresponse: JSON.stringify(resBody)
        };
        if(downloadPath){
            obj.downloadpdfpath = JSON.stringify(downloadPath);
        }

        var insertData = new db.reportIndexes(obj);
        insertData.saveAsync()
            .then(function (insertRec) {
                // console.log(insertRec)
                console.log('API Request and Response inserted into cassandra successfully')
                resolve(insertRec)
            })
            .catch(function (errInsertData) {
                console.log('Error in inserting API Request and Response into cassandra')
                // console.log(errInsertData)
                reject(errInsertData)
            })
    })
}

let checkAssessmentReqInCassandra = async function (reqBody, callback) {
    return new Promise(function (resolve, reject) {
        db.assessmentModel.findOneAsync({ apirequest: JSON.stringify(reqBody) }, { allow_filtering: true }, function (errGetData, getData) {
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


let insertAssessmentReqAndResInCassandra = async function (reqBody, resBody) {
    return new Promise(function (resolve, reject) {
        var insertData = new db.assessmentModel({
            apirequest: JSON.stringify(reqBody),
            apiresponse: JSON.stringify(resBody)
        });
        insertData.saveAsync()
            .then(function (insertRec) {
                // console.log(insertRec)
                console.log('API Request and Response inserted into cassandra successfully')
                resolve(insertRec)
            })
            .catch(function (errInsertData) {
                console.log('Error in inserting API Request and Response into cassandra')
                // console.log(errInsertData)
                reject(errInsertData)
            })
    })
}


let updateInstanceDownloadPath = async function (reqBody, callback) {
    return new Promise(function (resolve, reject) {
      
        // var query_object = reqBody.query;
        console.log("ssssssssssss",JSON.stringify(reqBody.query ));
        var query_object = { id : reqBody.query };
var update_values_object = {downloadpdfpath : reqBody.downloadPath };
var options = {ttl: 86400, if_exists: true};

console.log("query_object",query_object);
db.reportIndexes.update(query_object, update_values_object,options, function(err){
    if(err) {
        console.log(err);
    }else{
        resolve("updated");
    }
});

});
};

exports.checkReqInCassandra = checkReqInCassandra
exports.insertReqAndResInCassandra = insertReqAndResInCassandra
exports.checkAssessmentReqInCassandra = checkAssessmentReqInCassandra
exports.insertAssessmentReqAndResInCassandra = insertAssessmentReqAndResInCassandra
exports.updateInstanceDownloadPath = updateInstanceDownloadPath