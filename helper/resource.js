/**
 * name : resource.js
 * author : Ankit Shahu
 * created-date : 10-April-2023
 * Description : Resource level data for program and solution.
 */


const { ResourceType, SolutionType } = require("../common/enum.utils");
const rp = require('request-promise');
const { get } = require("request");
const kendra_service = require("./kendra_service");

exports.userExtensions = async function (req,res){
    return new Promise(async function (resolve, reject) {
        try {
            let userExtensions = await kendra_service.getUserExtension(req.userDetails.token)
            if(userExtensions.status === 200){
                for(let platformCode = 0; platformCode < userExtensions.result.platformRoles.length; platformCode++){
                    if(userExtensions.result.platformRoles[platformCode].code === "PROGRAM_DESIGNER" || userExtensions.result.platformRoles[platformCode].code === "PROGRAM_MANAGER"){
                        resolve(true)
                        break;
                    }
                }
                resolve(false);
            }else{
                resolve(false);
            }
        }catch(error){
            console.log(error);
        }
})}


exports.getDistricts = async function(req,res){
    return new Promise(async function (resolve, reject) {
        try {
            let bodyParam = req.query.resourceType === ResourceType.SOLUTION ? gen.utils.getDruidQuery("solution_distric_level_query") : gen.utils.getDruidQuery("program_distric_level_query");
            if(req.query.resourceType === ResourceType.PROGRAM){
                bodyParam.dataSource = process.env.PROGRAM_RESOURCE_DATASOURCE_NAME
            }else {
                bodyParam.dataSource  = req.body.solutionType === SolutionType.PROJECT ? process.env.PROJECT_RESOURCE_DATASOURCE_NAME : req.body.solutionType === SolutionType.OBSERVATION ? process.env.OBSERVATION_RESOURCE_DATASOURCE_NAME : process.env.SURVEY_RESOURCE_DATASOURCE_NAME
            }
            const resourceFilter = {
                type: "selector",
                dimension: req.query.resourceType == ResourceType.SOLUTION ? "solution_id" : "program_id",
                value: req.query.resourceId
            }
            bodyParam.filter.fields.push(resourceFilter)
            let options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;
            let data = await rp(options);
            if(data){
                const result = data.map(district => ({ id: req.query.resourceType == ResourceType.SOLUTION ? district.event.district_externalId : district.event.district_id, name: district.event.district_name }));
                resolve(result)
            }
        }catch(err){
            res.status(400).send({
                result: false,
                message: 'INTERNAL_SERVER_ERROR'
            });
        }
    })
}

exports.getOrganisations = async function(req,res){
    return new Promise(async function (resolve, reject) {
        try {
            let bodyParam = req.query.resourceType === ResourceType.SOLUTION ? gen.utils.getDruidQuery("solution_organisations_level_query") : gen.utils.getDruidQuery("program_organisations_level_query");
            if(req.query.resourceType === ResourceType.PROGRAM){
                bodyParam.dataSource = process.env.PROGRAM_RESOURCE_DATASOURCE_NAME
            }else {
                bodyParam.dataSource  = req.body.solutionType === SolutionType.PROJECT ? process.env.PROJECT_RESOURCE_DATASOURCE_NAME : req.body.solutionType === SolutionType.OBSERVATION ? process.env.OBSERVATION_RESOURCE_DATASOURCE_NAME : process.env.SURVEY_RESOURCE_DATASOURCE_NAME
            }
            const resourceFilter = {
                type: "selector",
                dimension: req.query.resourceType == ResourceType.SOLUTION ? "solution_id" : "program_id",
                value: req.query.resourceId
            }
            bodyParam.filter.fields.push(resourceFilter)
            let options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;
            let data = await rp(options);
            if(data){
                const result = data.map(district => ({ id: district.event.organisation_id, name: district.event.organisation_name }));
                resolve(result)
            }
        }catch(err){
            res.status(400).send({
                result: false,
                message: 'INTERNAL_SERVER_ERROR'}
            );
        }
    })

}

exports.getBlocks = async function(req,res){
    return new Promise(async function (resolve, reject) {
        try {
            let bodyParam = req.query.resourceType === ResourceType.SOLUTION ? gen.utils.getDruidQuery("solution_block_level_query") : gen.utils.getDruidQuery("program_block_level_query");
            if(req.query.resourceType === ResourceType.PROGRAM){
                bodyParam.dataSource = process.env.PROGRAM_RESOURCE_DATASOURCE_NAME
            }else {
                bodyParam.dataSource  = req.body.solutionType === SolutionType.PROJECT ? process.env.PROJECT_RESOURCE_DATASOURCE_NAME : req.body.solutionType === SolutionType.OBSERVATION ? process.env.OBSERVATION_RESOURCE_DATASOURCE_NAME : process.env.SURVEY_RESOURCE_DATASOURCE_NAME
            }
            const resourceFilter = {
                type: "selector",
                dimension: req.query.resourceType == ResourceType.SOLUTION ? "solution_id" : "program_id",
                value: req.query.resourceId
            }
            bodyParam.filter.fields.push(resourceFilter)

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
                const result = data.map(block => ({ id: req.query.resourceType == ResourceType.SOLUTION ? block.event.block_externalId : block.event.block_id, name: block.event.block_name }));
                resolve(result)
            }
        }catch(err){
            res.status(400).send({
                result: false,
                message: 'INTERNAL_SERVER_ERROR'}
            );
        }
        
    })

}
