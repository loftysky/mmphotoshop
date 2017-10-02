

(function() {


    var M = $.MM

    M.log("Defining module.")

    M.exportPanels = function() {

        M.log("exportPanels()")

        var dir = Folder.selectDialog("Pick folder to export panels.")
        if (!dir) {
            return
        }
        M.log(dir.fullName)

        app.doProgress("Exporting panels...", '$.MM._exportPanels("' + dir.fullName + '")')
    }

    M._exportPanels = function(dir) {

        M.log('_exportPanels()')
        
        try {
            var doc = app.activeDocument
        } catch (e) {
            alert('No active document.')
            return
        }

        var panelsExported = 0
        var spritesExported = 0

        try {

            // var history = doc.activeHistoryState
            var visibility = []
            var layers = doc.layers

            // Hide everything.
            for (i = 0; i < layers.length; i++) {
                var layer = layers[i];
                visibility.push(layer.visible);
                layer.visible = false;
            }

            M.log('Looking for "panel##" layer sets.')
            for (i = 0; i < doc.layerSets.length; i++) {

                if (!app.updateProgress(i, doc.layerSets.length)) {
                    return
                }

                var set = doc.layerSets[i]
                
                var m = /^[Pp]anel[0-9]+$/.exec(set.name)
                if (!m) {
                    continue
                }

                set.visible = true
                spritesExported += _exportPanel(doc, dir, set)
                panelsExported++
                set.visible = false
            }

        } catch (e) {
            alert(e)

        } finally {

            M.log('Reverting...')
            // doc.activeHistoryState = history
            for (i = 0; i < visibility.length; i++) {
                layers[i].visible = visibility[i];
            }

        }

        alert(
            "Exported " +
            panelsExported +
            " panel" +
            (panelsExported == 1 ? "" : "s") +
            " containing " +
            spritesExported +
            " sprite" + 
            (spritesExported == 1 ? "" : "s") +
            "."
        )

    }

    var _exportPanel = function(doc, dir, set) {
        
        var layers = set.layers;
        var visibility = []

        try {

            var spriteCount = 0
            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i]
                if (/^[Ss]prite[0-9]+$/.test(layer.name)) {
                    spriteCount++;
                }
            }

            if (spriteCount && spriteCount != layers.length) {
                throw "Not all children of " + set.name + " are sprites."
            }

            if (spriteCount) {

                for (var i = 0; i < layers.length; i++) {
                    var layer = layers[i]
                    visibility.push(layer.visible)
                    layer.visible = false
                }

                for (var i = 0; i < layers.length; i++) {
                    var layer = layers[i]
                    layer.visible = true;
                    _exportSprite(doc, dir, set.name + '_' + layer.name)
                    layer.visible = false;
                }

            } else {
                _exportSprite(doc, dir, set.name)
            }

        } finally {

            for (i = 0; i < visibility.length; i++) {
                layers[i].visible = visibility[i];
            }

        }

        return spriteCount || 1

    }

    var _exportSprite = function(doc, dir, name) {

        var options = new PNGSaveOptions()
        options.compression = 1;

        var path = dir + '/' + name + '.png'
        M.log(path)

        var file = new File(path)
        doc.saveAs(file, options, true, Extension.LOWERCASE)

    }


})()
