const pdfHandler = require('../../helper/common_handler_v2');
const assessmentsHelper =  require('../../helper/assessments.js');

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
       
        let assessmentRes = await assessmentsHelper.assessmentReportGetChartData(req, res);
        
        if (assessmentRes.result == true) {

            let resData = await pdfHandler.assessmentPdfGeneration(assessmentRes, storeReportsToS3 = false);

            resData.pdfUrl = process.env.APPLICATION_HOST_NAME + process.env.APPLICATION_BASE_URL + "v1/observations/pdfReportsUrl?id=" + resData.pdfUrl
            res.send(resData);
        }
        else {
            res.send(assessmentRes);
        }
    }
};
