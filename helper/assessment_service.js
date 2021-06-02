const rp = require('request-promise');
let urlPrefix = process.env.ML_SURVEY_SERVICE_URL;
const request = require('request');

//Function to get user profile
async function getUserProfile(createdBy, token) {

  return new Promise(async function (resolve, reject) {

    let options = {
      method: "GET",
      json: true,
      headers: {
        "x-authenticated-user-token": token,
        "Content-Type": "application/json",
      },
      uri: urlPrefix + endpoints.GET_USER_PROFILE + "/" + createdBy
    }

    rp(options)
      .then(result => {
        return resolve(result);
      })
      .catch(err => {
        return reject(err);
      })

  });
}

//function to make a call to samiksha assessment entities list API
async function getEntityList(entityId, childType, token) {

  return new Promise(async function (resolve) {
    let options = {
      method: "GET",
      json: true,
      headers: {
        "Content-Type": "application/json",
        "X-authenticated-user-token": token
      },
      uri: urlPrefix + endpoints.GET_ENTITY_LIST + "/" + entityId + "?type=" + childType
    }

    rp(options).then(function (resp) {
      return resolve(resp);

    }).catch(function (err) {
      return resolve(err);
    })

  });
}


//function to make a call to samiksha assessment entities list API
async function getSurveySubmissionStatusById(submissionId, token) {

  return new Promise(async function (resolve) {
    let options = {
      method: "GET",
      json: true,
      headers: {
        "Content-Type": "application/json",
        "X-authenticated-user-token": token
      },
      uri: urlPrefix + endpoints.GET_SURVEY_SUBMISSION_STATUS + "/" + submissionId
    }

    rp(options).then(function (resp) {
      return resolve(resp);

    }).catch(function (err) {
      return resolve(err);
    })

  });
}

//function to make a call to samiksha assessment entities list API
async function getObservationSubmissionStatusById(submissionId, token) {

  return new Promise(async function (resolve) {
    let options = {
      method: "GET",
      json: true,
      headers: {
        "Content-Type": "application/json",
        "X-authenticated-user-token": token
      },
      uri: urlPrefix + endpoints.GET_OBSERVATION_SUBMISSION_STATUS + "/" + submissionId
    }

    rp(options).then(function (resp) {
      return resolve(resp);

    }).catch(function (err) {
      return resolve(err);
    })

  });
}

//function to get  status of submissions for the given entity and observationId
async function getEntityObservationSubmissionsStatus(entityId, observationId, token) {

  return new Promise(async function (resolve) {
    let options = {
      method: "GET",
      json: true,
      headers: {
        "Content-Type": "application/json",
        "X-authenticated-user-token": token
      },
      uri: urlPrefix + endpoints.GET_ENTITY_OBSERVATION_SUBMISSIONS_STATUS + "/" + observationId + "?entityId=" + entityId
    }

    rp(options).then(function (resp) {
      return resolve(resp);

    }).catch(function (err) {
      return resolve(err);
    })

  });
}


//Function to get total entities 
async function getTotalEntities(observationId, token) {

  return new Promise(async function (resolve) {
    let options = {
      method: "GET",
      json: true,
      headers: {
        "Content-Type": "application/json",
        "X-authenticated-user-token": token
      },
      uri: urlPrefix + endpoints.OBSERVATION_DETAILS + "/" + observationId
    }

    rp(options).then(function (resp) {
      return resolve(resp);

    }).catch(function (err) {
      return resolve(err);
    })

  });
}

module.exports = {
  getUserProfile: getUserProfile,
  getEntityList: getEntityList,
  getSurveySubmissionStatusById: getSurveySubmissionStatusById,
  getObservationSubmissionStatusById: getObservationSubmissionStatusById,
  getEntityObservationSubmissionsStatus: getEntityObservationSubmissionsStatus,
  getTotalEntities: getTotalEntities
}