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

/**
 * Proxy all incoming requests to a HTTP proxy
 *
 * @return {Function}
 * @api public
 */

var HttpProxy = module.exports = exports = function httpProxy(options) {
  var self = this;
  this.options = options || {};
  this.middleware = function httpProxyMiddleware(request, response, next){
    var parsedUrl = url.parse(request.url);
    console.log(request);
    self.emit("proxiedrequest", {url: parsedUrl, headers: request.headers, time: (new Date()).getTime(), client: request.connection.remoteAddress});
    var proxyRequest = http.request({
        host: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        method: request.method,
        path: (parsedUrl.pathname || "/") + (parsedUrl.search || ""),
        headers: request.headers
    }, function(proxyResponse) {
        response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
        util.pump(proxyResponse, response);
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
