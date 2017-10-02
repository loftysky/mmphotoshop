

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
        var metadata = {
            application: {
                name: app.name,
                version: app.version
            },
            document: {
                path: doc.path.fullName,
                width: doc.width.as('px'),
                height: doc.height.as('px')
            },
            panels: []
        }

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
                var panelMeta = _exportPanel(doc, dir, set)
                metadata.panels.push(panelMeta)
                set.visible = false

                spritesExported += (panelMeta.sprites || []).length || 1
                panelsExported++
            }


            var metaPath = dir + '/metadata.json'
            var metaFile = new File(metaPath)
            metaFile.open('w')
            metaFile.write(JSON.stringify(metadata))
            metaFile.close()

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

        var metadata = {
            name: set.name,
            sprites: [],
        }

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
                    var spriteMeta = _exportSprite(doc, dir, set.name + '_' + layer.name)
                    spriteMeta.name = layer.name
                    metadata.sprites.push(spriteMeta)
                    layer.visible = false;
                }

            } else {
                var panelMeta = _exportSprite(doc, dir, set.name)
                panelMeta.name = null;
                metadata.sprites.push(panelMeta)
            }

        } finally {

            for (i = 0; i < visibility.length; i++) {
                layers[i].visible = visibility[i];
            }

        }

        return metadata

    }

    var _exportSprite = function(doc, dir, name) {

        var history = doc.activeHistoryState

        var px = function(x) { return x.as('px') }

        var width = px(doc.width)
        var height = px(doc.height)
        doc.trim(TrimType.TRANSPARENT, true, true, false, false)
        var top = height - px(doc.height)
        var left = width - px(doc.width)
        doc.trim(TrimType.TRANSPARENT, false, false, true, true)
        var bottom = height - top - px(doc.height)
        var right = width - left - px(doc.width)

        var options = new PNGSaveOptions()
        options.compression = 1;

        var pngPath = dir + '/' + name + '.png'
        M.log(pngPath)

        var pngFile = new File(pngPath)
        doc.saveAs(pngFile, options, true, Extension.LOWERCASE)

        doc.activeHistoryState = history

        return {
            top:    Math.round(top),
            right:  Math.round(right),
            bottom: Math.round(bottom),
            left:   Math.round(left)
        }

    }


})()
