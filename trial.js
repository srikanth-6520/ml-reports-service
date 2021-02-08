// const ChartjsNode = require('chartjs-node');
// let chartNode = new ChartjsNode(600, 600);



const ChartjsNode = require('chartjs-node');

var chartNode = new ChartjsNode(600, 600);
// chartNode.on('beforeDraw', function (Chartjs) {

//     // Register the annotation plugin
//     Chartjs.plugins.register( ChartjsAnnotation );
// });

var chartJsOptions = {
    plugins: {
        p1: false   // disable plugin 'p1' for this instance
    },
    type: 'horizontalBar',
    data: {
        
            legend: false,
            labels: [
                  "ME",
                  "SE"
              ],
              datasets: [
                  {
                     
                      data: [100, 75],
                      backgroundColor: ["#669911", "#119966" ]
                  }]
           
        
    },
    // options: myChartOptions
};

chartNode.drawChart( chartJsOptions  )
.then( function(){
    // Save as testimage.png
    chartNode.writeImageToFile('image/png', './testimage.png'); 
});
// // let myChartOptions = {
// //     plugins: {
//         afterDraw: function (chart, easing) {
//             var self = chart.config;    /* Configuration object containing type, data, options */
//             var ctx = chart.chart.ctx;  /* Canvas context used to draw with */
//         }
//     }
// }
 


// return chartNode.drawChart({chartJsOptions})
// .then(() => {
//     console.log("coming")
//     // chart is created
 
//     // get image as png buffer
//     return chartNode.getImageBuffer('');
// })
// .then(buffer => {
//     Array.isArray(buffer) // => true
//     // as a stream
//     return chartNode.getImageStream('image/png');
// })
// .then(streamResult => {
//     console.log("streamResult");
//     // using the length property you can do things like
//     // directly upload the image to s3 by using the
//     // stream and length properties
//     // streamResult.stream // => Stream object
//     // streamResult.length // => Integer length of stream
//     // write to a file
//     return chartNode.writeImageToFile('image/png', './testimage.svg');
// });



// import * as ChartjsNode from 'chartjs-node'; // Import the library

// const ChartjsNode = require('chartjs-node');
// // // 600x600 canvas size

// const chartNode = new ChartjsNode(600, 600); // Create an instance with dimensions

// const barGraphOptions = {
//   type: 'horizontalBar',
//   data: {
//     labels: [
//           "ME",
//           "SE"
//       ],
//       datasets: [
//           {
             
//               data: [100, 75],
//               backgroundColor: ["#669911", "#119966" ]
//           }]
//     }
// };

// // Draw the chart and write the file to the file system
// return new Promise(resolve => {
//   chartNode
//     .drawChart(barGraphOptions)
//     .then(() => {
//       chartNode.getImageBuffer('image/png');
//     })
//     .then(() => {
//       chartNode.writeImageToFile('image/png', 'some_file.png').then(() => {
//         resolve();
//       });
//     })
//     .catch(e => {
//       console.log('Caught', e);
//     });
// });


