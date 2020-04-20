var commonCassandraFunc = require('../../common/cassandra_func');
var pdfHandler = require('../../helper/common_handler');
var assessmentController = require('./assessments');


//Function to generate PDF for entity assessment API (For earlier version of the app)
exports.pdfReports = async function (req, res) {

    if (!req.body.entityId || !req.body.entityType || !req.body.programId || !req.body.solutionId) {
        res.status(400);
        var response = {
            result: false,
            message: 'entityId,entityType,programId,solutionId and immediateChildEntityType are required fields'
        }
        res.send(response);
    }
    else {
        reqData = req.body;
        var dataReportIndexes = await commonCassandraFunc.checkAssessmentReqInCassandra(reqData);

        if (dataReportIndexes && dataReportIndexes.downloadpdfpath) {


            dataReportIndexes.downloadpdfpath = dataReportIndexes.downloadpdfpath.replace(/^"(.*)"$/, '$1');
            let signedUlr = await pdfHandler.getSignedUrl(dataReportIndexes.downloadpdfpath);


            var response = {
                status: "success",
                message: 'Assessment Pdf Generated successfully',
                pdfUrl: signedUlr
            };
            res.send(response);

        } else {
            var assessmentRes;
            if (dataReportIndexes) {
                assessmentRes = JSON.parse(dataReportIndexes['apiresponse']);
            }
            else {
                assessmentRes = await assessmentController.assessmentReportGetChartData(req, res);
            }


            if (assessmentRes.result == true) {

                let resData = await pdfHandler.assessmentPdfGeneration(assessmentRes);

                if (dataReportIndexes) {
                    var reqOptions = {
                        query: dataReportIndexes.id,
                        downloadPath: resData.downloadPath
                    }
                    commonCassandraFunc.updateEntityAssessmentDownloadPath(reqOptions);
                } else {
                    //store download url in cassandra
                    let dataInsert = commonCassandraFunc.insertAssessmentReqAndResInCassandra(reqData, resData, resData.downloadPath);
                }

                res.send(resData);
                // res.send(omit(resData,'downloadPath'));
            }
            else {
                res.send(assessmentRes);
            }

        }
    }
};
