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
    
    function ScatterPlot(gl) {

        this.gl = gl;
        this.program_in_use = null;
        
        this.data = {
            vertex: new glutils.GlData(gl, 10),
            selection: new glutils.GlData(gl, 1)
        };
        
        // initialized after this object is created
        this.layout = null;
        
        this.textures = textures;
        
        // js copies of settings for this visualization
        this.userState  = {
            scale: [1, 1, 1],
            offset: [0, 0, 0],
            canvasDims: [0, 0],
            seltex: null,
            pointFactor: 1,
            tex: null
        };
        
        this.scatter_prog = new glutils.GlProgram(
            gl, scatterV, scatterF,
            [ 'pos', 'color', 'ind' ],
            [ 'scale', 'offset', 'pointFactor', 'tex' ]),
        
        this.select_prog = new glutils.GlProgram(
            gl, scatter_selectV, scatter_selectF,
            ['pos', 'color', 'shape', 'size', 'selected'],
            ['scale', 'offset', 'canvasDims', 'seltex']);

        this.picker = new offscreen.VertexPicker(gl);

            // defines vertex attribute information
        this.layout = {
            pos:      new glutils.GlLayout(this.data.vertex, 3, 0),
            color:    new glutils.GlLayout(this.data.vertex, 4, 3),
            shape:    new glutils.GlLayout(this.data.vertex, 1, 7),
            size:     new glutils.GlLayout(this.data.vertex, 1, 8),
            ind:      new glutils.GlLayout(this.data.vertex, 1, 9),
            selected: new glutils.GlLayout(this.data.selection, 1, 0)
        };

        // hack. closure to store 'this'
        function aux(l, p, att) { 
            return function(att) { l[att].set(p, att); };
        }
        
        var set_scatter = aux(this.layout, this.scatter_prog.prog);
        var set_select = aux(this.layout, this.select_prog.prog);

        this.scatter_prog.attr_names.forEach(set_scatter);
        this.select_prog.attr_names.forEach(set_select);
        
        this.scatter_prog.updateShader(gl.VERTEX_SHADER);
        this.scatter_prog.updateShader(gl.FRAGMENT_SHADER);
        this.scatter_prog.updateUniforms();

        this.select_prog.updateShader(gl.VERTEX_SHADER);
        this.select_prog.updateShader(gl.FRAGMENT_SHADER);
        this.select_prog.updateUniforms();

        // asynchronous.  requires loading 7 sizes of images for each glyph
        this.textures.init(gl);

        // gl state that remains constant for the life of the plot
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        
        // set specific uniform values that remain constant for life of the plot
        gl.useProgram(this.scatter_prog.prog);
        gl.uniform1iv(this.scatter_prog.uniforms.tex, this.textures.int32);
        
        gl.useProgram(this.select_prog.prog);
        gl.uniform1i(this.select_prog.seltex, textures.user_selection_unit);
        
        this.resize_dots(); // sets the pointFactor uniform
        this.zoom(); // sets scale and offset uniforms
        
    };

    ScatterPlot.prototype = {

        // marker to memoize program switches

        useSelection: function() {
            if (this.program_in_use === this.useSelection) { return; }
            var g = this.gl;
            g.clearColor(0.0, 0.0, 0.0, 0.0);
            g.blendEquation(g.FUNC_ADD);
            g.blendFunc(g.ONE, g.ONE);
            g.useProgram(this.select_prog.prog);
            this.program_in_use = this.useSelection;
        },

        useVisualization: function() {
            if (this.program_in_use === this.useVisualization) { return; }
            var g = this.gl;
            g.clearColor(1.0, 1.0, 1.0, 1.0);
            g.blendEquationSeparate(g.FUNC_ADD, g.FUNC_ADD);
            g.blendFuncSeparate(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA, g.ONE, g.ONE);
            g.useProgram(this.scatter_prog.prog);
            this.program_in_use = this.useVisualization;
        },
        
        // this may require only changing the viewport?
        zoom: function() {

            var xmin = -30, 
                xmax = 500,
                ymin = -640,
                ymax = 12349,
                Mx = 2 / (xmax - xmin),
                My = 2 / (ymax - ymin),
                Bx = -Mx * xmin - 1,
                By = -My * ymin - 1;
            
            this.userState.scale[0] = Mx;
            this.userState.scale[1] = My;
            this.userState.offset[0] = Bx;
            this.userState.offset[1] = By;

            this.gl.uniform3fv(this.scatter_prog.uniforms.scale, this.userState.scale);
            this.gl.uniform3fv(this.scatter_prog.offset, this.userState.offset);

        },
        
        resize_dots: function() {
            this.gl.useProgram(this.scatter_prog.prog);
            this.gl.uniform1f(this.scatter_prog.uniforms.pointFactor, 
                              this.userState.pointFactor);
        },
        
        // transfers the contents of the picker offscreen renderbuffer into the
        // ARRAY_BUFFER
        synch_selection: function() {
            this.picker.read_from_gl();
            this.data.selection.write_to_gl();
        },
        
        // most importantly, when new data is loaded, the sizes change
        // assume though that the number of points is known
        // also, resize the subordinate selection buffer
        load_data: function(vertex_data) {
            var floatSize = 4,
                npoints = vertex_data.length / this.data.vertex.stride;
            this.data.vertex.adopt_jsbuf(vertex_data);
            this.data.selection.create_jsbuf(npoints * floatSize);
            this.picker.resize(npoints, this.data.selection.jsbuf);

            this.useSelection();
            this.gl.uniform2fv(this.select_prog.uniforms.canvasDims, 
                               [this.picker.width, this.picker.height]);

            this.data.vertex.write_to_gl();
            this.data.selection.write_to_gl();
        },
        
        draw: function() {
            this.useVisualization();
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.gl.drawArrays(this.gl.GL_POINTS, 0, this.nVertices);
        },
        
        draw_picker: function() {
            this.useSelection();
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.gl.drawArrays(this.gl.GL_POINTS, 0, this.nVertices);
            this.synch_selection();
        }
    };

    return { 
        ScatterPlot: ScatterPlot 
    };
});
