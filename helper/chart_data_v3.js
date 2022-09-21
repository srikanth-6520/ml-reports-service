const moment = require("moment");
const path = require("path");
const filesHelper = require('../common/files_helper');
const kendraService = require('./kendra_service');
const default_no_of_assessment_submissions_threshold = 3;
const default_entity_score_api_threshold = 5;
const _ = require('lodash');

//function for instance observation final response creation
exports.instanceReportChart = async function (data, reportType = "") {
    let response;
    let multiSelectArray = [];
    let matrixArray = [];
    let order = "questionExternalId";
    let actualData = data;
    let solutionType;

    try {

        if (reportType && reportType == filesHelper.survey) {
            solutionType = filesHelper.survey;
            response = {
                result: true,
                solutionName: data[0].event.solutionName,
                reportSections: []
            }
        }
        else {
            solutionType = filesHelper.observation;
            response = {
                result: true,
                observationId: data[0].event.observationId,
                entityType: data[0].event.entityType,
                entityId: data[0].event[data[0].event.entityType],
                districtName: data[0].event.districtName,
                programName: data[0].event.programName,
                solutionName: data[0].event.solutionName,
                reportSections: []
            }
        }

        if (data[0].event.completedDate) {
            response["completedDate"] = data[0].event.completedDate;
        }

        await Promise.all(data.map(async element => {

            // Response object creation for text, slider, number and date type of questions
            if (element.event.questionResponseType == "text" && element.event.instanceParentResponsetype != "matrix" || element.event.questionResponseType == "slider" && element.event.instanceParentResponsetype != "matrix" || element.event.questionResponseType == "number" && element.event.instanceParentResponsetype != "matrix" || element.event.questionResponseType == "date" && element.event.instanceParentResponsetype != "matrix") {

                if (element.event.questionResponseType == "date") {
                    element.event.questionAnswer = await getISTDate(element.event.questionAnswer);
                }

                // If answer is null then assign value as not answered
                if (element.event.questionAnswer == null) {
                    element.event.questionAnswer = "Not Answered";
                }


                let resp = {
                    order: element.event[order],
                    question: element.event.questionName,
                    responseType: element.event.questionResponseType,
                    answers: [element.event.questionAnswer],
                    chart: {},
                    instanceQuestions: [],
                    criteriaName: element.event.criteriaName,
                    criteriaId: element.event.criteriaId
                }

                // if(element.event.remarks != null){
                //     resp.remarks = [element.event.remarks]
                // }


                response.reportSections.push(resp);
            }

            // Response object creation for radio type
            else if (element.event.questionResponseType == "radio" && element.event.instanceParentResponsetype != "matrix") {

                // If answer is null then assign value as not answered
                if (element.event.questionResponseLabel == null) {
                    element.event.questionResponseLabel = "Not Answered";
                }

                let resp = {
                    order: element.event[order],
                    question: element.event.questionName,
                    responseType: "text",
                    answers: [element.event.questionResponseLabel],
                    chart: {},
                    instanceQuestions: [],
                    criteriaName: element.event.criteriaName,
                    criteriaId: element.event.criteriaId
                }

                // if(element.event.remarks != null){
                //     resp.remarks = [element.event.remarks]
                // }

                response.reportSections.push(resp);

            }

        }))

        //filter all the objects whose questionResponseType is multiselect
        await Promise.all(data.map(element => {
            if (element.event.questionResponseType == "multiselect" && element.event.instanceParentResponsetype != "matrix") {
                multiSelectArray.push(element);
            }
            if (element.event.instanceParentResponsetype == "matrix" && element.event.questionAnswer != null) {
                matrixArray.push(element);
            }
        }))

        //group the multiselect questions based on their questionExternalId
        let multiSelectResult = await groupArrayByGivenField(multiSelectArray, "questionExternalId");
        let res = Object.keys(multiSelectResult);

        //loop the keys and construct a response object for multiselect questions
        await Promise.all(res.map(async ele => {
            let multiSelectResp = await instanceMultiselectFunc(multiSelectResult[ele])
            response.reportSections.push(multiSelectResp);

        }))

        //group the Matrix questions based on their questionExternalId
        let matrixResult = await groupArrayByGivenField(matrixArray, "instanceParentId");
        let matrixRes = Object.keys(matrixResult);

        //loop the keys of matrix array
        await Promise.all(matrixRes.map(async ele => {
            let matrixResponse = await matrixResponseObjectCreateFunc(matrixResult[ele], solutionType)
            response.reportSections.push(matrixResponse);

        }))

        //sort the response objects based on questionExternalId field
        await response.reportSections.sort(getSortOrder("order")); //Pass the attribute to be sorted on

        response.filters = [];
        if (solutionType == filesHelper.observation) {
            response.filters.push({
                order: "",
                filter: {
                    type: "segment",
                    title: "",
                    keyToSend: "criteriaWise",
                    data: ["questionWise", "criteriaWise"]
                }
            })
        }

        if (!reportType || solutionType == filesHelper.survey) {
            // Get the questions array
            let questionArray = await questionListObjectCreation(actualData);
            response.filters.push({
                order: "",
                filter: {
                    type: "modal",
                    title: "",
                    keyToSend: "questionId",
                    data: questionArray 
                }
            })
        }

        //return final response object
        return response;
    }
    catch (err) {
        console.log(err);
    }
}


//Function to create a response object for multiselect question (Instance level Report)
async function instanceMultiselectFunc(data) {
    let labelArray = [];
    let question;

    await Promise.all(data.map(element => {

        // If answer is null then assign value as not answered
        if (element.event.questionResponseLabel == null) {
            element.event.questionResponseLabel = "Not Answered";
        }

        labelArray.push(element.event.questionResponseLabel);

        question = element.event.questionName;
    }))

    //response object for multiselect questions
    let resp = {
        order: data[0].event.questionExternalId,
        question: question,
        responseType: "text",
        answers: labelArray,
        chart: {},
        instanceQuestions: [],
        criteriaName: data[0].event.criteriaName,
        criteriaId: data[0].event.criteriaId
    }

    // if(data[0].event.remarks != null){
    //     resp.remarks = [data[0].event.remarks];
    // }

    return resp;

}


