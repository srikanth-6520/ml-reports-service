const readFile = require('../v1/portal_reports/read_file')
exports.topScoreQuiz = async function (req, res) {
  try {
    filename = 'mantra/Home_Dashboard/top_scorers_quiz/top_scorers_quiz.json';
    var result = await readFile.readS3File(filename);
    res.send(result);

   
  }
  catch (e) {
    console.log(e);
    res.status(500).json({ errMessage: "Internal error. Please try again!!" });
  }

};

    


    






   

    
    


    
