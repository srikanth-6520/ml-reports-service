const moment = require("moment");

//function for instance observation final response creation
exports.instanceReportChart = async function (data) {
    var obj;
    var multiSelectArray = [];
    var matrixArray = [];

    try {
        // obj is the response object which we are sending as a API response   
        obj = {
            entityName: data[0].event.schoolName,
            observationName: data[0].event.observationName,
            observationId: data[0].event.observationId,
            entityType: data[0].event.entityType,
            entityId: data[0].event.school,
            response: []
        }

        await Promise.all(data.map(element => {

            // Response object creation for text, slider, number and date type of questions
            if (element.event.questionResponseType == "text" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer != null || element.event.questionResponseType == "slider" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer != null || element.event.questionResponseType == "number" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer != null || element.event.questionResponseType == "date" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer != null) {
               
                if (element.event.questionResponseType == "date"){
                    element.event.questionAnswer = moment(element.event.questionAnswer).format('D MMM YYYY, h:mm:ss A');
                }

                var resp = {
                    order:element.event.questionExternalId,
                    question: element.event.questionName,
                    responseType: element.event.questionResponseType,
                    answers: [element.event.questionAnswer],
                    chart: {},
                    instanceQuestions:[]
                }
                obj.response.push(resp);
            }

            // Response object creation for radio type
            else if (element.event.questionResponseType == "radio" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer != null) {
                var resp = {
                    order:element.event.questionExternalId,
                    question: element.event.questionName,
                    responseType: "text",
                    answers: [element.event.questionResponseLabel],
                    chart: {},
                    instanceQuestions:[]
                }
                obj.response.push(resp);

            }

        }))

        //filter all the objects whose questionResponseType is multiselect
        await Promise.all(data.map(element => {
            if (element.event.questionResponseType == "multiselect" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer != null) {
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
        let matrixResult = await groupArrayByGivenField(matrixArray,"instanceParentExternalId");
        let matrixRes = Object.keys(matrixResult);

         //loop the keys of matrix array
         await Promise.all(matrixRes.map(async ele => {
            let matrixResponse = await matrixResponseObjectCreateFunc(matrixResult[ele])
            obj.response.push(matrixResponse);

        }))
        
        //sort the response objects based on questionExternalId field
        await obj.response.sort(getSortOrder("order")); //Pass the attribute to be sorted on
        
        //loop through response objects to delete order key
        // await Promise.all(obj.response.map(async ele => {
        //    delete ele.order;
    
        // }))
            
        
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
        if (labelArray.includes(element.event.questionResponseLabel)) {
        } else {
            labelArray.push(element.event.questionResponseLabel);
        }
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
exports.entityReportChart = async function (data) {
    var obj;
    var multiSelectArray = [];
    var textArray = [];
    var radioArray = [];
    var sliderArray = [];
    var numberArray = [];
    var dateArray = [];
    var noOfSubmissions = [];
    var matrixArray = [];

    try {

        // obj is the response object which we are sending as a API response  
        if(data[0].event.school){ 

        obj = {
            entityName: data[0].event.schoolName,
            observationName: data[0].event.observationName,
            observationId: data[0].event.observationId,
            entityType: data[0].event.entityType,
            entityId: data[0].event.school,
            response: []
        }
    }
    else {

        obj = {
            observationName: data[0].event.observationName,
            observationId: data[0].event.observationId,
            response: []
        }
    }

        //filter all the objects whose questionResponseType is multiselect
        await Promise.all(data.map(element => {
            if (noOfSubmissions.includes(element.event.observationSubmissionId)) {
            } else {
                noOfSubmissions.push(element.event.observationSubmissionId);
            }

            if (element.event.questionResponseType == "text" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer != null) {
                textArray.push(element)
            }
            else if (element.event.questionResponseType == "radio" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer != null) {
                radioArray.push(element)
            }
            else if (element.event.questionResponseType == "multiselect" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer != null) {
                multiSelectArray.push(element)
            }
            else if (element.event.questionResponseType == "slider" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer != null) {
                sliderArray.push(element)
            }
            else if (element.event.questionResponseType == "number" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer != null) {
                numberArray.push(element)
            }
            else if (element.event.questionResponseType == "date" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer != null) {
                dateArray.push(element)
            }
            
            if (element.event.instanceParentResponsetype == "matrix" && element.event.questionAnswer != null){
                matrixArray.push(element)
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
         matrixResult = await groupArrayByGivenField(matrixArray,"instanceParentExternalId");

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
         
        //code to remove order key from the response object
        // await Promise.all(obj.response.map(async ele => {
              
        //     // res.forEach(async ele => {
        //       delete ele.order;
    
        //     }))
            

        return obj;
    
  }
    catch (err) {
        console.log(err);
    }

}



//=============== Entity Observation Report API ======================================
exports.entityObservationReportChartObjectCreation = async function (data) {
    var obj;
    var multiSelectArray = [];
    var textArray = [];
    var radioArray = [];
    var sliderArray = [];
    var numberArray = [];
    var dateArray = [];
    var noOfSubmissions = [];
    var matrixArray = [];

    try {
    
        // obj is the response object which we are sending as a API response  
        obj = {
            observationName: data[0].event.observationName,
            observationId: data[0].event.observationId,
            response: []
        }

        //filter all the objects whose questionResponseType is multiselect
        await Promise.all(data.map(element => {
            if (noOfSubmissions.includes(element.event.observationSubmissionId)) {
            } else {
                noOfSubmissions.push(element.event.observationSubmissionId);
            }

            if (element.event.questionResponseType == "text" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer != null) {
                textArray.push(element)
            }
            else if (element.event.questionResponseType == "radio" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer !=null) {
                radioArray.push(element)
            }
            else if (element.event.questionResponseType == "multiselect" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer !=null) {
                multiSelectArray.push(element)
            }
            else if (element.event.questionResponseType == "slider" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer !=null) {
                sliderArray.push(element)
            }
            else if (element.event.questionResponseType == "number" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer !=null) {
                numberArray.push(element)
            }
            else if (element.event.questionResponseType == "date" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer !=null) {
                dateArray.push(element)
            }
            if (element.event.instanceParentResponsetype == "matrix" && element.event.questionAnswer !=null){
                matrixArray.push(element)
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
         matrixResult = await groupArrayByGivenField(matrixArray,"instanceParentExternalId");
        
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
         
        //code to remove order key from the response object
        // await Promise.all(obj.response.map(async ele => {
              
        //     // res.forEach(async ele => {
        //       delete ele.order;
    
        //     }))
            

        return obj;
    
  }
    catch (err) {
        console.log(err);
    }

}


//matrix questions response object creation
async function matrixResponseObjectCreateFunc(data){
    var noOfInstances = [];
    var obj = {
        order:data[0].event.instanceParentExternalId,
        question: data[0].event.instanceParentQuestion,
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
      
    //loop the data and push answers to oe array
     for (i = 0; i < data.length; i++) {
        dataArray.push(data[i].event.questionAnswer);
        question = data[i].event.questionName;
        order = data[i].event.questionExternalId;
        responseType = data[i].event.questionResponseType;
     }

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
        
        dataArray.push(data[i].event.questionAnswer);
        answerArray.push(data[i].event.questionResponseLabel);

        if (labelArray.includes(data[i].event.questionResponseLabel)) {
        } else {
            labelArray.push(data[i].event.questionResponseLabel);
        }
        
        order = data[i].event.questionExternalId;
        question = data[i].event.questionName;
        responseType = data[i].event.questionResponseType;

    }

    var responseArray = count(dataArray)   //call count function to count occurences of elements in the array
    responseArray = Object.entries(responseArray);  //to convert object into array

    for (var j = 0; j < responseArray.length; j++) {
        var k = 0;
        var element = responseArray[j];
        var value = (element[k + 1] / noOfSubmissions.length) * 100;
        value = parseFloat(value.toFixed(2));
        var dataObj = {
            name: labelArray[j],
            y: value,
        }

        chartdata.push(dataObj);
    }

    var resp = {
        order: order,
        question: question,
        responseType: responseType,
        answers: [],
        chart: {
            type: "pie",
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
    let chartdata = []
   
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

    var resp = {
        order: data[0].event.questionExternalId,
        question: data[0].event.questionName,
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

//Function to create data and label array for multiselect 
function entityMultiselectGrouping(data) {
    var dataArray = [];
    var labelArray = [];

    for (i = 0; i < data.length; i++) {
        if (dataArray.includes(data[i].event.questionAnswer)) {
        } else {
            dataArray.push(data[i].event.questionAnswer);
        }
        if (labelArray.includes(data[i].event.questionResponseLabel)) {
        } else {
            labelArray.push(data[i].event.questionResponseLabel);
        }
    }
     return [dataArray, labelArray];
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
        title: titleName + " Perfomance report for " + designation + " View",
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
            title: "Descriptive view for " + designation + " for " + titleName + " performance",
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

        totalScore: data[0].event.totalScore,
        scoreAchieved: data[0].event.scoreAchieved,
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

    return obj;
}


async function scoreObjectCreateFunction(data) {

    let value = (data[0].event.minScore / data[0].event.maxScore) * 100;
    value = parseFloat(value.toFixed(2));
    let dataObj = {
        name: data[0].event.questionResponseLabel,
        y: value
    }

    let resp = {
        order: data[0].event.questionExternalId,
        question: data[0].event.questionName,
        chart: {
            type: "pie",
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
exports.entityScoreReportChartObjectCreation = async function (data) {
     
    let response = [data]; 

    let sortedData = await response.sort(getSortOrder("completedDate"));

    let submissionId = [];
    let responseData = [];
    let obj = {
        schoolName : data[0].event.schoolName,
        totalObservations : 5,
        response : []
    }

    await Promise.all(sortedData.map( element => {
       
      if(submissionId.length <= 5) {
        if(!submissionId.includes(element.event.observationSubmissionId)){
               submissionId.push(element.event.observationSubmissionId)
         }
      }
    }))


    //loop sortedData and take required json objects
    await Promise.all(sortedData.map( async objectData => {
      
        if(submissionId.includes(ele.event.observationSubmissionId)){
              
             responseData.push(objectData);
        }
    }))

     //group the questions based on their questionExternalId
     let groupedData = await groupArrayByGivenField(responseData,"questionExternalId");

     let groupKeys = Object.keys(groupedData);

     await Promise.all(groupKeys.map( async ele => {

        let responseObj = await entityScoreObjectCreateFunc(groupedData[ele]);
       
          obj.response.push(responseObj);
        
        }))

      //sort the response objects using questionExternalId field
      await obj.response.sort(getSortOrder("order")); //Pass the attribute to be sorted on

      return obj;

    }



async function entityScoreObjectCreateFunc (data) {

    let seriesData = [];
    //group the questions based on their observationSubmissionId
    let groupedSubmissionData = await groupArrayByGivenField(data,"observationSubmissionId"); 

    let groupedSubmissionKeys = Object.keys(groupedSubmissionData);

    await Promise.all(groupedSubmissionKeys.map(async scoreData => {

        seriesData.push([groupedSubmissionData[scoreData][0].event.minScore]);
    
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
                labels: "obs",
                showLastLabel: true
            },
            yAxis: {
                title: {
                    text: "Score"
                }
            },

            "data": seriesData

        }
    }
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



//============================ Container APP Response object creation ==========================================

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