//Function for entity Observation and observation report's response creation
exports.entityReportChart = async function (data, entityId, entityType, reportType) {
    let response;
    let multiSelectArray = [];
    let textArray = [];
    let radioArray = [];
    let sliderArray = [];
    let numberArray = [];
    let dateArray = [];
    let noOfSubmissions = [];
    let matrixArray = [];
    let actualData = data;
    let solutionType;
    let submissions = [];

    try {

        if (reportType == filesHelper.survey) {
            solutionType = filesHelper.survey;
            response = {
                result: true,
                solutionName: data[0].event.solutionName,
                reportSections: []
            }
        }
        else {
            solutionType = filesHelper.observation;

            response = {
                result: true,
                entityType: data[0].event.entityType,
                entityId: entityId,
                entityName: data[0].event[entityType + "Name"],
                solutionName: data[0].event.solutionName,
                observationId: data[0].event.observationId,
                districtName: data[0].event.districtName,
                programName: data[0].event.programName,
                reportSections: []
            }
        }

        if (data[0].event.completedDate) {
            response["completedDate"] = data[0].event.completedDate;
        }

        await Promise.all(data.map(element => {

            if (response.completedDate) {
                if (new Date(element.event.completedDate) > new Date(response.completedDate)) {
                    response.completedDate = element.event.completedDate;
                }
            }
            
            if (!noOfSubmissions.includes(element.event[solutionType + "SubmissionId"])) {
                noOfSubmissions.push(element.event[solutionType + "SubmissionId"]);
                submissions.push({
                    _id: element.event[solutionType + "SubmissionId"],
                    name: element.event.submissionTitle
                })
            }

            if (element.event.questionResponseType == "text" && element.event.instanceParentResponsetype != "matrix") {
                textArray.push(element)
            }
            else if (element.event.questionResponseType == "radio" && element.event.instanceParentResponsetype != "matrix") {
                radioArray.push(element)
            }
            else if (element.event.questionResponseType == "multiselect" && element.event.instanceParentResponsetype != "matrix" && element.event.questionAnswer != null) {
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

            if (element.event.instanceParentResponsetype == "matrix") {
                if (element.event.questionResponseType == "multiselect" && element.event.questionAnswer != null || element.event.questionResponseType == "radio" || element.event.questionResponseType == "text" || element.event.questionResponseType == "date" || element.event.questionResponseType == "slider" || element.event.questionResponseType == "number") {
                    matrixArray.push(element)
                }
            }
        }))

        //group the text questions based on their questionName
        textResult = await groupArrayByGivenField(textArray, "questionExternalId");

        //group the radio questions based on their questionName
        radioResult = await groupArrayByGivenField(radioArray, "questionExternalId");

        //group the multiselect questions based on their questionName
        multiSelectResult = await groupArrayByGivenField(multiSelectArray, "questionExternalId");

        //group the slider questions based on their questionName
        sliderResult = await groupArrayByGivenField(sliderArray, "questionExternalId");

        //group the number questions based on their questionName
        numberResult = await groupArrayByGivenField(numberArray, "questionExternalId");

        //group the date questions based on their questionName
        dateResult = await groupArrayByGivenField(dateArray, "questionExternalId");

        //group the Matrix questions based on their instanceParentExternalId
        matrixResult = await groupArrayByGivenField(matrixArray, "instanceParentId");

        let textRes = Object.keys(textResult);
        //loop the keys and construct a response object for text questions
        await Promise.all(textRes.map(async ele => {
            let textResponse = await responseObjectCreateFunc(textResult[ele], solutionType)
            response.reportSections.push(textResponse);

        }));

        let sliderRes = Object.keys(sliderResult);
        //loop the keys and construct a response object for slider questions
        await Promise.all(sliderRes.map(async ele => {
            let sliderResp = await responseObjectCreateFunc(sliderResult[ele], solutionType)
            response.reportSections.push(sliderResp);
        }));

        let numberRes = Object.keys(numberResult);
        //loop the keys and construct a response object for slider questions
        await Promise.all(numberRes.map(async ele => {
            let numberResp = await responseObjectCreateFunc(numberResult[ele], solutionType)
            response.reportSections.push(numberResp);
        }));

        let dateRes = Object.keys(dateResult);
        //loop the keys and construct a response object for slider questions
        await Promise.all(dateRes.map(async ele => {
            let dateResp = await responseObjectCreateFunc(dateResult[ele], solutionType)
            response.reportSections.push(dateResp);
        }))

        let radioRes = Object.keys(radioResult);
        //loop the keys and construct a response object for slider questions
        await Promise.all(radioRes.map(async ele => {
            let radioResp = await radioObjectCreateFunc(radioResult[ele], noOfSubmissions)
            response.reportSections.push(radioResp);
        }));

        let multiSelectRes = Object.keys(multiSelectResult);
        //loop the keys and construct a response object for multiselect questions
        await Promise.all(multiSelectRes.map(async ele => {
            let multiSelectResp = await multiSelectObjectCreateFunc(multiSelectResult[ele], noOfSubmissions, solutionType)
            response.reportSections.push(multiSelectResp);
        }))

        let matrixRes = Object.keys(matrixResult);
        //loop the keys of matrix array
        await Promise.all(matrixRes.map(async ele => {
            let matrixResponse = await matrixResponseObjectCreateFunc(matrixResult[ele], solutionType)
            response.reportSections.push(matrixResponse);

        }))

        response.totalSubmissions = noOfSubmissions.length;
        //sort the response objects based on questionExternalId field
        await response.reportSections.sort(getSortOrder("order")); //Pass the attribute to be sorted on

        response.filters = [];
        if (submissions.length > 1) {
            response.filters.push({
                order: "",
                filter: {
                    type: "dropdown",
                    title: "",
                    keyToSend: "submissionId",
                    data: submissions 
                }
            });
        }

        response.filters.push({
            order: "",
            filter: {
                type: "segment",
                title: "",
                keyToSend: "criteriaWise",
                data: ["questionWise","criteriaWise"] 
            }
        });

        if (!reportType || reportType == filesHelper.survey) {
            // Get the questions array
            let questionArray = await questionListObjectCreation(actualData);
            response.filters.push({
                order: "",
                filter: {
                    type: "modal",
                    title: "",
                    keyToSend: "questionId",
                    data: questionArray 
                }
            })
        }

        return response;

    }
    catch (err) {
        console.log(err);
    }

}


//matrix questions response object creation
async function matrixResponseObjectCreateFunc(data, solutionType) {
    let noOfInstances = [];
    let order = "instanceParentExternalId";

    //To get the latest edited question
    let questionObject = data.sort(custom_sort);
    let question = questionObject[questionObject.length - 1].event.instanceParentQuestion;

    let result = {
        order: data[0].event[order],
        question: question,
        responseType: data[0].event.instanceParentResponsetype,
        answers: [],
        chart: {},
        instanceQuestions: []
    }

    if (data[0].event.instanceParentCriteriaId) {
        result.criteriaName = data[0].event.instanceParentCriteriaName;
        result.criteriaId = data[0].event.instanceParentCriteriaId
    }

    let groupBySubmissionId = await groupArrayByGivenField(data, solutionType + "SubmissionId");
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
    let matrixResult = await groupArrayByGivenField(data, "questionExternalId");
    let matrixRes = Object.keys(matrixResult);

    //loop the keys and construct a response object for multiselect questions
    await Promise.all(matrixRes.map(async ele => {
        let matrixResponse = await matrixResponseObject(matrixResult[ele], instanceIdArrayData, solutionType)
        result.instanceQuestions.push(matrixResponse);

    }))

    //sort the response objects based on questionExternalId field
    await result.instanceQuestions.sort(getSortOrder("order")); //Pass the attribute to be sorted on

    return result;
}


//Create Response object for matrix type instance questions
async function matrixResponseObject(data, noOfInstances, solutionType) {

    if (data[0].event.questionResponseType == "text" || data[0].event.questionResponseType == "slider" || data[0].event.questionResponseType == "number" || data[0].event.questionResponseType == "date") {
       
        let responseObj = await responseObjectCreateFunc(data, solutionType);
        return responseObj;
    }
    else if (data[0].event.questionResponseType == "radio") {

        let responseObj = await radioObjectCreateFunc(data, noOfInstances);
        return responseObj;
    }
    else if (data[0].event.questionResponseType == "multiselect") {

        let responseObj = await multiSelectObjectCreateFunc(data, noOfInstances, solutionType);
        return responseObj;
    }
}


//function to create response object for text, number,slider,date questions (Entiry Report)
async function responseObjectCreateFunc(data, solutionType) {
    let question;
    let dataArray = [];
    //let remarks = [];

    //group the data based on submission id
    let groupBySubmissionId = await groupArrayByGivenField(data, solutionType + "SubmissionId");

    let submissionKeys = Object.keys(groupBySubmissionId);

    await Promise.all(submissionKeys.map(async element => {

        let answerArray = [];

        await Promise.all(groupBySubmissionId[element].map(async ele => {

            let answer = ele.event.questionAnswer;

            if (!answerArray.includes(answer)) {

                if (answer == null) {
                    answer = "Not answered";
                }

                if (ele.event.questionResponseType == "date") {
                    answer = await getISTDate(answer);
                }

                answerArray.push(answer);
            }
        }));

        dataArray.push(answerArray);
    }));

    //Merge multiple array into single array
    dataArray = Array.prototype.concat(...dataArray);


    //To get the latest edited question
    let questionObject = data.sort(custom_sort);
    question = questionObject[questionObject.length - 1].event.questionName;

    //response object
    let resp = {
        order: data[0].event.questionExternalId,
        question: question,
        responseType: data[0].event.questionResponseType,
        answers: dataArray,
        chart: {},
        instanceQuestions: [],
        criteriaName: data[0].event.criteriaName,
        criteriaId: data[0].event.criteriaId
    }

    return resp;
}

//function to create response object for radio questions (Entiry Report)
async function radioObjectCreateFunc(data, noOfSubmissions) {
    let dataArray = [];
    let labelArray = [];
    let chartdata = [];
    let answerArray = [];
    let question;

    for (let i = 0; i < data.length; i++) {

        if (data[i].event.questionAnswer == null) {
            data[i].event.questionAnswer = "Not answered";
        }
        if (data[i].event.questionResponseLabel == null) {
            data[i].event.questionResponseLabel = "Not answered";
        }

        dataArray.push(data[i].event.questionAnswer);
        answerArray.push(data[i].event.questionResponseLabel);

        if (!labelArray.includes(data[i].event.questionResponseLabel)) {
            labelArray.push(data[i].event.questionResponseLabel);
        } 
    }

    let responseArray = count(dataArray)   //call count function to count occurences of elements in the array
    responseArray = Object.entries(responseArray);  //to convert object into array

    for (let j = 0; j < responseArray.length; j++) {
        let k = 0;
        let element = responseArray[j];
        let value = (element[k + 1] / noOfSubmissions.length) * 100;
        value = parseFloat(value.toFixed(2));
        chartdata.push(value);
    }

    //To get the latest edited question
    let questionObject = data.sort(custom_sort);
    question = questionObject[questionObject.length - 1].event.questionName;

    let resp = {
        order: data[0].event.questionExternalId,
        question: question,
        responseType: data[0].event.questionResponseType,
        answers: [],
        chart: {
            type: "pie",
            data:{
                labels: labelArray,
                datasets: [{
                    backgroundColor: ['#FFA971', '#F6DB6C', '#98CBED', '#C9A0DA', '#5DABDC', '#88E5B0'],
                    data: chartdata
                }]
            },
            options :{
                responsive: true,
                legend: { 
                    position: "bottom", 
                     align: "start"
                }
            }
        },
        instanceQuestions: [],
        criteriaName: data[0].event.criteriaName,
        criteriaId: data[0].event.criteriaId
    }

    if ("instanceParentResponsetype" in data[0].event != null) {
        resp.answers = answerArray;
    }

    return resp;
}

//function to create response object for multiselect questions (Entiry Report)
async function multiSelectObjectCreateFunc(data, noOfSubmissions, solutionType) {
    try {
        let dataArray = [];
        let answerArray = [];
        let labelArray = [];
        let chartdata = [];
        //let remarks = [];

        await Promise.all(data.map(ele => {
            dataArray.push(ele.event.questionAnswer);

            if (!labelArray.includes(ele.event.questionResponseLabel)) {
                labelArray.push(ele.event.questionResponseLabel)
            }
        }))

        labelMerged = Array.from(new Set(labelArray))
        uniqueDataArray = Object.entries(count(dataArray));

        for (let j = 0; j < uniqueDataArray.length; j++) {
            let k = 0;
            let element = uniqueDataArray[j];
            let value = (element[k + 1] / noOfSubmissions.length) * 100;
            value = parseFloat(value.toFixed(2));
            chartdata.push(value);
        }

        //To get the latest edited question
        let questionObject = data.sort(custom_sort);
        let question = questionObject[questionObject.length - 1].event.questionName;


        let resp = {
            order: data[0].event.questionExternalId,
            question: question,
            responseType: data[0].event.questionResponseType,
            answers: [],
            chart: {
                type: "horizontalBar",
                data: {
                    labels: labelMerged,
                    datasets: [{
                            data: chartdata,
                            backgroundColor: "#de8657"
                    }]
                },
                options: {
                    legend: false,
                    scales: {
                        xAxes: [{
                            ticks: {
                                min: 0,
                                max: 100
                            },
                            scaleLabel: {
                                display: true,
                                labelString: "Responses in percentage"
                            }
                        }],
                        yAxes: [{
                            scaleLabel: {
                                display: true,
                                labelString: "Responses"
                            }
                        }],
                    }
                },            
            },
            instanceQuestions: [],
            criteriaName: data[0].event.criteriaName,
            criteriaId: data[0].event.criteriaId
        }

        // loop through objects and find remarks
        let groupArrayBySubmissions = await groupArrayByGivenField(data, solutionType + "SubmissionId");

        let submissionKeysArray = Object.keys(groupArrayBySubmissions);

        // Constructing answer array for matrix questions
        if ("instanceParentResponsetype" in data[0].event != null) {

            await Promise.all(submissionKeysArray.map(async ele => {
                var groupByInstanceId = await groupArrayByGivenField(groupArrayBySubmissions[ele], "instanceId")
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
    catch (err) {
        console.log(err);
    }
}


// to count the occurances of same elements in the array
function count(arr) {
    return arr.reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {})
}

//Create response object for listObservationNames API
exports.listObservationNamesObjectCreate = async function (data) {
    try {
        let responseObj = []

        for (let i = 0; i < data.length; i++) {
            responseObj.push(data[i].event);
        }

        return responseObj;
    }
    catch (err) {
        console.log(err);
    }
}


//===================================== chart object creation for observation scoring reports =========================

// Chart object creation for instance observation score report
exports.instanceScoreReportChartObjectCreation = async function (data, reportType) {

    let response = {
        result: true,
        totalScore: data[0].event.totalScore,
        scoreAchieved: data[0].event.scoreAchieved,
        schoolName: data[0].event.schoolName,
        districtName: data[0].event.districtName,
        solutionName: data[0].event.solutionName,
        programName: data[0].event.programName,
        reportSections: []
    }

    if (data[0].event.completedDate) {
        response["completedDate"] = data[0].event.completedDate;
    }

    //Group the objects based on the questionExternalId
    let result = await groupArrayByGivenField(data, "questionExternalId");

    let resp = Object.keys(result);

    await Promise.all(resp.map(async element => {

        let chartObject = await scoreObjectCreateFunction(result[element]);

        response.reportSections.push(chartObject);

    }))

    //sort the response objects based on questionExternalId field
    await response.reportSections.sort(getSortOrder("order")); //Pass the attribute to be sorted on

    response.filters = [{
        order: "",
        filter: {
            type: "segment",
            title: "",
            keyToSend: "criteriaWise",
            data: ["questionWise","criteriaWise"] 
        }
    }]

    if (!reportType) {
        // Get the question array
        let questionArray = await questionListObjectCreation(data);
        response.filters.push({
            order: "",
            filter: {
                type: "modal",
                title: "",
                keyToSend: "questionId",
                data: questionArray 
            }
        })
    }

    return response;
}


async function scoreObjectCreateFunction(data) {

    if (data[0].event.minScore == null) {
        data[0].event.minScore = 0;
    }

    if (data[0].event.maxScore == null) {
        data[0].event.maxScore = 0;
    }

    let scoreAchieved = (data[0].event.minScore / data[0].event.maxScore) * 100;
    scoreAchieved = parseFloat(scoreAchieved.toFixed(2));

    let scoreNotAchieved = 0;

    if (!scoreAchieved) {
        scoreAchieved = 0;
    } else {
        scoreNotAchieved = 100 - scoreAchieved
    }

    let resp = {
        order: data[0].event.questionExternalId,
        question: data[0].event.questionName,
        responseType: "pie",
        chart: {
            type: "pie",
            data: {
                labels: [data[0].event.minScore + " out of " + data[0].event.maxScore],
                datasets: [{
                    backgroundColor: [
                        "#6c4fa1",
                    ],
                    data: [scoreAchieved, scoreNotAchieved],
                    borderColor: 'black',
                }]

            }
        },
        criteriaName: data[0].event.criteriaName,
        criteriaId: data[0].event.criteriaId
    }

    return resp;
}



// Chart object creation for entity observation score report
exports.entityScoreReportChartObjectCreation = async function (data, reportType) {

    let sortedData = await data.sort(sort_objects);

    let submissionId = [];
    let responseData = [];
    let submissions = [];

    let threshold = process.env.ENTITY_SCORE_REPORT_THRESHOLD ? parseInt(process.env.ENTITY_SCORE_REPORT_THRESHOLD) : default_entity_score_api_threshold;

    if (typeof threshold !== "number") {
        throw new Error("threshold_in_entity_score_api should be integer");
    }

    await Promise.all(sortedData.map(element => {
        let submissionIdExists =submissions.find(temp=>temp._id == element.event.observationSubmissionId)

        if (!submissionIdExists) {
            submissions.push({ _id: element.event.observationSubmissionId, 
                               name: element.event.submissionTitle
                            });
        } 
        
        if (submissionId.length <= threshold) {
            if (!submissionId.includes(element.event.observationSubmissionId)) {
                submissionId.push(element.event.observationSubmissionId)
            }
        }
    }))

    let response = {
        result: true,
        entityName: data[0].event[data[0].event.entityType + "Name"],
        totalObservations: submissionId.length,
        districtName: data[0].event.districtName,
        solutionName: data[0].event.solutionName,
        programName: data[0].event.programName,
        reportSections: []
    }

    if (data[0].event.completedDate) {
        response["completedDate"] = data[0].event.completedDate;
    }

    //loop sortedData and take required json objects
    await Promise.all(sortedData.map(async objectData => {

        if (new Date(objectData.event.completedDate) > new Date(response.completedDate)) {
            response.completedDate = objectData.event.completedDate;
        }

        if (submissionId.includes(objectData.event.observationSubmissionId)) {

            responseData.push(objectData);
        }
    }))

    //group the questions based on their questionExternalId
    let groupedData = await groupArrayByGivenField(responseData, "questionExternalId");

    let groupKeys = Object.keys(groupedData);

    await Promise.all(groupKeys.map(async ele => {

        let responseObj = await entityScoreObjectCreateFunc(groupedData[ele], threshold);

        response.reportSections.push(responseObj);

    }))

    //sort the response objects using questionExternalId field
    await response.reportSections.sort(getSortOrder("order")); //Pass the attribute to be sorted on

    response.filters = [];
    if ( submissions.length > 1 ) {
        response.filters.push({
            order: "",
            filter: {
                type: "dropdown",
                title: "",
                keyToSend: "submissionId",
                data: submissions 
            },
        });
    }

    response.filters.push({
        order: "",
        filter: {
            type: "segment",
            title: "",
            keyToSend: "criteriaWise",
            data: ["questionWise","criteriaWise"] 
        }
    });

    if (!reportType) {
        // Get the question array
        let questionArray = await questionListObjectCreation(data);
        response.filters.push({
            order: "",
            filter: {
                type: "modal",
                title: "",
                keyToSend: "questionId",
                data: questionArray 
            }
        })
    }

    return response;

}


async function entityScoreObjectCreateFunc(data, threshold) {

    let seriesData = [];
    let yAxisMaxValue = 0;

    //group the questions based on their observationSubmissionId
    let groupedSubmissionData = await groupArrayByGivenField(data, "observationSubmissionId");

    let groupedSubmissionKeys = Object.keys(groupedSubmissionData);

    await Promise.all(groupedSubmissionKeys.map(async scoreData => {

        if (groupedSubmissionData[scoreData][0].event.minScore == null) {
            groupedSubmissionData[scoreData][0].event.minScore = 0;
        }

        if (seriesData.length != threshold) {
            seriesData.push(parseInt(groupedSubmissionData[scoreData][0].event.minScore));
        }

        if (groupedSubmissionData[scoreData][0].event.maxScore != null) {
            yAxisMaxValue = groupedSubmissionData[scoreData][0].event.maxScore;
        }


    }))

    let chartData = {
        order: data[0].event.questionExternalId,
        question: data[0].event.questionName,
        responseType: "bar",
        chart: {
            type: 'bar',
            data: {
                labels: [
                    "Obs1",
                    "Obs2",
                    "Obs3",
                    "Obs4",
                    "Obs5"
                ],
                datasets: [
                    {

                        data: seriesData,
                        backgroundColor: "#F6B343"
                    }]
            },
            options: {
                legend: false,
                scales: {
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'observations'
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            min: 0,
                            max: parseInt(yAxisMaxValue)
                        },

                        scaleLabel: {
                            display: true,
                            labelString: 'score'
                        }
                    }],
                }
            }
        },
        criteriaName: data[0].event.criteriaName,
        criteriaId: data[0].event.criteriaId
    }

    return chartData;
}


// Function for grouping the array based on certain field name
function groupArrayByGivenField(array, name) {
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


//Function for sorting the array in ascending order based on a key
function getSortOrder(prop) {
    return function (a, b) {
        if (a[prop] > b[prop]) {
            return 1;
        } else if (a[prop] < b[prop]) {
            return -1;
        }
        return 0;
    }
}


// question list response object creation
const questionListObjectCreation = async function (data) {
    let questionArray = [];

    //group the questions based on their questionExternalId
    let result = await groupArrayByGivenField(data, "questionExternalId");

    let groupKeys = Object.keys(result);

    await Promise.all(groupKeys.map(async element => {
        questionArray.push({
            name: result[element][0].event.questionName,
            _id: result[element][0].event.questionExternalId
        })
    }))

    await questionArray.sort(getSortOrder("questionExternalId"));

    return questionArray;

}



// Create evidenceList
exports.getEvidenceList = async function (data) {

    let filePath = [];
    let remarks = [];

    await Promise.all(data.map(element => {

        files = element.event.fileSourcePath.split(",");
        filePath.push(files);

        if (element.event.remarks != null) {
            remarks.push(element.event.remarks);
        }

    }));

    let evidenceList = Array.prototype.concat(...filePath);

    return [evidenceList, remarks];
}


//Evidence array creation function
exports.evidenceChartObjectCreation = async function (chartData, evidenceData, token) {


    let filesArray = [];
    let questionData = [];

    await Promise.all(chartData.reportSections.map(async element => {

        let filteredData = evidenceData.filter(data => element.order.includes(data.event.questionExternalId));

        if (filteredData.length > 0) {
            let result = await evidenceArrayCreation(element.order, evidenceData);

            filesArray.push(result[0]);
            questionData.push(result[1]);

        }

        if (element["instanceQuestions"] && element.instanceQuestions.length > 0) {

            await Promise.all(element.instanceQuestions.map(async ele => {

                let filteredData = evidenceData.filter(data => ele.order.includes(data.event.questionExternalId));

                if (filteredData.length > 0) {
                    let response = await evidenceArrayCreation(ele.order, evidenceData);

                    filesArray.push(response[0]);
                    questionData.push(response[1]);

                }

            }));

        }

    }));

    //merge multiple arrays into single array
    let fileSoucePaths = Array.prototype.concat(...filesArray);
    fileSoucePaths = Array.prototype.concat(...fileSoucePaths);

    let questionArray = Array.prototype.concat(...questionData);

    uniqueFilePaths = fileSoucePaths.filter(function (elem, index, self) { return index == self.indexOf(elem); })

    //get the downloadable url from kendra service    
    let downloadableUrls = await getDownloadableUrlFromKendra(uniqueFilePaths, token);

    let result = await insertEvidenceArrayToChartObject(chartData, downloadableUrls, questionArray);

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

    if (filePaths.length >  parseInt(process.env.EVIDENCE_THRESHOLD)) {
        filesArray.push(filePaths.slice(0, parseInt(process.env.EVIDENCE_THRESHOLD)));
    } else {
        filesArray.push(filePaths);
    }

    filesArray = Array.prototype.concat(...filesArray);

    let obj = {
        questionExternalId: questionExternalId,
        evidence_count: evidence_count,
        filePathsArray: filesArray
    }

    questionData.push(obj);

    return [filesArray, questionData];

}

// Insert evidence array to the corrousponding questions
async function insertEvidenceArrayToChartObject(chartData, downloadableUrls, questionData) {

    await Promise.all(chartData.reportSections.map(async ele => {

        let filteredData = questionData.filter(data => ele.order.includes(data.questionExternalId));

        if (filteredData.length > 0) {

            let evidenceData = [];

            await Promise.all(filteredData[0].filePathsArray.map(filePath => {

                let data = downloadableUrls.result.filter(evidence => [filePath].includes(evidence.filePath));
                evidenceData.push(data);

            }))

            evidenceData = Array.prototype.concat(...evidenceData);

            ele.evidences = [];
            ele.evidence_count = filteredData[0].evidence_count;

            await Promise.all(evidenceData.map(async element => {

                let ext = path.extname(element.filePath).split('.').join("");
                let obj = {};
                obj.url = element.url;
                obj.extension = ext;
                ele.evidences.push(obj);

            }));

        }

        if (ele["instanceQuestions"] && ele.instanceQuestions.length > 0) {

            await Promise.all(ele.instanceQuestions.map(async value => {

                let filteredData = questionData.filter(data => value.order.includes(data.questionExternalId));

                if (filteredData.length > 0) {

                    let evidenceData = [];

                    await Promise.all(filteredData[0].filePathsArray.map(filePath => {

                        let data = downloadableUrls.result.filter(evidence => [filePath].includes(evidence.filePath));
                        evidenceData.push(data);

                    }));

                    evidenceData = Array.prototype.concat(...evidenceData);

                    value.evidences = [];
                    value.evidence_count = filteredData[0].evidence_count;

                    await Promise.all(evidenceData.map(async element => {

                        let ext = path.extname(element.filePath).split('.').join("");
                        let obj = {};
                        obj.url = element.url;
                        obj.extension = ext;
                        value.evidences.push(obj);

                    }));

                }

            }));

        }

    }));

    await chartData.reportSections.sort(getSortOrder("order"));

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

        let ext = path.extname(filePath).split('.').join("");

        if (filesHelper.imageFormats.includes(ext)) {

            obj.filePath = filePath;
            obj.url = element.url;
            obj.extension = ext;
            evidenceList.images.push(obj);

        } else if (filesHelper.videoFormats.includes(ext)) {

            obj.filePath = filePath;
            obj.url = element.url;
            obj.extension = ext;
            evidenceList.videos.push(obj);

        } else {

            obj.filePath = element.filePath;
            obj.url = element.url;
            obj.extension = ext;
            evidenceList.documents.push(obj);

        }


    }))

    return evidenceList;
}


