import * as tf from '@tensorflow/tfjs';
import * as glutils from './webgl_utils';
import scatterV from './shaders/scatter-v.glsl';
import scatterF from './shaders/scatter-f.glsl';
import textures from './textures';

function ScatterPlot(gl, viewState) {

    // console.log(glutils);

    this.gl = gl;

    // hack.  For now, this counter is managed both in ScatterPlot
    // and in VisualSelection
    this.gl.pending_draws = 0;

    this.data = new glutils.GlData(gl, 10);

    // initialized after this object is created
    this.schema = null;

    this.textures = textures;
    this.textures_loaded = false;

    this.viewState = viewState;
    this.scatter_prog = new glutils.GlProgram(
        gl, scatterV, scatterF,
        ['pos', 'color', 'shape', 'size', 'selected'],
        [ 'scale', 'offset', 'pointFactor', 'tex']
    );

    // gl state that remains constant for the life of the plot
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);

    // defines vertex attribute information
    this.schema = {
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

    let set_scatter = aux(this.schema, this.scatter_prog.prog);

    this.scatter_prog.attr_names.forEach(set_scatter);


    this.scatter_prog.updateShader(gl.VERTEX_SHADER);
    this.scatter_prog.updateShader(gl.FRAGMENT_SHADER);
    this.scatter_prog.updateUniforms();

    gl.useProgram(this.scatter_prog.prog);

    this.resize_dots(); // sets the pointFactor uniform

};

ScatterPlot.prototype = {

    useVisualization() {
        var g = this.gl;
        g.clearColor(1.0, 1.0, 1.0, 1.0);
        g.blendEquationSeparate(g.FUNC_ADD, g.FUNC_ADD);
        g.blendFuncSeparate(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA, g.ONE, g.ONE);
        g.bindFramebuffer(g.FRAMEBUFFER, null);
        g.bindRenderbuffer(g.RENDERBUFFER, null);
        g.useProgram(this.scatter_prog.prog);
        // this.program_in_use = this.scatter_prog;
    },

    async initTextures() {
        await this.textures.init(this.gl);
        this.gl.uniform1iv(this.scatter_prog.uniforms.tex, this.textures.int32);
        this.textures_loaded = true;
    },

    resize_canvas() {
        let cnv = this.gl.canvas;
        this.gl.viewport(0, 0, cnv.width, cnv.height);
    },

    // transform a given point in pixel space to data space
    pixel2data(xp) {
        let [m, b] = [this.viewState.scale, this.viewState.offset];
        let [xoff, yoff, w, h] = this.gl.getParameter(this.gl.VIEWPORT);
        return [
            2/(w * m[0]) * xp[0] - (b[0] + 1)/m[0],
            -2/(h * m[1]) * xp[1] - (b[1] - 1)/m[1]
        ];
    },

    // transform a given point in data space to pixel space
    data2pixel(xd) {
        let [m, b] = [this.viewState.scale, this.viewState.offset];
        let [xoff, yoff, w, h] = this.gl.getParameter(this.gl.VIEWPORT);
        return [
            (w * m[0])/2 * xd[0] + w * (b[0] + 1)/2,
            -(h * m[1])/2 * xd[1] + h * (1 - b[1])/2
        ];

    },


    // clip space -> pixel space
    viewPortTransform2D(clip_space_ten) {
        // clip space to pixel space, the 'viewport transformation'
        let [xoff, yoff, w, h] = this.gl.getParameter(this.gl.VIEWPORT);
        let [halfw, halfh] = [w * 0.5, h * 0.5];
        let pixel_ten = clip_space_ten.mul([halfw, -halfh]).add([halfw, halfh]);
        return pixel_ten.cast('int32');
    },

    // data space -> pixel space
    vertexPixelCoords() {
        let pixel_ten = tf.tidy(() => {
            let vertex_ten = this.schema.pos.export();
            vertex_ten = vertex_ten.slice([0,0],[-1,2]);

            let scale2 = this.viewState.scale.slice(0, 2);
            let off2 = this.viewState.offset.slice(0, 2);

            // shape N, 2.  N = number of vertices
            // data space to clip space
            vertex_ten = vertex_ten.mul(scale2).add(off2);
            vertex_ten = this.viewPortTransform2D(vertex_ten);
            return vertex_ten;

        });
        return pixel_ten;

    },

    // define the data to clip space transform
    // data space y grows up
    // clip space y grows up 
    resetZoom() {
        let { xmin, xmax, ymin, ymax } = this.data_range;
        let Mx = 2 / (xmax - xmin),
            My = 2 / (ymax - ymin),
            Bx = -Mx * xmin - 1,
            By = -My * ymin - 1;

        this.viewState.scale[0] = Mx;
        this.viewState.scale[1] = My;
        this.viewState.offset[0] = Bx;
        this.viewState.offset[1] = By;
        // console.log(this.viewState);

        // this.gl.useProgram(this.scatter_prog.prog);
        this.gl.uniform3fv(this.scatter_prog.uniforms.scale, this.viewState.scale);
        this.gl.uniform3fv(this.scatter_prog.uniforms.offset, this.viewState.offset);
        this.draw_points();
    },

    zoom(focal_pixel, deltaY) {
        // focal_pixel will be in pixel coordinates
        let factor = Math.exp(deltaY * 0.001);
        let mdelta = factor - 1.0;
        let vs = this.viewState;

        let xdf = this.pixel2data(focal_pixel);
        let bdel = [-vs.scale[0] * mdelta * xdf[0], -vs.scale[1] * mdelta * xdf[1]];

        vs.scale[0] *= factor;
        vs.scale[1] *= factor;
        vs.offset[0] += bdel[0]; 
        vs.offset[1] += bdel[1];

        // let focal_pixel2 = this.data2pixel(xdf);
        // console.log(focal_pixel, focal_pixel2);
        // console.log(vs.scale, vs.offset);

        this.gl.uniform3fv(this.scatter_prog.uniforms.scale, this.viewState.scale);
        this.gl.uniform3fv(this.scatter_prog.uniforms.offset, this.viewState.offset);
        this.draw_points();
    },

    resize_dots() {
        this.gl.uniform1f(this.scatter_prog.uniforms.pointFactor, 
            this.viewState.pointFactor);
    },

    // most importantly, when new data is loaded, the sizes change
    // assume though that the number of points is known
    // also, resize the subordinate selection buffer to the next
    // rectangular size.
    load_data(vertex_data) {
        var floatSize = 4,
            npoints = vertex_data.length / this.data.stride;
        this.data.adopt_jsbuf(vertex_data);
        this.data.write_to_gl();

        const [mins, maxs] = tf.tidy(() => {
            let pos_ten = this.schema.pos.export();
            return [pos_ten.min(0), pos_ten.max(0)];
        });
        const [mins_vals, maxs_vals] = [mins.dataSync(), maxs.dataSync()];
        mins.dispose();
        maxs.dispose();
        this.data_range = {
            xmin: mins_vals[0],
            xmax: maxs_vals[0],
            ymin: mins_vals[1],
            ymax: maxs_vals[1]
        };
        this.resetZoom();
    },

    draw_points() {
        this.useVisualization();
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.drawArrays(this.gl.GL_POINTS, 0, this.data.num_items());
    }

};

export default ScatterPlot;
