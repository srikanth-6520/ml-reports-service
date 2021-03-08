const pdfHandler = require('../../helper/common_handler_v2');
const assessmentController = require('./assessments');
const storePdfReportsToS3 = (!process.env.STORE_PDF_REPORTS_IN_AWS_ON_OFF || process.env.STORE_PDF_REPORTS_IN_AWS_ON_OFF != "OFF") ? "ON" : "OFF"


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
        req.body.requestToPdf = true;
        let assessmentRes = await assessmentController.assessmentReportGetChartData(req, res);
        
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
