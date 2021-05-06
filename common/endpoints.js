/**
 * name : common/endpoints.js
 * author : Deepa
 * Date : 24-dec-2020
 * Description : All service endpoints
 */

module.exports = {
    GET_SURVEY_SUBMISSION_STATUS : "/api/v1/surveySubmissions/getStatus",
    GET_OBSERVATION_SUBMISSION_STATUS : "/api/v1/observationSubmissions/status",
    GET_ENTITY_OBSERVATION_SUBMISSIONS_STATUS: "/api/v1/observations/submissionStatus",
    GET_PRESIGNED_URL : "/api/v1/cloud-services/files/preSignedUrls",
    GET_DOWNLOADABLE_URL : "/api/v1/cloud-services/files/getDownloadableUrl",
}