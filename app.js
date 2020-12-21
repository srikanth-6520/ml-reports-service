var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// var config = require('./config/config');
require('./config');
require('./config/globals')();
global.config = require('./config/config');
var router = require('./routes');
const cors = require('cors');

var app = express();

var debug = require('debug')('nodejs-druid-query-app:server');
var http = require('http');
var bodyParser = require('body-parser');
var fs = require('fs');

app.use(cors());
app.use(logger('dev'));
//app.use(express.json());
//app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.set('views', path.join(__dirname, 'controllers/views'));
app.set('view engine', 'ejs');
app.use(express.static("public"));


app.use(function (req, res, next) { //allow cross origin requests
  res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With,Authorization, Content-Type, Accept,x-auth-token");
  next();
});



//API documentation (apidoc)
if (config.node_env == "development" || config.node_env == "local") {
  app.use(express.static("apidoc"));
  if (config.node_env == "local") {
    app.get(config.apidoc_url, (req, res) => {
      let apidocPath = config.apidoc_path + "/index.html";

      res.sendFile(path.join(__dirname, apidocPath));
    });
  } else {
    app.get(config.apidoc_url, (req, res) => {
      let urlArray = req.path.split("/");
      urlArray.splice(0, 3);
      let apidocPath = config.apidoc_path + urlArray.join("/");

      res.sendFile(path.join(__dirname, apidocPath));
    });
  }
}


/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || config.application_port_number);
app.set('port', port);
router(app);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, function () {


  console.log("started and running on port:" + port);
});
server.on('error', onError);
server.on('listening', onListening);

console.log("application started");

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}


/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

let dir = './tmp';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

let reportsPath = './public/reports';
if (!fs.existsSync(reportsPath)) {
   fs.mkdirSync(reportsPath);
}

module.exports = app;
