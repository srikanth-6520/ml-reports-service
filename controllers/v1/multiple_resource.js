const readFile = require('../v1/portal_reports/read_file')
var groupBy = require('group-array')

exports.multiResource = async function (req, res) {
    try {
        var filename = 'mantra/Adoption_Dashboard/user_content_watch/user_content_watch.json';
        let resources = req.body;
        const jsonData = await readFile.readS3File(filename);
        var jdata = []
        await jsonData.forEach(data => {
            resources.forEach(item => {
                if (data.content_name == item) {
                    jdata.push(data);
                }
            });
        });
        let groupData = groupBy(jdata, 'role_externalId');
        let myKeys = Object.keys(groupData);
        let usersCount = []
        myKeys.forEach(key => {
            var grouppedData = groupBy(groupData[`${key}`], 'User_FirstName');
            var userKeys = Object.keys(grouppedData);
            var cnt = 0;
            userKeys.forEach(user => {
                if (grouppedData[`${user}`].length == resources.length) {
                    cnt++;
                }
            });
            usersCount.push({ name: key, data: cnt });
        })
        res.send(usersCount)
    }
 
catch (e) {
    console.log(e);
    res.status(500).json({ errMessage: "Internal error. Please try again!!" });
}

};

