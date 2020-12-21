/**
 * name : abstract.js
 * author : Deepa
 * Date : 21-December-2020
 * Description : Abstract class.
 */

 /**
    * Abstract
    * @class
*/

let Abstract = class Abstract {
  
    constructor(schema) {
      if(schema) {
        this.model = database.createModel(schema);
        this.schema = schema.name;
      }
      
    }
  };
  
  module.exports = Abstract;
  