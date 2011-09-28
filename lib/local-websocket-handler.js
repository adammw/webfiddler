/*!
 * localWebsocketHandler middleware for connect
 * Copyright(c) 2011 Adam Malcontenti-Wilson
 * GPL Licensed
 */

/**
 * Proxy incoming websocket requests to a local server object
 *
 * @param {Object} server
 * @return {Function}
 * @api public
 */

module.exports = function localWebsocketHandler(server){
  return function localWebsocketHandler(req, socket, head){
    // Only listen to local websocket upgrades
    if (!req.headers || !req.headers.upgrade || req.headers.upgrade.toLowerCase() !== 'websocket' || req.method !== 'GET' || req.url[0] !== '/') return;

    // Re-emit the event on the server
    server.emit("upgrade", req, socket, head);
  };
};
