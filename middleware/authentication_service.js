/**
 * @authentication_service.js
 *
 * api related functionalities are written below
 */

/**
 * Loading Application level configuration data
 */
var config = require('../config/config.json');

/**
 * helper functions
 */

var ApiInterceptor = require('../helper/key_cloak_authentication');



/**
 * external library used in APIs
 */

var Q = require('q');
var _ = require('underscore');
var moment = require('moment');
// var http = require('http');
// var https = require('https');
var path = require('path');

var _this = this;
var api = {};
api.authenticate = authenticate;
api.validateToken = validateToken;

module.exports = api;

var keyCloakConfig = {
    authServerUrl: config.keycloak.sunbird_keycloak_auth_server_url,
    realm: config.keycloak.sunbird_keycloak_realm,
    clientId: config.keycloak.sunbird_keycloak_client_id,
    public: config.keycloak.sunbird_keycloak_public
};


var cacheConfig = {
    store: "memory",
    ttl: 1800
};

var apiInterceptor = new ApiInterceptor(keyCloakConfig, cacheConfig);


function authenticate(req, res, next) {
    console.log(req.headers)
    validateToken(req, res)
        .then(function (result) {

            if (result.status == "success") {
               
                req.userDetails = result.userDetails;
                next();

            } else {
                res.send({ status: "failed", message: result.message })
            }


        });

}


function validateToken(req, res) {

    var promise = new Promise(function (resolve, reject) {

        var token = req.headers["x-auth-token"];

        if (req.headers["x-auth-token"] && !req.path.includes("pdfReportsUrl")) {

            apiInterceptor.validateToken(token, function (err, tokenData) {

                if (tokenData) {
                    resolve({ status: "success", userDetails: tokenData });
                }
                if (err) {
                    resolve({ status: "failed", message: err });
                }
            });

        } else if (req.path.includes("pdfReportsUrl")) {

            resolve({ status: "success" });

        } else {
            
            resolve({ status: "failed", message: "x-auth-token not found in request" });
        }

    });
    return promise;
}


