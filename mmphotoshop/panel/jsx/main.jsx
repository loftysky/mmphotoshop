

(function() {


    var M = $.MM

    M.log("Defining module.")

    var pad = function(n, width, z) {
        z = z || '0'
        n = n + ''
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
    }

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

        try {

            var panelsExported = 0
            var panelsSeen = {}
            var spritesExported = 0

            var metadata = {
                application: {
                    name: app.name,
                    version: app.version
                },
                document: {
                    path: doc.path.fullName + '/' + doc.name, // This is wierd.
                    width: doc.width.as('px'),
                    height: doc.height.as('px')
                },
                path: dir,
                panels: []
            }
            

            // var history = doc.activeHistoryState
            var visibility = []
            var layers = doc.layers

            // Hide everything.
            for (i = 0; i < layers.length; i++) {
                var layer = layers[i]
                visibility.push(layer.visible)
                layer.visible = false
            }

            M.log('Looking for "panel##" layer sets.')
            for (i = 0; i < doc.layerSets.length; i++) {

                if (!app.updateProgress(i, doc.layerSets.length)) {
                    return
                }

                var set = doc.layerSets[i]
                
                var m = /^[Pp]anel([0-9])+$/.exec(set.name)
                if (!m) {
                    continue
                }
                var n = parseInt(m[1], 10)
                if (panelsSeen[n]) {
                    throw "Multiple panel" + pad(n, 2)
                }
                panelsSeen[n] = true

                set.visible = true

                var panelMeta = _exportPanel(doc, dir, set)
                panelMeta.rawIndex = i
                panelMeta.rawName = set.name
                panelMeta.name = 'panel' + pad(n, 2)
                panelMeta.id = n
                metadata.panels.push(panelMeta)

                set.visible = false

                spritesExported += (panelMeta.sprites || []).length || 1
                panelsExported++
            }

            metadata.panels.sort(function (a, b) { return a.id - b.id; })

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
        
        var layers = set.layers
        var visibility = []

        var metadata = {
            sprites: []
        }

        try {

            var spriteCount = 0
            var spriteSeen = {}

            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i]
                var m = /^[Ss]prite([0-9])+$/.exec(layer.name)
                if (m) {
                    spriteCount++;
                    var n = parseInt(m[1], 10)
                    if (spriteSeen[n]) {
                        throw "Multiple \"sprite" + pad(n, 2) + "\" in " + set.name
                    }
                    spriteSeen[n] = true
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
                    layer.visible = true
                    
                    var spriteMeta = _exportSprite(doc, dir, set.name + '_' + layer.name)
                    spriteMeta.rawIndex = i
                    spriteMeta.rawName = layer.name
                    var n = parseInt(/(\d+)$/.exec(layer.name)[1], 10)
                    spriteMeta.name = "sprite" + pad(n, 2)
                    spriteMeta.id = n
                    metadata.sprites.push(spriteMeta)

                    layer.visible = false;
                }

            } else {
                var panelMeta = _exportSprite(doc, dir, set.name)
                panelMeta.rawIndex = 0
                panelMeta.rawName = null
                panelMeta.name = "sprite01"
                panelMeta.id = 1
                metadata.sprites.push(panelMeta)
            }

        } finally {

            for (i = 0; i < visibility.length; i++) {
                layers[i].visible = visibility[i];
            }

        }

        // Order the sprites.
        metadata.sprites.sort(function (a, b) { return a.id - b.id; })

        return metadata

    }

    var _exportSprite = function(doc, dir, name) {

        var history = doc.activeHistoryState

        var px = function(x) { return x.as('px') }

        var width = doc.width.as('px')
        var height = doc.height.as('px')
        doc.trim(TrimType.TRANSPARENT, true, true, false, false)
        var top = height - doc.height.as('px')
        var left = width - doc.width.as('px')
        doc.trim(TrimType.TRANSPARENT, false, false, true, true)
        var bottom = height - top - doc.height.as('px')
        var right = width - left - doc.width.as('px')

        width = doc.width.as('px')
        height = doc.height.as('px')

        var options = new PNGSaveOptions()
        options.compression = 1;

        var pngName = name + '.png'
        var pngPath = dir + '/' + pngName
        M.log(pngPath)

        var pngFile = new File(pngPath)
        doc.saveAs(pngFile, options, true, Extension.LOWERCASE)

        doc.activeHistoryState = history

        return {
            fileName: pngName,
            width:    Math.round(width),
            height:   Math.round(height),
            top:      Math.round(top),
            right:    Math.round(right),
            bottom:   Math.round(bottom),
            left:     Math.round(left)
        }

    }


})()
