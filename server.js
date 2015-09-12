var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var cors = require('cors');

app.use(cors());
server.listen(3001);

function getDrones(callback) {
    var msg = [
        [28.170489, 83.045654],
        [27.782392, 84.413452],
        [28.339036, 82.174988],
        [27.563475, 84.968262],
        [28.383346, 84.693604],
        [27.835838, 83.732300]
    ];

    return callback(msg);
}

io.on('connection', function (socket) {
    var drones = setInterval(function () {
        getDrones(function (data) {
            socket.volatile.emit('drones', data);
        });

    }, 5 * 1000);

    socket.on('disconnect', function () {
        clearInterval(drones);
    });
});
