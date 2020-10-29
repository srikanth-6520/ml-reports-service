const readFile = require('./portal_reports/read_file')
exports.adoption_content = async function (req, res) {
  try {
    filename = 'mantra/Adoption_Dashboard/user_content_watch/user_content_watch.json';
    var result = await readFile.readS3File(filename);
    res.send(result);
    
   
  }
  catch (e) {
    console.log(e);
    res.status(500).json({ errMessage: "Internal error. Please try again!!" });
  }

};
