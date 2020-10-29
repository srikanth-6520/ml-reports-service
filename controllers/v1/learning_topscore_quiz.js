const readFile = require('../v1/portal_reports/read_file')
exports.scorePercentage = async function (req, res) {
  try {
    filename = 'mantra/Learning/top_scorers_quiz_percentage/top_scorers_quiz_percentage.json';
    var result = await readFile.readS3File(filename);
    res.send(result);

   
  }
  catch (e) {
    console.log(e);
    res.status(500).json({ errMessage: "Internal error. Please try again!!" });
  }

};

    
