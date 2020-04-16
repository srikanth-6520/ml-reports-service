const moment = require("moment");
let obsScoreOrder = 0;
const config = require('../config/config');
const path = require("path");
const filesHelper = require('../common/files_helper');
const kendraService = require('./kendra_service');

//function for instance observation final response creation
exports.instanceReportChart = async function (data) {
    var obj;
    var multiSelectArray = [];
    var matrixArray = [];
    var order = "questionExternalId";
    let actualData = data;

    try {
        // obj is the response object which we are sending as a API response   
        obj = {
            entityName: data[0].event.schoolName,
            observationName: data[0].event.observationName,
            observationId: data[0].event.observationId,
            entityType: data[0].event.entityType,
            entityId: data[0].event.school,
            districtName: data[0].event.districtName,
            response: []
        }
        

        await Promise.all(data.map(element => {

            // Response object creation for text, slider, number and date type of questions
            if (element.event.questionResponseType == "text" && element.event.instanceParentResponsetype != "matrix" || element.event.questionResponseType == "slider" && element.event.instanceParentResponsetype != "matrix" || element.event.questionResponseType == "number" && element.event.instanceParentResponsetype != "matrix" || element.event.questionResponseType == "date" && element.event.instanceParentResponsetype != "matrix") {
               
                if (element.event.questionResponseType == "date"){
                    element.event.questionAnswer = moment(element.event.questionAnswer).format('D MMM YYYY, h:mm:ss A');
                }

                // If answer is null then assign value as not answered
                if (element.event.questionAnswer == null) {
                    element.event.questionAnswer = "Not Answered";
                }


                var resp = {
                    order: element.event[order],
                    question: element.event.questionName,
                    responseType: element.event.questionResponseType,
                    answers: [element.event.questionAnswer],
                    chart: {},
                    instanceQuestions:[]
                }

               
                obj.response.push(resp);
            }

            // Response object creation for radio type
            else if (element.event.questionResponseType == "radio" && element.event.instanceParentResponsetype != "matrix") {

                // If answer is null then assign value as not answered
                if (element.event.questionResponseLabel == null) {
                    element.event.questionResponseLabel = "Not Answered";
                }

                var resp = {
                    order: element.event[order],
                    question: element.event.questionName,
                    responseType: "text",
                    answers: [element.event.questionResponseLabel],
                    chart: {},
                    instanceQuestions: []
                }

                obj.response.push(resp);

            }

        }))

        //filter all the objects whose questionResponseType is multiselect
        await Promise.all(data.map(element => {
            if (element.event.questionResponseType == "multiselect" && element.event.instanceParentResponsetype != "matrix" ) {
                multiSelectArray.push(element);
            }
            if (element.event.instanceParentResponsetype == "matrix" && element.event.questionAnswer != null) {
                matrixArray.push(element);
            }
        }))

        //group the multiselect questions based on their questionExternalId
        let multiSelectResult = await groupArrayByGivenField(multiSelectArray,"questionExternalId");
        let res = Object.keys(multiSelectResult);

        //loop the keys and construct a response object for multiselect questions
        await Promise.all(res.map(async ele => {
            let multiSelectResp = await instanceMultiselectFunc(multiSelectResult[ele])
            obj.response.push(multiSelectResp);

        }))

        //group the Matrix questions based on their questionExternalId
        let matrixResult = await groupArrayByGivenField(matrixArray,"instanceParentId");
        let matrixRes = Object.keys(matrixResult);

         //loop the keys of matrix array
         await Promise.all(matrixRes.map(async ele => {
            let matrixResponse = await matrixResponseObjectCreateFunc(matrixResult[ele])
            obj.response.push(matrixResponse);

        }))
        
        //sort the response objects based on questionExternalId field
        await obj.response.sort(getSortOrder("order")); //Pass the attribute to be sorted on


        // Get the questions array
        let questionArray = await questionListObjectCreation(actualData);
        obj.allQuestions = questionArray;

        //return final response object
        return obj;
     }
    catch (err) {
        console.log(err);
    }
}


//Function to create a response object for multiselect question (Instance level Report)
async function instanceMultiselectFunc(data) {
    var labelArray = [];
    var question;
    var responseType;
    var order;

    await Promise.all(data.map(element => {

         // If answer is null then assign value as not answered
         if (element.event.questionResponseLabel == null) {
             element.event.questionResponseLabel = "Not Answered";
         }

        labelArray.push(element.event.questionResponseLabel);
    
        order = element.event.questionExternalId;
    
        question = element.event.questionName;
        responseType = element.event.questionResponseType;
    }))

    //response object for multiselect questions
    var resp = {
        order:order,
        question: question,
        responseType: "text",
        answers: labelArray,
        chart: {},
        instanceQuestions:[]
    }

    return resp;

}


