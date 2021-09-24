/**
 * name : common/endpoints.js
 * author : Deepa
 * Date : 24-dec-2020
 * Description : All service endpoints
 */

module.exports = {
    GET_USER_PROFILE : "/v1/userExtension/getProfile",
    GET_ENTITY_LIST : "/v1/entities/list",
    GET_SURVEY_SUBMISSION_STATUS : "/v1/surveySubmissions/getStatus",
    GET_OBSERVATION_SUBMISSION_STATUS : "/v1/observationSubmissions/status",
    GET_ENTITY_OBSERVATION_SUBMISSIONS_STATUS: "/v1/observations/submissionStatus",
    OBSERVATION_DETAILS : "/v1/observations/details",
    GCP_GET_DOWNLOADABLE_URL : "/v1/cloud-services/gcp/getDownloadableUrl",
    AZURE_GET_DOWNLOADABLE_URL : "/v1/cloud-services/azure/getDownloadableUrl",
    AWS_GET_DOWNLOADABLE_URL : "/v1/cloud-services/aws/getDownloadableUrl",
    GET_PRESIGNED_URL : "/v1/cloud-services/files/preSignedUrls",
    GET_DOWNLOADABLE_URL: "/v1/cloud-services/files/getDownloadableUrl"
}