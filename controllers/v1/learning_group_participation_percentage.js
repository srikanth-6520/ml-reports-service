const readFile = require('../v1/portal_reports/read_file')
exports.participationPercentage = async function (req, res) {
  try {
    filename = 'mantra/Learning/group_participation_percentage/group_participation_percentage.json';
    var result = await readFile.readS3File(filename);
    res.send(result);

   
  }
  catch (e) {
    console.log(e);
    res.status(500).json({ errMessage: "Internal error. Please try again!!" });
  }

};

    