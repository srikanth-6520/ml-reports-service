const reportsHelper = require('../../helper/reports');

exports.fetch = async function (req, res) {

    try {
       
        //  submission observation report
        if (req.body.submissionId && req.body.observation == true ) {
           let response = await reportsHelper.instaceObservationReport(req, res);
           res.send(response);
        }

        // entity observation report
        if (req.body.entityId && req.body.observationId && req.body.observation == true) {
            let response = await reportsHelper.entityObservationReport(req, res);
            res.send(response);
        }
        
        //survey report
        if ( req.body.survey == true ) {
           let response = await reportsHelper.surveyReport(req, res);
           res.send(response);
        }
    
    }
    catch (err) {
        res.status(500);
        let response = {
            result: false,
            message: err.message
        }
        res.send(response);
    }
};



