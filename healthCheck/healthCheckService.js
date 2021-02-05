/**
 * name : healthCheckService.js.
 * author : Deepa.
 * created-date : 04-Feb-2021.
 * Description : Health check service helper functionality.
*/

// Dependencies
const { v1 : uuidv1 } = require('uuid');
const kendraHealthCheck = require("./kendra");
const assessmentHealthCheck = require("./assessment");
const druidHealthCheck = require("./druid");
const gotenbergHealthCheck = require("./gotenberg");

const obj = {
    KENDRA_SERVICE: {
        NAME: 'kendraservice.api',
        FAILED_CODE: 'KENDRA_SERVICE_HEALTH_FAILED',
        FAILED_MESSAGE: 'Kendra service is not healthy'
    },
    ASSESSMENT_SERVICE: {
        NAME: 'assessmentservice.api',
        FAILED_CODE: 'ASSESSMENT_SERVICE_HEALTH_FAILED',
        FAILED_MESSAGE: 'Assessment service is not healthy'
    },
    DRUID : {
        NAME: 'druid',
        FAILED_CODE: 'DRUID_HEALTH_FAILED',
        FAILED_MESSAGE: 'Druid server connection is not healthy'
    },
    GOTENBERG : {
        NAME: 'gotenberg',
        FAILED_CODE: 'GOTENBERG_HEALTH_FAILED',
        FAILED_MESSAGE: 'Gotenberg service is not healthy'
    },
    NAME: 'DhitiServiceHealthCheck',
    API_VERSION: '1.0'
}

let health_check = async function(req,res) {

    let checks = [];
    let kendraServiceStatus = await kendraHealthCheck.health_check();
    let assessmentServiceStatus = await assessmentHealthCheck.health_check();
    let gotenbergServiceStatus = await gotenbergHealthCheck.health_check();
    let druidServiceStatus = await druidHealthCheck.health_check();

    checks.push(checkResult("KENDRA_SERVICE",kendraServiceStatus));
    checks.push(checkResult("ASSESSMENT_SERVICE",assessmentServiceStatus));
    checks.push(checkResult('GOTENBERG',gotenbergServiceStatus));
    checks.push(checkResult('DRUID', druidServiceStatus));

    let checkServices = checks.filter( check => check.healthy === false);

    let result = {
        name : obj.NAME,
        version : obj.API_VERSION,
        healthy : checkServices.length > 0 ? false : true,
        checks : checks
    };

    let responseData = response(req,result);
    res.status(200).json(responseData);
}

let checkResult = function( serviceName,isHealthy ) {
    return {
        name : obj[serviceName].NAME,
        healthy : isHealthy,
        err : !isHealthy ?  obj[serviceName].FAILED_CODE : "",
        errMsg : !isHealthy ? obj[serviceName].FAILED_MESSAGE : ""
    }
}

let healthCheckStatus = function(req,res) {
    let responseData = response(req);
    res.status(200).json(responseData);
}

let response = function ( req,result = {} ) {
    return {
        "id" : "dhitiService.Health.API",
        "ver" : "1.0",
        "ts" : new Date(),
        "params" : {
            "resmsgid" : uuidv1(),
            "msgid" : req.headers['msgid'] || req.headers.msgid || uuidv1(),
            "status" : "successful",
            "err" : "null",
            "errMsg" : "null"
        },
        "status" : 200,
        result : result
    }
}

module.exports = {
    healthCheckStatus : healthCheckStatus,
    health_check : health_check
}