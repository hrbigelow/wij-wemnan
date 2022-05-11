requirejs.config({
    baseUrl: 'js/lib',
    // urlArgs: 'bust=' + (new Date()).getTime(),
    paths: {
        app: '../app',
        img: '../../img',
        shaders: '../../shaders',
        jquery: 'jquery-2.0.2'
    }
    // shim: {
    //     'makeDebugContext': {
    //         deps: ['webgl_debug'],
    //         init: function(utl) {
    //             return utl;
    //         }
    //     }
    // }

});


requirejs([
    'app/scatter_plot',
    'app/webgl_utils',
    'app/random_points',
    'app/visual_selection',
    'jquery'
], function(scatterPlot, glUtils, randomPoints, visualSelection, $) {
    // scatter_plot and all of its dependencies are now loaded here
    // and may be used.

    console.log('hello');
    window.glUtils = glUtils;
    window.randomPoints = randomPoints;
    window.selection = visualSelection;
    window.gl = $('#glcanvas')[0].getContext('webgl', {
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true
    });
    window.scatter_plot = new scatterPlot.ScatterPlot(window.gl);
});
