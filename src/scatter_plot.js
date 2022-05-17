import * as glutils from './webgl_utils';
import scatterV from './shaders/scatter-v.glsl';
import scatterF from './shaders/scatter-f.glsl';
// import scatter_selectV from './shaders/scatter_select-v.glsl';
// import scatter_selectF from './shaders/scatter_select-f.glsl';
import textures from './textures';
// import * as offscreen from './offscreen_rendering';

function ScatterPlot(gl, viewState) {

    console.log(glutils);

    this.gl = gl;

    // hack.  For now, this counter is managed both in ScatterPlot
    // and in VisualSelection
    this.gl.pending_draws = 0;

    this.data = new glutils.GlData(gl, 10);

    // initialized after this object is created
    this.layout = null;

    this.textures = textures;

    this.viewState = viewState;
    this.scatter_prog = new glutils.GlProgram(
        gl, scatterV, scatterF,
        ['pos', 'color', 'shape', 'size', 'selected'],
        [ 'scale', 'offset', 'pointFactor', 'tex']
    );

    // defines vertex attribute information
    this.layout = {
        pos:      new glutils.GlLayout(this.data, 3, 0, 0),
        color:    new glutils.GlLayout(this.data, 4, 3, 1),
        shape:    new glutils.GlLayout(this.data, 1, 7, 2),
        size:     new glutils.GlLayout(this.data, 1, 8, 3),
        selected: new glutils.GlLayout(this.data, 1, 9, 4),
    };

    // hack. closure to store 'this'
    function aux(l, p) { 
        return function(att) { l[att].set(p, att); };
    }

    let set_scatter = aux(this.layout, this.scatter_prog.prog);

    this.scatter_prog.attr_names.forEach(set_scatter);

    this.scatter_prog.updateShader(gl.VERTEX_SHADER);
    this.scatter_prog.updateShader(gl.FRAGMENT_SHADER);
    this.scatter_prog.updateUniforms();

    // asynchronous.  requires loading 7 sizes of images for each glyph
    this.textures.init(gl);

    // gl state that remains constant for the life of the plot
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);

    // set specific uniform values that remain constant for life of the plot
    gl.useProgram(this.scatter_prog.prog);
    // gl.uniform1iv(this.scatter_prog.uniforms.tex, this.textures.int32);

    this.resize_dots(); // sets the pointFactor uniform
    this.zoom(); // sets scale and offset uniforms

};

ScatterPlot.prototype = {

    useVisualization() {
        // if (this.program_in_use === this.scatter_prog) { return; }
        var g = this.gl;
        g.clearColor(1.0, 1.0, 1.0, 1.0);
        g.blendEquationSeparate(g.FUNC_ADD, g.FUNC_ADD);
        g.blendFuncSeparate(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA, g.ONE, g.ONE);
        g.bindFramebuffer(g.FRAMEBUFFER, null);
        g.bindRenderbuffer(g.RENDERBUFFER, null);
        // g.useProgram(this.scatter_prog.prog);
        // this.program_in_use = this.scatter_prog;
    },

    // this may require only changing the viewport?
    zoom() {

        var xmin = -30, 
            xmax = 500,
            ymin = -640,
            ymax = 12349,
            Mx = 2 / (xmax - xmin),
            My = 2 / (ymax - ymin),
            Bx = -Mx * xmin - 1,
            By = -My * ymin - 1;

        this.viewState.scale[0] = Mx;
        this.viewState.scale[1] = My;
        this.viewState.offset[0] = Bx;
        this.viewState.offset[1] = By;

        // this.gl.useProgram(this.scatter_prog.prog);
        this.gl.uniform3fv(this.scatter_prog.uniforms.scale, this.viewState.scale);
        this.gl.uniform3fv(this.scatter_prog.uniforms.offset, this.viewState.offset);

    },

    resize_dots() {
        // this.gl.useProgram(this.scatter_prog.prog);
        this.gl.uniform1f(this.scatter_prog.uniforms.pointFactor, 
            this.viewState.pointFactor);
    },

    // transfers the contents of the picker offscreen renderbuffer into the
    // ARRAY_BUFFER
    // sync_selection: function() {
    // this.picker.read_from_gl();
    // this.picker.data.write_to_gl();
    // },

    // most importantly, when new data is loaded, the sizes change
    // assume though that the number of points is known
    // also, resize the subordinate selection buffer to the next
    // rectangular size.
    load_data(vertex_data) {
        var floatSize = 4,
            npoints = vertex_data.length / this.data.stride;
        this.data.adopt_jsbuf(vertex_data);

        this.data.write_to_gl();
    },

    draw_points() {
        this.useVisualization();
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.drawArrays(this.gl.GL_POINTS, 0, this.data.num_items());
    }

    /*
  draw_picker: function() {
    this.useSelection();
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

      // draws just the number of visible vertices.
      // the picker has a data member that has more.
    this.gl.drawArrays(this.gl.GL_POINTS, 0, this.data.num_items());
    this.sync_selection();
  }
  */
};

export default ScatterPlot;
