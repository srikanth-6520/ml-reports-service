const AWS = require('aws-sdk')
const fs = require('fs');
const uuidv4 = require('uuid/v4');
const rp = require('request-promise');
const ejs = require('ejs');
const path = require('path');
const rimraf = require("rimraf");

// const s3 = new AWS.S3(gen.utils.getAWSConnection());
const myBucket = process.env.AWS_BUCKET_NAME;
const kendraHelper = require('./kendra_service');
const request = require("request");
const filesHelper = require('../common/files_helper');


// const signedUrlExpireSeconds=process.env.AWS_SIGNED_URL_EXPIRE_SECONDS;

exports.getSignedUrl = async function getSignedUrl(filePath) {

    return new Promise(function (resolve, reject) {
        // let myKey = filePath;
        // let url = s3.getSignedUrl('getObject', {
        //     Bucket: myBucket,
        //     Key: myKey,
        //     Expires: process.env.AWS_SIGNED_URL_EXPIRE_SECONDS
        // })

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
            Expires: process.env.AWS_SIGNED_URL_EXPIRE_SECONDS
        })

        return resolve(url);

    });

}


// PDF generation function for entity report
exports.pdfGeneration = async function pdfGeneration(instaRes, storeReportsToS3 = false) {


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

            var params;

            if (instaRes.solutionName) {
                params = {
                    solutionName: instaRes.solutionName
                }
            }
            else {
                params = {
                    observationName: instaRes.observationName
                }
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
                                        data: []
                                    }

                                    await Promise.all(ele.instanceQuestions.map(element => {
                                        //push the instance questions to the array
                                        if (element.responseType == "text" || element.responseType == "date" || element.responseType == "number" || ele.responseType == "slider") {
                                            obj.data.push(element);
                                        }
                                        else if (element.responseType == "radio") {
                                            let dt = matrixRadioFormData.filter(or => {
                                                if (or.order == element.order) {
                                                    return or;
                                                }
                                            })

                                            dt[0].options.responseType = "radio";
                                            dt[0].options.answers = element.answers;
                                            obj.data.push(dt);

                                        }
                                        else if (element.responseType == "multiselect") {
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

                                    var dir = imgPath;
                                    if (!fs.existsSync(dir)) {
                                        fs.mkdirSync(dir);
                                    }
                                    fs.writeFile(dir + '/index.html', dataEjsRender, function (errWriteFile, dataWriteFile) {
                                        if (errWriteFile) {
                                            throw errWriteFile;
                                        } else {

                                            let optionsHtmlToPdf = gen.utils.getGotenbergConnection();
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

                                            rp(optionsHtmlToPdf)
                                                .then(function (responseHtmlToPdf) {

                                                    
                                                    var pdfBuffer = Buffer.from(responseHtmlToPdf.body);
                                                    if (responseHtmlToPdf.statusCode == 200) {
                                                        fs.writeFile(dir + '/pdfReport.pdf', pdfBuffer, 'binary', function (err) {
                                                            if (err) {
                                                                return console.log(err);
                                                            }
                                                            
                                                            const s3 = new AWS.S3(gen.utils.getAWSConnection());
                                                            const uploadFile = () => {
                                                                fs.readFile(dir + '/pdfReport.pdf', (err, data) => {
                                                                    if (err) throw err;
                                                                    const params = {
                                                                        Bucket: process.env.AWS_BUCKET_NAME, // pass your bucket name
                                                                        Key: 'pdfReport/' + uuidv4() + 'pdfReport.pdf', // file will be saved as testBucket/contacts.csv
                                                                        Body: Buffer.from(data, null, 2),
                                                                        Expires: 10
                                                                    };

                                                                    if (storeReportsToS3 == false) {
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
exports.instanceObservationPdfGeneration = async function instanceObservationPdfGeneration(instaRes, storeReportsToS3 = false) {


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


                                if (ele.responseType === "text" || ele.responseType === "date" || ele.responseType === "number" || ele.responseType === "slider" || ele.responseType === "multiselect" || ele.responseType === "radio") {

                                    arrOfData.push(ele);

                                } else if (ele.responseType === "matrix") {

                                    //push main matrix question object into array
                                    arrOfData.push(ele);
                                    let obj = {
                                        order: ele.order,
                                        data: []
                                    }
                                    await Promise.all(ele.instanceQuestions.map(element => {
                                        //push the instance questions to the array
                                        if (element.responseType == "text" || element.responseType == "date" || element.responseType == "number" || ele.responseType == "slider") {
                                            obj.data.push(element);
                                        }
                                        else if (element.responseType == "radio") {
                                            let dt = radioFormData.filter(or => {
                                                if (or.order == element.order) {
                                                    return or;
                                                }
                                            })

                                            dt[0].options.responseType = "radio";
                                            dt[0].options.answers = element.answers;
                                            obj.data.push(dt);

                                        }
                                        else if (element.responseType == "multiselect") {
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

                                    var dir = imgPath;
                                    if (!fs.existsSync(dir)) {
                                        fs.mkdirSync(dir);
                                    }
                                    fs.writeFile(dir + '/index.html', dataEjsRender, function (errWriteFile, dataWriteFile) {
                                        if (errWriteFile) {
                                            throw errWriteFile;
                                        } else {

                                            let optionsHtmlToPdf = gen.utils.getGotenbergConnection();
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

                                            rp(optionsHtmlToPdf)
                                                .then(function (responseHtmlToPdf) {

                                                    // console.log("optionsHtmlToPdf", optionsHtmlToPdf.formData.files);
                                                    var pdfBuffer = Buffer.from(responseHtmlToPdf.body);
                                                    if (responseHtmlToPdf.statusCode == 200) {
                                                        fs.writeFile(dir + '/pdfReport.pdf', pdfBuffer, 'binary', function (err) {
                                                            if (err) {
                                                                return console.log(err);
                                                            }
                                                            // console.log("The PDF was saved!");
                                                            const s3 = new AWS.S3(gen.utils.getAWSConnection());
                                                            const uploadFile = () => {
                                                                fs.readFile(dir + '/pdfReport.pdf', (err, data) => {
                                                                    if (err) throw err;
                                                                    const params = {
                                                                        Bucket: process.env.AWS_BUCKET_NAME, // pass your bucket name
                                                                        Key: 'pdfReport/' + uuidv4() + 'pdfReport.pdf', // file will be saved as testBucket/contacts.csv
                                                                        Body: Buffer.from(data, null, 2),
                                                                        Expires: 10
                                                                    };

                                                                    if (storeReportsToS3 == false) {
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




//PDF generation for instance observation score report
exports.instanceObservationScorePdfGeneration = async function instanceObservationPdfGeneration(observationResp, storeReportsToS3 = false, obj) {

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

            //select all the multiselect response objects and create a chart object
            let chartObj = await getScoreChartObject(observationResp.response);

            let highChartData = await apiCallToHighChart(chartObj, imgPath, "scatter");

            var params;

            if (observationResp.solutionName) {
                params = {
                    solutionName: observationResp.solutionName
                }
            }
            else {
                params = {
                    observationName: observationResp.observationName
                }
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

                            let arrayOfData = [];


                            await Promise.all(observationResp.response.map(async ele => {

                                let dt = highChartData.filter(or => {

                                    if (or.order == ele.order) {
                                        return or;
                                    }
                                })

                                arrayOfData.push(dt);

                            }))

                            obj.orderData = arrayOfData;

                            ejs.renderFile(__dirname + '/../views/instanceScoreObsTemplate.ejs', {
                                data: obj
                            })
                                .then(function (dataEjsRender) {

                                    var dir = imgPath;
                                    if (!fs.existsSync(dir)) {
                                        fs.mkdirSync(dir);
                                    }

                                    fs.writeFile(dir + '/index.html', dataEjsRender, function (errWriteFile, dataWriteFile) {
                                        if (errWriteFile) {
                                            throw errWriteFile;
                                        } else {

                                            let optionsHtmlToPdf = gen.utils.getGotenbergConnection();
                                            optionsHtmlToPdf.formData = {
                                                files: [
                                                ]
                                            };
                                            highChartData.push({
                                                value: fs.createReadStream(dir + '/index.html'),
                                                options: {
                                                    filename: 'index.html'
                                                }
                                            });
                                            highChartData.push({
                                                value: fs.createReadStream(dir + '/style.css'),
                                                options: {
                                                    filename: 'style.css'
                                                }
                                            });
                                            highChartData.push({
                                                value: fs.createReadStream(dir + '/header.html'),
                                                options: {
                                                    filename: 'header.html'
                                                }
                                            });
                                            highChartData.push({
                                                value: fs.createReadStream(dir + '/footer.html'),
                                                options: {
                                                    filename: 'footer.html'
                                                }
                                            });
                                            optionsHtmlToPdf.formData.files = highChartData;

                                            rp(optionsHtmlToPdf)
                                                .then(function (responseHtmlToPdf) {

                                                    var pdfBuffer = Buffer.from(responseHtmlToPdf.body);
                                                    if (responseHtmlToPdf.statusCode == 200) {

                                                        fs.writeFile(dir + '/pdfReport.pdf', pdfBuffer, 'binary', function (err) {
                                                            if (err) {
                                                                return console.log(err);
                                                            }

                                                            else {
                                                                const s3 = new AWS.S3(gen.utils.getAWSConnection());

                                                                const uploadFile = () => {

                                                                    fs.readFile(dir + '/pdfReport.pdf', (err, data) => {
                                                                        if (err) throw err;

                                                                        const params = {
                                                                            Bucket: process.env.AWS_BUCKET_NAME, // pass your bucket name
                                                                            Key: 'pdfReport/' + uuidv4() + 'pdfReport.pdf',
                                                                            Body: Buffer.from(data, null, 2),
                                                                            Expires: 10
                                                                        };

                                                                        if (storeReportsToS3 == false) {
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
                                                                }
                                                                uploadFile();
                                                            }
                                                        });

                                                    }

                                                }).catch(function (err) {
                                                    resolve(err);
                                                    throw err;
                                                });

                                        }

                                    });

                                }).catch(function (errEjsRender) {
                                    console.log("errEjsRender : ", errEjsRender);

                                    reject(errEjsRender);
                                });
                        }


                    });



                });
        }

        catch (err) {

        }

        finally {


        }

    })

}


// ============> PDF generation function for assessment API ======================>
exports.assessmentPdfGeneration = async function assessmentPdfGeneration(assessmentRes, storeReportsToS3 = false) {


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

                                            let optionsHtmlToPdf = gen.utils.getGotenbergConnection();
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
                                                        fs.writeFile(dir + '/pdfReport.pdf', pdfBuffer, 'binary', function (err) {
                                                            if (err) {
                                                                return console.log(err);
                                                            }
                                                            // console.log("The PDF was saved!");
                                                            const s3 = new AWS.S3(gen.utils.getAWSConnection());
                                                            const uploadFile = () => {
                                                                fs.readFile(dir + '/pdfReport.pdf', (err, data) => {
                                                                    if (err) throw err;
                                                                    const params = {
                                                                        Bucket: process.env.AWS_BUCKET_NAME, // pass your bucket name
                                                                        Key: 'entityAssessmentPdfReports/' + uuidv4() + 'entityAssessmentReport.pdf', // file will be saved as testBucket/contacts.csv
                                                                        Body: Buffer.from(data, null, 2),
                                                                        Expires: 10
                                                                    };

                                                                    if (storeReportsToS3 == false) {
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

                                    resolve(errEjsRender);
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

        let arrayOfChartData = [];

        await Promise.all(items.map(async ele => {

            if (ele.responseType && ele.responseType == type) {
                var chartType = "bar";
                if (type == "radio") {
                    chartType = "pie";
                } else if (type == "stackedbar") {
                    chartType = "stackedbar";
                }

                let obj;

                if (chartType == "bar" || chartType == "pie") {

                    obj = await createChartObject(ele, chartType);

                } else if (chartType == "stackedbar") {
                    obj = {
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
                            credits: {
                                enabled: false
                            },
                            series: ele.chart.data
                        }
                    }

                }
                arrayOfChartData.push(obj);
            }
        }));
        return resolve(arrayOfChartData);
    });
}



//Prepare chart object to send it to highchart server for observation score report
async function getScoreChartObject(items) {

    return new Promise(async function (resolve, reject) {

        let arrayOfChartData = [];

        await Promise.all(items.map(async ele => {

            let obj = await createScoreChartObject(ele);

            arrayOfChartData.push(obj);

        }));

        return resolve(arrayOfChartData);

    });
}




//Prepare chart object to send it to highchart server for criteria score report
async function getCriteriaScoreChartObject(items) {

    return new Promise(async function (resolve, reject) {

        let arrayOfChartData = [];

        await Promise.all(items.map(async element => {

            await Promise.all(element.questionArray.map(async ele => {

                let obj = await createScoreChartObject(ele);

                arrayOfChartData.push(obj);

            }));

        }));

        return resolve(arrayOfChartData);

    });
}



async function createScoreChartObject(ele) {

    return new Promise(async function (resolve, reject) {

        let obj;

        if (ele.chart.type == "pie") {

            obj = {
                order: ele.order,
                type: "svg",
                options: {
                    title: {
                        text: ele.question
                    },
                    // colors: ['#6c4fa1'],

                    chart: {
                        type: ele.chart.type
                    },
                    xAxis: ele.chart.xAxis,
                    yAxis: ele.chart.yAxis,
                    credits: ele.chart.credits,
                    plotOptions: ele.chart.plotOptions,
                    series: ele.chart.data
                },
                question: ele.question
            };
        }
        else if (ele.chart.type == "bar") {

            obj = {
                order: ele.order,
                type: "svg",
                options: {
                    title: {
                        text: ele.question
                    },
                    chart: {
                        type: ele.chart.type
                    },
                    colors: ['#D35400', '#F1C40F', '#3498DB', '#8E44AD', '#154360', '#145A32'],
                    xAxis: ele.chart.xAxis,
                    yAxis: ele.chart.yAxis,
                    credits: ele.chart.credits,
                    plotOptions: ele.chart.plotOptions,
                    legend: ele.chart.legend,
                    series: ele.chart.data
                },
                question: ele.question
            };
        }
        else if (ele.chart.type == "scatter") {

            obj = {
                order: ele.order,
                type: "svg",
                options: {
                    title: {
                        text: ""
                    },
                    chart: {
                        type: ele.chart.type
                    },
                    xAxis: ele.chart.xAxis,
                    yAxis: ele.chart.yAxis,
                    plotOptions: ele.chart.plotOptions,
                    credits: ele.chart.credits,
                    legend: ele.chart.legend,
                    series: ele.chart.data
                }
            };

            if (ele.question) {
                obj.question = ele.question;
                obj.options.title.text = ele.question;
            }

            if (ele.schoolName) {
                obj.options.title.text = ele.schoolName;
            }

        }
        else if (ele.chart.type == "column") {

            obj = {
                order: ele.order,
                type: "svg",
                options: {
                    title: {
                        text: ele.question
                    },
                    chart: {
                        type: ele.chart.type
                    },
                    xAxis: ele.chart.xAxis,
                    yAxis: ele.chart.yAxis,
                    plotOptions: ele.chart.plotOptions,
                    credits: ele.chart.credits,
                    legend: ele.chart.legend,
                    series: ele.chart.data
                },
                question: ele.question
            };
        }

        return resolve(obj);

    })
}

//Unnati pdf generate function
exports.unnatiPdfGeneration = async function (responseData, storeReportsToS3 = false) {

    return new Promise(async function (resolve, reject) {

        var currentTempFolder = 'tmp/' + uuidv4() + "--" + Math.floor(Math.random() * (10000 - 10 + 1) + 10)

        var imgPath = __dirname + '/../' + currentTempFolder;

        if (!fs.existsSync(imgPath)) {
            fs.mkdirSync(imgPath);
        }

        let bootstrapStream = await copyBootStrapFile(__dirname + '/../public/css/bootstrap.min.css', imgPath + '/style.css');

        //copy images from public folder
        let src = __dirname + '/../public/images/Calendar-Time.svg';
        fs.copyFileSync(src, imgPath + '/Calendar-Time.svg');

        let fileData = [{
            value: fs.createReadStream(imgPath + '/Calendar-Time.svg'),
            options: {
                filename: 'Calendar-Time.svg',

            }
        }]


        let subTasksCount = 0;

        responseData.tasks.forEach(element => {
            subTasksCount = subTasksCount + element.subTasks.length;
        });

        let startDate, endDate;
        let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        if (responseData.startDate) {
            let date = new Date(responseData.startDate);
            let day = date.getDate();
            let month = months[date.getMonth()];
            let year = date.getFullYear();
            startDate = day + " " + month + " " + year;
        }

        if (responseData.endDate) {
            let date = new Date(responseData.endDate);
            let day = date.getDate();
            let month = months[date.getMonth()];
            let year = date.getFullYear();
            endDate = day + " " + month + " " + year;
        }

        try {

            var FormData = [];

            FormData.push(...fileData);

            let obj = {
                subTasks: subTasksCount,
                duration: responseData.duration,
                goal: responseData.goal,
                tasksArray: responseData.tasks,
                projectName: responseData.title,
                category: responseData.category,
                status: responseData.status,
                startDate: startDate,
                endDate: endDate
            }

            ejs.renderFile(__dirname + '/../views/unnatiTemplate.ejs', {
                data: obj
            })
                .then(function (dataEjsRender) {

                    var dir = imgPath;
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }

                    fs.writeFile(dir + '/index.html', dataEjsRender, function (errWriteFile, dataWriteFile) {
                        if (errWriteFile) {
                            throw errWriteFile;
                        } else {

                            let optionsHtmlToPdf = gen.utils.getGotenbergConnection();
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
                            optionsHtmlToPdf.formData.files = FormData;


                            rp(optionsHtmlToPdf)
                                .then(function (responseHtmlToPdf) {

                                    var pdfBuffer = Buffer.from(responseHtmlToPdf.body);
                                    if (responseHtmlToPdf.statusCode == 200) {

                                        fs.writeFile(dir + '/pdfReport.pdf', pdfBuffer, 'binary', function (err) {
                                            if (err) {
                                                return console.log(err);
                                            }

                                            else {
                                                const s3 = new AWS.S3(gen.utils.getAWSConnection());

                                                const uploadFile = () => {

                                                    fs.readFile(dir + '/pdfReport.pdf', (err, data) => {
                                                        if (err) throw err;

                                                        const params = {
                                                            Bucket: process.env.AWS_BUCKET_NAME, // pass your bucket name
                                                            Key: 'pdfReport/' + uuidv4() + 'pdfReport.pdf',
                                                            Body: Buffer.from(data, null, 2),
                                                            Expires: 10
                                                        };

                                                        if (storeReportsToS3 == false) {
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
                                                }
                                                uploadFile();
                                            }
                                        });
                                    }

                                }).catch(err => {
                                    resolve(err);
                                })
                        }
                    })
                })
        }
        catch (err) {
            resolve(err);
        }

    })
}





//Unnati monthly report pdf generation function
exports.unnatiMonthlyReportPdfGeneration = async function (responseData, storeReportsToS3 = false) {

    return new Promise(async function (resolve, reject) {

        var currentTempFolder = 'tmp/' + uuidv4() + "--" + Math.floor(Math.random() * (10000 - 10 + 1) + 10)

        var imgPath = __dirname + '/../' + currentTempFolder;

        if (!fs.existsSync(imgPath)) {
            fs.mkdirSync(imgPath);
        }

        let bootstrapStream = await copyBootStrapFile(__dirname + '/../public/css/bootstrap.min.css', imgPath + '/style.css');

        try {
            var FormData = [];

            //get the chart object
            let chartObj = await getTaskStatusPieChart(responseData.projectDetails);

            //generate the chart using highchart server
            let highChartData = await apiCallToHighChart(chartObj[0], imgPath, "pie");

            FormData.push(...highChartData);

            let projectData = chartObj[1];

            let obj = {
                schoolName: responseData.schoolName,
                reportType: responseData.reportType,
                projectArray: projectData,
                chartData: highChartData
            }

            ejs.renderFile(__dirname + '/../views/unnatiMonthlyReport.ejs', {
                data: obj

            })
                .then(function (dataEjsRender) {

                    var dir = imgPath;
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }

                    fs.writeFile(dir + '/index.html', dataEjsRender, function (errWriteFile, dataWriteFile) {
                        if (errWriteFile) {
                            throw errWriteFile;
                        } else {

                            let optionsHtmlToPdf = gen.utils.getGotenbergConnection();
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
                            optionsHtmlToPdf.formData.files = FormData;


                            rp(optionsHtmlToPdf)
                                .then(function (responseHtmlToPdf) {

                                    var pdfBuffer = Buffer.from(responseHtmlToPdf.body);
                                    if (responseHtmlToPdf.statusCode == 200) {

                                        fs.writeFile(dir + '/pdfReport.pdf', pdfBuffer, 'binary', function (err) {
                                            if (err) {
                                                return console.log(err);
                                            }

                                            else {
                                                const s3 = new AWS.S3(gen.utils.getAWSConnection());

                                                const uploadFile = () => {

                                                    fs.readFile(dir + '/pdfReport.pdf', (err, data) => {
                                                        if (err) throw err;

                                                        const params = {
                                                            Bucket: process.env.AWS_BUCKET_NAME, // pass your bucket name
                                                            Key: 'pdfReport/' + uuidv4() + 'pdfReport.pdf',
                                                            Body: Buffer.from(data, null, 2),
                                                            Expires: 10
                                                        };

                                                        if (storeReportsToS3 == false) {
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
                                                }
                                                uploadFile();
                                            }
                                        });
                                    }

                                }).catch(err => {
                                    resolve(err);
                                })
                        }
                    })
                })
        }
        catch (err) {
            resolve(err);
        }

    })
}

async function getTaskStatusPieChart(data) {

    return new Promise(async function (resolve, reject) {

        let seriesData = [];
        var i = 0;
        let projectData = [];

        await Promise.all(data.map(async element => {

            let complete = 0, inProgress = 0, notStarted = 0;

            await Promise.all(element.tasks.map(async ele => {

                if (ele.status) {
                    if (ele.status.toLowerCase() == "completed") {
                        complete = complete + 1;
                    }
                    else if (ele.status.toLowerCase() == "in progress") {
                        inProgress = inProgress + 1;
                    }
                    else if (ele.status.toLowerCase() == "not started yet" || ele.status.toLowerCase() == "not yet started") {
                        notStarted = notStarted + 1;
                    }


                }
            }))

            let dataArray = [];

            if (complete >= 1) {
                let obj = {
                    name: 'Complete',
                    y: complete,
                    color: "#6abf34"
                }

                dataArray.push(obj);
            }
            if (notStarted >= 1) {
                let obj = {
                    name: 'Not Started',
                    y: notStarted,
                    color: "#81d6f0"
                }

                dataArray.push(obj);
            }
            if (inProgress >= 1) {
                let obj = {
                    name: 'In Progress',
                    y: inProgress,
                    color: "#91d050"
                }

                dataArray.push(obj);
            }

            let chartData = {
                type: "svg",
                order: i,
                options: {
                    chart: {
                        type: 'pie'
                    },
                    title: {
                        text: 'TASK STATUS %'
                    },
                    plotOptions: {
                        pie: {
                            dataLabels: {
                                enabled: true,
                                format: "{point.y}"
                            },
                            showInLegend: true
                        }
                    },
                    credits: {
                        enabled: false
                    },
                    series: [{
                        data: dataArray
                    }]
                }
            }

            seriesData.push(chartData);

            element.order = i;
            projectData.push(element);

            i++;

        }))

        resolve([seriesData, projectData]);


    })
}


//Unnati monthly report pdf generation function
exports.unnatiViewFullReportPdfGeneration = async function (responseData, storeReportsToS3 = false) {

    return new Promise(async function (resolve, reject) {

        var currentTempFolder = 'tmp/' + uuidv4() + "--" + Math.floor(Math.random() * (10000 - 10 + 1) + 10)

        var imgPath = __dirname + '/../' + currentTempFolder;

        if (!fs.existsSync(imgPath)) {
            fs.mkdirSync(imgPath);
        }

        let bootstrapStream = await copyBootStrapFile(__dirname + '/../public/css/bootstrap.min.css', imgPath + '/style.css');

        try {

            var FormData = [];

            //get the chart object
            let chartObj = await ganttChartObject(responseData.projectDetails);

            //generate the chart using highchart server
            let highChartData = await apiCallToHighChart(chartObj[0], imgPath, "gantt");

            FormData.push(...highChartData);

            let obj = {
                chartData: highChartData,
                reportType: responseData.reportType,
                projectData: chartObj[1]
            }

            ejs.renderFile(__dirname + '/../views/unnatiViewFullReport.ejs', {
                data: obj

            })
                .then(function (dataEjsRender) {

                    var dir = imgPath;
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }

                    fs.writeFile(dir + '/index.html', dataEjsRender, function (errWriteFile, dataWriteFile) {
                        if (errWriteFile) {
                            throw errWriteFile;
                        } else {

                            let optionsHtmlToPdf = gen.utils.getGotenbergConnection();
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
                            optionsHtmlToPdf.formData.files = FormData;


                            rp(optionsHtmlToPdf)
                                .then(function (responseHtmlToPdf) {

                                    var pdfBuffer = Buffer.from(responseHtmlToPdf.body);
                                    if (responseHtmlToPdf.statusCode == 200) {

                                        fs.writeFile(dir + '/pdfReport.pdf', pdfBuffer, 'binary', function (err) {
                                            if (err) {
                                                return console.log(err);
                                            }

                                            else {
                                                const s3 = new AWS.S3(gen.utils.getAWSConnection());

                                                const uploadFile = () => {

                                                    fs.readFile(dir + '/pdfReport.pdf', (err, data) => {
                                                        if (err) throw err;

                                                        const params = {
                                                            Bucket: process.env.AWS_BUCKET_NAME, // pass your bucket name
                                                            Key: 'pdfReport/' + uuidv4() + 'pdfReport.pdf',
                                                            Body: Buffer.from(data, null, 2),
                                                            Expires: 10
                                                        };

                                                        if (storeReportsToS3 == false) {
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
                                                }
                                                uploadFile();
                                            }
                                        });
                                    }

                                }).catch(err => {
                                    resolve(err);
                                })
                        }
                    })
                })
        }
        catch (err) {
            resolve(err);
        }

    })
}



//Unnati monthly report pdf generation function
exports.addTaskPdfGeneration = async function (responseData, storeReportsToS3 = false) {

    return new Promise(async function (resolve, reject) {

        var currentTempFolder = 'tmp/' + uuidv4() + "--" + Math.floor(Math.random() * (10000 - 10 + 1) + 10)

        var imgPath = __dirname + '/../' + currentTempFolder;

        if (!fs.existsSync(imgPath)) {
            fs.mkdirSync(imgPath);
        }

        let bootstrapStream = await copyBootStrapFile(__dirname + '/../public/css/bootstrap.min.css', imgPath + '/style.css');

        try {

            var FormData = [];

            let obj = {
                response: responseData
            }

            ejs.renderFile(__dirname + '/../views/unnatiAddTaskReport.ejs', {
                data: obj

            })
                .then(function (dataEjsRender) {

                    var dir = imgPath;
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }

                    fs.writeFile(dir + '/index.html', dataEjsRender, function (errWriteFile, dataWriteFile) {
                        if (errWriteFile) {
                            throw errWriteFile;
                        } else {

                            let optionsHtmlToPdf = gen.utils.getGotenbergConnection();
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
                            optionsHtmlToPdf.formData.files = FormData;


                            rp(optionsHtmlToPdf)
                                .then(function (responseHtmlToPdf) {

                                    var pdfBuffer = Buffer.from(responseHtmlToPdf.body);
                                    if (responseHtmlToPdf.statusCode == 200) {

                                        fs.writeFile(dir + '/pdfReport.pdf', pdfBuffer, 'binary', function (err) {
                                            if (err) {
                                                return console.log(err);
                                            }

                                            else {
                                                const s3 = new AWS.S3(gen.utils.getAWSConnection());

                                                const uploadFile = () => {

                                                    fs.readFile(dir + '/pdfReport.pdf', (err, data) => {
                                                        if (err) throw err;

                                                        const params = {
                                                            Bucket: process.env.AWS_BUCKET_NAME, // pass your bucket name
                                                            Key: 'pdfReport/' + uuidv4() + 'pdfReport.pdf',
                                                            Body: Buffer.from(data, null, 2),
                                                            Expires: 10
                                                        };

                                                        if (storeReportsToS3 == false) {
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
                                                }
                                                uploadFile();
                                            }
                                        });
                                    }

                                }).catch(err => {
                                    resolve(err);
                                })
                        }
                    })
                })
        }
        catch (err) {
            resolve(err);
        }

    })
}



//PDF generation for instance criteria report
exports.instanceCriteriaReportPdfGeneration = async function (instanceResponse, storeReportsToS3 = false) {


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

            let formData = [];

            let params = {
                observationName: instanceResponse.observationName
            }
            ejs.renderFile(__dirname + '/../views/header.ejs', {
                data: params
            })
                .then(function (headerHtml) {

                    var dir = imgPath;

                    fs.writeFile(dir + '/header.html', headerHtml, async function (err, dataWr) {
                        if (err) {
                            throw err;
                        } else {

                            var obj = {
                                response: instanceResponse.response
                            };
                            ejs.renderFile(__dirname + '/../views/instanceCriteriaTemplate.ejs', {
                                data: obj
                            })
                                .then(function (dataEjsRender) {

                                    var dir = imgPath;
                                    if (!fs.existsSync(dir)) {
                                        fs.mkdirSync(dir);
                                    }
                                    fs.writeFile(dir + '/index.html', dataEjsRender, function (errWriteFile, dataWriteFile) {
                                        if (errWriteFile) {
                                            throw errWriteFile;
                                        } else {

                                            let optionsHtmlToPdf = gen.utils.getGotenbergConnection();
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

                                            rp(optionsHtmlToPdf)
                                                .then(function (responseHtmlToPdf) {

                                                    // console.log("optionsHtmlToPdf", optionsHtmlToPdf.formData.files);
                                                    var pdfBuffer = Buffer.from(responseHtmlToPdf.body);
                                                    if (responseHtmlToPdf.statusCode == 200) {
                                                        fs.writeFile(dir + '/pdfReport.pdf', pdfBuffer, 'binary', function (err) {
                                                            if (err) {
                                                                return console.log(err);
                                                            }
                                                            // console.log("The PDF was saved!");
                                                            const s3 = new AWS.S3(gen.utils.getAWSConnection());
                                                            const uploadFile = () => {
                                                                fs.readFile(dir + '/pdfReport.pdf', (err, data) => {
                                                                    if (err) throw err;
                                                                    const params = {
                                                                        Bucket: process.env.AWS_BUCKET_NAME, // pass your bucket name
                                                                        Key: 'pdfReport/' + uuidv4() + 'pdfReport.pdf', // file will be saved as testBucket/contacts.csv
                                                                        Body: Buffer.from(data, null, 2),
                                                                        Expires: 10
                                                                    };

                                                                    if (storeReportsToS3 == false) {
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

        }
    })
}


// PDF generation function for entity report
exports.entityCriteriaPdfReportGeneration = async function (responseData, storeReportsToS3 = false) {

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

            let formData = [];

            //Prepare chart object before sending it to highchart server
            let multiSelectData = await getCriteriaChartData(responseData.response, "multiselect");
            let radioData = await getCriteriaChartData(responseData.response, "radio");

            //send chart objects to highchart server and get the charts
            let multiselectFormData = await apiCallToHighChart(multiSelectData, imgPath, "multiselect");
            let radioFormData = await apiCallToHighChart(radioData, imgPath, "radio");

            formData.push(...multiselectFormData);
            formData.push(...radioFormData);

            let params = {
                observationName: responseData.observationName
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

                            let obj = {
                                response: responseData.response,
                                radioData: radioFormData,
                                multiselectData: multiselectFormData
                            };
                            ejs.renderFile(__dirname + '/../views/entityCriteriaTemplate.ejs', {
                                data: obj
                            })
                                .then(function (dataEjsRender) {

                                    var dir = imgPath;
                                    if (!fs.existsSync(dir)) {
                                        fs.mkdirSync(dir);
                                    }
                                    fs.writeFile(dir + '/index.html', dataEjsRender, function (errWriteFile, dataWriteFile) {
                                        if (errWriteFile) {
                                            throw errWriteFile;
                                        } else {

                                            let optionsHtmlToPdf = gen.utils.getGotenbergConnection();
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

                                            rp(optionsHtmlToPdf)
                                                .then(function (responseHtmlToPdf) {

                                                    // console.log("optionsHtmlToPdf", optionsHtmlToPdf.formData.files);
                                                    var pdfBuffer = Buffer.from(responseHtmlToPdf.body);
                                                    if (responseHtmlToPdf.statusCode == 200) {
                                                        fs.writeFile(dir + '/pdfReport.pdf', pdfBuffer, 'binary', function (err) {
                                                            if (err) {
                                                                return console.log(err);
                                                            }
                                                            
                                                            const s3 = new AWS.S3(gen.utils.getAWSConnection());
                                                            const uploadFile = () => {
                                                                fs.readFile(dir + '/pdfReport.pdf', (err, data) => {
                                                                    if (err) throw err;
                                                                    const params = {
                                                                        Bucket: process.env.AWS_BUCKET_NAME, // pass your bucket name
                                                                        Key: 'pdfReport/' + uuidv4() + 'pdfReport.pdf', // file will be saved as testBucket/contacts.csv
                                                                        Body: Buffer.from(data, null, 2),
                                                                        Expires: 10
                                                                    };

                                                                    if (storeReportsToS3 == false) {
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
            console.log(exp);
        }
    })

}




//Prepare chart object to send it to highchart server
async function getCriteriaChartData(items, type) {
    return new Promise(async function (resolve, reject) {

        let arrayOfChartData = [];

        await Promise.all(items.map(async element => {

            await Promise.all(element.questionArray.map(async ele => {

                if (ele.responseType && ele.responseType == type) {
                    let chartType = "bar";
                    if (type == "radio") {
                        chartType = "pie";
                    }

                    let obj = await createChartObject(ele, chartType);

                    arrayOfChartData.push(obj);
                }

            }));
        }));
        return resolve(arrayOfChartData);
    });
}


async function createChartObject(ele, chartType) {

    return new Promise(async function (resolve, reject) {

        let obj = {
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
                plotOptions: ele.chart.plotOptions,
                xAxis: ele.chart.xAxis,
                yAxis: ele.chart.yAxis,
                credits: {
                    enabled: false
                },
                series: ele.chart.data
            },
            question: ele.question
        };

        if (chartType == "pie") {
            obj.options.chart = {
                type: chartType,
                align: 'center',
                marginLeft: 0,
                marginBottom: 100
            }

            obj.options.legend = {
                align: 'left',
                layout: 'vertical',
                itemStyle: {
                    "word-wrap": "break-word",
                    color: '#000000',
                    fontWeight: 'bold',
                    width: 700,
                    "overflow-wrap": "break-word"
                }
            }
        }

        resolve(obj);

    })

}

//PDF generation for instance observation score report
exports.instanceScoreCriteriaPdfGeneration = async function (observationResp, storeReportsToS3 = false, obj) {

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

            let chartObj = await getCriteriaScoreChartObject(observationResp.response);

            let highChartData = await apiCallToHighChart(chartObj, imgPath, "pie");

            let params = {
                observationName: observationResp.observationName
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


                            obj.response = observationResp.response;
                            obj.highChartData = highChartData;

                            ejs.renderFile(__dirname + '/../views/scoreCriteriaTemplate.ejs', {
                                data: obj
                            })
                                .then(function (dataEjsRender) {

                                    var dir = imgPath;
                                    if (!fs.existsSync(dir)) {
                                        fs.mkdirSync(dir);
                                    }

                                    fs.writeFile(dir + '/index.html', dataEjsRender, function (errWriteFile, dataWriteFile) {
                                        if (errWriteFile) {
                                            throw errWriteFile;
                                        } else {

                                            let optionsHtmlToPdf = gen.utils.getGotenbergConnection();
                                            optionsHtmlToPdf.formData = {
                                                files: [
                                                ]
                                            };
                                            highChartData.push({
                                                value: fs.createReadStream(dir + '/index.html'),
                                                options: {
                                                    filename: 'index.html'
                                                }
                                            });
                                            highChartData.push({
                                                value: fs.createReadStream(dir + '/style.css'),
                                                options: {
                                                    filename: 'style.css'
                                                }
                                            });
                                            highChartData.push({
                                                value: fs.createReadStream(dir + '/header.html'),
                                                options: {
                                                    filename: 'header.html'
                                                }
                                            });
                                            highChartData.push({
                                                value: fs.createReadStream(dir + '/footer.html'),
                                                options: {
                                                    filename: 'footer.html'
                                                }
                                            });
                                            optionsHtmlToPdf.formData.files = highChartData;

                                            rp(optionsHtmlToPdf)
                                                .then(function (responseHtmlToPdf) {

                                                    var pdfBuffer = Buffer.from(responseHtmlToPdf.body);
                                                    if (responseHtmlToPdf.statusCode == 200) {

                                                        fs.writeFile(dir + '/pdfReport.pdf', pdfBuffer, 'binary', function (err) {
                                                            if (err) {
                                                                return console.log(err);
                                                            }

                                                            else {
                                                                const s3 = new AWS.S3(gen.utils.getAWSConnection());

                                                                const uploadFile = () => {

                                                                    fs.readFile(dir + '/pdfReport.pdf', (err, data) => {
                                                                        if (err) throw err;

                                                                        const params = {
                                                                            Bucket: process.env.AWS_BUCKET_NAME, // pass your bucket name
                                                                            Key: 'pdfReport/' + uuidv4() + 'pdfReport.pdf',
                                                                            Body: Buffer.from(data, null, 2),
                                                                            Expires: 10
                                                                        };

                                                                        if (storeReportsToS3 == false) {
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
                                                                }
                                                                uploadFile();
                                                            }
                                                        });

                                                    }

                                                }).catch(function (err) {
                                                    console.log("error in converting HtmlToPdf", err);
                                                    resolve(err);
                                                    throw err;
                                                });

                                        }

                                    });

                                }).catch(function (errEjsRender) {
                                    console.log("errEjsRender : ", errEjsRender);

                                    reject(errEjsRender);
                                });
                        }


                    });



                });
        }

        catch (err) {
            console.log(err);
        }
    })

}


// gantt chart for unnati pdf report
async function ganttChartObject(data) {

    return new Promise(async function (resolve, reject) {



        let i = 1;
        let arrayOfData = [];
        let projectData = [];

        await Promise.all(data.map(async element => {

            let xAxisCategories = [];
            let dataArray = [];


            await Promise.all(element.tasks.map(ele => {

                xAxisCategories.push(ele.title);
                if (ele.status) {
                    if (ele.status.toLowerCase() == "completed") {

                        let obj = {
                            y: 4,
                            color: "#00c983"
                        }

                        dataArray.push(obj);
                    } else if (ele.status.toLowerCase() == "not yet started" || ele.status.toLowerCase() == "not started yet" || ele.status.toLowerCase() == "notstarted") {
                        let obj = {
                            y: 4,
                            color: "#F5F5F5"
                        }
                        dataArray.push(obj);
                    } else if (ele.status.toLowerCase() == "in progress" || ele.status.toLowerCase() == "inprogress") {
                        let obj = {
                            y: 4,
                            color: "#FF872F"
                        }
                        dataArray.push(obj);
                    }
                }
            }))

            let chartData = {
                order: i,
                type: "svg",
                options: {

                    chart: {
                        type: 'bar'
                    },
                    title: {
                        text: ''
                    },

                    xAxis: {
                        categories: xAxisCategories,
                        title: {
                            text: null
                        }
                    },
                    yAxis: {
                        min: 1,
                        max: 4,
                        allowDecimals: false,
                        opposite: true,
                        title: {
                            text: '',

                        },
                        labels: {
                            format: 'Week {value}'
                        }
                    },

                    plotOptions: {
                        bar: {
                            dataLabels: {
                                enabled: false
                            }
                        }
                    },
                    legend: {
                        enabled: false
                    },
                    credits: {
                        enabled: false
                    },
                    series: [{
                        data: dataArray
                    }]
                }
            }

            arrayOfData.push(chartData);
            element.order = i;
            projectData.push(element);
            i++;
        }))
        resolve([arrayOfData, projectData]);

    })

}



//Unnati redesign entity report pdf generation function
exports.unnatiEntityReportPdfGeneration = async function (inputData, storeReportsToS3 = false) {

    return new Promise(async function (resolve, reject) {

        let currentTempFolder = 'tmp/' + uuidv4() + "--" + Math.floor(Math.random() * (10000 - 10 + 1) + 10)

        let imgPath = __dirname + '/../' + currentTempFolder;

        if (!fs.existsSync(imgPath)) {
            fs.mkdirSync(imgPath);
        }

        let bootstrapStream = await copyBootStrapFile(__dirname + '/../public/css/bootstrap.min.css', imgPath + '/style.css');

        try {
            let formData = [];

            //copy images from public folder
            let imgSourcePaths = ['/../public/images/note1.svg', '/../public/images/note2.svg', '/../public/images/note3.svg', '/../public/images/note4.svg']

            for (let i = 0; i < imgSourcePaths.length; i++) {

                let imgName = "note" + (i + 1) + ".svg";
                let src = __dirname + imgSourcePaths[i];
                fs.copyFileSync(src, imgPath + ('/' + imgName));

                formData.push({
                    value: fs.createReadStream(imgPath + ('/' + imgName)),
                    options: {
                        filename: imgName,
                    }
                })
            }

            //get the chart object
            let chartData = await getEntityReportChartObjects(inputData);

            //generate the chart using highchart server
            let highChartData = await apiCallToHighChart(chartData, imgPath, "pie");

            formData.push(...highChartData);

            let ejsInputData = {
                chartData: highChartData,
                response: inputData
            }

            ejs.renderFile(__dirname + '/../views/unnatiEntityReport.ejs', {
                data: ejsInputData
            })
                .then(function (dataEjsRender) {

                    let dir = imgPath;
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }

                    fs.writeFile(dir + '/index.html', dataEjsRender, function (errWriteFile, dataWriteFile) {
                        if (errWriteFile) {
                            throw errWriteFile;
                        } else {

                            let optionsHtmlToPdf = gen.utils.getGotenbergConnection();
                            optionsHtmlToPdf.formData = {
                                files: []
                            };
                            formData.push({
                                value: fs.createReadStream(dir + '/index.html'),
                                options: {
                                    filename: 'index.html'
                                }
                            });
                            optionsHtmlToPdf.formData.files = formData;

                            rp(optionsHtmlToPdf)
                                .then(function (responseHtmlToPdf) {

                                    var pdfBuffer = Buffer.from(responseHtmlToPdf.body);
                                    if (responseHtmlToPdf.statusCode == 200) {

                                        fs.writeFile(dir + '/pdfReport.pdf', pdfBuffer, 'binary', function (err) {
                                            if (err) {
                                                return console.log(err);
                                            }

                                            else {
                                                const s3 = new AWS.S3(gen.utils.getAWSConnection());

                                                const uploadFile = () => {

                                                    fs.readFile(dir + '/pdfReport.pdf', (err, data) => {
                                                        if (err) throw err;

                                                        const params = {
                                                            Bucket: process.env.AWS_BUCKET_NAME, // pass your bucket name
                                                            Key: 'pdfReport/' + uuidv4() + 'pdfReport.pdf',
                                                            Body: Buffer.from(data, null, 2),
                                                            Expires: 10
                                                        };

                                                        if (storeReportsToS3 == false) {
                                                            let folderPath = Buffer.from(currentTempFolder).toString('base64')

                                                            let response = {
                                                                status: "success",
                                                                message: 'report generated',
                                                                pdfUrl: folderPath,

                                                            };
                                                            resolve(response);

                                                        } else {


                                                            s3.upload(params, function (s3Err, data) {
                                                                if (s3Err) throw s3Err;

                                                                console.log(`File uploaded successfully at ${data.Location}`);

                                                                s3SignedUrl(data.key).then(function (signedRes) {

                                                                    try {

                                                                        fs.readdir(imgPath, (err, files) => {
                                                                            if (err) throw err;

                                                                            let i = 0;
                                                                            for (const file of files) {

                                                                                fs.unlink(path.join(imgPath, file), err => {
                                                                                    if (err) throw err;
                                                                                });

                                                                                if (i == files.length) {
                                                                                    fs.unlink('../../' + currentTempFolder, err => {
                                                                                        if (err) throw err;

                                                                                    });
                                                                                }

                                                                                i = i + 1;

                                                                            }
                                                                        });
                                                                        rimraf(imgPath, function () { console.log("done"); });

                                                                    } catch (ex) {
                                                                        console.log("ex ", ex);
                                                                    }

                                                                    let response = {
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
                                                }
                                                uploadFile();
                                            }
                                        });
                                    }

                                }).catch(err => {
                                    resolve(err);
                                })
                        }
                    })
                })
        }
        catch (err) {
            resolve(err);
        }
    })
}

async function getEntityReportChartObjects(data) {

    return new Promise(async function (resolve, reject) {

        let chartData = [];

        let getChartObjects = [
            getTaskOverviewChart(data.tasks),
            getCategoryWiseChart(data.categories)
        ];

        await Promise.all(getChartObjects)
            .then(function (response) {
                chartData.push(response[0]);
                chartData.push(response[1]);
            });

        return resolve(chartData)


    })
}

async function getTaskOverviewChart(tasks) {
    return new Promise(async function (resolve, reject) {


        let total = tasks['Total'];
        delete tasks['Total'];

        let seriesData = "[";
        Object.keys(tasks).forEach(eachTask => {
            let color = "";
            if (eachTask == "Completed") {
                color = "green";
            } else if (eachTask == "Not Started") {
                color = "red";
            }

            let percetage = ((tasks[eachTask] / total) * 100).toFixed(1);
            if (color != "") {
                seriesData = seriesData + "{ color:'" + color + "',name: '" + eachTask + "',y:" + percetage + "},";
            } else {
                seriesData = seriesData + "{ name: '" + eachTask + "',y: " + percetage + "},";
            }

        })
        seriesData = seriesData + "]";

        let chartOptions = "{ title: { text: '' },chart: { type: 'pie' }," +
            "plotOptions: { 'pie': { showInLegend: true, dataLabels: { enabled: true, formatter: function () { return this.y ? this.point.y+'%' : null; }} }},"
            + "credits: { enabled: false },"
            + "series: [{ minPointSize: 50,innerSize: '80%',zMin: 0,name: 'tasks', data: " + seriesData + " }] }"

        let chartObject = {
            order: 1,
            type: "svg",
            options: chartOptions
        };

        resolve(chartObject);
    })
}

async function getCategoryWiseChart(categories) {
    return new Promise(async function (resolve, reject) {

        let total = categories['Total'];
        delete categories['Total'];

        let seriesData = "[";
        Object.keys(categories).forEach(eachCategory => {
            let percetage = ((categories[eachCategory] / total) * 100).toFixed(1);
            seriesData = seriesData + "{ name: '" + eachCategory + "',y: " + percetage + "},";
        });

        seriesData = seriesData + "]";
        let chartOptions = "{ title: { text: '' },chart: { type: 'pie' }," +
            "plotOptions: { 'pie': { showInLegend: true, dataLabels: { enabled: true, formatter: function () { return this.y ? this.point.y+'%' : null; }} }},"
            + "credits: { enabled: false },"
            + "series: [{ minPointSize: 50,innerSize: '50%',zMin: 0,name: 'tasks', data: " + seriesData + " }] }"

        let chartObject = {
            order: 2,
            type: "svg",
            options: chartOptions
        };
        resolve(chartObject);
    })
}



async function convertChartDataTofile(radioFilePath, options) {
    try {
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
    catch (err) {
        console.log("error while generating highchart")
    }
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
            console.log("error while calling highchart server");
        }
    });
}


async function callChartApiPreparation(ele, imgPath, type, chartData, carrent, formData) {
    try {
        let loop = 0;
        let options = gen.utils.getHighChartConnection();
        let chartImage = "chartPngImage_" + loop + "_" + uuidv4() + "_.svg";
        options.method = "POST";
        options.body = JSON.stringify(ele);
        let imgFilePath = imgPath + "/" + chartImage;
        loop = loop + 1;
        let renderImage = await convertChartDataTofile(imgFilePath, options);

        let fileDat = {
            order: ele.order,
            value: fs.createReadStream(imgFilePath),
            options: {
                filename: chartImage,

            }
        }

        if (ele.question) {
            fileDat.options.question = ele.question;
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
    catch (err) {
        console.log(err);
        console.log("error");
    }
}
async function getPercentages(data, target = 100) {
    var off = target - _.reduce(data, function (acc, x) { return acc + Math.round(x) }, 0);
    return _.chain(data).
        sortBy(function (x) { return Math.round(x) - x }).
        map(function (x, i) { return Math.round(x) + (off > i) - (i >= (data.length + off)) }).
        value();
}


//Improvement project pdf generation function
exports.improvementProjectPdfGeneration = async function (responseData) {

    return new Promise(async function (resolve, reject) {
        
        
        let currentTempFolder = 'tmp/' + uuidv4() + "--" + Math.floor(Math.random() * (10000 - 10 + 1) + 10)

        let imgPath = __dirname + '/../' + currentTempFolder;

        if (!fs.existsSync(imgPath)) {
            fs.mkdirSync(imgPath);
        }

        let bootstrapStream = await copyBootStrapFile(__dirname + '/../public/css/bootstrap.min.css', imgPath + '/style.css');
       
        let subTasksCount = 0;
        let completedTaskCount = 0;
        if (responseData.tasks.length > 0) {
            responseData.tasks.forEach(element => {
               subTasksCount = subTasksCount + element.children.length;
               if ( element.status == "completed") {
                    completedTaskCount++;
               }
            });
        }
    
        responseData.completedTaskCount = completedTaskCount;
       
        try {
            
            let FormData = [];
            
            let obj = {
                subTasks: subTasksCount,
                tasksArray: responseData.tasks,
                response: responseData
            }
            
            ejs.renderFile(__dirname + '/../views/improvementProjectTemplate.ejs', {
                data: obj
            })
                .then(function (dataEjsRender) {

                    var dir = imgPath;
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }

                    fs.writeFile(dir + '/index.html', dataEjsRender, function (errWriteFile, dataWriteFile) {
                        if (errWriteFile) {
                            
                            throw errWriteFile;
                        } else {

                            let optionsHtmlToPdf = gen.utils.getGotenbergConnection();
                            
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
                            optionsHtmlToPdf.formData.files = FormData;
                            optionsHtmlToPdf.formData.paperHeight = 4.2;
                            optionsHtmlToPdf.formData.emulatedMediaType = "screen";
                            optionsHtmlToPdf.formData.marginRight = 0;
                            optionsHtmlToPdf.formData.marginLeft = 0;
                            optionsHtmlToPdf.formData.marginTop = 0;
                            optionsHtmlToPdf.formData.marginBottom = 0;
                            
                            

                            rp(optionsHtmlToPdf)
                                .then(function (responseHtmlToPdf) {

                                    let pdfBuffer = Buffer.from(responseHtmlToPdf.body);
                                    
                                    if (responseHtmlToPdf.statusCode == 200) {
                                       
                                        let pdfFile = uuidv4() + ".pdf";
                                        
                                        fs.writeFile(dir + '/' + pdfFile, pdfBuffer, 'binary', async function (err) {
                                            if (err) {
                                                
                                                return console.log(err);
                                            }
                                            else {
                                                
                                                let uploadFileResponse = await uploadPdfToCloud(pdfFile, dir);

                                                if (uploadFileResponse.success) {
                                                    let pdfDownloadableUrl = await getDownloadableUrl(uploadFileResponse.data);

                                                    if (pdfDownloadableUrl.success && pdfDownloadableUrl.data.result && Object.keys(pdfDownloadableUrl.data.result).length > 0) {

                                                        fs.readdir(imgPath, (err, files) => {
                                                            if (err) throw err;

                                                            let i = 0;
                                                            for (const file of files) {

                                                                fs.unlink(path.join(imgPath, file), err => {
                                                                    if (err) throw err;
                                                                });

                                                                if (i == files.length) {
                                                                    fs.unlink('../../' + currentTempFolder, err => {
                                                                        if (err) throw err;

                                                                    });
                                                                    console.log("path.dirname(filename).split(path.sep).pop()", path.dirname(file).split(path.sep).pop());

                                                                }

                                                                i = i + 1;

                                                            }
                                                        });
                                                        rimraf(imgPath, function () { console.log("done"); });

                                                        return resolve({
                                                            status: filesHelper.status_success,
                                                            message: filesHelper.pdf_report_generated,
                                                            pdfUrl: pdfDownloadableUrl.data.result.url
                                                        });
                                                    }
                                                    else {
                                                        
                                                        return resolve({
                                                            status: filesHelper.status_failure,
                                                            message: pdfDownloadableUrl.message ? pdfDownloadableUrl.message : filesHelper.could_not_generate_pdf,
                                                            pdfUrl: ""
                                                        })
                                                    }
                                                }
                                                else {
                                                    
                                                    return resolve({
                                                        status: filesHelper.status_failure,
                                                        message: uploadFileResponse.message ? uploadFileResponse.message : filesHelper.could_not_generate_pdf,
                                                        pdfUrl: ""
                                                    })
                                                }

                                            }
                                        });
                                    }

                                }).catch(err => {
                                    resolve(err);
                                })
                        }
                    })
                })
        }
        catch (err) {
            resolve(err);
        }

    })
}

//Improvement project task pdf generation function
exports.improvementProjectTaskPdfGeneration = async function (responseData) {

    return new Promise(async function (resolve, reject) {
        
        console.log("Debugging Reports Issue");
       
        let currentTempFolder = 'tmp/' + uuidv4() + "--" + Math.floor(Math.random() * (10000 - 10 + 1) + 10)

        let imgPath = __dirname + '/../' + currentTempFolder;

        if (!fs.existsSync(imgPath)) {
            fs.mkdirSync(imgPath);
        }

        let bootstrapStream = await copyBootStrapFile(__dirname + '/../public/css/bootstrap.min.css', imgPath + '/style.css');

        let completedTaskCount = 0;
        if (responseData.tasks.length > 0) {
            responseData.tasks.forEach(element => {
               if ( element.status == "completed") {
                    completedTaskCount++;
               }
            });
        }
        
        responseData.completedTaskCount = responseData.taskcompleted;
        try {

            let FormData = [];
           
           
            let obj = {
                response: responseData,
                tasksArray: responseData.tasks
            }
           
            ejs.renderFile(__dirname + '/../views/improvementProjectTaskTemplate.ejs', {
                data: obj

            })
                .then(function (dataEjsRender) {

                    var dir = imgPath;
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }

                    fs.writeFile(dir + '/index.html', dataEjsRender, function (errWriteFile, dataWriteFile) {
                        if (errWriteFile) {
                            throw errWriteFile;
                        } else {

                            let optionsHtmlToPdf = gen.utils.getGotenbergConnection();
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
                            optionsHtmlToPdf.formData.files = FormData;
                            optionsHtmlToPdf.formData.paperHeight = 4.2;
                            optionsHtmlToPdf.formData.emulatedMediaType = "screen";
                            optionsHtmlToPdf.formData.marginRight = 0;
                            optionsHtmlToPdf.formData.marginLeft = 0;
                            optionsHtmlToPdf.formData.marginTop = 0;
                            optionsHtmlToPdf.formData.marginBottom = 0;


                            rp(optionsHtmlToPdf)
                                .then(function (responseHtmlToPdf) {
                                    console.log({responseHtmlToPdf});
                                    let pdfBuffer = Buffer.from(responseHtmlToPdf.body);
                                    if (responseHtmlToPdf.statusCode == 200) {

                                        let pdfFile = uuidv4() + ".pdf";
                                        fs.writeFile(dir + '/' + pdfFile, pdfBuffer, 'binary', async function (err) {
                                            if (err) {
                                                return console.log(err);
                                            }
                                            else {

                                                let uploadFileResponse = await uploadPdfToCloud(pdfFile, dir);
                                                console.log({uploadFileResponse});
                                                if (uploadFileResponse.success) {
                                                    let pdfDownloadableUrl = await getDownloadableUrl(uploadFileResponse.data);
                                                    console.log({pdfDownloadableUrl})
                                                    if (pdfDownloadableUrl.success && pdfDownloadableUrl.data.result && Object.keys(pdfDownloadableUrl.data.result).length > 0) {

                                                        fs.readdir(imgPath, (err, files) => {
                                                            if (err) throw err;

                                                            let i = 0;
                                                            for (const file of files) {

                                                                fs.unlink(path.join(imgPath, file), err => {
                                                                    if (err) throw err;
                                                                });

                                                                if (i == files.length) {
                                                                    fs.unlink('../../' + currentTempFolder, err => {
                                                                        if (err) throw err;

                                                                    });
                                                                    console.log("path.dirname(filename).split(path.sep).pop()", path.dirname(file).split(path.sep).pop());

                                                                }

                                                                i = i + 1;

                                                            }
                                                        });
                                                        rimraf(imgPath, function () { console.log("done"); });

                                                        return resolve({
                                                            status: filesHelper.status_success,
                                                            message: filesHelper.pdf_report_generated,
                                                            pdfUrl: pdfDownloadableUrl.data.result.url
                                                        });
                                                    }
                                                    else {
                                                        return resolve({
                                                            status: filesHelper.status_failure,
                                                            message: pdfDownloadableUrl.message ? pdfDownloadableUrl.message : filesHelper.could_not_generate_pdf,
                                                            pdfUrl: ""
                                                        })
                                                    }
                                                }
                                                else {
                                                    return resolve({
                                                        status: filesHelper.status_failure,
                                                        message: uploadFileResponse.message ? uploadFileResponse.message : filesHelper.could_not_generate_pdf,
                                                        pdfUrl: ""
                                                    })
                                                }

                                            }
                                        });
                                    }

                                }).catch(err => {
                                    console.log({ 'Gotten Burg Error': err });
                                    resolve(err);
                                })
                        }
                    })
                })
        }
        catch (err) {
            resolve(err);
        }

    })
}


const uploadPdfToCloud = async function(fileName, folderPath) {

    return new Promise( async function( resolve, reject) {
     
     try {
 
         let getSignedUrl = await kendraHelper.getPreSignedUrl
         (
             fileName
         );
        
         if (getSignedUrl.result && Object.keys(getSignedUrl.result).length > 0) {
             
             let fileUploadUrl = getSignedUrl.result[Object.keys(getSignedUrl.result)[0]].files[0].url;
             let fileData = fs.readFileSync(folderPath + "/" + fileName);
            
             try { 
                 await request({
                   url: fileUploadUrl,
                   method: 'put',
                   headers: {
                       "x-ms-blob-type" : getSignedUrl.result[Object.keys(getSignedUrl.result)[0]].files[0].cloudStorage == filesHelper.azure ? "BlockBlob" : null,
                       "Content-Type": "multipart/form-data"
                     },
                   body: fileData
                 })
                 
                 return resolve({
                     success: true,
                     data: getSignedUrl.result[Object.keys(getSignedUrl.result)[0]].files[0].payload.sourcePath
                 })
                 
             } catch (e) {
                 console.log(e)
             }
         }
         else {
             return resolve({
                 success: false
             })
         }
     }
     catch(err) {
         return resolve({
             success: false,
             message: err.message
         })
     }
 
    })
 }
 
const getDownloadableUrl = async function (filePath) {
 
     return new Promise(async function (resolve, reject) {
 
         try {
            
             let response = await kendraHelper.getDownloadableUrl
             (
                 filePath
             );
            
             return resolve({
                 success: true,
                 data: response
             });
         }
         catch (err) {
             return resolve({
                 success: false,
                 message: err.message
             })
         }
 
     })
}