//Function for entity Observation and observation report's final response creation
exports.entityReportChart = async function (data,entityId,entityName) {
    var obj;
    var multiSelectArray = [];
    var textArray = [];
    var radioArray = [];
    var sliderArray = [];
    var numberArray = [];
    var dateArray = [];
    var noOfSubmissions = [];
    var matrixArray = [];
    let actualData = data;

    try {

        // obj is the response object which we are sending as a API response  
        if (data[0].event.solutionId) {

            obj = {
                solutionId: data[0].event.solutionId,
                solutionName: data[0].event.solutionName,
                entityType: data[0].event.entityType,
                entityId: entityId,
                entityName: data[0].event[entityName + "Name"],
                response: []
            }


        }
        else {
            obj = {
                observationId: data[0].event.observationId,
                observationName: data[0].event.observationName,
                entityType: data[0].event.entityType,
                entityId: entityId,
                entityName:  data[0].event[entityName + "Name"],
                districtName: data[0].event.districtName,
                response: []
            }
        }

        //If questionSequenceByEcm is not null, then convert ecm number from string to int
        // if (data[0].event.questionSequenceByEcm != null) {
        //     data = await sequenceNumberTypeConvertion(data);
        // }

        //filter all the objects whose questionResponseType is multiselect
        await Promise.all(data.map(element => {
            if (noOfSubmissions.includes(element.event.observationSubmissionId)) {
            } else {
                noOfSubmissions.push(element.event.observationSubmissionId);
            }

            if (element.event.questionResponseType == "text" && element.event.instanceParentResponsetype != "matrix") {
                textArray.push(element)
            }
            else if (element.event.questionResponseType == "radio" && element.event.instanceParentResponsetype != "matrix") {
                radioArray.push(element)
            }
            else if (element.event.questionResponseType == "multiselect" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer !=null) {
                multiSelectArray.push(element)
            }
            else if (element.event.questionResponseType == "slider" && element.event.instanceParentResponsetype != "matrix") {
                sliderArray.push(element)
            }
            else if (element.event.questionResponseType == "number" && element.event.instanceParentResponsetype != "matrix") {
                numberArray.push(element)
            }
            else if (element.event.questionResponseType == "date" && element.event.instanceParentResponsetype != "matrix") {
                dateArray.push(element)
            }
            
            if (element.event.instanceParentResponsetype == "matrix"){
                if(element.event.questionResponseType == "multiselect" && element.event.questionAnswer != null || element.event.questionResponseType == "radio" || element.event.questionResponseType == "text" || element.event.questionResponseType == "date" || element.event.questionResponseType == "slider" || element.event.questionResponseType == "number"){
                matrixArray.push(element)
            }
           }
        }))

        //group the text questions based on their questionName
        textResult = await groupArrayByGivenField(textArray,"questionExternalId");

        //group the radio questions based on their questionName
        radioResult = await groupArrayByGivenField(radioArray,"questionExternalId");

        //group the multiselect questions based on their questionName

        // console.log("mutiSelectArray",mutiSelectArray);
        multiSelectResult = await groupArrayByGivenField(multiSelectArray,"questionExternalId");

        //group the slider questions based on their questionName
        sliderResult = await groupArrayByGivenField(sliderArray,"questionExternalId");

        //group the number questions based on their questionName
        numberResult = await groupArrayByGivenField(numberArray,"questionExternalId");
        
        //group the date questions based on their questionName
         dateResult = await groupArrayByGivenField(dateArray,"questionExternalId");

        //group the Matrix questions based on their instanceParentExternalId
         matrixResult = await groupArrayByGivenField(matrixArray,"instanceParentId");

        let textRes = Object.keys(textResult);
        //loop the keys and construct a response object for text questions
        await Promise.all(textRes.map(async ele => {
            let textResponse = await responseObjectCreateFunc(textResult[ele])
            obj.response.push(textResponse);

        }));

        let sliderRes = Object.keys(sliderResult);
        //loop the keys and construct a response object for slider questions
        await Promise.all(sliderRes.map(async ele => {
            let sliderResp = await responseObjectCreateFunc(sliderResult[ele])
            obj.response.push(sliderResp);
        }));

        let numberRes = Object.keys(numberResult);
        //loop the keys and construct a response object for slider questions
        await Promise.all(numberRes.map(async ele => {
            let numberResp = await responseObjectCreateFunc(numberResult[ele])
            obj.response.push(numberResp);
        }));
         
        let dateRes = Object.keys(dateResult);
        //loop the keys and construct a response object for slider questions
        await Promise.all(dateRes.map(async ele => {
            let dateResp = await responseObjectCreateFunc(dateResult[ele])
            let answers = []
             await Promise.all(dateResp.answers.map(element => {
                answers.push(moment(element).format('D MMM YYYY, h:mm:ss A'));
             }))
             dateResp.answers = answers;
            obj.response.push(dateResp);
        }))

        let radioRes = Object.keys(radioResult);
        //loop the keys and construct a response object for slider questions
        await Promise.all(radioRes.map(async ele => {
            let radioResp = await radioObjectCreateFunc(radioResult[ele],noOfSubmissions)
            obj.response.push(radioResp);
        }));

         let multiSelectRes = Object.keys(multiSelectResult);
         //loop the keys and construct a response object for multiselect questions
        await Promise.all(multiSelectRes.map(async ele => {
            let multiSelectResp = await multiSelectObjectCreateFunc(multiSelectResult[ele],noOfSubmissions)
            obj.response.push(multiSelectResp);
        }))

        let matrixRes = Object.keys(matrixResult);
        //loop the keys of matrix array
        await Promise.all(matrixRes.map(async ele => {
           let matrixResponse = await matrixResponseObjectCreateFunc(matrixResult[ele])
           obj.response.push(matrixResponse);

       }))

        //sort the response objects based on questionExternalId field
         await obj.response.sort(getSortOrder("order")); //Pass the attribute to be sorted on


        // Get the questions array
        let questionArray = await questionListObjectCreation(actualData);
        obj.allQuestions = questionArray;

         return obj;
    
  }
    catch (err) {
        console.log(err);
    }

}


