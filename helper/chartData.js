//function for instance observation final response creation
exports.instanceReportChart = function (data) {
    var obj;
    var mutiSelectArray = []

    try {
        // obj is the response object which we are sending as a API response   
        obj = {
            entityName: data[0].event.entityName,
            observationName: data[0].event.observationName,
            observationId: data[0].event.observationId,
            entityType: data[0].event.entityType,
            entityId: data[0].event.entityId,
            response: []
        }

        for (var i = 0; i < data.length; i++) {
            // Response object creation for text type
            if (data[i].event.questionResponseType == "text") {
                var resp = {
                    question: data[i].event.questionName,
                    responseType: data[i].event.questionResponseType,
                    answers: [data[i].event.questionAnswer],
                    chart: {}
                }
                obj.response.push(resp);
            }
            // Response object creation for radio type
            else if (data[i].event.questionResponseType == "radio") {
                var resp = {
                    question: data[i].event.questionName,
                    responseType: data[i].event.questionResponseType,
                    answers: [],
                    chart: {
                        type: "pie",
                        data: [
                            {
                                data: [{
                                    name: data[i].event.questionResponseLabel,
                                    y: 100,
                                }]
                            }
                        ]
                    }
                }
                obj.response.push(resp);

            }
            // Response object creation for slider type
            else if (data[i].event.questionResponseType == "slider") {
                var resp = {
                    question: data[i].event.questionName,
                    responseType: data[i].event.questionResponseType,
                    answers: data[i].event.questionAnswer,
                    chart: {}
                }
                obj.response.push(resp);
            }
        }

        //filter all the objects whose questionResponseType is multiselect
        for (j = 0; j < data.length; j++) {
            if (data[j].event.questionResponseType == "multiselect") {
                mutiSelectArray.push(data[j])
            }
        }

        //group the multiselect questions based on their questionName
        result = mutiSelectArray.reduce(function (r, a) {
            r[a.event.questionName] = r[a.event.questionName] || [];
            r[a.event.questionName].push(a);
            return r;
        }, Object.create(null));

        var res = Object.keys(result);

        //loop the keys and construct a response object for multiselect questions
        res.forEach(ele => {
            var multiSelectResp = instanceMultiselectFunc(result[ele])
            obj.response.push(multiSelectResp);

        })

        //return final response object
        return obj;
     }
    catch (err) {
        console.log(err);
    }
}


//Function to create a response object for multiselect question (Instance level Report)
function instanceMultiselectFunc(data) {
    var dataArray = [];
    var labelArray = [];
    var valueArray = [];
    var question;
    var responseType;

    for (i = 0; i < data.length; i++) {
        if (dataArray.includes(data[i].event.questionAnswer)) {
        } else {
            dataArray.push(data[i].event.questionAnswer);
        }
        if (labelArray.includes(data[i].event.questionResponseLabel)) {
        } else {
            labelArray.push(data[i].event.questionResponseLabel);
        }
        question = data[i].event.questionName;
        responseType = data[i].event.questionResponseType;
    }

    for (j = 1; j <= dataArray.length; j++) {
        var k = 1;
        var value = (k / dataArray.length) * 100;
        value = value.toFixed(2);
        valueArray.push(value);
    }
    
    //response object for multiselect questions
    var resp = {
        question: question,
        responseType: responseType,
        answers: [],
        chart: {
            type: "bar",
            data: [
                {
                    data: valueArray
                }
            ],
            xAxis: {
                categories: labelArray,
                title: {
                    text: "Responses"
                }
            },
            yAxis: {
                title: {
                    text: "Responses in percentage"
                }
            }
        }
    }

    return resp;

}


