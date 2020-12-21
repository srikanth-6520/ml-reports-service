/**
 * name : dhitiReports.js
 * author : Deepa
 * created-date : 21-Deepa-2020
 * Description : dhiti reports related information.
 */

// Dependencies

/**
    * DhitiReports
    * @class
*/

module.exports = class DhitiReports extends Abstract {
  
    constructor() {
        super(dhitiReportsSchema);
    }
    
    static get name() {
        return "dhitiReports";
    }

};