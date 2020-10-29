const readFile = require('../v1/portal_reports/read_file')
exports.multiSelection = async function (req, res) {
    try {
        let list1 = req.body;
        filename = 'mantra/Adoption_Dashboard/compliance/loggingtrend/monthly/september_latest/logging_trend_september.json';
        const jsonData = await readFile.readS3File(filename);
        var op = (jsonData);
        var jdata = []
        var keys = Object.keys(op[0]);
        await list1.forEach(item => {
            var mydata = [];
            op.forEach(data => {
                keys.forEach(key => {
                    if (item == key) {
                        mydata.push(Number(data[`${key}`]));
                        
                    }
                })
            });
            let a = {
                showInLegend: false,
                name: item,
                data: mydata
            }
            jdata.push(a);
        })
        
        res.send(jdata)
    }
 
catch (e) {
    console.log(e);
    res.status(500).json({ errMessage: "Internal error. Please try again!!" });
}
};