//matrix questions response object creation
async function matrixResponseObjectCreateFunc(data){
    var noOfInstances = [];
    let order;

    // if(data[0].event.instanceParentEcmSequence != null){
    //     order = "instanceParentEcmSequence";
    // } else {
        order = "instanceParentExternalId";
    // }
    
     //To get the latest edited question
     let questionObject = data.sort(custom_sort);
     let question = questionObject[questionObject.length-1].event.instanceParentQuestion;

    var obj = {
        order:data[0].event[order],
        question: question,
        responseType: data[0].event.instanceParentResponsetype,
        answers: [],
        chart: {},
        instanceQuestions:[]
    }
   
    let groupBySubmissionId = await groupArrayByGivenField(data, "observationSubmissionId");
    let submissionKeys = Object.keys(groupBySubmissionId);

    await Promise.all(submissionKeys.map(async ele => {

        let groupByInstanceId = await groupArrayByGivenField(groupBySubmissionId[ele], "instanceId")
        let instanceKeys = Object.keys(groupByInstanceId)

        await Promise.all(instanceKeys.map(async element => {
            let instanceData = groupByInstanceId[element];
            let instanceIdArray = [];

            await Promise.all(instanceData.map(resp => {
                if (instanceIdArray.includes(resp.event.instanceId)) {

                } else {
                    instanceIdArray.push(resp.event.instanceId);
                }
            }))

            noOfInstances.push(instanceIdArray);

        }))
    }))

    let instanceIdArrayData = [].concat.apply([], noOfInstances); 

    //group the Matrix questions based on their questionExternalId
    let matrixResult = await groupArrayByGivenField(data,"questionExternalId");
    let matrixRes = Object.keys(matrixResult);

     //loop the keys and construct a response object for multiselect questions
     await Promise.all(matrixRes.map(async ele => {
        let matrixResponse = await matrixResponseObject(matrixResult[ele],instanceIdArrayData)
        obj.instanceQuestions.push(matrixResponse);

    }))

    //sort the response objects based on questionExternalId field
    await obj.instanceQuestions.sort(getSortOrder("order")); //Pass the attribute to be sorted on

    return obj;
}


//Create Response object for matrix type instance questions
async function matrixResponseObject(data,noOfInstances){

    if(data[0].event.questionResponseType == "text" || data[0].event.questionResponseType == "slider" || data[0].event.questionResponseType == "number" || data[0].event.questionResponseType == "date"){
         var answers = []
        let responseObj = await responseObjectCreateFunc(data);
         
        if(responseObj.responseType == "date") {
          await Promise.all(responseObj.answers.map(element => {
             answers.push(moment(element).format('D MMM YYYY, h:mm:ss A'));
           }))

           responseObj.answers = answers
        }
        //  responseObj.answers = answers;
         return responseObj;
    }
    else if(data[0].event.questionResponseType == "radio"){

        let responseObj = await radioObjectCreateFunc(data,noOfInstances);
        return responseObj;
    }
    else if(data[0].event.questionResponseType == "multiselect"){
            
        let responseObj = await multiSelectObjectCreateFunc(data,noOfInstances);
        return responseObj;
    }
}


//function to create response onject for text, number,slider,date questions (Entiry Report)
async function responseObjectCreateFunc(data) {
    let dataArray = [];
    let question;
    let responseType;
    let order;
      
    //loop the data and push answers to array
     for (i = 0; i < data.length; i++) {
         if(data[i].event.questionAnswer == null){
            data[i].event.questionAnswer = "Not answered";
         }
        dataArray.push(data[i].event.questionAnswer);

        // if(data[i].event.questionSequenceByEcm != null){

        //     order = data[i].event.questionSequenceByEcm;
        // } else {
            order = data[i].event.questionExternalId;
        // } 

        responseType = data[i].event.questionResponseType;
     }
      
     //To get the latest edited question
     let questionObject = data.sort(custom_sort);
     question = questionObject[questionObject.length-1].event.questionName;

    //response object
    let resp = {
        order: order,
        question: question,
        responseType: responseType,
        answers: dataArray,
        chart: {},
        instanceQuestions:[]
    }
    return resp;

}


//function to create response object for radio questions (Entiry Report)
async function radioObjectCreateFunc(data,noOfSubmissions) {
    var dataArray = [];
    var labelArray = [];
    var chartdata = [];
    var answerArray = [];
    var question;
    var responseType;
    var order;

    for (var i = 0; i < data.length; i++) {

        if(data[i].event.questionAnswer == null){
            data[i].event.questionAnswer = "Not answered";
        }
        if(data[i].event.questionResponseLabel == null) {
            data[i].event.questionResponseLabel = "Not answered";
        }
        
        dataArray.push(data[i].event.questionAnswer);
        answerArray.push(data[i].event.questionResponseLabel);

        if (labelArray.includes(data[i].event.questionResponseLabel)) {
        } else {
            labelArray.push(data[i].event.questionResponseLabel);
        }
        
        // if(data[i].event.questionSequenceByEcm != null){

        //     order = data[i].event.questionSequenceByEcm;
        // } else {
            order = data[i].event.questionExternalId;
        // } 
        
        
        responseType = data[i].event.questionResponseType;

    }

    var responseArray = count(dataArray)   //call count function to count occurences of elements in the array
    responseArray = Object.entries(responseArray);  //to convert object into array

    for (var j = 0; j < responseArray.length; j++) {
        var k = 0;
        var element = responseArray[j];
        var value = (element[k + 1] / noOfSubmissions.length) * 100;
        value = parseFloat(value.toFixed(2));
        if(labelArray[j] == null){
            labelArray[j] = "Not answered";
        }
        var dataObj = {
            name: labelArray[j],
            y: value
        }

        chartdata.push(dataObj);
        
    }
    
    //To get the latest edited question
    let questionObject = data.sort(custom_sort);
    question = questionObject[questionObject.length-1].event.questionName;

    var resp = {
        order: order,
        question: question,
        responseType: responseType,
        answers: [],
        chart: {
            type: "pie",
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: false
                    },
                    showInLegend: true
                }
            },
            data: [
                {
                    data: chartdata
                }
            ]
        },
        instanceQuestions:[]
    }
    
    if("instanceParentResponsetype" in data[0].event){
        resp.answers = answerArray;
    }

    return resp;
}