// Function for grouping the array based on certain field name
function groupDataByEntityId(array, name) {
    result = array.reduce(function (r, a) {
        r[a[name]] = r[a[name]] || [];
        r[a[name]].push(a);
        return r;
    }, Object.create(null));

    return result;
}

//Function to create a report based on criteria
exports.getCriteriawiseReport = async function (responseObj) {

    let responseArray = [];
    let finalResponseArray = []
    let allCriterias = []

    await Promise.all(responseObj.reportSections.map(element => {

        if (element["instanceQuestions"] && element.instanceQuestions.length > 0) {
            responseArray = [...responseArray, ...element.instanceQuestions];
        } else {
            responseArray.push(element);
        }
    }));

    let groupByCriteria = await groupDataByEntityId(responseArray, "criteriaId");

    let criteriaKeys = Object.keys(groupByCriteria);

    await Promise.all(criteriaKeys.map(ele => {

        let criteriaObj = {

            criteriaId: ele,
            criteriaName: groupByCriteria[ele][0].criteriaName,
            questionArray: groupByCriteria[ele]

        }
        
        allCriterias.push({
           _id: ele,
           name: groupByCriteria[ele][0].criteriaName
        })

        finalResponseArray.push(criteriaObj);

    }));

    responseObj.reportSections = finalResponseArray;

    if (!Array.isArray(responseObj.filters)){
        responseObj.filter = [];
    }
    
    responseObj.filters.push({
        order: "",
        filter: {
            type: "modal",
            title: "",
            keyToSend: "criteria",
            data: allCriterias 
        }
    });

    return responseObj;

}



