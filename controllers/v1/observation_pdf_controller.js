let instanceController = require('./instance_observation');
let entityController = require('./entity_observations');
let observationController = require('./observation_controller'); 
let entitySolutionController = require('../v2/entity_observations')
var pdfHandler = require('../../helper/common_handler');
var rimraf = require("rimraf");
var fs = require('fs');
const path = require('path');
var omit = require('object.omit');

//COntroller function for observation pdf reports
exports.observationPdfReports = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        if (req.query.entityId && req.query.entityType && req.query.observationId) {

            let resObj = await entityController.entityObservationReportPdfGeneration(req, res);
            res.send(resObj);
        }
        else if (req.query.observationId && req.query.entityId) {

            let resObj = await entityController.entityObservationPdf(req, res);
            res.send(resObj);
        }
        else if (req.query.submissionId) {

            let resObj = await instanceController.instancePdfReport(req, res);
            res.send(resObj);

        } 
        else if (req.query.observationId) {

            let resObj = await observationController.observationGenerateReport(req, res);
            res.send(resObj);

        }
        else if (req.query.entityId && req.query.entityType && req.query.solutionId) {

            let resObj = await entitySolutionController.entitySolutionReportPdfGeneration(req, res);
            res.send(resObj);
        }
        else {
            res.send({
                status: "failure",
                message: "Invalid input"
            });
        }
    })

}


//COntroller function for observation score pdf reports
exports.observationScorePdfReport = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        if (req.body && req.body.submissionId) {

            let resObj = await instanceController.instanceObservationScorePdfFunc(req, res);
            res.send(resObj);
        }

        else if (req.body && req.body.entityId && req.body.observationId) {

            let resObj = await entityController.entityObservationScorePdfFunc(req, res);
            res.send(resObj);
        }
        else if (req.body && req.body.observationId) {

            let resObj = await observationController.observationScorePdfFunc(req, res);
            res.send(resObj);
        }
        else if (req.body && req.body.solutionId && req.body.entityId && req.body.entityType) {

            let resObj = await entityController.entitySolutionScorePdfFunc(req, res);
            res.send(resObj);

        }
        else {
            res.send({
                status: "failure",
                message: "Invalid input"
            });
        }

    })


}

//Controller function for unnati pdf generation
exports.unnatiPdfGeneration = async function(req,res){

    let response = await pdfHandler.unnatiPdfGeneration(req.body,true);
    let hostname = req.headers.host;
  
    response.pdfUrl = "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + response.pdfUrl
    res.send(response);
}

//COntroller function to get the pdf report from tmp folder and then delete the folder from local storage
exports.pdftempUrl = async function (req, response) {

    try {

    var folderPath = Buffer.from(req.query.id, 'base64').toString('ascii')
    console.log(folderPath, "req", __dirname + '../' + req.query.id);
    fs.readFile(__dirname + '/../../' + folderPath + '/pdfReport.pdf', function (err, data) {
        if (!err) {

           
            response.writeHead(200, { 'Content-Type': 'application/pdf' });
            response.write(data);


            try{
                fs.readdir(__dirname + '/../../' + folderPath, (err, files) => {
                    if (err) throw err;
    
                    // console.log("files",files.length);
                    var i = 0;
                    for (const file of files) {
                        i = i +1;
                        fs.unlink(path.join(__dirname + '/../../' + folderPath, file), err => {
                            if (err) throw err;
                        });
                        // if(i==files.length){
                        //     // fs.unlink(__dirname + '/../../'+folderPath);
                        //     // console.log("path.dirname(filename).split(path.sep).pop()",path.dirname(file).split(path.sep).pop());
                        //     // fs.unlink(path.join(imgPath, ""), err => {
                        //     //     if (err) throw err;
                        //     // });
                        // }
                        
                    }
                });
                rimraf(__dirname + '/../../' + folderPath, function () { console.log("done"); });
    
            }catch(exp){

                console.log("error",exp)

            }
            response.end();
            // fs.unlink(__dirname+'/instanceLevelReport.pdf');
        } else {
            response.send("File Not Found");
            console.log(err);
        }

    });

   } catch(error){
       console.log(error);
   }
};