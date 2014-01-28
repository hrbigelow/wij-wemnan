define([
    'app/webgl_utils',
    'text!shaders/scatter-v.cc',
    'text!shaders/scatter-f.cc',
    'text!shaders/scatter_select-v.cc',
    'text!shaders/scatter_select-f.cc',
    'app/textures',
    'app/offscreen_rendering'
], function (glutils,
             scatterV, 
             scatterF, 
             scatter_selectV, 
             scatter_selectF,
             textures,
             offscreen) {
    
    return {
    
        init: function(gl) {

            var plot = {

                gl: gl,

                data: {
                    vertex: new glutils.GlData(gl, 10),
                    selection: new glutils.GlData(gl, 1)
                },
                
                // defines vertex attribute information
                layout: {
                    pos:      new glutils.GlLayout(this.data.vertex, 3, 0),
                    color:    new glutils.GlLayout(this.data.vertex, 4, 3),
                    shape:    new glutils.GlLayout(this.data.vertex, 1, 7),
                    size:     new glutils.GlLayout(this.data.vertex, 1, 8),
                    ind:      new glutils.GlLayout(this.data.vertex, 1, 9),
                    selected: new glutils.GlLayout(this.data.selection, 1, 0)
                },

                textures: textures,

                // js copies of settings for this visualization
                userState : {
                    scale: [1, 1, 1],
                    offset: [0, 0, 0],
                    canvasDims: [0, 0],
                    seltex: null,
                    pointFactor: 1,
                    tex: null
                },

                scatter_prog: new glutils.GlProgram(
                    gl, scatterV, scatterF,
                    [ 'pos', 'color', 'ind' ],
                    [ 'scale', 'offset', 'pointFactor', 'tex' ]),
                
                select_prog: new glutils.GlProgram(
                    gl, scatter_selectV, scatter_selectF,
                    ['pos', 'color', 'shape', 'size', 'selected'],
                    ['scale', 'offset', 'canvasDims', 'seltex']),

                picker: new offscreen.VertexPicker(gl)
            };

            plot.scatter_prog.updateShader(gl.VERTEX_SHADER);
            plot.scatter_prog.updateShader(gl.FRAGMENT_SHADER);
            plot.scatter_prog.updateUniforms();

            plot.select_prog.updateShader(gl.VERTEX_SHADER);
            plot.select_prog.updateShader(gl.FRAGMENT_SHADER);
            plot.select_prog.updateUniforms();

            // asynchronous.  requires loading 7 sizes of images for each glyph
            plot.textures.init(gl);

            // gl state that remains constant for the life of the plot
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.gl.disable(this.gl.DEPTH_TEST);
            this.gl.enable(this.gl.BLEND);

            // set specific uniform values that remain constant for life of the plot
            this.gl.useProgram(this.scatter_prog);
            this.gl.uniform1iv(this.scatter_prog.uniforms.tex, this.textures.int32);

            this.gl.useProgram(this.select_prog);
            this.gl.uniform2fv(this.select_prog.seltex, textures.user_selection_unit);

            this.resize_dots(); // sets the pointFactor uniform
            this.zoom(); // sets scale and offset uniforms

            return plot;
        },

        useSelection: function() {
            var g = this.gl;
            g.clearColor(0.0, 0.0, 0.0, 0.0);
            g.blendEquation(g.FUNC_ADD);
            g.blendFunc(g.ONE, g.ONE);
            g.useProgram(this.select_prog);
        },

        useVisualization: function() {
            var g = this.gl;
            g.clearColor(1.0, 1.0, 1.0, 1.0);
            g.blendEquationSeparate(g.FUNC_ADD, g.FUNC_ADD);
            g.blendFuncSeparate(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA, g.ONE, g.ONE);
            g.useProgram(this.scatter_prog);
        },
        
        // this may require only changing the viewport?
        zoom: function() {
        },

        resize_dots: function() {
            this.gl.useProgram(this.scatter_prog);
            this.gl.uniform1f(this.scatter_prog.uniforms.pointFactor, 
                              this.userState.pointFactor);
        },
        
        sync_selection: function() {
            this.picker.read_from_gl();
            this.data.selection.write_to_gl();
        },

        // most importantly, when new data is loaded, the sizes change
        // assume though that the number of points is known
        // also, resize the subordinate selection buffer
        load_data: function(vertex_data) {
            var floatSize = 4,
                npoints = vertex_data.length / this.data.vertex.stride / floatSize;
            this.data.vertex.destroy_jsbuf();
            this.data.vertex.create_jsbuf(vertex_data.length);
            this.data.selection.destroy_jsbuf();
            this.data.selection.create_jsbuf(npoints * floatSize);
            this.picker.resize(npoints, this.data.selection.jsbuf);
            this.gl.uniform2fv(this.select_prog.uniforms.canvasDims, 
                              [this.picker.width, this.picker.height]);

        },

        draw: function() {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.gl.drawArrays(this.gl.GL_POINTS, 0, this.nVertices);
        }


    };
}
