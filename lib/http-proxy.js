/*!
 * http proxy middleware for connect
 * Copyright(c) 2011 Adam Malcontenti-Wilson
 * GPL Licensed
 */
 
/**
 * Module dependencies
 */
 
var http = require('http'),
    url = require('url'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter;

var timestamp = function() { return (new Date()).getTime()/1000; };

/**
 * Proxy all incoming requests to a HTTP proxy
 *
 * @return {Function}
 * @api public
 */

var HttpProxy = module.exports = exports = function httpProxy(options) {
  var self = this;
  var requestId = 0;
  this.options = options || {};
  this.middleware = function httpProxyMiddleware(request, response, next){
    var parsedUrl = url.parse(request.url);
    self.emit("requestWillBeSent", {requestId: String(++requestId), request: {url: request.url, method: request.method, headers: request.headers}, timestamp: timestamp(), client: request.connection.remoteAddress});
    var proxyRequest = http.request({
        host: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        method: request.method,
        path: (parsedUrl.pathname || "/") + (parsedUrl.search || ""),
        headers: request.headers
    }, function(proxyResponse) {
        response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
        self.emit("responseReceived", {requestId: requestId, response: {url: request.url, status: proxyResponse.statusCode, statusText: "TODO", mimeType: (proxyResponse.headers["content-type"] || ""), headers: proxyResponse.headers, requestHeaders: request.headers }, timestamp: timestamp(), client: request.connection.remoteAddress});
        util.pump(proxyResponse, response);
        proxyResponse.on('end', function() {
            self.emit("loadingFinished", {requestId: requestId, timestamp: timestamp()});
        });
    });
    proxyRequest.on('error', function(e) {
        response.writeHead(504);
        response.end("504 Gateway Timeout");
    });
    request.on('close', function(err) {
        proxyRequest.abort();
    });
    util.pump(request,proxyRequest);
  };
  
  
  EventEmitter.call(this);
};
util.inherits(HttpProxy, EventEmitter);
