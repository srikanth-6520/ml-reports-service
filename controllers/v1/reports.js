const reportsHelper = require('../../helper/reports');

exports.fetch = async function (req, res) {

    try {
       
        //  submission observation report
        if (req.body.submissionId && req.body.observation == true ) {
            console.log({instaceObservationReport: 'executed'});
           let response = await reportsHelper.instaceObservationReport(req, res);
           console.log(response, "instaceObservationReport response")
           res.send(response);

        } else if (req.body.entityId && req.body.observationId && req.body.observation == true) {    // entity observation report
            let response = await reportsHelper.entityObservationReport(req, res);
            console.log(response, "entityObservationReport response");
            res.send(response);
            

        } else if ( req.body.survey == true ) {
           let response = await reportsHelper.surveyReport(req, res);
           console.log(response, "surveyReport response");
           res.send(response);

        } else {
            console.log("Response:",{ resp: "Report can't be generated for the given invalid request" });
            res.send({
                result: false,
                message: "Report can't be generated for the given invalid request"
            });
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



