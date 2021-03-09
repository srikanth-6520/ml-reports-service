const observationsHelper = require('../../helper/observations');
const assessmentsHelper = require('../../helper/assessments');
const reportsHelper = require('../../helper/reports');

exports.fetch = async function (req, res) {

    try {
       
        //  submission observation report
        if (req.body.submissionId && req.body.observation == true ) {
           let response = await instaceObservationReport(req, res);
           res.send(response);
        }

        // entity observation report
        if (req.body.entityId && req.body.observationId && req.body.observation == true) {
            let response = await entityObservationReport(req, res);
            res.send(response);
        }
        
        //survey report
        if ( req.body.survey == true ) {
           let response = await surveyReport(req, res);
           res.send(response);
        }


       
    }
    catch (err) {
        res.status(500);
        let response = {
            result: false,
            message: 'INTERNAL_SERVER_ERROR',
        }
        res.send(response);
    }
};



