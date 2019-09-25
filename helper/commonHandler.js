// var config = require('../config/config.json');
const AWS = require('aws-sdk')
var fs = require('fs');
var uuidv4 = require('uuid/v4');


var config = require('../config/config');
var rp = require('request-promise');
var ejs = require('ejs');
const path = require('path');

const s3 = new AWS.S3(config.s3_credentials);
const myBucket = config.s3_bucketName;

// const signedUrlExpireSeconds=config.s3_signed_url_expire_seconds;




exports.getSignedUrl = async function getSignedUrl(filePath) {

    return new Promise(function (resolve, reject) {
        // let myKey = filePath;
        // let url = s3.getSignedUrl('getObject', {
        //     Bucket: myBucket,
        //     Key: myKey,
        //     Expires: config.s3_signed_url_expire_seconds
        // })

        // // console.log("url",url)
        // return resolve(url);

        let urlInfo = s3SignedUrl(filePath);

    });

}

async function s3SignedUrl(filePath) {
    return new Promise(function (resolve, reject) {
        let myKey = filePath;
        let url = s3.getSignedUrl('getObject', {
            Bucket: myBucket,
            Key: myKey,
            Expires: config.s3_signed_url_expire_seconds
        })

        // console.log("url",url)
        return resolve(url);

    });

}