//function to create response object for multiselect questions (Entiry Report)
async function multiSelectObjectCreateFunc(data,noOfSubmissions) {
    try {
    let dataArray = [];
    let answerArray = [];
    let labelArray = [];
    let chartdata = [];
    let order;
   
    await Promise.all(data.map(ele => {
        dataArray.push(ele.event.questionAnswer);

        if (labelArray.includes(ele.event.questionResponseLabel)) {
        } else {
            labelArray.push(ele.event.questionResponseLabel)
        }
    }))
    
    labelMerged = Array.from(new Set(labelArray))  
    uniqueDataArray = Object.entries(count(dataArray));

    for (var j = 0; j < uniqueDataArray.length; j++) {
        var k = 0;
        var element = uniqueDataArray[j];
        var value = (element[k + 1] / noOfSubmissions.length) * 100;
        value = parseFloat(value.toFixed(2));
        chartdata.push(value);
    }

    // if(data[0].event.questionSequenceByEcm != null){

    //     order = data[0].event.questionSequenceByEcm;
    // } else {
        order = data[0].event.questionExternalId;
    // } 

    //To get the latest edited question
    let questionObject = data.sort(custom_sort);
    let question = questionObject[questionObject.length-1].event.questionName;
    

    var resp = {
        order: order,
        question: question,
        responseType: data[0].event.questionResponseType,
        answers: [],
        chart: {
            type: "bar",
            data: [
                {
                    data: chartdata
                }
            ],
            xAxis: {
                categories: labelMerged,
                title: {
                    text: "Responses"
                }
            },
            yAxis: {
                min : 0,
                max : 100,
                title: {
                    text: "Responses in percentage"
                }
            }
        },
        instanceQuestions:[]
    }

    // Constructing answer array for matrix questions
    if ("instanceParentResponsetype" in data[0].event) {

        var groupBySubmissionId = await groupArrayByGivenField(data, "observationSubmissionId");
        var submissionKeys = Object.keys(groupBySubmissionId);
        
        await Promise.all(submissionKeys.map(async ele => {
            var groupByInstanceId = await groupArrayByGivenField(groupBySubmissionId[ele], "instanceId")
            var instanceKeys = Object.keys(groupByInstanceId)
            
            await Promise.all(instanceKeys.map(async element => {
                let instanceData = groupByInstanceId[element];
                let instanceAnswerArray = [];

                await Promise.all(instanceData.map(resp => {

                    instanceAnswerArray.push(resp.event.questionResponseLabel);
                }))

                answerArray.push(instanceAnswerArray);

            }))

        }))

        resp.answers = answerArray;
    }
    
    return resp;
}
catch(err) {
  console.log(err);
 }
}

// to count the occurances of same elements in the array
function count(arr) {
    return arr.reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {})
}

//Create response object for listObservationNames API
exports.listObservationNamesObjectCreate = async function(data){
    try {
    var responseObj = []

    for(var i=0;i<data.length;i++){
        responseObj.push(data[i].event);
    }

      return responseObj;
    }
    catch(err){
        console.log(err);
    }
}

//Create response object for listSolutionNames API
exports.listSolutionNamesObjectCreate = async function (data) {
    try {
        let responseObj = [];
        let scoring;

        let groupBySolutionId = await groupArrayByGivenField(data, "solutionId")

        let solutionKeys = Object.keys(groupBySolutionId);

        await Promise.all(solutionKeys.map(element => {

            let obj = {
                solutionName: groupBySolutionId[element][0].event.solutionName,
                solutionId: groupBySolutionId[element][0].event.solutionId
            }

            groupBySolutionId[element].forEach(ele => {

                if (ele.event.totalScore >= 1) {
                    scoring = true;
                }
            });


            if (scoring == true) {
                obj.scoring = true;
            } else {
                obj.scoring = false;
            }

            responseObj.push(obj);
        }))

        return responseObj;

    }
    catch (err) {
        console.log(err);
    }
}



//=========================================  assessment chart data ===============================================

exports.listProgramsObjectCreate = async function(data){
    try {
    var responseObj = []
    var dataArray = []

    for(var i=0;i<data.length;i++){
         dataArray.push(data[i].event);
    }
     
    // Function for grouping the array based on program Id
      result = dataArray.reduce(function (r, a) {
            r[a.programId] = r[a.programId] || [];
            r[a.programId].push(a);
            return r;
        }, Object.create(null));

        var res = Object.keys(result);

        //loop the keys 
        await Promise.all(res.map(async ele => {
            var programListResp = await programListRespObjCreate(result[ele])
            responseObj.push(programListResp);

        }));

      return responseObj;
    }
    catch(err){
        console.log(err);
    }
}

//Function to create program object and solution array  -- listPrograms API
async function programListRespObjCreate(data){
    try {
    var pgmObj = {
        programName: data[0].programName,
        programId: data[0].programId,
        programDescription: data[0].programDescription,
        programExternalId: data[0].programExternalId,
        solutions: []
    }

     await Promise.all(data.map(element => {
        var solutionObj = {
            solutionName : element.solutionName,
            solutionId : element.solutionId,
            solutionDescription: element.solutionDescription,
            solutionExternalId: element.solutionExternalId
        }

     pgmObj.solutions.push(solutionObj);
      }));

    return pgmObj;

 }
 catch(err){
     console.log(err);
 }
}

