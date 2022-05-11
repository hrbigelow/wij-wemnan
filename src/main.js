import App from './App.svelte';

const app = new App({
  target: document.body,
  props: { }
});

export default app;


/*
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
*/

