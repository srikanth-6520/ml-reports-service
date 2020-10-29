const readFile = require('./portal_reports/read_file')
exports.appCount = async function (req, res) {
  try {
    filename = 'mantra/Adoption_Dashboard/compliance/loggingtrend/monthly/september_latest/daily_distinct_users_trend.json';
    var result = await readFile.readS3File(filename);
    res.send(result);
    
   
  }
  catch (e) {
    console.log(e);
    res.status(500).json({ errMessage: "Internal error. Please try again!!" });
  }

};
