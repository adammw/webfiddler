// Override WebInspector functions to work in WebFiddler

WebInspector.InspectorFrontendHostStub.prototype.hiddenPanels =function()
{
    return "elements,resources,scripts,timeline,profiles,audits,console";
};

InspectorBackendClass.prototype.sendMessageObjectToBackend = function(messageObject)
{
    console.log(messageObject.method, messageObject.params);
    var message = JSON.stringify(messageObject);
    InspectorFrontendHost.sendMessageToBackend(message);
};

WebInspector.loaded = function()
{
    InspectorBackend.loadFromJSONIfNeeded();
    var host = "host" in WebInspector.queryParamsObject ? WebInspector.queryParamsObject.host : window.location.host;
    WebInspector.socket = io.connect();
    WebInspector.socket.on('message', function(message) { InspectorBackend.dispatch(message); });
    WebInspector.socket.on('error', function(error) { console.error(error); });
    WebInspector.socket.on('connect', function() {
        InspectorFrontendHost.sendMessageToBackend = WebInspector.socket.send.bind(WebInspector.socket);

        WebInspector.doLoadedDone();
    });
};