//Function for entity Observation and observation report's final response creation
exports.entityReportChart = function (data) {
    var obj;
    var mutiSelectArray = [];
    var textArray = [];
    var radioArray = [];
    var sliderArray = [];

    try {
        // obj is the response object which we are sending as a API response  
        if(data[0].event.entityId){ 

        obj = {
            entityName: data[0].event.entityName,
            observationName: data[0].event.observationName,
            observationId: data[0].event.observationId,
            entityType: data[0].event.entityType,
            entityId: data[0].event.entityId,
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
        for (var i = 0; i < data.length; i++) {
            if (data[i].event.questionResponseType == "text") {
                textArray.push(data[i])
            }
            else if (data[i].event.questionResponseType == "radio") {
                radioArray.push(data[i])
            }
            else if (data[i].event.questionResponseType == "multiselect") {
                mutiSelectArray.push(data[i])
            }
            else if (data[i].event.questionResponseType == "slider") {
                sliderArray.push(data[i])
            }
        }

        //group the text questions based on their questionName
        textResult = groupArrayElements(textArray);

        //group the radio questions based on their questionName
        radioResult = groupArrayElements(radioArray);

        //group the multiselect questions based on their questionName
        multiSelectResult = groupArrayElements(mutiSelectArray)

        //group the multiselect questions based on their questionName
        sliderResult = groupArrayElements(sliderArray);

        var textRes = Object.keys(textResult);

        //loop the keys and construct a response object for text questions
        textRes.forEach(ele => {
            var textResponse = responseObjectCreateFunc(textResult[ele])
            obj.response.push(textResponse);

        })

        var sliderRes = Object.keys(sliderResult);
        //loop the keys and construct a response object for slider questions
        sliderRes.forEach(ele => {
            var sliderResp = responseObjectCreateFunc(sliderResult[ele])
            obj.response.push(sliderResp);
        })

        var radioRes = Object.keys(radioResult);
        //loop the keys and construct a response object for slider questions
        radioRes.forEach(ele => {
            var radioResp = radioObjectCreateFunc(radioResult[ele])
            obj.response.push(radioResp);
        })

        var multiSelectRes = Object.keys(multiSelectResult);
        //loop the keys and construct a response object for multiselect questions
        multiSelectRes.forEach(ele => {
            var multiSelectResp = multiSelectObjectCreateFunc(multiSelectResult[ele])
            obj.response.push(multiSelectResp);
        })

        return obj;
    
  }
    catch (err) {
        console.log(err);
    }

}

// Function for grouping the array based on certain field name
function groupArrayElements (array){
    result = array.reduce(function (r, a) {
        r[a.event.questionName] = r[a.event.questionName] || [];
        r[a.event.questionName].push(a);
        return r;
    }, Object.create(null));

    return result;

}

//function to create response onject for text and slider questions (Entiry Report)
function responseObjectCreateFunc(data) {
    var dataArray = [];
    var question;
    var responseType;
    
    //loop the data and push answers to oe array
    for (i = 0; i < data.length; i++) {
        dataArray.push(data[i].event.questionAnswer);
        question = data[i].event.questionName;
        responseType = data[i].event.questionResponseType;
    }

    //response object
    var resp = {
        question: question,
        responseType: responseType,
        answers: dataArray,
        chart: {}
    }
    return resp;
}


//function to create response onject for radio questions (Entiry Report)
function radioObjectCreateFunc(data) {
    var dataArray = [];
    var labelArray = [];
    var chartdata = [];
    var question;
    var responseType;

    for (var i = 0; i < data.length; i++) {
        dataArray.push(data[i].event.questionAnswer);
        if (labelArray.includes(data[i].event.questionResponseLabel)) {
        } else {
            labelArray.push(data[i].event.questionResponseLabel);
        }

        question = data[i].event.questionName;
        responseType = data[i].event.questionResponseType;

    }

    var responseArray = count(dataArray)   //call count function to count occurences of elements in the array
    responseArray = Object.entries(responseArray);  //to convert object into array

    for (var j = 0; j < responseArray.length; j++) {
        var k = 0;
        var element = responseArray[j];
        var value = (element[k + 1] / dataArray.length) * 100;
        value = value.toFixed(2);
        var dataObj = {
            name: labelArray[j],
            y: value,
        }

        chartdata.push(dataObj);
    }

    var resp = {
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
        }
    }

    return resp;
}

//function to create response onject for multiselect questions (Entiry Report)
function multiSelectObjectCreateFunc(data) {
    var dataArray = [];
    var labelArray = [];
    var chartdata = []

    //group the multiselect questions based on their observationSubmissionId
    multiSelectResult = data.reduce(function (r, a) {
        r[a.event.observationSubmissionId] = r[a.event.observationSubmissionId] || [];
        r[a.event.observationSubmissionId].push(a);
        return r;
    }, Object.create(null));

    var multiSelectRes = Object.keys(multiSelectResult);
    //loop the keys and construct a response object for multiselect questions
    multiSelectRes.forEach(ele => {
        var multiSelectResp = entityMultiselectGrouping(multiSelectResult[ele])
        dataArray.push(multiSelectResp[0]);
        labelArray.push(multiSelectResp[1]);
    })

    var dataMerged = [].concat.apply([], dataArray);   // to merger multiple arrays into single array
    var labelMerged = [].concat.apply([], labelArray);  // to merger multiple arrays into single array

    labelMerged = Array.from(new Set(labelMerged))  //remove duplicates from label array
    uniqueDataArray = Object.entries(count(dataMerged));

    for (var j = 0; j < uniqueDataArray.length; j++) {
        var k = 0;
        var element = uniqueDataArray[j];
        var value = (element[k + 1] / dataMerged.length) * 100;
        value = value.toFixed(2);
        chartdata.push(value);
    }

    var resp = {
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
                title: {
                    text: "Responses in percentage"
                }
            }
        }
    }

    return resp;

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





