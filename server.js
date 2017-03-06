var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded()); 

app.get('/', function(req, res){
  res.sendFile(__dirname +'/index.html');
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
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