exports.pdfGeneration = async function pdfGeneration(instaRes) {


    return new Promise(async function (resolve, reject) {


        // if (dataReportIndexes) {
        // } else {
        // }

        // console.log("instaRes",instaRes);

        var imgPath = __dirname + '/../tmp/' + uuidv4();
        try {

            // console.log("instaRes",);
            var multiSelectData = await getSelectedData(instaRes.response, "multiselect");


            console.log("imgPath======", imgPath);

            // console.log("imgPath",imgPath);
            if (!fs.existsSync(imgPath)) {
                fs.mkdirSync(imgPath);
            }

            let bootstrapStream = await copyBootStrapFile(__dirname + '/../public/css/bootstrap.min.css', imgPath + '/style.css');

            // let headerFile = await copyBootStrapFile(__dirname + '/../views/header.html', imgPath + '/header.html');
            let footerFile = await copyBootStrapFile(__dirname + '/../views/footer.html', imgPath + '/footer.html');



            var radioQuestIons = await getSelectedData(instaRes.response, "radio");
            let FormData = [];

            // console.log("multiSelectData",radioQuestIons);
            let formDataMultiSelect = await apiCallToHighChart(multiSelectData, imgPath, "multiselect");
            let radioFormData = await apiCallToHighChart(radioQuestIons, imgPath, "radio");
            FormData.push(...formDataMultiSelect);
            FormData.push(...radioFormData);

            var params = {
                observationName: instaRes.observationName
            }
            ejs.renderFile(__dirname + '/../views/header.ejs', {
                data: params
            })
                .then(function (headerHtml) {

                    var dir = imgPath;
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }
                    fs.writeFile(dir + '/header.html', headerHtml, function (errWr, dataWr) {
                        if (errWr) {
                            throw errWr;
                        } else {

                            var obj = {
                                path: formDataMultiSelect,
                                instaRes: instaRes.response,
                                sliderData: instaRes.response,
                                radioOptionsData: radioFormData
                            };
                            ejs.renderFile(__dirname + '/../views/mainTemplate.ejs', {
                                data: obj
                            })
                                .then(function (dataEjsRender) {
                                    // console.log("dataEjsRender",imgPath);
                                    var dir = imgPath;
                                    if (!fs.existsSync(dir)) {
                                        fs.mkdirSync(dir);
                                    }
                                    fs.writeFile(dir + '/index.html', dataEjsRender, function (errWriteFile, dataWriteFile) {
                                        if (errWriteFile) {
                                            throw errWriteFile;
                                        } else {

                                            var optionsHtmlToPdf = config.optionsHtmlToPdf;
                                            optionsHtmlToPdf.formData = {
                                                files: [
                                                ]
                                            };
                                            FormData.push({
                                                value: fs.createReadStream(dir + '/index.html'),
                                                options: {
                                                    filename: 'index.html'
                                                }
                                            });
                                            FormData.push({
                                                value: fs.createReadStream(dir + '/style.css'),
                                                options: {
                                                    filename: 'style.css'
                                                }
                                            });
                                            FormData.push({
                                                value: fs.createReadStream(dir + '/header.html'),
                                                options: {
                                                    filename: 'header.html'
                                                }
                                            });
                                            FormData.push({
                                                value: fs.createReadStream(dir + '/footer.html'),
                                                options: {
                                                    filename: 'footer.html'
                                                }
                                            });
                                            optionsHtmlToPdf.formData.files = FormData;
                                            // console.log("formData ===", optionsHtmlToPdf.formData.files);
                                            // optionsHtmlToPdf.formData.files.push(formDataMultiSelect);
                                            rp(optionsHtmlToPdf)
                                                .then(function (responseHtmlToPdf) {

                                                    // console.log("optionsHtmlToPdf", optionsHtmlToPdf.formData.files);
                                                    var pdfBuffer = Buffer.from(responseHtmlToPdf.body);
                                                    if (responseHtmlToPdf.statusCode == 200) {
                                                        fs.writeFile(dir + '/instanceLevelReport.pdf', pdfBuffer, 'binary', function (err) {
                                                            if (err) {
                                                                return console.log(err);
                                                            }
                                                            // console.log("The PDF was saved!");
                                                            const s3 = new AWS.S3(config.s3_credentials);
                                                            const uploadFile = () => {
                                                                fs.readFile(dir + '/instanceLevelReport.pdf', (err, data) => {
                                                                    if (err) throw err;
                                                                    const params = {
                                                                        Bucket: config.s3_bucketName, // pass your bucket name
                                                                        Key: 'instanceLevelPdfReports/' + uuidv4() + 'instanceLevelReport.pdf', // file will be saved as testBucket/contacts.csv
                                                                        Body: Buffer.from(data, null, 2)
                                                                    };
                                                                    s3.upload(params, function (s3Err, data) {
                                                                        if (s3Err) throw s3Err;

                                                                        // console.log("data", data);
                                                                        console.log(`File uploaded successfully at ${data.Location}`);

                                                                        s3SignedUrl(data.key).then(function (signedRes) {
                                                                            // if (dataReportIndexes) {
                                                                            //   var reqOptions = {
                                                                            //     query: dataReportIndexes.id,
                                                                            //     downloadPath: data.key
                                                                            //   }
                                                                            //    commonCassandraFunc.updateInstanceDownloadPath(reqOptions);
                                                                            // } else {
                                                                            //   let dataInsert = commonCassandraFunc.insertReqAndResInCassandra(reqData, instaRes, data.key);
                                                                            // }

                                                                            fs.readdir(imgPath, (err, files) => {
                                                                                if (err) throw err;
                                                                
                                                                                for (const file of files) {
                                                                                    fs.unlink(path.join(imgPath, file), err => {
                                                                                        if (err) throw err;
                                                                                    });
                                                                                }
                                                                            });
                                                                            
                                                                            var response = {
                                                                                status: "success",
                                                                                message: 'report generated',
                                                                                pdfUrl: signedRes,
                                                                                downloadPath: data.key
                                                                            };
                                                                            resolve(response);
                                                                        })
                                                                    });
                                                                });
                                                            };
                                                            uploadFile();
                                                        });
                                                    }
                                                })
                                                .catch(function (err) {
                                                    console.log("error in converting HtmlToPdf", err);
                                                    resolve(err);
                                                    throw err;
                                                });
                                        }
                                    });
                                })
                                .catch(function (errEjsRender) {
                                    console.log("errEjsRender : ", errEjsRender);

                                    reject(errEjsRender);
                                });

                        }

                    });
                });

        } catch (exp) {


        } finally {


           
            // fs.unlink(imgPath);
        }
    })

}

