const readFile = require('../v1/portal_reports/read_file')
exports.roleCount = async function (req, res) {
  try {
    filename =  'mantra/telemetry/role_content.csv';
    var result = await readFile.readS3File(filename);
    res.send(result);

   
  }
  catch (e) {
    console.log(e);
    res.status(500).json({ errMessage: "Internal error. Please try again!!" });
  }

};

    


    






   