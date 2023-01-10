const { ResourceType } = require("../common/enum.utils");
const rp = require('request-promise');
exports.getDistricts = async function(req,res){
    return new Promise(async function (resolve, reject) {
        try {
            let bodyParam = gen.utils.getDruidQuery("distric_level_query");
            if(req.query.resourceType == ResourceType.SOLUTION) {
                if (process.env.SOLUTION_RESOURCE_DATASOURCE_NAME) {
                    bodyParam.dataSource = process.env.SOLUTION_RESOURCE_DATASOURCE_NAME;
                }
                const solutionFilter = {
                    type: "selector",
                    dimension: "solution_id",
                    value: req.query.resourceId
                }
                bodyParam.filter.fields.push(solutionFilter)
            } else if(req.query.resourceType == ResourceType.PROGRAM) {
                if (process.env.PROGRAM_RESOURCE_DATASOURCE_NAME) {
                    bodyParam.dataSource = process.env.PROGRAM_RESOURCE_DATASOURCE_NAME;
                }
                const programFilter = {
                    type: "selector",
                    dimension: "program_id",
                    value: req.query.resourceId
                }
                bodyParam.filter.fields.push(programFilter)
            }
            let options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;
            console.log({druidConnection: options});
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
            let bodyParam = gen.utils.getDruidQuery("organisations_level_query");
            if(req.query.resourceType == ResourceType.SOLUTION) {
                if (process.env.SOLUTION_RESOURCE_DATASOURCE_NAME) {
                    bodyParam.dataSource = process.env.SOLUTION_RESOURCE_DATASOURCE_NAME;
                }
                const solutionFilter = {
                    type: "selector",
                    dimension: "solution_id",
                    value: req.query.resourceId
                }
                bodyParam.filter.fields.push(solutionFilter)
            } else if(req.query.resourceType == ResourceType.PROGRAM) {
                if (process.env.PROGRAM_RESOURCE_DATASOURCE_NAME) {
                    bodyParam.dataSource = process.env.PROGRAM_RESOURCE_DATASOURCE_NAME;
                }
                const programFilter = {
                    type: "selector",
                    dimension: "program_id",
                    value: req.query.resourceId
                }
                bodyParam.filter.fields.push(programFilter)
            }
            let options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;
            console.log({druidConnection: options});
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
            let bodyParam = gen.utils.getDruidQuery("block_level_query");
            if(req.query.resourceType == ResourceType.SOLUTION) {
                if (process.env.SOLUTION_RESOURCE_DATASOURCE_NAME) {
                    bodyParam.dataSource = process.env.SOLUTION_RESOURCE_DATASOURCE_NAME;
                }
                const solutionFilter = {
                    type: "selector",
                    dimension: "solution_id",
                    value: req.query.resourceId
                }
                bodyParam.filter.fields.push(solutionFilter)
            }else if(req.query.resourceType == ResourceType.PROGRAM) {
               if (process.env.PROGRAM_RESOURCE_DATASOURCE_NAME) {
                    bodyParam.dataSource = process.env.PROGRAM_RESOURCE_DATASOURCE_NAME;
                }
                const programFilter = {
                    type: "selector",
                    dimension: "program_id",
                    value: req.query.resourceId
                }
                bodyParam.filter.fields.push(programFilter)
            }

            const districtFilter = {
                type: "selector",
                dimension: "district_externalId",
                value: req.body.query.districtLocationId
            }
            bodyParam.filter.fields.push(districtFilter)
            let options = gen.utils.getDruidConnection();
            options.method = "POST";
            options.body = bodyParam;
            console.log({druidConnection: options});
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