//Report for entity level report in assessments
exports.entityLevelReportData = async function (data) {

    return new Promise(async function (resolve, reject) {

        //group the data based on completed date   
        let groupedSubmissionData = await groupArrayByGivenField(data, "completedDate");
        let submissions = [];
        let latestSubmissionId = "";

        let completedDateKeys = Object.keys(groupedSubmissionData);
        let latestDate = completedDateKeys[completedDateKeys.sort().length - 1];
        latestSubmissionId = groupedSubmissionData[latestDate][0].event.observationSubmissionId;

        await Promise.all(completedDateKeys.map(completedDateKey => {
            submissions.push({
               _id: groupedSubmissionData[completedDateKey][0].event.observationSubmissionId,
               name: groupedSubmissionData[completedDateKey][0].event.submissionTitle
            })
        }))

        let totalSubmissions = completedDateKeys.length;

        let threshold = process.env.ASSESSMENT_SUBMISSION_REPORT_THRESHOLD ? parseInt(process.env.ASSESSMENT_SUBMISSION_REPORT_THRESHOLD) : default_no_of_assessment_submissions_threshold;

        if (typeof threshold !== "number") {
            throw new Error("no_of_assessment_submissions_threshold value should be integer");
        }

        let dateArray = [];
        if (completedDateKeys.length > threshold) {

            dateArray = completedDateKeys.slice(-(threshold - 1));
            dateArray.push(completedDateKeys[0]);

            completedDateKeys = dateArray;
        }

        let response = await entityLevelReportChartCreateFunc(groupedSubmissionData, completedDateKeys.sort());

        let result = [];
        if (response.length > 0) {

            result.push(response[0]);

            //append total number of submissions value
            response[1].chart.totalSubmissions = totalSubmissions;
            result.push(response[1]);
        }

        return resolve({
            result : result,
            submissionId: latestSubmissionId,
            filters :  submissions.length > 1 ? [{
                order: "",
                filter: {
                    type: "dropdown",
                    title: "",
                    keyToSend: "submissionId",
                    data: submissions 
                },
            }] : []
            

        });
    }).
        catch(err => {
            return reject(err);
        })
}

