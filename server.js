var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var cfenv = require("cfenv");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded()); 

var mydb;

function saveChat (msg,time) {
  var _msg = msg;
  var _time = time;
  if(!mydb) {
    console.log("No database.");
    return;
  }
  // insert the username as a document
  mydb.insert({ "msg" : _msg ,"time":_time}, function(err, body, header) {
    if (err) {
      return console.log('[mydb.insert] ', err.message);
    }
    console.log("success stored: "_time);
  });
}

function loadChat() {
  var names = [];
  if(!mydb) {
    console.log("No database.");
    return;
  }

  mydb.list({ include_docs: true }, function(err, body) {
    if (!err) {
      body.rows.forEach(function(row) {
        if(row.doc.msg)
          msgs.push(row.doc.msg);
      });
      return msgs;
    }
  });
});


// load local VCAP configuration  and service credentials
var vcapLocal;
try {
  vcapLocal = require('./vcap-local.json');
  console.log("Loaded local VCAP", vcapLocal);
} catch (e) { }

const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {}

const appEnv = cfenv.getAppEnv(appEnvOpts);

if (appEnv.services['cloudantNoSQLDB']) {
  // Load the Cloudant library.
  var Cloudant = require('cloudant');

  // Initialize database with credentials
  var cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials);

  //database name
  var dbName = 'mydb';

  // Create a new "mydb" database.
  cloudant.db.create(dbName, function(err, data) {
    if(!err) //err if database doesn't already exists
      console.log("Created database: " + dbName);
  });

  // Specify the database we are going to use (mydb)...
  mydb = cloudant.db.use(dbName);
}


app.get('/', function(req, res){
  res.sendFile(__dirname +'/index.html');
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
    var d = new Date();
    console.log(d.getDate()+"/"+d.getMonth()+"/"+d.getYear()+' _'+d.getHours()+"."+d.getMinutes()+"."+d.getSeconds()+'::'+msg);
  });

  socket.on('load message', function(msg){
    io.emit('loaded message', loadChat());
    var d = new Date();
    console.log(d.getDate()+"/"+d.getMonth()+"/"+d.getYear()+' _'+d.getHours()+"."+d.getMinutes()+"."+d.getSeconds()+'::'+msg);
  });

  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

var port = process.env.PORT || 3000
http.listen(port, function() {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});