async function getSelectedData(items, type) {
    return new Promise(async function (resolve, reject) {
        var ArrayOfChartData = [];
        await Promise.all(items.map(async ele => {
            if (ele.responseType && ele.responseType == type) {
                let chartType = "bar";
                if (type == "radio") {
                    chartType = "pie";
                } else {


                }

                //   console.log(chartType,"ele.chart.data",ele.chart.data[0].data)


                var obj = {


                    options: {
                        title: {
                            text: ele.question
                        },
                        chart: {
                            type: chartType
                        },
                        xAxis: ele.chart.xAxis,
                        yAxis: ele.chart.yAxis,
                        series: ele.chart.data
                    },
                    question: ele.question
                };
                //   console.log("obj.options.series",ele.chart.data[0].data[0].y);
                // return resolve(obj);


                if (chartType == "pie") {
                    obj.options.series[0].data[0].y = parseInt(obj.options.series[0].data[0].y);
                } else {

                    let multiSelectInputs = [];
                    await Promise.all(obj.options.series[0].data.map(function (item) {
                        // return parseInt(item, 10);
                        multiSelectInputs.push(parseInt(item));

                    }));
                    obj.options.series[0].data = multiSelectInputs;

                }
                //   console.log(obj.options.series[0].data[0].y);
                ArrayOfChartData.push(obj);
            }
        }));
        return resolve(ArrayOfChartData);
    });
}

async function convertChartDataTofile(radioFilePath, options) {
    // console.log("options===", options);
    var fileInfo = await rp(options).pipe(fs.createWriteStream(radioFilePath))
    return new Promise(function (resolve, reject) {
        fileInfo.on('finish', function () {
            return resolve(fileInfo);
        });
        fileInfo.on('error', function (err) {
            // return resolve(fileInfo);
            console.log(err);
            return resolve(err)
        });
    });
}

async function copyBootStrapFile(from, to) {
    // var fileInfo = await rp(options).pipe(fs.createWriteStream(radioFilePath))
    var readCss = fs.createReadStream(from).pipe(fs.createWriteStream(to));
    return new Promise(function (resolve, reject) {
        readCss.on('finish', function () {
            // console.log("readCss", readCss);
            return resolve(readCss);
        });
        readCss.on('error', function (err) {
            // return resolve(fileInfo);
            // console.log("err--", err);
            return resolve(err)
        });
    });
}

async function apiCallToHighChart(chartData, imgPath, type) {
    return new Promise(async function (resolve, reject) {
        var formData = [];
        try {
            var carrent = 0;
            if (chartData && chartData.length > 0) {
                let dt = await callChartApiPreparation(chartData[0], imgPath, type, chartData, carrent, formData);
                return resolve(formData);
            } else {
                return resolve(formData);
            }
        } catch (err) {
            console.log("error while calling", err);
        }
    });
}


async function callChartApiPreparation(ele, imgPath, type, chartData, carrent, formData) {
    let loop = 0;
    var options = config.high_chart;
    var chartImage = "instanceMultiSelectFile_" + loop + "_" + uuidv4() + "_.png";
    options.method = "POST";
    options.body = JSON.stringify(ele);
    let imgFilePath = imgPath + "/" + chartImage;
    loop = loop + 1;
    let renderImage = await convertChartDataTofile(imgFilePath, options);
    let fileDat = {
        value: fs.createReadStream(imgFilePath),
        options: {
            filename: chartImage,
            question: ele.question
        }
    }
    formData.push(fileDat);
    carrent = carrent + 1;
    if (chartData.length > carrent) {
        try {
            let call = await callChartApiPreparation(chartData[carrent], imgPath, type, chartData, carrent, formData);
        } catch (err) {
            console.log("error while making api call to high chart docker", err);
        }
    } else {
        return (formData);
    }
}
