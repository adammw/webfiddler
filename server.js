var connect = require('./lib/connect'), //requires custom connect
    captiveLandingPage = require('./lib/captive-landing-page'),
    connectProxy = require('./lib/connect-proxy'),
    filterDirectHttp = require('./lib/filter-direct-http'),
    HttpProxy = require('./lib/http-proxy'),
    ioListen = require('socket.io').listen,
    localWebsocketHandler = require('./lib/local-websocket-handler.js'),
    proxyVhost = require('./lib/proxy-vhost');

var webfiddlerServer = connect.createServer(
    connect.router(function(app) {
        app.post('/add-to-ip-cache', function(req, res, next) {
            captiveLandingPage.ipCache.push(req.connection.remoteAddress);
            res.writeHead(303, {'Location':'/'});
            res.end();
        });
    }),
    connect.static(__dirname + '/public'),
    function(req, res, next) {
        res.writeHead(404);
        res.end('404 Not Found');
    }
);
var io = ioListen(webfiddlerServer);

var httpProxy = new HttpProxy();
httpProxy.on('proxiedrequest', function(request) {
    io.sockets.emit('proxiedrequest', request);
});

var proxyServer = connect.createServer(
    filterDirectHttp(webfiddlerServer),
    proxyVhost('webfiddler', webfiddlerServer),
    captiveLandingPage(__dirname + '/public/first-run-notice.html'),
    httpProxy.middleware,
    function(req, res, next) {
        res.writeHead(400, {'Content-Type':'text/plain'});
        res.end('400 Bad Request');
    }
);
proxyServer.on('upgrade', connectProxy({localOverrides: [{hostname: 'webfiddler', server: webfiddlerServer}]}));
proxyServer.on('upgrade', localWebsocketHandler(webfiddlerServer));
proxyServer.listen(8080);
