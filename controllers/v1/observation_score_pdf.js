let instanceObserv = require('./instance_observation');
let entityObserv = require('./entity_observations');
let observationController = require('./observation_controller'); 


exports.observationScorePdfReport = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        if (req.body && req.body.submissionId) {

            let resObj = await instanceObserv.instanceObservationScorePdfFunc(req, res)
        }

        else if (req.body && req.body.entityId && req.body.observationId) {

            let resObj = await entityObserv.entityObservationScorePdfFunc(req, res)
        }
        else if (req.body && req.body.observationId) {

            let resObj = await observationController.observationScorePdfFunc(req, res)
        }
        else {
            resolve({
                status: "failure",
                message: "Invalid input"
            });
        }

    })


}