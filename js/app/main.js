requirejs.config({
    baseUrl: 'js/lib',

    paths: {
        app: '../app',
        shaders: '../../shaders'
    }
});


requirejs([
    'app/scatter_plot',
    'app/webgl_utils',
    'app/random_points'
], function(scatter, glUtils, randomPoints) {
    // scatter_plot and all of its dependencies are now loaded here
    // and may be used.

    console.log('hello');
    window.scatter = scatter;
    window.glUtils = glUtils;
    window.randomPoints = randomPoints;
});
