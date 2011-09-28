/*!
 * captiveLandingPage middleware
 * Copyright(c) 2011 Adam Malcontenti-Wilson
 * GPL Licensed
 */
 
/**
 * Module dependencies
 */
 
var fs = require('fs'),
    path = require('path'),
    util = require('util');

/**
 * Serve the file specified by `file` for all first-time IP addresses
 *
 * @param {String} file
 * @return {Function}
 * @api public
 */
 
module.exports = exports = function captiveLandingPage(file){ 
  return function captiveLandingPage(req, res, next){
    if (exports.ipCache.indexOf(req.connection.remoteAddress) != -1) return next();
    res.writeHead(407);
    util.pump(fs.createReadStream(file), res);
  }
}
exports.ipCache = [];