//Chart data preparation for entity level assessment report
const entityLevelReportChartCreateFunc = async function (groupedSubmissionData, completedDateArray) {

    return new Promise(async function (resolve, reject) {

        let domainObj = {};
        let domainNameArray = [];
        let submissionDateArray = [];
        let domainCriteriaArray = [];
        let domainCriteriaObj = {};
        let heading = [];
        let dynamicLevelObj = {};
        let scoresExists = false;
        

        //loop the data and construct domain name and level object
        for (completedDate = 0; completedDate < completedDateArray.length; completedDate++) {

            let i = completedDate + 1;
            heading.push("Assess. " + i);

            let date = completedDateArray[completedDate];

            for (domain = 0; domain < groupedSubmissionData[date].length; domain++) {

                let domainData = groupedSubmissionData[date][domain];

                
                if (domainData.event.level !== null) {

                    scoresExists = true;

                    if (domainData.event.level == filesHelper.no_level_matched) {
                        domainData.event.label = filesHelper.NA;
                    }

                    if (!dynamicLevelObj[domainData.event.level]) {
                        dynamicLevelObj[domainData.event.level] = [];
                    }

                    // Domain and level object creation for chart
                    if (!domainObj[domainData.event.domainName]) {
                        domainObj[domainData.event.domainName] = {};

                        if (!domainObj[domainData.event.domainName][domainData.event.completedDate]) {
                            domainObj[domainData.event.domainName][domainData.event.completedDate] = {};

                            if (!domainObj[domainData.event.domainName][domainData.event.completedDate][domainData.event.level]) {
                                domainObj[domainData.event.domainName][domainData.event.completedDate][domainData.event.level] = 1;
                            }
                            else {
                                let level = domainObj[domainData.event.domainName][domainData.event.completedDate][domainData.event.level];
                                domainObj[domainData.event.domainName][domainData.event.completedDate][domainData.event.level] = ++level;
                            }
                        }
                        else {
                            if (!domainObj[domainData.event.domainName][domainData.event.completedDate][domainData.event.level]) {
                                domainObj[domainData.event.domainName][domainData.event.completedDate][domainData.event.level] = 1;
                            }
                            else {
                                let level = domainObj[domainData.event.domainName][domainData.event.completedDate][domainData.event.level];
                                domainObj[domainData.event.domainName][domainData.event.completedDate][domainData.event.level] = ++level;
                            }
                        }
                    } else {
                        if (!domainObj[domainData.event.domainName][domainData.event.completedDate]) {
                            domainObj[domainData.event.domainName][domainData.event.completedDate] = {};

                            if (!domainObj[domainData.event.domainName][domainData.event.completedDate][domainData.event.level]) {
                                domainObj[domainData.event.domainName][domainData.event.completedDate][domainData.event.level] = 1;
                            }
                            else {

                                let level = domainObj[domainData.event.domainName][domainData.event.completedDate][domainData.event.level];
                                domainObj[domainData.event.domainName][domainData.event.completedDate][domainData.event.level] = ++level;
                            }
                        }
                        else {
                            if (!domainObj[domainData.event.domainName][domainData.event.completedDate][domainData.event.level]) {
                                domainObj[domainData.event.domainName][domainData.event.completedDate][domainData.event.level] = 1;
                            }
                            else {

                                let level = domainObj[domainData.event.domainName][domainData.event.completedDate][domainData.event.level];
                                domainObj[domainData.event.domainName][domainData.event.completedDate][domainData.event.level] = ++level;
                            }
                        }
                    }

                    
                    let levelData = [domainData.event.label];
                    let levelsWithScores = [];
                    if(domainData.event.criteriaScore){
                        levelsWithScores = [{ level: domainData.event.label , score: domainData.event.criteriaScore }];
                    }
                    
                    

                    // Domain and criteria object creation
                    if (!domainCriteriaObj[domainData.event.domainName]) {
                        domainCriteriaObj[domainData.event.domainName] = {};

                        domainCriteriaObj[domainData.event.domainName][domainData.event.childExternalid] = {};

                        domainCriteriaObj[domainData.event.domainName][domainData.event.childExternalid][domainData.event.childName] = {};

                       
                        domainCriteriaObj[domainData.event.domainName][domainData.event.childExternalid][domainData.event.childName]["levels"] = levelData;
                        domainCriteriaObj[domainData.event.domainName][domainData.event.childExternalid][domainData.event.childName]["levelsWithScores"] = levelsWithScores;
                    }
                    else {

                        if (!domainCriteriaObj[domainData.event.domainName][domainData.event.childExternalid]) {
                            domainCriteriaObj[domainData.event.domainName][domainData.event.childExternalid] = {};

                            domainCriteriaObj[domainData.event.domainName][domainData.event.childExternalid][domainData.event.childName] = {};

                            domainCriteriaObj[domainData.event.domainName][domainData.event.childExternalid][domainData.event.childName]["levels"] =  levelData;
                            domainCriteriaObj[domainData.event.domainName][domainData.event.childExternalid][domainData.event.childName]["levelsWithScores"] =  levelsWithScores;
                        }
                        else {
                            if (!domainCriteriaObj[domainData.event.domainName][domainData.event.childExternalid][domainData.event.childName]) {
                                domainCriteriaObj[domainData.event.domainName][domainData.event.childExternalid][domainData.event.childName] = {};

                                domainCriteriaObj[domainData.event.domainName][domainData.event.childExternalid][domainData.event.childName]["levels"] = levelData;
                                domainCriteriaObj[domainData.event.domainName][domainData.event.childExternalid][domainData.event.childName]["levelsWithScores"] = levelsWithScores;
                                
                            }
                            else {

                                if (!domainCriteriaObj[domainData.event.domainName][domainData.event.childExternalid][domainData.event.childName]["levels"]) {
                                    domainCriteriaObj[domainData.event.domainName][domainData.event.childExternalid][domainData.event.childName]["levels"] = levelData;
                                    domainCriteriaObj[domainData.event.domainName][domainData.event.childExternalid][domainData.event.childName]["levelsWithScores"] = levelsWithScores;
                                }
                                else {
                                    domainCriteriaObj[domainData.event.domainName][domainData.event.childExternalid][domainData.event.childName]["levels"].push(levelData[0]);
                                    domainCriteriaObj[domainData.event.domainName][domainData.event.childExternalid][domainData.event.childName]["levelsWithScores"].push(levelsWithScores[0]);
                                }
                            }
                        }
                    }

                }
            }
        }

        // if score does not exists, return empty array
        if (scoresExists == false) {
            return resolve([]);
        }

        //loo the domain keys and construct level array for stacked bar chart
        let domainKeys = Object.keys(domainObj);
        let obj = {};

        for (domainKey = 0; domainKey < domainKeys.length; domainKey++) {

            let dateKeys = Object.keys(domainObj[domainKeys[domainKey]]);

            for (dateKey = 0; dateKey < dateKeys.length; dateKey++) {

                submissionDateArray.push(dateKeys[dateKey]);

                if (!domainNameArray.includes(domainKeys[domainKey])) {

                    domainNameArray.push(domainKeys[domainKey])

                } else {
                    domainNameArray.push("")
                }

                let levels = domainObj[domainKeys[domainKey]][dateKeys[dateKey]];

                let levelKeys = Object.keys(levels);
       
                for (level in dynamicLevelObj) {
                    if (levelKeys.includes(level)) {
                        dynamicLevelObj[level].push(levels[level]);
                    } else {
                        dynamicLevelObj[level].push(0);
                    }

                }
            }
        }

        //sort the levels
        Object.keys(dynamicLevelObj).sort().forEach(function (key) {
            obj[key] = dynamicLevelObj[key];
        });

      
        let backgroundColors = ['rgb(255, 99, 132)','rgb(54, 162, 235)','rgb(255, 206, 86)','rgb(231, 233, 237)','rgb(75, 192, 192)','rgb(151, 187, 205)','rgb(220, 220, 220)','rgb(247, 70, 74)','rgb(70, 191, 189)','rgb(253, 180, 92)','rgb(148, 159, 177)','rgb(77, 83, 96)','rgb(95, 101, 217)','rgb(170, 95, 217)','rgb(140, 48, 57)','rgb(209, 6, 40)','rgb(68, 128, 51)','rgb(125, 128, 51)','rgb(128, 84, 51)','rgb(179, 139, 11)'];
        let i = 0;
  
        let series = [];
        for (level in obj) {
            series.push({
                label: level,
                data: obj[level],
                backgroundColor: backgroundColors[i]
            })

            i++;
        }

        submissionDateArray = await getDateTime(submissionDateArray);

        let chartObj = {
            order: 1,
            domainLevelObject: domainObj,
            responseType: "horizontalBar",
            chart: {
                type: 'horizontalBar',
                title: "",
                submissionDateArray: submissionDateArray,
                data: {
                    labels: domainNameArray,
                    datasets: series,
                },
                options: {
                    title: {
                        display: true,
                        text: ""
                    },
                    scales: {
                        xAxes: [{
                            stacked: true,
                            gridLines: { display: false },
                            scaleLabel: {
                                display: true,
                                labelString: 'Criteria'
                            }
                        }],
                        yAxes: [{
                            stacked: true
                        }],
                    },
                    legend: { 
                            display: true,
                            position : "bottom" 
                        }
                }
            }
        }

        let domainCriteriaKeys = Object.keys(domainCriteriaObj);

        for (domainKey = 0; domainKey < domainCriteriaKeys.length; domainKey++) {

            let domainCriteriaObject = {
                domainName: domainCriteriaKeys[domainKey],
                criterias: []
            }

            let externalIdKeys = Object.keys(domainCriteriaObj[domainCriteriaKeys[domainKey]]);

            for (externalIdKey = 0; externalIdKey < externalIdKeys.length; externalIdKey++) {

                let criteriaKey = Object.keys(domainCriteriaObj[domainCriteriaKeys[domainKey]][externalIdKeys[externalIdKey]]);

                for (ckey = 0; ckey < criteriaKey.length; ckey++) {

                    let criteriaObj = { 
                        name: criteriaKey[ckey],
                        levels: domainCriteriaObj[domainCriteriaKeys[domainKey]][externalIdKeys[externalIdKey]][criteriaKey[ckey]].levels,
                        levelsWithScores: domainCriteriaObj[domainCriteriaKeys[domainKey]][externalIdKeys[externalIdKey]][criteriaKey[ckey]].levelsWithScores
                    }

                    domainCriteriaObject.criterias.push(criteriaObj);
                }
            }
            domainCriteriaArray.push(domainCriteriaObject);
        }

        let expansionViewObj = {
            order: 2,
            responseType: "expansion-table",
            chart: {
                type: "expansion-table",
                title: "Descriptive view",
                heading: heading,
                domains: domainCriteriaArray
            }
        };

        return resolve([chartObj, expansionViewObj]);

    }).
        catch(err => {
            return reject(err);
        })
}

