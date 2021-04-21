const fs = require('fs');
const uuidv4 = require('uuid/v4');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const plugins = require("chartjs-plugin-datalabels");
const width = 800; //px
const height = 450; //px
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
const rp = require('request-promise');
const ejs = require('ejs');
const path = require('path');
const rimraf = require("rimraf");

const kendraHelper = require('./kendra_service');
const request = require("request");
const filesHelper = require('../common/files_helper');


// PDF generation function for entity report
exports.pdfGeneration = async function pdfGeneration(instaRes) {


    return new Promise(async function (resolve, reject) {

        let currentTempFolder = 'tmp/' + uuidv4() + "--" + Math.floor(Math.random() * (10000 - 10 + 1) + 10)

        let imgPath = __dirname + '/../' + currentTempFolder;
        
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
            let multiSelectDataArray = [];
            let radioDataArray = [];

            //loop the response and store multiselect and radio questions of matrix type
            await Promise.all(instaRes.reportSections.map(async ele => {
                if (ele.responseType == "matrix") {
                    await Promise.all(ele.instanceQuestions.map(element => {
                        if (element.responseType == "multiselect") {
                            matrixMultiSelectArray.push(element);
                        }
                        else if (element.responseType == "radio") {
                            matrixRadioArray.push(element);
                        }
                    }))
                } else if (ele.responseType == "multiselect") {
                    multiSelectDataArray.push(ele)
                } else if (ele.responseType == "radio") {
                    radioDataArray.push(ele)
                }
            }))
           
            let multiSelectData = []
            let radioQuestions = [];
            let matrixMultiSelectChartObj = [];
            let matrixRadioChartObj = [];
            let formDataMultiSelect = [];
            let radioFormData = [];
            let formDataMatrixMultiSelect = [];
            let matrixRadioFormData = [];

            //Prepare chart object before sending it to highchart server
            if (multiSelectDataArray.length > 0 ) {
               multiSelectData = await getChartObject(multiSelectDataArray);
               formDataMultiSelect = await createChart(multiSelectData, imgPath);
            }
            if (radioDataArray.length > 0 ) {
                radioQuestions = await getChartObject(radioDataArray);
                radioFormData = await createChart(radioQuestions, imgPath);
            }
            if (matrixMultiSelectArray.length > 0 ) {
                matrixMultiSelectChartObj = await getChartObject(matrixMultiSelectArray);
                formDataMatrixMultiSelect = await createChart(matrixMultiSelectChartObj, imgPath);
            }
            if (matrixRadioArray.length > 0 ) {
                matrixRadioChartObj = await getChartObject(matrixRadioArray);
                matrixRadioFormData = await createChart(matrixRadioChartObj, imgPath);
            }

            FormData.push(...formDataMultiSelect);
            FormData.push(...radioFormData);
            FormData.push(...formDataMatrixMultiSelect);
            FormData.push(...matrixRadioFormData);
           
            let params;

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

                    let dir = imgPath;
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }
                    fs.writeFile(dir + '/header.html', headerHtml, async function (errWr, dataWr) {
                        if (errWr) {
                            throw errWr;
                        } else {
                            
                            let arrOfData = [];
                            let matrixData = [];

                            await Promise.all(instaRes.reportSections.map(async ele => {

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

                            let obj = {
                                path: formDataMultiSelect,
                                instaRes: instaRes.reportSections,
                                radioOptionsData: [],
                                orderData: arrOfData,
                                matrixRes: matrixData
                            };

                            ejs.renderFile(__dirname + '/../views/mainTemplate.ejs', {
                                data: obj
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

        } finally {}
    })

}

// PDF generation function for instance API
exports.instanceObservationPdfGeneration = async function instanceObservationPdfGeneration(instaRes) {


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

            await Promise.all(instaRes.reportSections.map(async ele => {
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
            let multiSelectChartObj = await getChartObject(multiSelectArray);
            let radioChartObj = await getChartObject(radioArray);

            let multiselectFormData = await createChart(multiSelectChartObj, imgPath);
            let radioFormData = await createChart(radioChartObj, imgPath);

            formData.push(...multiselectFormData);
            formData.push(...radioFormData);


            var params = {
                observationName: instaRes.solutionName
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

                            await Promise.all(instaRes.reportSections.map(async ele => {


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
                                  reject(errEjsRender);
                                });

                        }

                    });
                });

        } catch (exp) {
          return reject(exp);
        } 
    })
}

//PDF generation for instance observation score report
exports.instanceObservationScorePdfGeneration = async function instanceObservationPdfGeneration(observationResp, obj) {

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
            let chartObject = await getChartObject(observationResp.reportSections);

            let formData = await createChart(chartObject, imgPath);

            let params;

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


                            await Promise.all(observationResp.reportSections.map(async ele => {

                                let dt = formData.filter(or => {

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
                                            })
                                            .catch(function (err) {
                                                resolve(err);
                                                throw err;
                                            });
                                        }
                                    });
                                }).catch(function (errEjsRender) {
                                    return reject(errEjsRender);
                                });
                        }
                    });
                });
        }
        catch (err) {
         return reject(err);
        }
    })
}