//Function to create stacked bar chart response object for entity assessment API  
exports.entityAssessmentChart = async function (inputObj) {
    try {
    data = inputObj.data;
    childEntity = inputObj.childEntity;
    entityName = inputObj.entityName;
    levelCount = inputObj.levelCount;
    entityType = inputObj.entityType;

    var domainArray = [];
    var firstScoreArray =[];
    var secondScoreArray = [];
    var thirdScoreArray = [];
    var fourthScoreArray = [];
    var obj ={};

    //Store the domain Names in an array
    await Promise.all(data.map(async ele => {               
        if (domainArray.includes(ele.event[entityName])) {

        } else {
            domainArray.push(ele.event[entityName]);
        }
    }));
   
    //group the json objects based on entityName
    var res = await groupArrayByGivenField(data,entityName);

    var dt = Object.keys(res);
    await Promise.all(dt.map(element => {
        var l1 = "";
        var l2 = "";
        var l3 = "";
        var l4 = "";
        var foundL1 = res[element].some(function (el) {
            if (el.event.level === 'L1') {
                l1 = el;
                return el;
            } else {
                return false;
            }
        });

        var foundL2 = res[element].some(el => {
            if (el.event.level === 'L2') {
                l2 = el;
                return el;
            } else {
                return false;
            }
        });

        var foundL3 = res[element].some(el => {
            if (el.event.level === 'L3') {
                l3 = el;
                return el;
            } else {
                return false;
            }
        });

        var foundL4 = res[element].some(el => {
            if (el.event.level === 'L4') {
                l4 = el;
                return el;
            } else {
                return false;
            }
        })
        

        //if domainCount is found, then push the count, otherwise push 0 
        if (foundL1) {
            obj = {
                y: l1.event[levelCount],
                entityId: l1.event[childEntity]
            }
            firstScoreArray.push(obj);
        } else {
            obj = {
                y: 0,
                entityId: ""
            }
            firstScoreArray.push(obj);
        }
        if (foundL2) {
            obj = {
                y: l2.event[levelCount],
                entityId: l2.event[childEntity]
            }
            secondScoreArray.push(obj);
        } else {
            obj = {
                y: 0,
                entityId: ""
            }
            secondScoreArray.push(obj);
        }
        if (foundL3) {
            obj = {
                y: l3.event[levelCount],
                entityId: l3.event[childEntity]
            }
            thirdScoreArray.push(obj);
        } else {
            obj = {
                y: 0,
                entityId: ""
            }
            thirdScoreArray.push(obj);
        }
        if (foundL4) {
            obj = {
                y: l4.event[levelCount],
                entityId: l4.event[childEntity]
            }
            fourthScoreArray.push(obj);
        } else {
            obj = {
                y: 0,
                entityId: ""
            }
            fourthScoreArray.push(obj);
        }
    }));

      var titleName = "";
      var chartTitle = "";
      if(childEntity == ""){
          titleName = "School";
          chartTitle = "domain"
      }
      else{
          titleName = "Entity";
          chartTitle = "Entity"
      }

      var designation = await designationCreateFunction(entityType);

      var chartObj = {
        result:true,
        title: data[0].event.programName + " report",
        reportSections: [
            {
                order: 1,
                chart: {
                    type: "bar",
                    nextChildEntityType: childEntity,
                    stacking: "percent",
                    title: "Criteria vs level mapping aggregated at " + chartTitle + " level",
                    xAxis: {
                        categories: domainArray,
                        title: ""
                    },
                    yAxis: {
                        title: {
                            text: "Criteria"
                        }
                    },
                    data: [
                        {
                            name: "Level 1",
                            data: firstScoreArray
                        },
                        {
                            name: "Level 2",
                            data: secondScoreArray
                        },
                        {
                            name: "Level 3",
                            data: thirdScoreArray
                        },
                        {
                            name: "Level 4",
                            data: fourthScoreArray
                        }
                    ]
                }
            }
        ]
    }
// console.log(chartObj.reportSections[0].chart);
  return chartObj;
}
catch(err){
    console.log(err);
}
}



//Function for creating response object to show domainNames, criteria's and level's   -- expansion view entity assessment API
exports.entityTableViewFunc = async function(dataObj){
    try {
    var data = dataObj.entityData;
    var entityType = dataObj.entityType;
    var childType = dataObj.childEntityType;
    var result = await groupArrayByGivenField(data,childType);
    var res = Object.keys(result);
    
    var titleName;
    if(entityType == "school"){
        titleName = "school";
    }
    else{
        titleName = "Entity"
    }
    var designation = await designationCreateFunction(entityType);
    var tableObj = {
        order: 2,
        chart: {
            type: "expansion",
            title: "Descriptive view",
            entities : []
        }
    }
    
    // wait till the final entity response object comes
    await Promise.all(res.map(async element => {
        var tableData = await tableDataCreateFunc(result[element],childType)
        tableObj.chart.entities.push(tableData);
    }));

    return tableObj;
    }
    catch(err){
        console.log(err);
    }

}

//create criteria array based on domainName
async function tableDataCreateFunc(data,entityType){
    try{

    var result = await groupArrayByGivenField(data,"domainName");
    var res = Object.keys(result);

    var chartdata = {
        entityName: data[0].event[entityType + "Name"],
        entityId: data[0].event[entityType],
        domains : []
     }

    // chartdata.domains = await domainLoopFunction(result,res)
    await Promise.all(res.map( async element => {
        var tableData = await domainCriteriaCreateFunc(result[element])
        chartdata.domains.push(tableData);
    }));

    return chartdata;
    }
    catch(err){
        console.log(err);
    }
}

//Function to create criteria array based on the domain Name -- expansion view of entity assessment API
async function domainCriteriaCreateFunc (data){
    try{
    var chartObj = {
        domainName: data[0].event.domainName,
        domainId: data[0].event.domainExternalId,
        criterias: []
    }

    await Promise.all(data.map(async ele => { 
        if (ele.event.childType == "criteria") {
            var obj = {
                name: ele.event.childName
            }
            if (ele.event.level == "L1") {
                obj.level = "Level 1"
            }
            else if (ele.event.level == "L2") {
                obj.level = "Level 2"
            }
            else if (ele.event.level == "L3") {
                obj.level = "Level 3"
            }
            else if (ele.event.level == "L4") {
                obj.level = "Level 4"
            }
            chartObj.criterias.push(obj);
        }

    }));
       return chartObj;
  }
 catch(err){
    console.log(err);
 }
}


//===================================== chart object creation for observation scoring reports =========================

// Chart object creation for instance observation score report
exports.instanceScoreReportChartObjectCreation = async function (data) {

    let obj = {
        result : true,
        totalScore: data[0].event.totalScore,
        scoreAchieved: data[0].event.scoreAchieved,
        observationName: data[0].event.observationName,
        schoolName: data[0].event.schoolName,
        districtName: data[0].event.districtName,
        response: []
    }

    //Group the objects based on the questionExternalId
    let result = await groupArrayByGivenField(data, "questionExternalId");

    let resp = Object.keys(result);

    await Promise.all(resp.map(async element => {

        let chartObject = await scoreObjectCreateFunction(result[element]);

        obj.response.push(chartObject);

    }))

     //sort the response objects based on questionExternalId field
     await obj.response.sort(getSortOrder("order")); //Pass the attribute to be sorted on

     // Get the question array
     let questionArray = await questionListObjectCreation(data);
     obj.allQuestions = questionArray;

    return obj;
}


