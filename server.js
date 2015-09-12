var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var cors = require('cors');

app.use(cors());
server.listen(3001);

function getNews(callback) {
    var msg = Date() + ' message';
    return callback(msg);
}

io.on('connection', function (socket) {
    var news = setInterval(function () {
        getNews(function (message) {
            socket.volatile.emit('news', message);
        });

    }, 10 * 1000);

    socket.on('disconnect', function () {
        clearInterval(news);
    });
});
