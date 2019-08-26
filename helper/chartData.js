exports.instanceReportChart = function (data) {
    var obj;
    var mutiSelectArray = []

      // this is the response object which we are sending as a API response    
      obj = {
        entityName: data[0].event.entityName,
        observationName: data[0].event.observationName,
        observationId: data[0].event.observationId,
        entityType: data[0].event.entityType,
        entityId: data[0].event.entityId,
        response: []
    }
    
    for (var i = 0; i < data.length; i++) {

        if (data[i].event.questionResponseType == "text") {
            var resp = {
                question: data[i].event.questionName,
                responseType: data[i].event.questionResponseType,
                answers: [data[i].event.questionAnswer],
                chart: {}
            }
            obj.response.push(resp);
        }
        else if (data[i].event.questionResponseType == "radio") {
            var resp = {
                question: data[i].event.questionName,
                responseType: data[i].event.questionResponseType,
                answers: [],
                chart: {
                        type:"pie",
                        data:[
                        {
                        data:[{name : data[i].event.questionResponseLabel,
                        y : 100,
                        }]
                        }
                        ]
                        }
                }
            obj.response.push(resp);

        }
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
    for(j=0;j<data.length;j++){
        if(data[j].event.questionResponseType == "multiselect"){
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
           var multiSelectResp =  multiselectFunc(result[ele])
           obj.response.push(multiSelectResp);
  
       })
  
    //return final response object
    return obj;
    }


function multiselectFunc(data) {
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

    for(j=1;j<=dataArray.length;j++){
       const k = 1;
       const value = (k/dataArray.length)*100;
       valueArray.push(value);
    }

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