//function for date conversion
const getDateTime = async function (completedDate) {

    let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let submissionDate = [];
    await Promise.all(completedDate.map(date => {
        if (date === null) {
            submissionDate.push("");
        } else {
            let dateValue = new Date(date);
            let day = dateValue.getDate();
            let month = months[dateValue.getMonth()];
            let year = dateValue.getFullYear();
            submissionDate.push(day + " " + month + " " + year);
        }
    }));

    return submissionDate;
}


//function for creating report of survey solution
exports.getSurveySolutionReport = async function (data, submissionCount) {
    return new Promise(async function (resolve, reject) {

        let result = {
            result: true,
            solutionName: data[0].event.solutionName,
            programName: data[0].event.programName,
            reportSections: [],
            questionExternalIds: []
        }

        let matrixData = [];
        let nonMatrixData = [];
        let questionFilter = [];

        await Promise.all(data.map(singleData => {

            if (!result.questionExternalIds.includes(singleData.event.questionExternalId)) {
                result.questionExternalIds.push(singleData.event.questionExternalId)
                questionFilter.push({
                    _id: singleData.event.questionExternalId,
                    name: singleData.event.questionName
                })
            }

            if (singleData.event.instanceParentResponsetype == "matrix") {
                matrixData.push(singleData)
            }
            else {
                nonMatrixData.push(singleData);
            }
        }))

        result.filters = [{
            order: "",
            filter: {
                type: "modal",
                title: "",
                keyToSend: "questionId",
                data: questionFilter 
            }
        }];

        if (matrixData.length > 0) {

            let groupedMatrixData = await groupArrayByGivenField(matrixData, "instanceParentExternalId");

            let matrixQuestionKeys = Object.keys(groupedMatrixData);

            await Promise.all(matrixQuestionKeys.map(async matrixKey => {

                let numberOfInstances = [];
                groupedMatrixData[matrixKey].map(singleMatrixObject => {
                    if (!numberOfInstances.includes(singleMatrixObject.event.instanceId)) {
                        numberOfInstances.push(singleMatrixObject.event.instanceId);
                    }
                })

                let response = {
                    order: matrixKey,
                    question: groupedMatrixData[matrixKey][0].event.instanceParentQuestion,
                    responseType: groupedMatrixData[matrixKey][0].event.instanceParentResponsetype,
                    answers: [],
                    chart: {},
                    instanceQuestions: []
                }

                let chartData = await getChartObject(groupedMatrixData[matrixKey], numberOfInstances.length);

                if (chartData.length > 0) {
                    response.instanceQuestions.push(...chartData);
                    result.reportSections.push(response);
                }
            }))
        }

        if (nonMatrixData.length > 0) {
            let chartData = await getChartObject(nonMatrixData, submissionCount);

            if (chartData.length > 0) {
                result.reportSections.push(...chartData);
            }
        }

        await result.reportSections.sort(getSortOrder("order"))
        return resolve(result);

    })
        .catch(err => {
            return reject(err);
        })
}

