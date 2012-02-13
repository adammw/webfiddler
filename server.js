#!/usr/bin/env node

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

var cannedResponses = {
    'Profiler.hasHeapProfiler': false,
    'Network.enable': true,
    'Page.enable': false,
    'CSS.enable': false,
    'Console.enable': false,
    'Inspector.enable': false,
    'Database.enable': false,
    'DOMStorage.enable': false,
    'Network.canClearBrowserCache': false,
    'Network.canClearBrowserCookies': false,

}

io.sockets.on('connection', function(socket){
    socket.on('message', function(message) {
        var messageObject = JSON.parse(message);
        if (messageObject.method in cannedResponses) {
            socket.send(JSON.stringify({id: messageObject.id, result: cannedResponses[messageObject.method]}));
        }
    });
});

var httpProxy = new HttpProxy();
httpProxy.on('requestWillBeSent', function(data) {
    io.sockets.send(JSON.stringify({method: "Network.requestWillBeSent", params: data}));
});
httpProxy.on('responseReceived', function(data) {
    io.sockets.send(JSON.stringify({method: "Network.responseReceived", params: data}));
});
httpProxy.on('loadingFinished', function(data) {
    io.sockets.send(JSON.stringify({method: "Network.loadingFinished", params: data}));
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
