/**
 * name : common/endpoints.js
 * author : Deepa
 * Date : 24-dec-2020
 * Description : All service endpoints
 */

module.exports = {
    GET_SURVEY_SUBMISSION_STATUS : "/surveySubmissions/getStatus",
    GET_OBSERVATION_SUBMISSION_STATUS : "/observationSubmissions/status",
    GET_ENTITY_OBSERVATION_SUBMISSIONS_STATUS: "/observations/submissionStatus",
    GET_PRESIGNED_URL : "/cloud-services/files/preSignedUrls",
    GET_DOWNLOADABLE_URL : "/cloud-services/files/getDownloadableUrl",
}