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

        // hack.  For now, this counter is managed both in ScatterPlot
        // and in VisualSelection
        this.gl.pending_draws = 0;
        
        this.data = new glutils.GlData(gl, 10);
        
        // initialized after this object is created
        this.layout = null;
        
        this.textures = textures;
        
        // js copies of settings for this visualization
        this.userState = {
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
            pos:      new glutils.GlLayout(this.data, 3, 0),
            color:    new glutils.GlLayout(this.data, 4, 3),
            shape:    new glutils.GlLayout(this.data, 1, 7),
            size:     new glutils.GlLayout(this.data, 1, 8),
            ind:      new glutils.GlLayout(this.data, 1, 9),
            selected: new glutils.GlLayout(this.picker.data, 1, 0)
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
            if (this.program_in_use === this.select_prog) { return; }
            var g = this.gl;
            g.clearColor(0.0, 0.0, 0.0, 0.0);
            // g.clearColor(1.0, 0.0, 0.0, 0.0);
            // g.blendEquation(g.FUNC_ADD);
            // g.blendFunc(g.ONE, g.ONE);
            g.bindFramebuffer(g.FRAMEBUFFER, this.picker.fb);
            g.bindRenderbuffer(g.RENDERBUFFER, this.picker.rb);
            g.blendEquationSeparate(g.FUNC_ADD, g.FUNC_ADD);
            g.blendFuncSeparate(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA, g.ONE, g.ONE);
            g.useProgram(this.select_prog.prog);
            this.program_in_use = this.select_prog;
        },

        useVisualization: function() {
            if (this.program_in_use === this.scatter_prog) { return; }
            var g = this.gl;
            g.clearColor(1.0, 1.0, 1.0, 1.0);
            g.blendEquationSeparate(g.FUNC_ADD, g.FUNC_ADD);
            g.blendFuncSeparate(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA, g.ONE, g.ONE);
            g.bindFramebuffer(g.FRAMEBUFFER, null);
            g.bindRenderbuffer(g.RENDERBUFFER, null);
            g.useProgram(this.scatter_prog.prog);
            this.program_in_use = this.scatter_prog;
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

            this.gl.useProgram(this.scatter_prog.prog);
            this.gl.uniform3fv(this.scatter_prog.uniforms.scale, this.userState.scale);
            this.gl.uniform3fv(this.scatter_prog.uniforms.offset, this.userState.offset);

            this.gl.useProgram(this.select_prog.prog);
            this.gl.uniform3fv(this.select_prog.uniforms.scale, this.userState.scale);
            this.gl.uniform3fv(this.select_prog.uniforms.offset, this.userState.offset);

            // restore to be consistent with what JS thinks is the program in use.
            if (this.program_in_use !== null) {
                this.gl.useProgram(this.program_in_use.prog);
            }
            
        },
        
        resize_dots: function() {
            this.gl.useProgram(this.scatter_prog.prog);
            this.gl.uniform1f(this.scatter_prog.uniforms.pointFactor, 
                              this.userState.pointFactor);
            if (this.program_in_use !== null) {
                this.gl.useProgram(this.program_in_use.prog);
            }
        },
        
        // transfers the contents of the picker offscreen renderbuffer into the
        // ARRAY_BUFFER
        synch_selection: function() {
            this.picker.read_from_gl();
            this.picker.data.write_to_gl();
        },
        
        // most importantly, when new data is loaded, the sizes change
        // assume though that the number of points is known
        // also, resize the subordinate selection buffer to the next
        // rectangular size.
        load_data: function(vertex_data) {
            var floatSize = 4,
                npoints = vertex_data.length / this.data.stride;
            this.data.adopt_jsbuf(vertex_data);
            this.picker.resize(npoints);

            this.useSelection();
            this.gl.uniform2fv(this.select_prog.uniforms.canvasDims, 
                               [this.picker.width, this.picker.height]);

            this.data.write_to_gl();
            this.picker.data.write_to_gl();
        },
        
        draw: function() {
            this.useVisualization();
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.gl.drawArrays(this.gl.GL_POINTS, 0, this.data.num_items());
        },
        
        draw_picker: function() {
            this.useSelection();
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);

            // draws just the number of visible vertices.
            // the picker has a data member that has more.
            this.gl.drawArrays(this.gl.GL_POINTS, 0, this.data.num_items());
            this.synch_selection();
        }
    };

    return { 
        ScatterPlot: ScatterPlot 
    };
});
