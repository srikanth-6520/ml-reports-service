const authenticator = require('../middleware/authentication_service');

module.exports = function (app) {

    app.use(authenticator.authenticate);

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

            if (process.env.ENABLE_DEBUG_LOGGING === "ON") {
                logger.info("Requests:",{ resp: result });
            }
        } catch (err) {
            logger.info("Response:", {
                method: req.method,
                url: req.url,
                headers: req.headers,
                error: err
            });
        }
    }

    app.all("/:version/:controller/:method", router);

    app.use((req, res, next) => {
        res.status(404).send("Not found");
    });

}