const getChartObject = async function (data, submissionCount) {

    return new Promise(async function (resolve, reject) {

        let response = [];

        let groupDataByQuestionId = await groupArrayByGivenField(data, "questionExternalId");

        let questionKeys = Object.keys(groupDataByQuestionId);

        await Promise.all(questionKeys.map(async questionKey => {

            let questionObject = {
                order: questionKey,
                question: groupDataByQuestionId[questionKey][0].event.questionName,
                responseType: groupDataByQuestionId[questionKey][0].event.questionResponseType,
                answers: [],
                chart: {},
                instanceQuestions: []
            }

            if (questionObject.responseType == "radio") {

                let chartDataArray = [];
                let labelArray = [];

                await Promise.all(groupDataByQuestionId[questionKey].map(singleResponse => {
                    labelArray.push(singleResponse.event.questionResponseLabel);
                    chartDataArray.push(((singleResponse.event.questionAnswerCount / submissionCount) * 100).toFixed(2))
                }))

                let chart = {
                    type: "pie",
                    data: {
                        labels: labelArray,
                        datasets: [{
                            backgroundColor: ['#FFA971', '#F6DB6C', '#98CBED', '#C9A0DA', '#5DABDC', '#88E5B0'],
                            data: chartDataArray
                        }]
                    }
                }

                questionObject.chart = chart;
                response.push(questionObject);
            }
            else if (questionObject.responseType == "multiselect") {

                let chartDataArray = [];
                let labelArray = [];

                await Promise.all(groupDataByQuestionId[questionKey].map(singleResponse => {
                    chartDataArray.push(((singleResponse.event.questionAnswerCount / submissionCount) * 100).toFixed(2));
                    labelArray.push(singleResponse.event.questionResponseLabel)
                }))

                let chart = {
                    type: "horizontalBar",
                    data: {
                        labels: labelArray,
                        datasets: [{
                                data: chartDataArray,
                                backgroundColor: "#de8657"
                        }]
                    },
                    options: {
                        legend: false,
                        scales: {
                            xAxes: [{
                                ticks: {
                                    min: 0,
                                    max: 100
                                },
                                scaleLabel: {
                                    display: true,
                                    labelString: "Responses in percentage"
                                }
                            }],
                            yAxes: [{
                                scaleLabel: {
                                    display: true,
                                    labelString: "Responses"
                                }
                            }],
                        }
                    }
                }
                questionObject.chart = chart;
                response.push(questionObject);
            }
            else {
                let sortedData = await groupDataByQuestionId[questionKey].sort(getSortOrder("completedDate"));
                await Promise.all(sortedData.map(async singleResponse => {

                    if (singleResponse.event.questionResponseType == "date") {
                        singleResponse.event.questionAnswer = await getISTDate(singleResponse.event.questionAnswer)
                    }
                    questionObject.answers.push(singleResponse.event.questionAnswer)
                }))
                questionObject.count = submissionCount;
                questionObject.completedDate = sortedData[sortedData.length - 1].event.completedDate;
                response.push(questionObject);
            }
        }))

        return resolve(response);

    })
        .catch(err => {
            return reject(err);
        })

}



