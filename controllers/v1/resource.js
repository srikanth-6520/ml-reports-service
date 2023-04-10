/**
 * name : resource.js
 * author : Ankit Shahu
 * created-date : 10-April-2023
 * Description : Resource level data for program and solution.
 */


const resourceHelper = require("../../helper/resource")
const {ResourceType, ResourceTypeProjection} = require("../../common/constants")

 /**
     * @api {post} /mlreports/api/v1/resource/filtervalues?resourceType=program&resourceId=6013eab15faeea0e88a26ef5
     * List of data based on collection
     * @apiVersion 1.0.0
     * @apiGroup public
     * @apiSampleRequest /mlreports/api/v1/resource/filtervalues
     * @param {json} Request-Body:
     {
     "projection": "block",
        "query":{           // optional required for block
        "districtLocationId": "b5c35cfc-6c1e-4266-94ef-a425c43c7f4e"
        }
        "solutionType": "observation"/"survey"/"improvementProject" //Required only for resourceType=solution,
        "programId": "6013eab15faeea0e88a26efd"
      }
     * @apiParamExample {json} Response:
     * {
          "message": "Program resource fetched successfully ",
          "status": 200,
          "result": {
          "districts": [
                {
                    "id": "98ae45d7-9257-4c14-a16a-9760a442ff28",
                    "name": "PRAKASAM"
                },
                {
                    "id": "0c0391ba-610b-4796-8645-338d047b1e28",
                    "name": "TIRUVALLUR"
                }
            ],
            "organisations": [
                {
                    "id": "0126796199493140480",
                    "name": "Staging Custodian Organization"
                }
            ]  
          }
     * }   
     * @apiUse successBody
     * @apiUse errorBody
     */

    /**
      * List of data based on collection
      * @method
      * @name filtervalues
      * @returns {JSON} list of data.
    */
exports.filtervalues = async function (req, res) { 
    
    //userExtension will validate whether user have access to the program as designer or manager.
    const userExtension = await resourceHelper.userExtensions(req,res);
    if(userExtension){
        if(req.query.resourceType == ResourceType.PROGRAM || req.query.resourceType == ResourceType.SOLUTION){
            if(!req.query.resourceId){
                res.status(400).send({
                    message: "Resource id not passed"
                })
            }
            if(req.body.projection == ResourceTypeProjection.DISTRICT){
                //Gets list of district where program or solution started
                const getDistict = await resourceHelper.getDistricts( req ,res)
                //Gets list of Organisation where program or solution started
                const getOrganisation = await resourceHelper.getOrganisations(req,res)
                if(getDistict || getOrganisation){
                    const districtOrganisationResponse = {
                        message: req.query.resourceType == ResourceType.SOLUTION? "Solution details fetched successfully":"Program details fetched successfully",
                        status: "success",
                        result:{
                            districts: getDistict,
                            organisations: getOrganisation
                        }
                    }
                    res.status(200).send(districtOrganisationResponse)
                }
            } else if(req.body.projection == ResourceTypeProjection.BLOCK){
                //Gets list of block where program or solution started
                const getBlock = await resourceHelper.getBlocks( req,res )
                if(getBlock){
                    const blockResponse = {
                        message: req.query.resourceType == ResourceType.SOLUTION? "Solution details fetched successfully":"Program details fetched successfully",
                        status: "success",
                        result:{
                            block: getBlock,
                        }
                    }
                    res.status(200).send(blockResponse)
                }
            }
        }else{
            res.status(400).send({
                message: "No data found"
            })
        }
    }else {
        res.status(401).send({
            message: "You are not authorised to access this resource"
        })
    }
}
