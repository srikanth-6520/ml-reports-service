const authenticator = require('../middleware/authentication_service');

module.exports = function (app) {

    app.use(process.env.APPLICATION_BASE_URL, authenticator.authenticate);

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

    app.all(process.env.APPLICATION_BASE_URL + ":version/:controller/:method", router);

    app.use((req, res, next) => {
        res.status(404).send("Not found");
    });

}