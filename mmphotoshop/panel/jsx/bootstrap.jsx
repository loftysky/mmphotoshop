
if ($ === undefined) {
    $ = {}
}

$.MM = (function() {

    var M = {}

    M.log = function(message) {

        if (app.name == "ExtendScript Toolkit") {
            print(message);
        } else {
            var msg = new BridgeTalk();
            msg.target = "estoolkit";
            msg.body = 'print("[MM] " + ' + message.toSource() + ')';
            msg.send();
        }
    }

    M.log("Started logger.")

    M._imports = {}

    M.load = function(path) {

        if (M._imports[path] != undefined) {
            return M._imports[path]
        }

        try {
            var x = $.evalFile(path) || null
            M._imports[path] = x
            return x
        } catch (e) {
            alert(e.toString() + " (from " + e.fileName + "[" + e.line + "])")
        }

    }

    M.eval = function(source) {
        try {
            return JSON.stringify($.evalScript(source))
        } catch (e) {
            alert(e)
        }
    }

    return M

})()

