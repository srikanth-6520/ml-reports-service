
const path = require("path");
const filesHelper = require('../common/files_helper');

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



//Function for listing all answers of a question
exports.listALLAnswers = async function (data) {

    let result = {
        question: data[0].events[0].questionName,
        answers: [],
        completedDate: ""
    }

    data.forEach(singleEvent => {
        singleEvent.events.forEach(singleResponse => {
            result.answers.push(singleResponse.questionAnswer);
        })
    })

    let latestEvent = data[data.length - 1].events;
    result.completedDate = latestEvent[latestEvent.length - 1].completedDate;

    return result;
}