// ============> PDF generation function for assessment API ======================>

// Single submission and multiple submission assessment report
exports.assessmentAgainPdfReport = async function (assessmentResponse) {

    return new Promise(async function (resolve, reject) {

        let currentTempFolder = 'tmp/' + uuidv4() + "--" + Math.floor(Math.random() * (10000 - 10 + 1) + 10)

        let imgPath = __dirname + '/../' + currentTempFolder;

        try {

            let assessmentChartData = await getAssessmentAgainChartData(assessmentResponse);
            let chartData = await getChartObject([assessmentChartData.reportSections[0]]);

            // console.log("imgPath",imgPath);
            if (!fs.existsSync(imgPath)) {
                fs.mkdirSync(imgPath);
            }

            let bootstrapStream = await copyBootStrapFile(__dirname + '/../public/css/bootstrap.min.css', imgPath + '/style.css');

            // let headerFile = await copyBootStrapFile(__dirname + '/../views/header.html', imgPath + '/header.html');
            let footerFile = await copyBootStrapFile(__dirname + '/../views/footer.html', imgPath + '/footer.html');

            let FormData = [];

            let formDataAssessment = await createChart(chartData, imgPath);

            FormData.push(...formDataAssessment);
            let params = {
                assessmentName: assessmentResponse.programName
            }
            ejs.renderFile(__dirname + '/../views/assessment_header.ejs', {
                data: params
            })
                .then(function (headerHtml) {
                    let dir = imgPath;
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }
                    fs.writeFile(dir + '/header.html', headerHtml, function (errWr, dataWr) {
                        if (errWr) {
                            throw errWr;
                        } else {

                            let obj = {
                                path: formDataAssessment,
                            };

                            assessmentResponse.reportSections[1].isAssessAgain = true;

                            ejs.renderFile(__dirname + '/../views/stacked_bar_assessment_template.ejs', {
                                data: obj.path[0].options.filename,
                                assessmentData: assessmentResponse.reportSections[1]
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
                                            })
                                            .catch(function (err) {
                                                resolve(err);
                                                throw err;
                                            });
                                        }
                                    });
                                })
                                .catch(function (errEjsRender) {
                                    console.log(errEjsRender);
                                    resolve(errEjsRender);
                                });
                        }
                    });
                });

        } catch (err) {
            return reject(err);
        }
    })
}

const getAssessmentAgainChartData = async function(assessmentData) {

    let actualChartData = [];
    let j = 0;
    let k = 0;
   
    for (let i =0; i < assessmentData.reportSections[0].chart.data.datasets.length; i++) {
        actualChartData = [...actualChartData, ...assessmentData.reportSections[0].chart.data.datasets[i].data]
    }
   
    let chartData = await convertAssessAgainChartDataToPercentage(assessmentData.reportSections[0].domainLevelObject);
    
    assessmentData.reportSections[0].chart.data.datasets = chartData;

    assessmentData.reportSections[0].chart.options["plugins"] = {
        datalabels: {
            offset: 0,
            anchor: "end",
            align: "left",
            font: {
              size: 7
            },
            formatter: function(value, data) {
                if ((data.datasetIndex + 1) % chartData.length == 0) {
                    let barValue = actualChartData[j]
                    j++;
                    if (assessmentData.reportSections[0].chart.submissionDateArray.length > 0) {
                        let submissionValue = assessmentData.reportSections[0].chart.submissionDateArray[k];
                        k++;
                        return [barValue, "", submissionValue];
                    } else {
                        return barValue;
                    }
                }
                else {
                     let barValue = actualChartData[j];
                     j++;
                     return barValue;
                }
            }
        }
    }

    return assessmentData;
}

