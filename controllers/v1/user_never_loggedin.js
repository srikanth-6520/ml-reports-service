const readFile = require('./portal_reports/read_file')
exports.userNeverLoggedIn= async function (req, res) {
  try {
    filename ='mantra/Adoption_Dashboard/users_never_logged_in/users_never_logged_in.json';
    var result = await readFile.readS3File(filename);
    res.send(result);

   
  }
  catch (e) {
    console.log(e);
    res.status(500).json({ errMessage: "Internal error. Please try again!!" });
  }

};

    


    






   

    
    


    


    