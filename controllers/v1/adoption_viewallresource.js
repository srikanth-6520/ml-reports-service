var const_data = require('../../config/aws-config');
const auth = require('../../middleware/authentication_service');
const csv = require('csvtojson');
var fs = require('fs');
const groupBy = require('group-array');

exports.adoption = async function (req, res) {
  try {
    let resources = req.body;
    const_data['getParams']['Key'] = "mantra/user_content/user_content_watch.csv";
    const stream = const_data['s3'].getObject(const_data['getParams']).createReadStream();
    const jsonData = await csv().fromStream(stream);
    var jdata = [];
    await jsonData.forEach((data) => {
      resources.forEach((item) => {
        if (data.content_name == item) {
          jdata.push(data);
        }
      });
    });
    let groupData = groupBy(jdata, 'role_externalId');
    let myKeys = Object.keys(groupData);
    let usersCount = [];
    myKeys.forEach((key) => {
      var grouppedData = groupBy(groupData[`${key}`], 'User_FirstName');
      var userKeys = Object.keys(grouppedData);
      var cnt = 0;
      userKeys.forEach((user) => {
        if (grouppedData[`${user}`].length == resources.length) {
          cnt++;
          console.log(grouppedData[`${user}`].length);
        }
      });
      usersCount.push({
        name: key,
        data: cnt,
        
      });
    });
    res.send(usersCount);
  } catch (e) {
    console.log(e);
  }
};
