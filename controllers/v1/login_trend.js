const readFile = require('../v1/portal_reports/read_file')
exports.loginTrend = async function (req, res) {
    
  try {
    filename = 'mantra/Adoption_Dashboard/compliance/loggingtrend/monthly/september_latest/logging_trend_september.json';
    var result = await readFile.readS3File(filename);
    res.send(result);

   
  }
  catch (e) {
    console.log(e);
    res.status(500).json({ errMessage: "Internal error. Please try again!!" });
  }
    
};