async function scoreObjectCreateFunction(data) {

    if(data[0].event.minScore == null){
        data[0].event.minScore = 0;
    }

    if(data[0].event.maxScore == null){
        data[0].event.maxScore = 0;
    }

    let value = (data[0].event.minScore / data[0].event.maxScore) * 100;
    value = parseFloat(value.toFixed(2));
    
    let yy=0;
   
    if(!value){
        value = 0;
    } else {
        yy=100 - value
    }

    let dataObj = [{
        name: data[0].event.minScore + " out of " + data[0].event.maxScore,
        y: value,
        color: "#6c4fa1"
    },{
        name: "",
        y: yy,
        color: "#fff"
    }]

    let resp = {
        order: data[0].event.questionExternalId,
        question: data[0].event.questionName,
        chart: {
            type: "pie",
            credits: {
                enabled: false
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: false
                    },
                    showInLegend: true,
                    borderColor: '#000000'
                }
            },

            data: [
                {
                    data: dataObj
                }
            ]
        }
    }

    return resp;

}



// Chart object creation for entity observation score report
exports.entityScoreReportChartObjectCreation = async function (data, version) {

    let sortedData = await data.sort(sort_objects);

    let submissionId = [];
    let responseData = [];

    await Promise.all(sortedData.map( element => {

        if(submissionId.length <= config.druid.threshold_in_entity_score_api) {
          if(!submissionId.includes(element.event.observationSubmissionId)){
                 submissionId.push(element.event.observationSubmissionId)
           }
        }
      }))


    let obj = {
        result : true,
        schoolName : data[0].event.schoolName,
        totalObservations : submissionId.length,
        observationName: data[0].event.observationName,
        districtName: data[0].event.districtName,
        response : []
    }

    //loop sortedData and take required json objects
    await Promise.all(sortedData.map( async objectData => {

        if(submissionId.includes(objectData.event.observationSubmissionId)){
              
             responseData.push(objectData);
        }
    }))

     //group the questions based on their questionExternalId
     let groupedData = await groupArrayByGivenField(responseData,"questionExternalId");

     let groupKeys = Object.keys(groupedData);

     await Promise.all(groupKeys.map( async ele => {

        let responseObj = await entityScoreObjectCreateFunc(groupedData[ele], version);
       
          obj.response.push(responseObj);
        
        }))

      //sort the response objects using questionExternalId field
      await obj.response.sort(getSortOrder("order")); //Pass the attribute to be sorted on


     // Get the question array
      let questionArray = await questionListObjectCreation(data);
      obj.allQuestions = questionArray;


      return obj;

    }

    
async function entityScoreObjectCreateFunc (data, version) {

    let seriesData = [];
    let yAxisMaxValue ;

    //group the questions based on their observationSubmissionId
    let groupedSubmissionData = await groupArrayByGivenField(data,"observationSubmissionId"); 

    let groupedSubmissionKeys = Object.keys(groupedSubmissionData);

    await Promise.all(groupedSubmissionKeys.map(async scoreData => {

        if(groupedSubmissionData[scoreData][0].event.minScore == null) {
            groupedSubmissionData[scoreData][0].event.minScore = 0;
        }

        if(seriesData.length != config.druid.threshold_in_entity_score_api){
        seriesData.push([parseInt(groupedSubmissionData[scoreData][0].event.minScore)]);
        }

        if(groupedSubmissionData[scoreData][0].event.maxScore != null) {
            yAxisMaxValue = groupedSubmissionData[scoreData][0].event.maxScore ;
        }

    
    }))

    let chartData = {
        order : data[0].event.questionExternalId,
        question : data[0].event.questionName,
        chart: {
            type: "scatter",
            title: "",
            xAxis: {
                title: {
                    enabled: true,
                    text: "observations"
                },
                labels: {},
                categories: ["Obs1", "Obs2", "Obs3", "Obs4", "Obs5"],
                startOnTick: false,
                endOnTick: false,
                showLastLabel: true
            },
            yAxis: {
                min:0,
                max: yAxisMaxValue,
                allowDecimals: false,
                title: {
                    text: "Score"
                }
            },
            plotOptions:{
                scatter:{
                    lineWidth:1,
                    lineColor:"#F6B343"
                }
            },
            credits: {
                enabled: false
            },
            legend: {
                enabled: false
            },
            data: [{
                color: "#F6B343",
                data : seriesData
            }]

        }
    }

    if (version == "v2") {
        chartData.chart.type = "column";
        chartData.chart.plotOptions = {
            column: {
                pointPadding: 0.3,
                borderWidth: 0
            }
        }
    }

    return chartData;
}



// Chart object creation for observation score report
exports.observationScoreReportChart = async function (data) {

    let obj = {
        result: true,
        observationName: data[0].event.observationName,
        solutionName: data[0].event.solutionName,
        response: []
    }

    //group the data based on entity Id
    let questionIdGroupedData = await groupArrayByGivenField(data, "questionExternalId");

    let entityKeys = Object.keys(questionIdGroupedData);

    await Promise.all(entityKeys.map(async element => {

        let responseObj = await observationScoreResponseObj(questionIdGroupedData[element]);

        obj.response.push(responseObj);
    }))


    // Number of schools in this particular observation/solution
    //obj.schoolsObserved = obj.response[0].chart.xAxis.categories.length;

    //sort the response objects using questionExternalId field
    await obj.response.sort(getSortOrder("order")); //Pass the attribute to be sorted on


    // Get the question array
    let questionArray = await questionListObjectCreation(data);
    obj.allQuestions = questionArray;



    return obj;
}

