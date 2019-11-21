// var config = require('../config/config.json');
const AWS = require('aws-sdk')
var fs = require('fs');
var uuidv4 = require('uuid/v4');


var config = require('../config/config');
var rp = require('request-promise');
var ejs = require('ejs');
const path = require('path');
var rimraf = require("rimraf");

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

        resolve(urlInfo);

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


// PDF generation function for entity report
exports.pdfGeneration = async function pdfGeneration(instaRes, deleteFromS3 = null) {


    return new Promise(async function (resolve, reject) {

        var currentTempFolder = 'tmp/' + uuidv4() + "--" + Math.floor(Math.random() * (10000 - 10 + 1) + 10)

        var imgPath = __dirname + '/../' + currentTempFolder;


        try {
            
            if (!fs.existsSync(imgPath)) {
                fs.mkdirSync(imgPath);
            }

            let bootstrapStream = await copyBootStrapFile(__dirname + '/../public/css/bootstrap.min.css', imgPath + '/style.css');

            // let headerFile = await copyBootStrapFile(__dirname + '/../views/header.html', imgPath + '/header.html');
            let footerFile = await copyBootStrapFile(__dirname + '/../views/footer.html', imgPath + '/footer.html');

        

            
            let FormData = [];

            let matrixMultiSelectArray = [];
            let matrixRadioArray = [];

            //loop the response and store multiselect and radio questions of matrix type
            await Promise.all(instaRes.response.map(async ele => {
                if (ele.responseType == "matrix") {
                    await Promise.all(ele.instanceQuestions.map(element => {
                        if (element.responseType == "multiselect") {
                            matrixMultiSelectArray.push(element);
                        }
                        else if (element.responseType == "radio") {
                            matrixRadioArray.push(element);
                        }
                    }))
                }

            }))

            //Prepare chart object before sending it to highchart server
            var multiSelectData = await getSelectedData(instaRes.response, "multiselect");
            var radioQuestions = await getSelectedData(instaRes.response, "radio");
            
            // Prepare chart object before sending it to highchart server (Matrix questions)
            let matrixMultiSelectChartObj = await getSelectedData(matrixMultiSelectArray, "multiselect");
            let matrixRadioChartObj = await getSelectedData(matrixRadioArray, "radio");
            

            //send chart objects to highchart server and get the charts
            let formDataMultiSelect = await apiCallToHighChart(multiSelectData, imgPath, "multiselect");
            let radioFormData = await apiCallToHighChart(radioQuestions, imgPath, "radio");

            //send chart objects to highchart server and get the charts (Matrix questions)
            let formDataMatrixMultiSelect = await apiCallToHighChart(matrixMultiSelectChartObj, imgPath, "multiselect");
            let matrixRadioFormData = await apiCallToHighChart(matrixRadioChartObj, imgPath, "radio");

            FormData.push(...formDataMultiSelect);
            FormData.push(...radioFormData);
            FormData.push(...formDataMatrixMultiSelect);
            FormData.push(...matrixRadioFormData);
            
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
                    fs.writeFile(dir + '/header.html', headerHtml, async function (errWr, dataWr) {
                        if (errWr) {
                            throw errWr;
                        } else {

                            var arrOfData = [];
                            var matrixData = [];

                            await Promise.all(instaRes.response.map(async ele => {

                                // console.log(ele.order);
                                if (ele.responseType === "text" || ele.responseType === "date" || ele.responseType === "number" || ele.responseType === "slider") {

                                    arrOfData.push(ele);

                                } else if (ele.responseType === "multiselect") {

                                    let dt = formDataMultiSelect.filter(or => {

                                        if (or.order == ele.order) {
                                            return or;
                                        }
                                    })

                                    dt.responseType = "multiselect";
                                    arrOfData.push(dt);

                                } else if (ele.responseType === "radio") {
                                    let dt = radioFormData.filter(or => {

                                        if (or.order == ele.order) {
                                            return or;
                                        }
                                    })

                                    dt.responseType = "radio";
                                    arrOfData.push(dt);

                                } else if (ele.responseType === "matrix") {
                                    //push main matrix question object into array
                                    arrOfData.push(ele);
                                    let obj = {
                                        order: ele.order,
                                        data:[]
                                    }

                                    await Promise.all(ele.instanceQuestions.map(element => {
                                      //push the instance questions to the array
                                       if(element.responseType == "text" || element.responseType == "date" || element.responseType == "number" || ele.responseType == "slider") {
                                            obj.data.push(element);   
                                       }
                                       else if(element.responseType == "radio"){
                                         let dt = matrixRadioFormData.filter(or => {
                                            if (or.order == element.order) {
                                                return or;
                                            }
                                        })

                                        dt[0].options.responseType = "radio";
                                        dt[0].options.answers = element.answers;
                                        obj.data.push(dt);
                                            
                                       }
                                       else if(element.responseType == "multiselect"){
                                        let dt = formDataMatrixMultiSelect.filter(or => {
                                           if (or.order == element.order) {
                                               return or;
                                           }
                                       })

                                       dt[0].options.responseType = "multiselect";
                                       dt[0].options.answers = element.answers;
                                       
                                       obj.data.push(dt);
                                           
                                      }
                                    }))
                                   matrixData.push(obj); 
                                }
                            }));

                            var obj = {
                                path: formDataMultiSelect,
                                instaRes: instaRes.response,
                                radioOptionsData: radioFormData,
                                orderData: arrOfData,
                                matrixRes: matrixData
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
                                                                        Body: Buffer.from(data, null, 2),
                                                                        Expires: 10
                                                                    };

                                                                    if (deleteFromS3 == true) {
                                                                        var folderPath = Buffer.from(currentTempFolder).toString('base64')

                                                                        var response = {
                                                                            status: "success",
                                                                            message: 'report generated',
                                                                            pdfUrl: folderPath,

                                                                        };
                                                                        resolve(response);

                                                                    } else {


                                                                        s3.upload(params, function (s3Err, data) {
                                                                            if (s3Err) throw s3Err;

                                                                            // console.log("data", data);
                                                                            console.log(`File uploaded successfully at ${data.Location}`);

                                                                            s3SignedUrl(data.key).then(function (signedRes) {

                                                                                try {



                                                                                    fs.readdir(imgPath, (err, files) => {
                                                                                        if (err) throw err;

                                                                                        // console.log("files",files.length);
                                                                                        var i = 0;
                                                                                        for (const file of files) {

                                                                                            fs.unlink(path.join(imgPath, file), err => {
                                                                                                if (err) throw err;
                                                                                            });

                                                                                            if (i == files.length) {
                                                                                                fs.unlink('../../' + currentTempFolder, err => {
                                                                                                    if (err) throw err;

                                                                                                });
                                                                                                console.log("path.dirname(filename).split(path.sep).pop()", path.dirname(file).split(path.sep).pop());
                                                                                                // fs.unlink(path.join(imgPath, ""), err => {
                                                                                                //     if (err) throw err;
                                                                                                // });
                                                                                            }

                                                                                            i = i + 1;

                                                                                        }
                                                                                    });
                                                                                    rimraf(imgPath, function () { console.log("done"); });

                                                                                } catch (ex) {
                                                                                    console.log("ex ", ex);
                                                                                }

                                                                                var response = {
                                                                                    status: "success",
                                                                                    message: 'report generated',
                                                                                    pdfUrl: signedRes,
                                                                                    downloadPath: data.key
                                                                                };
                                                                                resolve(response);
                                                                            })
                                                                        });

                                                                    }
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


// PDF generation function for instance API
exports.instanceObservationPdfGeneration = async function instanceObservationPdfGeneration(instaRes, deleteFromS3 = null) {


    return new Promise(async function (resolve, reject) {

        var currentTempFolder = 'tmp/' + uuidv4() + "--" + Math.floor(Math.random() * (10000 - 10 + 1) + 10)

        var imgPath = __dirname + '/../' + currentTempFolder;


        try {

            if (!fs.existsSync(imgPath)) {
                fs.mkdirSync(imgPath);
            }

            let bootstrapStream = await copyBootStrapFile(__dirname + '/../public/css/bootstrap.min.css', imgPath + '/style.css');

            // let headerFile = await copyBootStrapFile(__dirname + '/../views/header.html', imgPath + '/header.html');
            let footerFile = await copyBootStrapFile(__dirname + '/../views/footer.html', imgPath + '/footer.html');

            var multiSelectArray = [];
            var radioArray = [];
            let formData = [];

            await Promise.all(instaRes.response.map(async ele => {
                if (ele.responseType == "matrix") {
                    await Promise.all(ele.instanceQuestions.map(element => {
                        if (element.responseType == "multiselect") {
                            multiSelectArray.push(element);
                        }
                        else if (element.responseType == "radio") {
                            radioArray.push(element);
                        }
                    }))
                }

            }))
            
            //select all the multiselect response objects and create a chart object
            let multiSelectChartObj = await getSelectedData(multiSelectArray, "multiselect");
            let radioChartObj = await getSelectedData(radioArray, "radio");

            // console.log(radioChartObj);

            let multiselectFormData = await apiCallToHighChart(multiSelectChartObj, imgPath, "multiselect");
            let radioFormData = await apiCallToHighChart(radioChartObj, imgPath, "radio");
            formData.push(...multiselectFormData);
            formData.push(...radioFormData);
              

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

                    fs.writeFile(dir + '/header.html', headerHtml, async function (errWr, dataWr) {
                        if (errWr) {
                            throw errWr;
                        } else {

                            //Arrange the questions based on the order field
                            var arrOfData = [];
                            var matrixData = [];

                            await Promise.all(instaRes.response.map(async ele => {
                            
                                // console.log(ele.order);
                                if (ele.responseType === "text" || ele.responseType === "date" || ele.responseType === "number" || ele.responseType === "slider" || ele.responseType === "multiselect" || ele.responseType === "radio") {

                                    arrOfData.push(ele);

                                } else if (ele.responseType === "matrix") {

                                    //push main matrix question object into array
                                    arrOfData.push(ele);
                                    let obj = {
                                         order: ele.order,
                                         data:[]
                                    }
                                    await Promise.all(ele.instanceQuestions.map(element => {
                                      //push the instance questions to the array
                                       if(element.responseType == "text" || element.responseType == "date" || element.responseType == "number" || ele.responseType == "slider") {
                                        obj.data.push(element);   
                                       }
                                       else if(element.responseType == "radio"){
                                         let dt = radioFormData.filter(or => {
                                            if (or.order == element.order) {
                                                return or;
                                            }
                                        })

                                        dt[0].options.responseType = "radio";
                                        dt[0].options.answers = element.answers;
                                        obj.data.push(dt);
                                            
                                       }
                                       else if(element.responseType == "multiselect"){
                                        let dt = multiselectFormData.filter(or => {
                                           if (or.order == element.order) {
                                               return or;
                                           }
                                       })

                                       dt[0].options.responseType = "multiselect";
                                       dt[0].options.answers = element.answers;
                                       
                                       obj.data.push(dt);
                                           
                                      }
                                    }))

                                    matrixData.push(obj);
                                }
                            }));


                            var obj = {
                                orderData: arrOfData,
                                matrixRes: matrixData
                            };
                            ejs.renderFile(__dirname + '/../views/instanceObservationTemplate.ejs', {
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
                                            formData.push({
                                                value: fs.createReadStream(dir + '/index.html'),
                                                options: {
                                                    filename: 'index.html'
                                                }
                                            });
                                            formData.push({
                                                value: fs.createReadStream(dir + '/style.css'),
                                                options: {
                                                    filename: 'style.css'
                                                }
                                            });
                                            formData.push({
                                                value: fs.createReadStream(dir + '/header.html'),
                                                options: {
                                                    filename: 'header.html'
                                                }
                                            });
                                            formData.push({
                                                value: fs.createReadStream(dir + '/footer.html'),
                                                options: {
                                                    filename: 'footer.html'
                                                }
                                            });
                                            optionsHtmlToPdf.formData.files = formData;
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
                                                                        Body: Buffer.from(data, null, 2),
                                                                        Expires: 10
                                                                    };

                                                                    if (deleteFromS3 == true) {
                                                                        var folderPath = Buffer.from(currentTempFolder).toString('base64')

                                                                        var response = {
                                                                            status: "success",
                                                                            message: 'report generated',
                                                                            pdfUrl: folderPath,

                                                                        };
                                                                        resolve(response);

                                                                    } else {


                                                                        s3.upload(params, function (s3Err, data) {
                                                                            if (s3Err) throw s3Err;

                                                                            // console.log("data", data);
                                                                            console.log(`File uploaded successfully at ${data.Location}`);

                                                                            s3SignedUrl(data.key).then(function (signedRes) {

                                                                                try {



                                                                                    fs.readdir(imgPath, (err, files) => {
                                                                                        if (err) throw err;

                                                                                        // console.log("files",files.length);
                                                                                        var i = 0;
                                                                                        for (const file of files) {

                                                                                            fs.unlink(path.join(imgPath, file), err => {
                                                                                                if (err) throw err;
                                                                                            });

                                                                                            if (i == files.length) {
                                                                                                fs.unlink('../../' + currentTempFolder, err => {
                                                                                                    if (err) throw err;

                                                                                                });
                                                                                                console.log("path.dirname(filename).split(path.sep).pop()", path.dirname(file).split(path.sep).pop());
                                                                                                // fs.unlink(path.join(imgPath, ""), err => {
                                                                                                //     if (err) throw err;
                                                                                                // });
                                                                                            }

                                                                                            i = i + 1;

                                                                                        }
                                                                                    });
                                                                                    rimraf(imgPath, function () { console.log("done"); });

                                                                                } catch (ex) {
                                                                                    console.log("ex ", ex);
                                                                                }

                                                                                var response = {
                                                                                    status: "success",
                                                                                    message: 'report generated',
                                                                                    pdfUrl: signedRes,
                                                                                    downloadPath: data.key
                                                                                };
                                                                                resolve(response);
                                                                            })
                                                                        });

                                                                    }
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


// ============> PDF generation function for assessment API ======================>
exports.assessmentPdfGeneration = async function assessmentPdfGeneration(assessmentRes, deleteFromS3 = null) {


    return new Promise(async function (resolve, reject) {

        var currentTempFolder = 'tmp/' + uuidv4() + "--" + Math.floor(Math.random() * (10000 - 10 + 1) + 10)

        var imgPath = __dirname + '/../' + currentTempFolder;

        // var FormData = [];


        try {

            var assessmentData = [assessmentRes.reportSections[0]]
            assessmentData[0].responseType = "stackedbar";
            var chartData = await getSelectedData(assessmentData, "stackedbar");

            // console.log("imgPath",imgPath);
            if (!fs.existsSync(imgPath)) {
                fs.mkdirSync(imgPath);
            }

            let bootstrapStream = await copyBootStrapFile(__dirname + '/../public/css/bootstrap.min.css', imgPath + '/style.css');

            // let headerFile = await copyBootStrapFile(__dirname + '/../views/header.html', imgPath + '/header.html');
            let footerFile = await copyBootStrapFile(__dirname + '/../views/footer.html', imgPath + '/footer.html');

            let FormData = [];

            let formDataAssessment = await apiCallToHighChart(chartData, imgPath, "stackedbar");

            FormData.push(...formDataAssessment);
            var params = {
                assessmentName: "Institutional Assessment Report"
            }
            ejs.renderFile(__dirname + '/../views/assessment_header.ejs', {
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
                                path: formDataAssessment,
                            };
                            ejs.renderFile(__dirname + '/../views/stacked_bar_assessment_template.ejs', {
                                data: obj.path[0].options.filename,
                                assessmentData: assessmentRes.reportSections[1]
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
                                                        fs.writeFile(dir + '/entityAssessmentReport.pdf', pdfBuffer, 'binary', function (err) {
                                                            if (err) {
                                                                return console.log(err);
                                                            }
                                                            // console.log("The PDF was saved!");
                                                            const s3 = new AWS.S3(config.s3_credentials);
                                                            const uploadFile = () => {
                                                                fs.readFile(dir + '/entityAssessmentReport.pdf', (err, data) => {
                                                                    if (err) throw err;
                                                                    const params = {
                                                                        Bucket: config.s3_bucketName, // pass your bucket name
                                                                        Key: 'entityAssessmentPdfReports/' + uuidv4() + 'entityAssessmentReport.pdf', // file will be saved as testBucket/contacts.csv
                                                                        Body: Buffer.from(data, null, 2),
                                                                        Expires: 10
                                                                    };

                                                                    if (deleteFromS3 == true) {
                                                                        var folderPath = Buffer.from(currentTempFolder).toString('base64')

                                                                        var response = {
                                                                            status: "success",
                                                                            message: 'report generated',
                                                                            pdfUrl: folderPath,

                                                                        };
                                                                        resolve(response);

                                                                    } else {


                                                                        s3.upload(params, function (s3Err, data) {
                                                                            if (s3Err) throw s3Err;

                                                                            // console.log("data", data);
                                                                            console.log(`File uploaded successfully at ${data.Location}`);

                                                                            s3SignedUrl(data.key).then(function (signedRes) {

                                                                                try {



                                                                                    fs.readdir(imgPath, (err, files) => {
                                                                                        if (err) throw err;

                                                                                        // console.log("files",files.length);
                                                                                        var i = 0;
                                                                                        for (const file of files) {

                                                                                            fs.unlink(path.join(imgPath, file), err => {
                                                                                                if (err) throw err;
                                                                                            });
                                                                                            if (i == files.length) {
                                                                                                fs.unlink('../../' + currentTempFolder, err => {
                                                                                                    if (err) throw err;
                                                                                                });
                                                                                                console.log("path.dirname(filename).split(path.sep).pop()", path.dirname(file).split(path.sep).pop());
                                                                                                // fs.unlink(path.join(imgPath, ""), err => {
                                                                                                //     if (err) throw err;
                                                                                                // });
                                                                                            }

                                                                                            i = i + 1;
                                                                                        }
                                                                                    });
                                                                                    rimraf(imgPath, function () { console.log("done"); });

                                                                                } catch (ex) {
                                                                                    console.log("ex ", ex);
                                                                                }

                                                                                var response = {
                                                                                    status: "success",
                                                                                    message: 'report generated',
                                                                                    pdfUrl: signedRes,
                                                                                    downloadPath: data.key
                                                                                };
                                                                                resolve(response);
                                                                            })
                                                                        });

                                                                    }
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

//Prepare chart object to send it to highchart server
async function getSelectedData(items, type) {
    return new Promise(async function (resolve, reject) {
        var ArrayOfChartData = [];
        // console.log("items",items);
        await Promise.all(items.map(async ele => {
             
            if (ele.responseType && ele.responseType == type) {
                var chartType = "bar";
                if (type == "radio") {

                    // console.log("ele",ele.chart);
                    // console.log("ele",ele.chart.data[0]);
                    chartType = "pie";
                } else if (type == "stackedbar") {
                    chartType = "stackedbar";
                }

                //   console.log(chartType,"ele.chart.data",ele.chart.data[0].data)
                var obj = {
                    order: ele.order,
                    type: "svg",
                    options: {
                        title: {
                            text: ele.question
                        },
                        colors: ['#D35400', '#F1C40F', '#3498DB', '#8E44AD', '#154360', '#145A32'],

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
                    // obj.options.series[0].data[0].y = parseInt(obj.options.series[0].data[0].y);

                    let multiSelectInputs = [];
                    await Promise.all(obj.options.series[0].data.map(function (item) {
                        // return parseInt(item, 10);
                        // console.log("item",item);
                        let parseVal = parseInt(item.y);
                        var ex = {
                            name: item.name,
                            y: parseVal
                        }
                        multiSelectInputs.push(ex);

                    }));
                    obj.options.series[0].data = multiSelectInputs;

                } else if (chartType == "bar") {

                    let multiSelectInputs = [];
                    await Promise.all(obj.options.series[0].data.map(function (item) {
                        // return parseInt(item, 10);
                        // console.log("item",item);
                        multiSelectInputs.push(parseInt(item));

                    }));
                    obj.options.series[0].data = multiSelectInputs;

                } else if (chartType == "stackedbar") {
                    var obj = {
                        type: "svg",
                        options: {
                            chart: {
                                type: 'bar'
                            },
                            colors: ['#D35400', '#F1C40F', '#3498DB', '#8E44AD', '#154360', '#145A32'],

                            title: {
                                text: ele.chart.title
                            },
                            xAxis: {
                                categories: ele.chart.xAxis.categories
                            },
                            yAxis: {
                                min: 0,
                                title: {
                                    text: ele.chart.yAxis.title.text
                                }
                            },
                            legend: {
                                reversed: true
                            },
                            plotOptions: {
                                series: {
                                    stacking: ele.chart.stacking,
                                    dataLabels: {
                                        enabled: true
                                    }
                                }
                            },
                            series: ele.chart.data
                        }
                    }

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
    var chartImage = "chartPngImage_" + loop + "_" + uuidv4() + "_.svg";
    options.method = "POST";
    options.body = JSON.stringify(ele);
    let imgFilePath = imgPath + "/" + chartImage;
    loop = loop + 1;
    let renderImage = await convertChartDataTofile(imgFilePath, options);

    // console.log("ele",ele);
    let fileDat = {
        order: ele.order,
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