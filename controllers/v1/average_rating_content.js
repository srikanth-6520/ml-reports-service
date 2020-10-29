const readFile = require('./portal_reports/read_file')
exports.averageRatingContent = async function (req, res) {
  try {
    filename = 'mantra/Home_Dashboard/top_content_ratings/top_content_ratings.json';
    var result = await readFile.readS3File(filename);
    res.send(result);
    
   
  }
  catch (e) {
    console.log(e);
    res.status(500).json({ errMessage: "Internal error. Please try again!!" });
  }

};

    


    






   

    
    
