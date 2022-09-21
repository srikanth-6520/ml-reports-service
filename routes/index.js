const authenticator = require('../middleware/authentication_service');
const pagination = require('../middleware/pagination');

module.exports = function (app) {

    app.use(authenticator.authenticate);
    app.use(pagination);

    let router = async function (req, res, next) {
        
        if (!controllers[req.params.version]) {
            next();
        }
        if (!controllers[req.params.version][req.params.controller]) {
            next();
        }
        if (!controllers[req.params.version][req.params.controller][req.params.method]) {
            next();
        }
        try {
            let result = await controllers[req.params.version][req.params.controller][req.params.method](req, res);
        } catch (err) {

        }
    }

    app.all("/:version/:controller/:method", router);
    app.all("/:version/:controller/:method/:_id", router);

    app.use((req, res, next) => {
        res.status(404).send("Not found");
    });

}