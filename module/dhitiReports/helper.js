/**
 * name : dhitiReports/helper.js
 * author : Deepa
 * Date : 21-december-2020
 * Description : All dhiti reports related information.
 */

// Dependencies

/**
    * DhitiReportsHelper
    * @class
*/
module.exports = class DhitiReportsHelper {

    /**
     * store report in db.
     * @method
     * @name create
     * @param  {submissionId}  - submission Id.
     * @param  {s3Path}  - s3 path.
     * @param {reportType} - report type
     * @returns {json} creates record in mongodb.
    */

    static create( submissionId, s3Path, reportType ) {
        return new Promise(async (resolve, reject) => {
            try {

            let result = await database.models.dhitiReports.insertMany
            ([{
               submissionId : submissionId,
               s3Path : s3Path,
               reportType: reportType
            }])
            
            return resolve({
               success: true,
               data: result
            });

            } catch (error) {
                return resolve({
                    success: false,
                    data: {}
                });
            }
        })
    }

     /**
     * get report from db.
     * @method
     * @name get
     * @param  {submissionId}  - submission Id.
     * @param  {reportType}  - report type.
     * @returns {String} - s3Path of report.
    */

    static get( submissionId, reportType ) {
        return new Promise(async (resolve, reject) => {
           try {
           
            let report = await database.models.dhitiReports.findOne
            ({
                submissionId: submissionId,
                reportType: reportType
            },{
                "s3Path" : 1
            })
            
            if (Object.keys(report).length == 0) {
                throw new Error();
            }
            
            return resolve({
               success: true,
               data: report.s3Path
            });

           } catch (error) {
               return resolve({
                   success: false,
                   data: ""
               });
            }
        })
    }
    
};