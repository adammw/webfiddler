/*!
 * proxyVhost middleware
 * Based on Connect - vhost
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2011 Adam Malcontenti-Wilson
 * MIT Licensed
 */
 
/**
 * Module dependencies
 */
 
var url = require('url');

/**
 * Setup vhost on the http proxy for the given `hostname` and `server`.
 *
 * Examples:
 *
 *     connect(
 *       connect.vhost('foo.com',
 *         connect.createServer(...middleware...)
 *       ),
 *       connect.vhost('bar.com',
 *         connect.createServer(...middleware...)
 *       )
 *     );
 *
 * @param {String} hostname
 * @param {Server} server
 * @return {Function}
 * @api public
 */

module.exports = function proxyVhost(hostname, server){
  if (!hostname) throw new Error('vhost hostname required');
  if (!server) throw new Error('vhost server required');
  var regexp = new RegExp('^' + hostname.replace(/[*]/g, '(.*?)') + '$', 'i');
  if (server.onvhost) server.onvhost(hostname);
  return function vhost(req, res, next){
    var parsedUrl = url.parse(req.url);
    if (!parsedUrl.hostname) return next();
    var host = parsedUrl.hostname;
    if (req.subdomains = regexp.exec(host)) {
      req.subdomains = req.subdomains[0].split('.').slice(0, -1);
      // normalise url
      req.url = parsedUrl.pathname + (parsedUrl.search || "");
      server.emit("request", req, res, next);
    } else {
      next();
    }
  };
};
