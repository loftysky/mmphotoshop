

(function() {


    var M = $.MM

    M.log("Defining module.")

    M.exportPanels = function() {
        M.log("exportPanels()")
        app.doProgress("Exporting panels...", '$.MM._exportPanels()')
    }

    var _exportPanel = function(doc, set) {

        var beforeFlatten = doc.activeHistoryState
        var name = set.name;

        set.visible = true
        doc.flatten()

        var jpeg = new JPEGSaveOptions()
        jpeg.embedColorProfile = true;
        jpeg.formatOptions = FormatOptions.STANDARDBASELINE
        jpeg.matte = MatteType.NONE
        jpeg.quality = 12

        var path = '/Volumes/CGroot/home/mikeb/Desktop/psd,' + name + '.jpg'
        M.log(path)

        var file = new File(path)
        doc.saveAs(file, jpeg, true, Extension.LOWERCASE)
        
        doc.activeHistoryState = beforeFlatten
        set.visible = false // History doesn't include visibility by default.

    }

    M._exportPanels = function() {

        M.log('_exportPanels()')
        
        try {
            var doc = app.activeDocument
        } catch (e) {
            alert('No active document.')
            return
        }

        try {

            var originalHistory = doc.activeHistoryState
            var originalVisibility = []

            // Hide everything.
            for (i = 0; i < doc.layers.length; i++) {
                var layer = doc.layers[i];
                originalVisibility.push(layer.visible);
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
                _exportPanel(doc, set)
            }

        } catch (e) {
            alert(e)
        } finally {

            M.log('Reverting...')
            doc.activeHistoryState = originalHistory
            for (i = 0; i < originalVisibility.length; i++) {
                doc.layers[i].visible = originalVisibility[i];
            }

        }

    }

})()
