/*!
 * HTTP CONNECT proxy
 * Copyright(c) 2011 Adam Malcontenti-Wilson
 * GPL Licensed
 */
 
/**
 * Module dependencies
 */
 
var http = require('http'),
    net = require('net'),
    url = require('url'),
    util = require('util');

/**
 * Proxy all incoming HTTP CONNECT requests
 *
 * @return {Function}
 * @api public
 */

module.exports = function connectProxy(options){
  var options = options || {};
  return function connectProxy(request, socket, head){
    // Ignore non-CONNECT upgrades
    if (request.method != 'CONNECT') return;
    
    // Parse the host:port url string
    try {
      var parsedUrl = (function(url) {
        var splitUrl = url.split(':');
        if (splitUrl.length != 2) throw Error();
        return {port: splitUrl[1], hostname: splitUrl[0]};
      })(request.url);
    } catch(e) {
      socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
      socket.end();
      return;
    }
    
    // Allow local overrides
    if (options.localOverrides) {
        for (var i = 0; i < options.localOverrides.length; i++) {
            if (options.localOverrides[i].hostname && parsedUrl.hostname == options.localOverrides[i].hostname) {
                // Tell the client you've made a successful connection
                socket.write("HTTP/1.0 200 Connection established\r\n\r\n");
                
                // Proxy the connection to the override server
                http._connectionListener.call(options.localOverrides[i].server, socket);
                return;
            }
        }
    }
    
    // Only allow proxying of standard/safe ports
    if (parsedUrl.port != 443) {
      socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
      socket.end();
      return;
    } 
    
    // Create a TCP connection and proxy it
    var proxySocket = net.createConnection(parsedUrl.port, parsedUrl.hostname);
    proxySocket.on('connect', function() {
      socket.write("HTTP/1.0 200 Connection established\r\n\r\n");
      util.pump(socket, proxySocket);
      util.pump(proxySocket, socket);
    });
  };
};
