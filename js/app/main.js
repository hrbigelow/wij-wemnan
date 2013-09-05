requirejs.config({
    baseUrl: 'js/lib',

    paths: {
        app: '../app',
        shaders: '../../shaders'
    }
});


requirejs([
    'app/scatter_plot',
    'app/webgl_utils'
], function(scatter, glUtils) {
    // scatter_plot and all of its dependencies are now loaded here
    // and may be used.

    console.log('hello');
    window.scatter = scatter;
    window.glUtils = glUtils;
});
