var instanceObserv = require('./instance_observation');
var entityObserv = require('./entity_observations');


exports.observationScorePdfReport = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        if (req.body && req.body.submissionId) {

            let resObj = await instanceObserv.instanceObservationScorePdfFunc(req, res)
        }

        else if (req.body && req.body.entityId && req.body.observationId) {

            let resObj = await entityObserv.entityObservationScorePdfFunc(req, res)
        }
        else {
            resolve({
                status: "failure",
                message: "Invalid input"
            });
        }

    })


}