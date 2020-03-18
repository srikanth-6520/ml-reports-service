var pdfHandler = require('../../helper/common_handler');

//Controller function for unnati pdf generation
exports.pdfReport = async function(req,res){

    let response = await pdfHandler.unnatiPdfGeneration(req.body,true);
    let hostname = req.headers.host;
  
    response.pdfUrl = "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + response.pdfUrl
    res.send(response);
}


//Controller function for unnati monthly report pdf generation
exports.monthlyReport = async function(req,res){

    let response = await pdfHandler.unnatiMonthlyReportPdfGeneration(req.body,true);
    let hostname = req.headers.host;
  
    response.pdfUrl = "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + response.pdfUrl
    res.send(response);
}

//Controller function for unnati view full report pdf generation
exports.viewProjectReport = async function(req,res){

    let response = await pdfHandler.unnatiViewFullReportPdfGeneration(req.body,true);
    let hostname = req.headers.host;
  
    response.pdfUrl = "https://" + hostname + "/dhiti/api/v1/observations/pdfReportsUrl?id=" + response.pdfUrl
    res.send(response);
}
