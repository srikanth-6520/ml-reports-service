var config = require('../../config/config');
var rp = require('request-promise');
var request = require('request');
var model = require('../../db')
var helperFunc = require('../../helper/chartData');
var commonCassandraFunc = require('../../common/cassandraFunc');

exports.entityAssessment = async function (req, res) {
  if (!req.body.entityId || !req.body.entityType || !req.body.programId || !req.body.solutionId) {
    res.status(400);
    var response = {
      result: false,
      message: 'entityId,entityType,programId,solutionId and immediateChildEntityType are required fields'
    }
    res.send(response);
  }
  else {
    childType = req.body.immediateChildEntityType;
    reqBody = req.body
    var dataAssessIndexes = await commonCassandraFunc.checkAssessmentReqInCassandra(reqBody)
    if (dataAssessIndexes == undefined) {
      //get domainName and level info
      model.MyModel.findOneAsync({ qid: "entity_assessment_query" }, { allow_filtering: true })
        .then(async function (result) {
          var bodyParam = JSON.parse(result.query);
          if(config.druid.assessment_datasource_name){
            bodyParam.dataSource = config.druid.assessment_datasource_name;
          }
          //dynamically appending values to filter
          bodyParam.filter.fields[0].dimension = req.body.entityType;
          bodyParam.filter.fields[0].value = req.body.entityId;
          bodyParam.filter.fields[1].value = req.body.programId;
          bodyParam.filter.fields[2].value = req.body.solutionId;
         
          if(req.body.immediateChildEntityType == ""){
            // req.body.immediateChildEntityType = "domain"
            bodyParam.dimensions.push("domainName","level","schoolName","school");
            bodyParam.aggregations[0].fieldName = "domainName";
            bodyParam.aggregations[0].fieldNames.push("domainName");
            bodyParam.aggregations[0].name = "domainNameCount";
          }
          else{
            var entityName = req.body.immediateChildEntityType + "Name";
            bodyParam.dimensions.push(req.body.immediateChildEntityType,entityName,"level");
            bodyParam.aggregations[0].fieldName = entityName;
            bodyParam.aggregations[0].fieldNames.push(entityName);
            bodyParam.aggregations[0].name = entityName + "Count";
          }
          //pass the query as body param and get the resul from druid
          let opt = config.druid.options;
          opt.method = "POST";
          opt.body = bodyParam;
          var data = await rp(opt);
          if (!data.length) {
            res.send({ "data": {} })
          }
         else {
           var inputObj = {
             data : data,
             entityName : bodyParam.aggregations[0].fieldName,
             childEntity : req.body.immediateChildEntityType,
             levelCount : bodyParam.aggregations[0].name,
             entityType : req.body.entityType
           }
            //call the function entityAssessmentChart to get the data for stacked bar chart 
           var responseObj = await helperFunc.entityAssessmentChart(inputObj);
              bodyParam.dimensions.push("childType","childName","domainExternalId");
              if(!bodyParam.dimensions.includes("domainName")){
                bodyParam.dimensions.push("domainName");
              }
              if(req.body.immediateChildEntityType == ""){
                req.body.immediateChildEntityType = "school"
              }
              //pass the query as body param and get the resul from druid
              var options = config.druid.options;
              options.method = "POST";
              options.body = bodyParam;
              var entityData = await rp(options);
              var dataObj = {
                entityData :entityData,
                childEntityType : req.body.immediateChildEntityType,
                entityType : req.body.entityType
              }
              //call the function to get the data for expansion view of domain and criteria
              var tableObj = await helperFunc.entityTableViewFunc(dataObj)
              responseObj.reportSections.push(tableObj);

              if(childType){
              //call samiksha entity list assessment API to get the grandchildEntity type.
              var grandChildEntityType = await assessmentEntityList(req.body.entityId,childType,req.headers["x-auth-token"])
              if(grandChildEntityType.status == 200){
                if(grandChildEntityType.result[0].subEntityGroups.length != 0){
                responseObj.reportSections[0].chart.grandChildEntityType = grandChildEntityType.result[0].immediateSubEntityType;
                res.send(responseObj);
                }
                else{
                  responseObj.reportSections[0].chart.grandChildEntityType = "";
                  res.send(responseObj);
                }
              }
              else{
              responseObj.reportSections[0].chart.grandChildEntityType = "";
              res.send(responseObj);
              }
            }
            else{
              responseObj.reportSections[0].chart.grandChildEntityType = "";
              res.send(responseObj);
            }
            commonCassandraFunc.insertAssessmentReqAndResInCassandra(reqBody, responseObj)
          }
      })
        .catch(function (err) {
          console.log(err);
          res.status(400);
          var response = {
            result: false,
            message: 'Data not found'
          }
          res.send(response);
        })
    } else {
      res.send(JSON.parse(dataAssessIndexes['apiresponse']))
    }
  }
}



//function to make a call to samiksha assessment entities list API
async function assessmentEntityList(entityId,childType,token) {

  return new Promise(async function(resolve){
  var options = {
    method: "GET",
    json: true,
    headers: {
        "Content-Type": "application/json",
        "X-authenticated-user-token": token
    },
    uri: config.samiksha_assessment_entity_list_api.url + entityId + "?type=" + childType
}

  rp(options).then(function(resp){
    return resolve(resp);

  }).catch(function(err){
    return resolve(err);
  })

});
}