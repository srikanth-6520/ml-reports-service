const { ResourceType } = require("../common/enum.utils");
const rp = require('request-promise');
const { get } = require("request");
const kendra_service = require("./kendra_service");

exports.userExtensions = async function (req,res){
    return new Promise(async function (resolve, reject) {
        try {
            let userExtensions = await kendra_service.getUserExtension(req.userDetails.token)
            if(userExtensions.status === 200){
                resolve(true);
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
            let bodyParam = req.query.resourceType === ResourceType.SOLUTION ? gen.utils.getDruidQuery("solution_distric_level_query") : get.utils.getDruidQuery("program_distric_level_query");
            bodyParam.dataSource = req.query.resourceType === ResourceType.SOLUTION ? process.env.SOLUTION_RESOURCE_DATASOURCE_NAME : process.env.PROGRAM_RESOURCE_DATASOURCE_NAME
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
                const result = data.map(district => ({ id: district.event.district_externalId, name: district.event.district_name }));
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

exports.getOrganisations = async function(req,res){
    return new Promise(async function (resolve, reject) {
        try {
            let bodyParam = req.query.resourceType === ResourceType.SOLUTION ? gen.utils.getDruidQuery("solution_organisations_level_query") : get.utils.getDruidQuery("program_organisations_level_query");
            bodyParam.dataSource = req.query.resourceType === ResourceType.SOLUTION ? process.env.SOLUTION_RESOURCE_DATASOURCE_NAME : process.env.PROGRAM_RESOURCE_DATASOURCE_NAME
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
            let bodyParam = req.query.resourceType === ResourceType.SOLUTION ? gen.utils.getDruidQuery("solution_block_level_query") : get.utils.getDruidQuery("program_block_level_query");
            bodyParam.dataSource = req.query.resourceType === ResourceType.SOLUTION ? process.env.SOLUTION_RESOURCE_DATASOURCE_NAME : process.env.PROGRAM_RESOURCE_DATASOURCE_NAME
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
                const result = data.map(block => ({ id: block.event.block_externalId, name: block.event.block_name }));
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