const convertAssessAgainChartDataToPercentage = async function(domainObj) {
    
    let dynamicLevelObj = {};
    let domainKeys = Object.keys(domainObj);

    for (let i = 0; i < domainKeys.length; i++) {
        let dateKeys = Object.keys(domainObj[domainKeys[i]]);
        for (let dateKey = 0; dateKey < dateKeys.length; dateKey++) {
            let levels = domainObj[domainKeys[i]][dateKeys[dateKey]];
            let sum = 0;
            for (level in levels) {
                if (!dynamicLevelObj[level]) {
                   dynamicLevelObj[level] = []
                }
                sum += levels[level];
            }
    
            for (level in levels) {
                 levels[level] = ((levels[level] / sum) * 100).toFixed(2);
            }
        }
    }
    
    let levelCountbject = {};
   
    for (let i = 0; i < domainKeys.length; i++) {
        let dateKeys = Object.keys(domainObj[domainKeys[i]]);
        for (let dateKey = 0; dateKey < dateKeys.length; dateKey++) {
            let levels = domainObj[domainKeys[i]][dateKeys[dateKey]];
           
            for (level in dynamicLevelObj) {
                if (Object.keys(levels).includes(level)) {
                    dynamicLevelObj[level].push(levels[level]);
                } else {
                    dynamicLevelObj[level].push(0);
                }
            }
        }
    }

    //sort the levels
    Object.keys(dynamicLevelObj).sort().forEach(function (key) {
        levelCountbject[key] = dynamicLevelObj[key];
    });

    let datasets = [];
    let backgroundColors = ['rgb(255, 99, 132)','rgb(54, 162, 235)','rgb(255, 206, 86)','rgb(231, 233, 237)','rgb(75, 192, 192)','rgb(151, 187, 205)','rgb(220, 220, 220)','rgb(247, 70, 74)','rgb(70, 191, 189)','rgb(253, 180, 92)','rgb(148, 159, 177)','rgb(77, 83, 96)','rgb(95, 101, 217)','rgb(170, 95, 217)','rgb(140, 48, 57)','rgb(209, 6, 40)','rgb(68, 128, 51)','rgb(125, 128, 51)','rgb(128, 84, 51)','rgb(179, 139, 11)']
    let incrementor = 0;
  
    for (level in levelCountbject) {
        datasets.push({
            label: level,
            data: levelCountbject[level],
            backgroundColor: backgroundColors[incrementor]
        })
        incrementor++;
    }
    
    return datasets;
}

