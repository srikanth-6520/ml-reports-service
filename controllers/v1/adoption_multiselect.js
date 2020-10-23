var jsonResponce = require('./login_trend')
var groupBy = require('group-array')
var const_data = require('../../config/aws-config');
const auth = require('../../middleware/authentication_service');
const csv = require('csvtojson')
exports.multiSelection = async function (req, res) {
    try {
        let list1 = req.body;
        const_data['getParams']['Key'] = "mantra/compliance/loggingtrend/monthly/september_latest/logging_trend_september.csv";
        const stream = const_data['s3'].getObject(const_data['getParams']).createReadStream();
        const jsonData = await csv().fromStream(stream);
        // console.log(jsonData)
        var jdata = []
       
        var keys = Object.keys(jsonData[0]);
        console.log(keys)
        await list1.forEach(item => {
            var mydata = [];
            jsonData.forEach(data => {
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
            jdata.push(a)
        })
        
        res.send(jdata)
    }
 
catch (e) {
    console.log(e);
    res.status(500).json({ errMessage: "Internal error. Please try again!!" });
}
};