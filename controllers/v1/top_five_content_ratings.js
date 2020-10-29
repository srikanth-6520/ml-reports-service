//Program EFFECTIVNESS
const readFile = require('../v1/portal_reports/read_file')
exports.topFiveContentRatings = async function (req, res) {
  try {
    filename = 'mantra/Program_Effectiveness/top_content_ratings/top_five_content_ratings.json';
    var result = await readFile.readS3File(filename);
    res.send(result);

   
  }
  catch (e) {
    console.log(e);
    res.status(500).json({ errMessage: "Internal error. Please try again!!" });
  }

};

    


    






   

    