//PDF generation for instance criteria report
exports.instanceCriteriaReportPdfGeneration = async function (instanceResponse) {


    return new Promise(async function (resolve, reject) {

        let currentTempFolder = 'tmp/' + uuidv4() + "--" + Math.floor(Math.random() * (10000 - 10 + 1) + 10)

        let imgPath = __dirname + '/../' + currentTempFolder;


        try {

            if (!fs.existsSync(imgPath)) {
                fs.mkdirSync(imgPath);
            }

            let bootstrapStream = await copyBootStrapFile(__dirname + '/../public/css/bootstrap.min.css', imgPath + '/style.css');

            // let headerFile = await copyBootStrapFile(__dirname + '/../views/header.html', imgPath + '/header.html');
            let footerFile = await copyBootStrapFile(__dirname + '/../views/footer.html', imgPath + '/footer.html');

            let formData = [];

            let params = {
                observationName: instanceResponse.solutionName
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
                                response: instanceResponse.reportSections
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
exports.entityCriteriaPdfReportGeneration = async function (responseData) {

    return new Promise(async function (resolve, reject) {

        let currentTempFolder = 'tmp/' + uuidv4() + "--" + Math.floor(Math.random() * (10000 - 10 + 1) + 10)

        let imgPath = __dirname + '/../' + currentTempFolder;


        try {

            if (!fs.existsSync(imgPath)) {
                fs.mkdirSync(imgPath);
            }

            let bootstrapStream = await copyBootStrapFile(__dirname + '/../public/css/bootstrap.min.css', imgPath + '/style.css');

            // let headerFile = await copyBootStrapFile(__dirname + '/../views/header.html', imgPath + '/header.html');
            let footerFile = await copyBootStrapFile(__dirname + '/../views/footer.html', imgPath + '/footer.html');

            let multiSelectArray = [];
            let radioArray = [];
            let formData = [];

            await Promise.all(responseData.reportSections.map(async singleResponse => {
                await Promise.all( singleResponse.questionArray.map( question => {
                    if (question.responseType == "multiselect") {
                        multiSelectArray.push(question);
                    }
                    else if (question.responseType == "radio") {
                        radioArray.push(question);
                    }
                }))
            }))
            
            //Prepare chart object before sending it to highchart server
            let multiSelectData = await getChartObject(multiSelectArray);
            let radioData = await getChartObject(radioArray);

            //send chart objects to highchart server and get the charts
            let multiselectFormData = await createChart(multiSelectData, imgPath);
            let radioFormData = await createChart(radioData, imgPath);

            formData.push(...multiselectFormData);
            formData.push(...radioFormData);

            let params = {
                observationName: responseData.solutionName
            }

            ejs.renderFile(__dirname + '/../views/header.ejs', {
                data: params
            })
                .then(function (headerHtml) {

                    let dir = imgPath;
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }
                    fs.writeFile(dir + '/header.html', headerHtml, async function (errWr, dataWr) {
                        if (errWr) {
                            throw errWr;
                        } else {

                            let obj = {
                                response: responseData.reportSections,
                                radioData: radioFormData,
                                multiselectData: multiselectFormData
                            };
                            ejs.renderFile(__dirname + '/../views/entityCriteriaTemplate.ejs', {
                                data: obj
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

//PDF generation for instance observation score report
exports.instanceScoreCriteriaPdfGeneration = async function (observationResp, obj) {

    return new Promise(async function (resolve, reject) {

        let currentTempFolder = 'tmp/' + uuidv4() + "--" + Math.floor(Math.random() * (10000 - 10 + 1) + 10)

        let imgPath = __dirname + '/../' + currentTempFolder;

        try {

            if (!fs.existsSync(imgPath)) {
                fs.mkdirSync(imgPath);
            }

            let bootstrapStream = await copyBootStrapFile(__dirname + '/../public/css/bootstrap.min.css', imgPath + '/style.css');

            // let headerFile = await copyBootStrapFile(__dirname + '/../views/header.html', imgPath + '/header.html');
            let footerFile = await copyBootStrapFile(__dirname + '/../views/footer.html', imgPath + '/footer.html');
            
            let chartDataArray = [];

            await Promise.all(observationResp.reportSections.map(async questionData => {
    
                await Promise.all(questionData.questionArray.map(async singleQuestion => {
    
                    chartDataArray.push(singleQuestion);
                }));
            }));

            let chartObj = await getChartObject(chartDataArray);

            let formData = await createChart(chartObj, imgPath);

            let params = {
                observationName: observationResp.solutionName
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


                            obj.response = observationResp.reportSections;
                            obj.highChartData = formData;

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
          return reject(err);
        }
    })

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

//Prepare chartData for chartjs
const getChartObject = async function (data) {

    let chartOptions = [];

    await Promise.all(data.map(chartData => {
        let chartObj = {
            order: chartData.order,
            options: chartData.chart,
            question: chartData.question
        };
       
        if (!chartObj.options.options) {
           chartObj.options.options = {
               plugin : {}
           };
        }

        if (!chartObj.options.options.title) {
            chartObj.options.options.title = {
                display: true,
                text: chartData.question,
                fontSize: 22
            };
        }
        
        if (chartObj.options.type == "horizontalBar") {
        if (!chartObj.options.options.scales["yAxes"] || !chartObj.options.options.scales["yAxes"][0]["ticks"] ) {
            if (!chartObj.options.options.scales["yAxes"]) {
               chartObj.options.options.scales["yAxes"] = [{}];
            }
            
            chartObj.options.options.scales["yAxes"][0]["ticks"] = {
                callback: function (value, index, values) {
                  let strArr = value.split(' ');
                  let tempString = '';
                  let result = [];
                  for (let x = 0; x < strArr.length; x++) {
                    tempString += ' ' + strArr[x];
                    if ((x % 5 === 0 && x !== 0) || x == strArr.length - 1) {
                      tempString = tempString.slice(1);
                      result.push(tempString);
                      tempString = '';
                    }
                  }
                  return result || value;
                },
                fontSize: 12,
            }
        }
        }

        chartOptions.push(chartObj)
    }))

    return chartOptions;
}

// Chart creation using chartjs
const createChart = async function (chartData, imgPath) {

    return new Promise(async function (resolve, reject) {

        try {

            let formData = [];

            await Promise.all(chartData.map(async data => {
                let chartImage = "chartPngImage_" + uuidv4() + "_.png";

                let imgFilePath = imgPath + "/" + chartImage;

                let imageBuffer = await chartJSNodeCanvas.renderToBuffer(data.options);
                fs.writeFileSync(imgFilePath, imageBuffer);

                formData.push({
                    order: data.order,
                    value: fs.createReadStream(imgFilePath),
                    options: {
                        filename: chartImage,
                    }
                })

            }))

            return resolve(formData)
        }
        catch (err) {
            return reject(err);
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
                      "x-ms-blob-type" : process.env.CLOUD_STORAGE == "AZURE" ? "BlockBlob" : null,
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