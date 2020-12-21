/**
 * name : dhitiReports.js
 * author : Deepa
 * Date : 21-Dec-2020
 * Description : Schema for dhiti reports collection.
 */

module.exports = {
    name: "dhitiReports",
    schema: {
        "submissionId" : {
            type : String,
            required : true
        },
        "s3Path" : {
            type : String,
            required : true
        },
        "reportType" : {
            type : String,
            required : true
        },
        "status" : {
            type : String,
            default : "active"
        },
        "isDeleted" : {
            type : Boolean,
            default : false
        }
    }
}