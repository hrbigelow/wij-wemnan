requirejs.config({
    baseUrl: 'js/lib',

    paths: {
        app: '../app'
    }
});


requirejs([
    'scatter_plot'
], function(scatter) {
    // scatter_plot and all of its dependencies are now loaded here
    // and may be used.

    console.log('hello');
});
