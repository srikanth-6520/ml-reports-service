

exports.instaceObservationReport = async function (req, res) {

    let bodyParam = gen.utils.getDruidQuery("instance_observation_query");
    
    if (process.env.OBSERVATION_DATASOURCE_NAME) {
        bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
    }

    bodyParam.filter.fields[0].value = submissionId;
    
    // Push criteriaId or questionId filter based on the report Type (question wise and criteria wise)

    //pass the query get the result from druid
    let options = gen.utils.getDruidConnection();
    options.method = "POST";
    options.body = bodyParam;
    let data = await rp(options);
    
    //Decide which report to send 
    if (req.body.scoring == false && req.body.criteriaWise == false && req.body.pdf == false ) {

        return instaceReportQuestionWise;
    }

    if (req.body.scoring == true && req.body.criteriaWise == false && req.body.pdf == false && scoringSystem == "pointBased") {

        return instaceScoringReportQuestionWise;
    }

    if (req.body.scoring == false && req.body.criteriaWise == true && req.body.pdf == false ) {

        return instaceReportCriteriaWise;
    }

    if (req.body.scoring == true && req.body.criteriaWise == true && req.body.pdf == false && scoringSystem == "pointBased") {

        return instaceScoreReportCriteriaWise;
    }

    if (req.body.scoring == true && req.body.criteriaWise == false && req.body.pdf == false &&  scoringSystem !== "pointBased") {

        return instaceAssessmentScoringReport;
    }

     //For PDF reports

     if (req.body.scoring == true && req.body.criteriaWise == false && req.body.pdf == false &&  scoringSystem !== "pointBased") {

        return instaceAssessmentScoringPDFReport;
    }

     if (req.body.scoring == false && req.body.criteriaWise == false && req.body.pdf == true && scoringSystem == "pointBased") {

        return instaceReportQuestionPDFWise;
    }

    if (req.body.scoring == true && req.body.criteriaWise == false && req.body.pdf == true && scoringSystem == "pointBased") {

        return instaceScoringReportQuestionPDFWise;
    }

    if (req.body.scoring == false && req.body.criteriaWise == true && req.body.pdf == true && scoringSystem == "pointBased") {

        return instaceReportCriteriaPDFWise;
    }

    if (req.body.scoring == true && req.body.criteriaWise == true && req.body.pdf == true && scoringSystem == "pointBased") {

        return instaceScoreReportCriteriaPDFWise;
    }

}







exports.entityObservationReport = async function (req, res) {


    let bodyParam = gen.utils.getDruidQuery("Entity_observation_query");

    if (process.env.OBSERVATION_DATASOURCE_NAME) {
        bodyParam.dataSource = process.env.OBSERVATION_DATASOURCE_NAME;
    }

    bodyParam.filter.fields[0].dimension = entityType;
    bodyParam.filter.fields[0].value = req.body.entityId;
    bodyParam.filter.fields[1].value = req.body.observationId;
    
    // Push criteriaId or questionId filter based on the report Type (question wise and criteria wise)

    //pass the query get the result from druid
    let options = gen.utils.getDruidConnection();
    options.method = "POST";
    options.body = bodyParam;
    let data = await rp(options);
    
    //Decide which report to send 
    if (req.body.scoring == false && req.body.criteriaWise == false && req.body.pdf == false ) {

        return entityReportQuestionWise;
    }

    if (req.body.scoring == true && req.body.criteriaWise == false && req.body.pdf == false && scoringSystem == "pointBased") {

        return entityScoringReportQuestionWise;
    }

    if (req.body.scoring == false && req.body.criteriaWise == true && req.body.pdf == false ) {

        return entityReportCriteriaWise;
    }

    if (req.body.scoring == true && req.body.criteriaWise == true && req.body.pdf == false && scoringSystem == "pointBased") {

        return entityScoreReportCriteriaWise;
    }

    if (req.body.scoring == true && req.body.criteriaWise == false && req.body.pdf == false &&  scoringSystem !== "pointBased") {

        return entityAssessmentScoringReport;
    }

     //For PDF reports

     if (req.body.scoring == true && req.body.criteriaWise == false && req.body.pdf == false &&  scoringSystem !== "pointBased") {

        return entityAssessmentScoringPDFReport;
    }

     if (req.body.scoring == false && req.body.criteriaWise == false && req.body.pdf == true && scoringSystem == "pointBased") {

        return entityReportQuestionPDFWise;
    }

    if (req.body.scoring == true && req.body.criteriaWise == false && req.body.pdf == true && scoringSystem == "pointBased") {

        return entityScoringReportQuestionPDFWise;
    }

    if (req.body.scoring == false && req.body.criteriaWise == true && req.body.pdf == true && scoringSystem == "pointBased") {

        return entityReportCriteriaPDFWise;
    }

    if (req.body.scoring == true && req.body.criteriaWise == true && req.body.pdf == true && scoringSystem == "pointBased") {

        return entityScoreReportCriteriaPDFWise;
    }

}


exports.surveyReport = async function (req, res) {
   
    if (req.body.submissionId) {
        return submissionReport;
    }

    if (req.body.solutionId) {
        return solutionreport;
    }

}