//Chart object creation for each question
async function observationScoreResponseObj(data){

    let obsArray1 = [];
    let obsArray2 = [];
    let schoolNames = [];
    let yAxisMaxValue;
    
    //Group the data based on school Id
    let groupedEntityData = await groupArrayByGivenField(data,"school");
    
    let groupedEntityKeys = Object.keys(groupedEntityData);
    
    await Promise.all(groupedEntityKeys.map(async element => {
         
        let sortedData = await groupedEntityData[element].sort(sort_objects);

        schoolNames.push(sortedData[0].event.schoolName);
        yAxisMaxValue = parseInt(sortedData[0].event.maxScore);

        if (sortedData.length >= 1) {

            if (sortedData[0].event.minScore == null) {
                sortedData[0].event.minScore = 0;
            }

            obsArray1.push(parseInt(sortedData[0].event.minScore));

            if (sortedData.length > 1) {

                if (sortedData[1].event.minScore == null) {
                    sortedData[1].event.minScore = 0;
                }

                obsArray2.push(parseInt(sortedData[1].event.minScore));
            }

        }

    }))


    let chartData = {
        order : data[0].event.questionExternalId,
        question : data[0].event.questionName,
        chart: {
            type: "bar",
            title: "",
            xAxis: {
                title: {
                    text: null
                },
                labels: {},
                categories: schoolNames
            },
            yAxis: {
                min: 0,
                max : yAxisMaxValue,
                title: {
                    text: "Score"
                },
                labels: {
                    overflow: 'justify'
                },
                allowDecimals : false
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true
                    }
                }
            },
            legend: {
               enabled : true
            },
            credits: {
                enabled: false
            },
            data: [{
                name: 'observation1',
                data: obsArray1
            }, {
                name: 'observation2',
                data: obsArray2
            }]

        }
    }

    return chartData;
}

// Function for grouping the array based on certain field name
function groupArrayByGivenField (array,name){
    result = array.reduce(function (r, a) {
        r[a.event[name]] = r[a.event[name]] || [];
        r[a.event[name]].push(a);
        return r;
    }, Object.create(null));

    return result;
}


function custom_sort(a, b) {
    return new Date(a.event.completedDate).getTime() - new Date(b.event.completedDate).getTime();
}

function sort_objects(a, b) {
    return new Date(a.event.completedDate).getTime() < new Date(b.event.completedDate).getTime();
}


//function to create the title
function designationCreateFunction(entityType){
    var value;
    if(entityType == "school"){
       value = "HM"
    }
    else if(entityType == "cluster"){
        value = "CRP"
    }
    else if(entityType == "zone"){
        value = "ZONE"
    }
    else if(entityType == "block"){
        value = "BEO"
    }
    else if(entityType == "district"){
        value = "DEO"
    }
    else if(entityType == "state"){
        value = "State"
    }
    else if(entityType == "hub"){
        value = "HUB"
    }

  return value;
}



//============================ Container APP API Response object creation ==========================================

exports.courseEnrollmentResponeObj = async function(result){
    var response = {
        result: true,
        data : []
    }
   
    for (var i = 0; i < result.length; i++) {
            let obj = {}
            obj.course_name = result[i].event.course_name;
            obj.status = result[i].event.course_status;
        response.data.push(obj);
        }
   
    return response;
}

//Chart object creation for usage by content 
exports.usageByContentResponeObj = async function (result) {
    var response = {
        result: true,
        data: []
    }

    for (var i = 0; i < result.length; i++) {
        let obj = {}
        obj.content_name = result[i].content_name;
        obj.total_users_viewed = result[i]["Total Users Viewed"];
        response.data.push(obj);
    }
    return response;
}


//Chart object creation for contents downloaded by the user
exports.contentDownloadResponeObj = async function (result) {
    var response = {
        result: true,
        data: []
    }

    for (var i = 0; i < result.length; i++) {
        let obj = {}
        obj.content_name = result[i].content_name;
        obj.total_downloads = result[i]["COUNT(content_identifier)"];
        response.data.push(obj);
    }
    return response;
}


//Chart object creation for contents viewed in the platform
exports.contentViewResponeObj = async function (result) {
    var response = {
        result: true,
        data: []
    }

    for (var i = 0; i < result.length; i++) {
        let obj = {}
        obj.content_name = result[i].content_name;
        obj.total_views = result[i]["COUNT(content_identifier)"];
        response.data.push(obj);
    }
    return response;
}



//Function for sorting the array in ascending order based on a key
function getSortOrder(prop) {
    return function(a, b) {
        if (a[prop] > b[prop]) {
            return 1;
        } else if (a[prop] < b[prop]) {
            return -1;
        }
        return 0;
    }
 }

//COnvert questionSequenceByEcm value from string to int
async function sequenceNumberTypeConvertion(data){

    await Promise.all(data.map(element => {
         element.event.questionSequenceByEcm = parseInt(element.event.questionSequenceByEcm);

         if(element.event.instanceParentEcmSequence != null){
             element.event.instanceParentEcmSequence = parseInt(element.event,instanceParentEcmSequence);
         }
    }));

 return data;
}



// question list response object creation
var questionListObjectCreation = async function(data){
    let questionArray = [];
    
    //group the questions based on their questionExternalId
    let result = await groupArrayByGivenField(data,"questionExternalId");

    let groupKeys = Object.keys(result);

    await Promise.all(groupKeys.map(async element => {
          let obj = {};
         
          obj.questionName = result[element][0].event.questionName;
          obj.questionExternalId = result[element][0].event.questionExternalId;
          obj.questionId = result[element][0].event.questionId;

          questionArray.push(obj);
    }))

    await questionArray.sort(getSortOrder("questionExternalId"));

  return questionArray;

}



