const fs = require('fs');
const uuidv4 = require('uuid/v4');
const rp = require('request-promise');
const ejs = require('ejs');
const path = require('path');
const rimraf = require("rimraf");

const kendraHelper = require('./kendra_service');
const request = require("request");
const filesHelper = require('../common/files_helper');


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
        
        if (responseData.tasks.length > 0) {
            responseData.tasks.forEach(element => {
               subTasksCount = subTasksCount + element.children.length;
            });
        }

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
                                                        rimraf(imgPath);

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
       
        let currentTempFolder = 'tmp/' + uuidv4() + "--" + Math.floor(Math.random() * (10000 - 10 + 1) + 10)

        let imgPath = __dirname + '/../' + currentTempFolder;

        if (!fs.existsSync(imgPath)) {
            fs.mkdirSync(imgPath);
        }

        let bootstrapStream = await copyBootStrapFile(__dirname + '/../public/css/bootstrap.min.css', imgPath + '/style.css');

        try {

            let FormData = [];
           
            let startDate = "";
            let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            if (responseData.startDate) {
                let date = new Date(responseData.startDate);
                let day = date.getDate();
                let month = months[date.getMonth()];
                let year = date.getFullYear();
                startDate = day + " " + month + " " + year;
            }
           
            let obj = {
                response: responseData,
                startDate: startDate
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
                                                        rimraf(imgPath);

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