const getISTDate = async function(date) {
    let d = new Date(date);
    d.setUTCHours(d.getUTCHours() + 5);
    d.setUTCMinutes(d.getUTCMinutes() + 30);
    let amOrPm = (d.getUTCHours() < 12) ? "AM" : "PM";
    let hour = (d.getUTCHours() < 12) ? d.getUTCHours() : d.getUTCHours() - 12;
    return d.getUTCDate() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCFullYear() + ' ' + hour + ':' + d.getUTCMinutes() + ':' + d.getUTCSeconds() + ' ' + amOrPm;

}

// listImprovementProjects response creation function
exports.improvementProjectsObjectCreate = async function (data) {

    let groupByCriteria = await groupArrayByGivenField(data, "criteriaId");

    let criteriaKeys = Object.keys(groupByCriteria);

    let improvementProjectSuggestions = [];

    await Promise.all(criteriaKeys.map(async element => {

        let criteriaObject = {
            criteriaId: element,
            criteriaName: groupByCriteria[element][0].event.criteriaName,
            level: groupByCriteria[element][0].event.level,
            label: groupByCriteria[element][0].event.label,
            improvementProjects: []
        }

        await Promise.all(groupByCriteria[element].map(ele => {

            if (ele.event.imp_project_title != null) {

                criteriaObject.improvementProjects.push({
                    name: ele.event.imp_project_title,
                    _id: ele.event.imp_project_id,
                    goal: ele.event.imp_project_goal,
                    externalId: ele.event.imp_project_externalId
                })
            }
        }));

        improvementProjectSuggestions.push(criteriaObject);

    }));

    return improvementProjectSuggestions;
}

// Function question response report 
exports.questionResponseReportDataObjectCreation = async function ( data, dateFilter = {} ) {
    try {
        const questionAndAnswers = [];
        const questionResponseObj = [];
        const questionArray = [];
        const filteredQuestionResponse = [];
        let uniqQuestionResponseArray= [];
       
        //getting program name and solution name from data
        const filter ={
            programName : data[0].events[0].programName,
            solutionName : data[0].events[0].solutionName,
            solutionId : data[0].events[0].solutionId,
            solutionType : data[0].events[0].solution_type,
            optionalFilters : []
        }
        //Add all optional filters applied to optionalFilters array. 
        if ( data[0].events[0].organisation_name ) {
            filter.optionalFilters.push( "Organization : " + data[0].events[0].organisation_name );
        }
        if ( data[0].events[0].user_blockName ) {
            filter.optionalFilters.push( "Block : " + data[0].events[0].user_blockName );
        }
        if ( data[0].events[0].user_districtName ) {
            filter.optionalFilters.push( "District : " + data[0].events[0].user_districtName  );
        }
        if ( _.isEmpty(dateFilter) == false ) {
            filter.dateFilters = dateFilter;
        }
        
        //each element contain data inside object events. saving events data to an array
        for ( let eventIndex = 0; eventIndex < data.length; eventIndex++) {
            const questionResponses = data[eventIndex].events;
            for ( let questionResponseIndex = 0; questionResponseIndex < questionResponses.length; questionResponseIndex++) {
                const response = {
                    domainName : questionResponses[questionResponseIndex].domainName,
                    criteriaName : questionResponses[questionResponseIndex].criteriaName,
                    questionId : questionResponses[questionResponseIndex].questionId,
                    questionName : questionResponses[questionResponseIndex].questionName,
                    questionResponseType : questionResponses[questionResponseIndex].questionResponseType,
                }

                if ( questionResponses[questionResponseIndex].questionSequenceByEcm  && questionResponses[questionResponseIndex].questionSequenceByEcm != null ) {
                    response.questionSequenceByEcm = Number(questionResponses[questionResponseIndex].questionSequenceByEcm)
                } else {
                    response.questionSequenceByEcm = null
                }

                questionResponseObj.push(response);

                const questionData = {
                    questionId : questionResponses[questionResponseIndex].questionId,
                    answer : questionResponses[questionResponseIndex].questionResponseLabel
                }
                questionArray.push(questionData)
            }
        }
    
        if ( questionResponseObj.length > 0 ) {
            uniqQuestionResponseArray =  _.uniqWith(questionResponseObj, _.isEqual);
        }
        
        //from the question array calculate score for each options of all questions
        if ( questionArray.length > 0 ) {
            //group array based on question
            const groupQuestionArray =  _.mapValues(_.groupBy(questionArray, 'questionId'),
            qlist => qlist.map(questionArray => _.omit(questionArray, 'questionId')));
           
            //generate answer report for each question 
            let questionsArray = Object.entries(groupQuestionArray)
            for ( let questionIndex = 0; questionIndex < questionsArray.length ; questionIndex++ ) {
                let item = questionsArray[questionIndex];
                const answerStat = [];
                const questionId = item[0];
                const label = _.groupBy(item[1], response => response.answer);
                let labelArray =  Object.entries(label);
                for ( let labelIndex = 0; labelIndex < labelArray.length ; labelIndex++ ) {
                    //calculate submissions for each labels
                    let currentLabel = labelArray[labelIndex];
                    const labelData = [];
                    labelData[0] = currentLabel[0];
                    labelData[1] =  currentLabel[1].length;
                    answerStat.push(labelData);
                }
                questionAndAnswers[questionId] = answerStat
            }   
        }
        
        if ( uniqQuestionResponseArray.length > 0  ) {
             //add answer evaluation data to each element in uniqQuestionResponseArray
            for ( let index = 0 ; index < uniqQuestionResponseArray.length ; index++ ) {
                let currentElementQuestionId = uniqQuestionResponseArray[index].questionId;
                uniqQuestionResponseArray[index].answerData = questionAndAnswers[currentElementQuestionId]
            }
            //filter uniqQuestionResponseArray based on domain and criteria
            const domaingrouping =  _.mapValues(_.groupBy(uniqQuestionResponseArray, 'domainName'),
            qlist => qlist.map(uniqQuestionResponseArray => _.omit(uniqQuestionResponseArray, 'domainName')));

            let domainArray = Object.entries(domaingrouping);
            for ( let domainIndex = 0; domainIndex < domainArray.length; domainIndex++ ) {
                let item = domainArray[domainIndex];
                const domainWiseObject = {};
                let arrayToGroup = item[1]
                //group criteria wise grouping
                const criteriaGrouping = _.mapValues(_.groupBy(arrayToGroup, 'criteriaName'),
                qlist => qlist.map(arrayToGroup => _.omit(arrayToGroup, 'criteriaName')));
                const criteriaArray = [];
                Object.entries(criteriaGrouping).forEach(item => {
                    const criteriaWiseObject = {
                        criteriaName : item[0],
                        questionData : item[1]
                    };
                    criteriaArray.push(criteriaWiseObject)                     
                }) 
                domainWiseObject.domain = item[0];
                domainWiseObject.criterias = criteriaArray
                filteredQuestionResponse.push(domainWiseObject);
            }
        }
        return {
            filterData : filter,
            responseData : filteredQuestionResponse
        }

    } catch (err) {
        let response = {
            result: false,
            message: err.message
          };
          return response;
    }
}