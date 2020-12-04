const config = require('../../config/config');
const commonCassandraFunc = require('../../common/cassandra_func');
const pdfHandler = require('../../helper/common_handler');
const assessmentController = require('./assessments');
const storePdfReportsToS3 = (!config.store_pdf_reports_in_s3_on_off || config.store_pdf_reports_in_s3_on_off != "OFF") ? "ON" : "OFF"


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
        // reqData = req.body;
        // var dataReportIndexes = await commonCassandraFunc.checkAssessmentReqInCassandra(reqData);

        // if (dataReportIndexes && dataReportIndexes.downloadpdfpath) {


        //     dataReportIndexes.downloadpdfpath = dataReportIndexes.downloadpdfpath.replace(/^"(.*)"$/, '$1');
        //     let signedUlr = await pdfHandler.getSignedUrl(dataReportIndexes.downloadpdfpath);


        //     var response = {
        //         status: "success",
        //         message: 'Assessment Pdf Generated successfully',
        //         pdfUrl: signedUlr
        //     };
        //     res.send(response);

        // } else {
            let assessmentRes;
            // if (dataReportIndexes) {
            //     assessmentRes = JSON.parse(dataReportIndexes['apiresponse']);
            // }
            // else {
                assessmentRes = await assessmentController.assessmentReportGetChartData(req, res);
            // }


            if (assessmentRes.result == true) {

                // let storeReportsToS3 = false;
                // if(storePdfReportsToS3 == "ON"){
                //   storeReportsToS3 = true;
                // }
                
                let resData = await pdfHandler.assessmentPdfGeneration(assessmentRes, storeReportsToS3 = false);

                // if (storeReportsToS3 == false) {
                    
                    resData.pdfUrl = config.application_host_name + config.application_base_url + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
                    res.send(resData);
                // }
                // else {
                //     if (dataReportIndexes) {
                //         var reqOptions = {
                //             query: dataReportIndexes.id,
                //             downloadPath: resData.downloadPath
                //         }
                //         commonCassandraFunc.updateEntityAssessmentDownloadPath(reqOptions);
                //     } else {
                //         //store download url in cassandra
                //         let dataInsert = commonCassandraFunc.insertAssessmentReqAndResInCassandra(reqData, resData, resData.downloadPath);
                //     }

                //     //res.send(resData);
                //      res.send(omit(resData,'downloadPath'));
                // }
            }
            else {
                res.send(assessmentRes);
            }

        // }
    }
};