// Create evidenceList
exports.getEvidenceList = async function(data){
    
    let filePath = [];

    await Promise.all(data.map(element => {
        
        files = element.event.fileSourcePath.split(",");
        filePath.push(files);

    }));

    let evidenceList = Array.prototype.concat(...filePath);
    
    return evidenceList;
}


//Evidence array creation function
exports.evidenceChartObjectCreation = async function(chartData, evidenceData, token){


    let filesArray = [];
    let questionData = [];
   
    await Promise.all(chartData.response.map(async element => {
        
        let filteredData = evidenceData.filter(data => element.order.includes(data.event.questionExternalId));
   
        if(filteredData.length > 0) {
        let result = await evidenceArrayCreation(element.order, evidenceData);
    
        filesArray.push(result[0]);
        questionData.push(result[1]);

        if(element.instanceQuestions.length > 0){
          
            await Promise.all(element.instanceQuestions.map(async ele => {
            
            let filteredData = evidenceData.filter(data => ele.order.includes(data.event.questionExternalId));
            
            if(filteredData.length > 0) {
            let response = await evidenceArrayCreation(ele.order, evidenceData);

            filesArray.push(response[0]);
            questionData.push(response[1]);

            }
 
            }));

        }

      }

    }));

    //merge multiple arrays into single array
    let fileSoucePaths = Array.prototype.concat(...filesArray);
    fileSoucePaths = Array.prototype.concat(...fileSoucePaths);

    let questionArray = Array.prototype.concat(...questionData);
   
    //get the downloadable url from kendra service    
    let downloadableUrls = await getDownloadableUrlFromKendra(fileSoucePaths,token);
  
    let result = await insertEvidenceArrayToChartObject(chartData,downloadableUrls,questionArray);

    return result;

}

// create filepaths array 
async function evidenceArrayCreation(questionExternalId, evidenceData) {

    let filteredData = evidenceData.filter(data => questionExternalId.includes(data.event.questionExternalId));
   
    let filePath = [];
    let questionData = [];
    let filesArray = [];
    let evidence_count;

    //loop the array, split the fileSourcePath and push it into array
    await Promise.all(filteredData.map(fileData => {

       filePath.push(fileData.event.fileSourcePath.split(","));

    }));
    
    let filePaths = Array.prototype.concat(...filePath);
    
    evidence_count = filePaths.length;

    if (filePaths.length > config.evidence.evidence_threshold) {
        filesArray.push(filePaths.slice(0, config.evidence.evidence_threshold));
    } else {
        filesArray.push(filePaths);
    }

    filesArray = Array.prototype.concat(...filesArray);

    let obj = {
        questionExternalId: questionExternalId,
        evidence_count : evidence_count,
        filePathsArray: filesArray
    }

    questionData.push(obj);

    return [filesArray,questionData];

}

// Insert evidence array to the corrousponding questions
async function insertEvidenceArrayToChartObject (chartData,downloadableUrls,questionData){

    await Promise.all(chartData.response.map(async ele => {
         
        let filteredData = questionData.filter(data => ele.order.includes(data.questionExternalId));

        if (filteredData.length > 0) {

            let evidenceData = downloadableUrls.result.filter(evidence => filteredData[0].filePathsArray.includes(evidence.filePath));
            
            evidenceData = evidenceData.reduce((unique, o) => {if(!unique.some(obj => obj.filePath === o.filePath)) {unique.push(o);}return unique;},[]);
            ele.evidences = [];
            ele.evidence_count = filteredData[0].evidence_count;

            await Promise.all(evidenceData.map(async element => {

                let ext = path.extname(element.filePath);
                let obj = {};
                obj.url = element.url;
                obj.extension = ext;
                ele.evidences.push(obj);

            }));

        }

        if(ele.instanceQuestions.length > 0){

            await Promise.all(chartData.response.instanceQuestions.map(async value => {

                let filteredData = questionData.filter(data => value.order.includes(data.questionExternalId));
                if (filteredData.length > 0) {

                    let evidenceData = downloadableUrls.result.filter(evidence => filteredData[0].filePathsArray.includes(evidence.filePath));
                    
                    evidenceData = evidenceData.reduce((unique, o) => { if (!unique.some(obj => obj.filePath === o.filePath)) { unique.push(o); } return unique; }, []);
                    
                    ele.evidences = [];
                    ele.evidence_count = filteredData[0].evidence_count;

                    await Promise.all(evidenceData.map(async element => {

                        let ext = path.extname(element.filePath);
                        let obj = {};
                        obj.url = element.url;
                        obj.extension = ext;
                        ele.evidences.push(obj);

                    }));

                }

            }));

        }

    }));

    return chartData;
}


// Extract fileSourcePath, get the downloadable url from kendra service
async function getDownloadableUrlFromKendra(filesArray, token) {

    return new Promise(async function (resolve, reject) {

        try {
            let downloadableUrl = await kendraService.getDownloadableUrl(filesArray, token);

            return resolve(downloadableUrl);

        } catch (error) {
            return reject(error);
        }
    })
}


// Response object creation for allEvidences API
exports.evidenceResponseCreateFunc = async function (result) {

    let evidenceList = {
        images: [],
        videos: [],
        documents: [],
        remarks: []
    };

    await Promise.all(result.map(element => {
        
        let obj = {};
        let filePath = element.filePath;

        let extension = path.extname(filePath);

        let ext = extension.split('.').join("");


        if (filesHelper.imageFormats.includes(ext)) {

           obj.filePath = filePath;
           obj.url = element.url;
           obj.extension =  ext;
           evidenceList.images.push(obj);

        } else if ( filesHelper.videoFormats.includes(ext)){

           obj.filePath = filePath;
           obj.url = element.url;
           obj.extension =  ext;
           evidenceList.videos.push(obj);

        } else {

            obj.filePath = element.filePath;
            obj.url = element.url;
            obj.extension =  ext;
            evidenceList.documents.push(obj);
 
         }


    }))

    return evidenceList;
}
