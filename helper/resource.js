/**
 * name : resource.js
 * author : Ankit Shahu
 * created-date : 10-April-2023
 * Description : Resource level data for program and solution.
 */


 const { ResourceType } = require("../common/constants");
const rp = require('request-promise');
const kendra_service = require("./kendra_service");
const utils = require("../common/utils");

//user-extension validation: this will check if user is program manager or program designer of particular porgram.
exports.userExtensions = async function (req,res){
    return new Promise(async function (resolve, reject) {
        try {
            let userExtensions = await kendra_service.getUserExtension(req.userDetails.token)
            if(userExtensions.status === 200){
                for(let platformCode = 0; platformCode < userExtensions.result.platformRoles.length; platformCode++){
                    if((userExtensions.result.platformRoles[platformCode].code === "PROGRAM_DESIGNER" || userExtensions.result.platformRoles[platformCode].code === "PROGRAM_MANAGER") && (userExtensions.result.platformRoles[platformCode].programs.includes(req.body.programId))){
                        resolve(true)
                        break;
                    }
                }
                resolve(false);
            }else{
                resolve(false);
            }
        }catch(error){
            res.status(400).send({
                result: false,
                message: err.message
            });
        }
    })
}

//this function will call druid and return all the districts to particular program or solution
exports.getDistricts = async function(req,res){
    return new Promise(async function (resolve, reject) {
        try {
            let bodyParam = req.query.resourceType === ResourceType.SOLUTION ? gen.utils.getDruidQuery("solution_distric_level_query") : gen.utils.getDruidQuery("program_distric_level_query");
            //Gets data source name based on resource type and solution type
            bodyParam.dataSource = await utils.getDataSourceName(req.query, req.body)
            //Gets Resource filter based on Resource type
            const resourceFilter = await utils.getResourceFilter(req.query)
            bodyParam.filter.fields.push(resourceFilter)
            //Gets Interval filter from previous Date to current Date "2023-05-11T00:00:00+00:00/2023-05-12T00:00:00+00:00"
            bodyParam.intervals = await utils.getIntervalFilter()
            let options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;
            let data = await rp(options);
            if(data){
                const typeOfId = req.query.resourceType == ResourceType.SOLUTION ? "district_externalId" : "district_id"
                const result = data.map(district => ({ id: district.event[typeOfId] , name: district.event.district_name }));
                resolve(result)
            }
        }catch(err){
            res.status(400).send({
                result: false,
                message: err.message
            });
        }
    })
}

//this function will call druid and return all the organisations to particular program or solution
exports.getOrganisations = async function(req,res){
    return new Promise(async function (resolve, reject) {
        try {
            let bodyParam = req.query.resourceType === ResourceType.SOLUTION ? gen.utils.getDruidQuery("solution_organisations_level_query") : gen.utils.getDruidQuery("program_organisations_level_query");
            //Gets data source name based on resource type and solution type
            bodyParam.dataSource = await utils.getDataSourceName(req.query, req.body)
            //Gets Resource filter based on Resource type
            const resourceFilter = await utils.getResourceFilter(req.query)
            bodyParam.filter.fields.push(resourceFilter)
            //Gets Interval filter from previous Date to current Date "2023-05-11T00:00:00+00:00/2023-05-12T00:00:00+00:00"
            bodyParam.intervals = await utils.getIntervalFilter()
            let options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;
            let data = await rp(options);
            if(data){
                const result = data.map(organisation => ({ id: organisation.event.organisation_id, name: organisation.event.organisation_name }));
                resolve(result)
            }
        }catch(err){
            res.status(400).send({
                result: false,
                message: err.message
            });
        }
    })

}

//this function will call druid and return all the block to particular program or solution
exports.getBlocks = async function(req,res){
    return new Promise(async function (resolve, reject) {
        try {
            let bodyParam = req.query.resourceType === ResourceType.SOLUTION ? gen.utils.getDruidQuery("solution_block_level_query") : gen.utils.getDruidQuery("program_block_level_query");
            //Gets data source name based on resource type and solution type
            bodyParam.dataSource = await utils.getDataSourceName(req.query, req.body)
            //Gets Resource filter based on Resource type
            const resourceFilter = await utils.getResourceFilter(req.query)
            bodyParam.filter.fields.push(resourceFilter)
            //Gets Interval filter from previous Date to current Date "2023-05-11T00:00:00+00:00/2023-05-12T00:00:00+00:00"
            bodyParam.intervals = await utils.getIntervalFilter()
            const districtFilter = {
                type: "selector",
                dimension: req.query.resourceType == ResourceType.SOLUTION ?  "district_externalId" : "district_id",
                value: req.body.query.districtLocationId
            }
            bodyParam.filter.fields.push(districtFilter)
            let options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;
            let data = await rp(options);
            if(data){
                const typeOfId = req.query.resourceType == ResourceType.SOLUTION ? "block_externalId" : "block_id"
                const result = data.map(block => ({ id: block.event[typeOfId] , name: block.event.block_name }));
                resolve(result)
            }
        }catch(err){
            res.status(400).send({
                result: false,
                message: err.message
            });
        }
        
    })

}
