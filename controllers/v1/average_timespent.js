const readFile = require('../v1/portal_reports/read_file')
exports.averageTimeSpent = async function (req, res) {
  try {
    filename = 'mantra/Home_Dashboard/timespent/avg_timespent.json';
    var result = await readFile.readS3File(filename);
    res.send(result);

   
  }
  catch (e) {
    console.log(e);
    res.status(500).json({ errMessage: "Internal error. Please try again!!" });
  }

};

    