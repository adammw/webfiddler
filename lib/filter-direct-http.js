/*!
 * filterDirectHttp middleware
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

module.exports = function filterDirectHttp(server){
  if (!server) throw new Error('vhost server required');
  return function filterDirectHttp(req, res, next){
    if (req.url[0] == '/') {
      server.emit("request", req, res, next);
    } else {
      next();
    }
  };
};