//=====================  assessment chart data ===============================================

exports.entityAssessmentChart = function (data) {
    try{
    var domainArray = [];
    var firstScoreArray =[];
    var secondScoreArray = [];
    var thirdScoreArray = [];
    var fourthScoreArray = [];
    
    //Store the domain Names in an array
    for (var i = 0; i < data.length; i++) {
        if (domainArray.includes(data[i].event.domainName)) {

        } else {
            domainArray.push(data[i].event.domainName);
        }
    }

    var res = groupArrayByDomainName(data);
    var dt = Object.keys(res);
    dt.forEach(element => {
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
            firstScoreArray.push(l1.event.domainNameCount);
        } else {
            firstScoreArray.push(0);
        }
        if (foundL2) {
            secondScoreArray.push(l2.event.domainNameCount);
        } else {
            secondScoreArray.push(0);
        }
        if (foundL3) {
            thirdScoreArray.push(l3.event.domainNameCount);
        } else {
            thirdScoreArray.push(0);
        }
        if (foundL4) {
            fourthScoreArray.push(l4.event.domainNameCount);
        } else {
            fourthScoreArray.push(0);
        }
    })
      
    var chartObj = {
        title: "School Perfomance report for HM",
        reportSections: [
            {
                order: 1,
                chart: {
                    type: "bar",
                    stacking: "percent",
                    title: "Criteria vs level mapping aggregated at domain level",
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
  return chartObj;
}
catch(err){
    console.log(err);
}
}

//Function for creating response object to show domainNames, criteria's and level's
exports.entityTableViewFunc = function(data){
    try{
    var dataArray = [];
    var result = groupArrayByDomainName(data);
    var res = Object.keys(result);

    res.forEach(element => {
        var tableData = tableDataCreateFunc(result[element])
        dataArray.push(tableData);
    })

    var tableObj = {
        order: 2,
        chart: {
            type: "expansion",
            title: "Descriptive view for HM for school performance",
            data: dataArray
        }
    }
return tableObj;
    }
    catch(err){
        console.log(err);
    }

}

//create criteria array based on domainName
function tableDataCreateFunc(data){
    var chartdata = {
        domainName: data[0].event.domainName,
        domainId: data[0].event.domainExternalId,
        criterias: []
    }

    for(var i=0;i < data.length; i++){
    if(data[i].event.childType == "criteria"){
        var obj ={
            name: data[i].event.childName,
            level: data[i].event.level
        }
    chartdata.criterias.push(obj);
    }
  }
 return chartdata;
}

// Function for grouping the array based on certain field name
function groupArrayByDomainName (array){
    result = array.reduce(function (r, a) {
        r[a.event.domainName] = r[a.event.domainName] || [];
        r[a.event.domainName].push(a);
        return r;
    }, Object.create(null));

    return result;
}
