(function(M) {


M.export = function() {
    M.callOurJSX('exportPanels')
}


jQuery(function(J) {

    var importButton = J('#export-button')
        .attr('disabled', false)
        .on('click', function(e) {
            e.preventDefault()
            M.export()
        })

})


})(MM)
