let entityController = require('./entity_observations');

//COntroller function for observation score pdf reports
exports.observationScorePdfReport = async function (req, res) {

    return new Promise(async function (resolve, reject) {

        if (req.body && req.body.entityId && req.body.observationId) {

            let resObj = await entityController.entityObservationScorePdfFunc(req, res);
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

