define([
    'app/webgl_utils',
    'app/random_points',
    'app/data_layouts',
    'app/textures',
    'text!shaders/points1-vertex.cc',
    'text!shaders/points1-fragment.cc',
    'text!shaders/center-selection-v.cc',
    'text!shaders/center-selection-f.cc'
], function(glUtils, randomPoints, dataLayout, textures,
            vVisShaderStr, fVisShaderStr,
            vSelShaderStr, fSelShaderStr) {

    // vertex attribute encoding for this scatter plot
    var shaderSpec = {
        sel: { 
            uniforms: ['scale', 'offset', 'canvasWidth', 'tex'],
            attributes: ['pos', 'color', 'ind']
        },
        vis: {
            uniforms: ['pointFactor', 'scale', 'offset', 'tex', 'seltex'],
            attributes: ['pos', 'color', 'shape', 'size']
        }
    };

    function setAtt(att, prog, gl) {
        var atts = dataLayout.scatter,
            floatBytes = 4;

        gl.enableVertexAttribArray(prog[att]);
        gl.vertexAttribPointer(prog[att], atts[att].size, 
                               gl.FLOAT, false, atts.stride * floatBytes, 
                               atts[att].offset * floatBytes);
    }

    return {

        visProgram: undefined,
        selProgram: undefined,
        points: undefined,
        glPoints: undefined,
        nVertices: undefined,
        textures: textures,
        gl: undefined,

        view: {
            scale: [1, 1, 1],
            offset: [0, 0, 0],
            pointFactor: 1.0
        },


        useVisualizationProgram: function() {

            var g = this.gl;

            // set GL global state
            g.clearColor(0.0, 0.0, 0.0, 0.0);
            g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);
            g.enable(g.BLEND);
            g.blendEquationSeparate(g.FUNC_ADD, g.FUNC_ADD);
            g.blendFuncSeparate(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA, g.ONE, g.ONE);
            g.disable(g.DEPTH_TEST);
            // g.depthFunc(g.LEQUAL);
            
            // define pointer semantics.  these link up the offsets in the
            // g program with the offsets in the buffer.
            g.bindBuffer(g.ARRAY_BUFFER, this.glPoints);
            
            var vp = this.visProgram;
            shaderSpec.vis.attributes.forEach(function(att) { setAtt(att, vp, g); });

            g.bindBuffer(g.ARRAY_BUFFER, null);
            g.useProgram(this.visProgram);
        },
        

        // this function does just the minimal amount of work needed to get
        // the gl context ready to use the 'sel' program.
        // the caller is responsible for setting uniforms in the sel program itself.
        useSelectionProgram: function() {

            var g = this.gl;

            // set GL global state
            g.clearColor(0.0, 0.0, 0.0, 0.0);
            g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);
            g.disable(g.BLEND);
            // !!! g.blendEquationSeparate(g.FUNC_ADD, g.FUNC_ADD);
            // !!! g.blendFuncSeparate(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA, g.ONE, g.ONE);
            g.disable(g.DEPTH_TEST);
            // g.depthFunc(g.LEQUAL);

            // define pointer semantics.  these link up the offsets in the
            // gl program with the offsets in the buffer.
            g.bindBuffer(g.ARRAY_BUFFER, this.glPoints);

            var sp = this.selProgram;
            shaderSpec.sel.attributes.forEach(function(att) { setAtt(att, sp, g); });
            g.bindBuffer(g.ARRAY_BUFFER, null);
            g.useProgram(this.selProgram);

        },

        init: function(gl, nVertices) {
            var rp = randomPoints,
                pc = rp.plotConfig;

            this.gl = gl;

            this.visProgram =
                glUtils.createProgram(vVisShaderStr, fVisShaderStr, shaderSpec.vis, this.gl);
            
            this.selProgram = 
                glUtils.createProgram(vSelShaderStr, fSelShaderStr, shaderSpec.sel, this.gl);

            this.textures.init(gl);

            this.nVertices = nVertices;
            this.points = rp.randomPoints(nVertices);
            this.glPoints = this.gl.createBuffer();
            this.setZoom(pc.xmin, pc.xmax, pc.ymin, pc.ymax);

        },


        // sets this.scale and this.view.offset to effect a [-1, 1] =>
        // [minX, maxX] transformation
        setZoom: function(minX, maxX, minY, maxY) {
            var Mx = 2 / (maxX - minX),
                My = 2 / (maxY - minY),
                Bx = -Mx * minX - 1,
                By = -My * minY - 1;

            this.view.scale = [Mx, My, 1.0];
            this.view.offset = [Bx, By, 0.0];
        },

        // set the GL overall plot uniforms. This function will be
        // called any time the user-space parameters affecting the
        // visualization are altered
        setGLPlotUniforms: function() {
            var g = this.gl;
            g.useProgram(this.visProgram);
            g.uniform1f(this.visProgram.pointFactor, this.view.pointFactor);
            g.uniform3fv(this.visProgram.scale, this.view.scale);
            g.uniform3fv(this.visProgram.offset, this.view.offset);
            g.uniform1iv(this.visProgram.tex, textures.int32);
            g.uniform1i(this.visProgram.seltex, textures.user_selection_unit);
        },

        // set GL uniforms for center-selection shaders
        setGLSelectionUniforms: function() {
            var pg = this.selProgram,
                g = this.gl;

            g.useProgram(pg);

            g.uniform2fv(pg.scale, this.view.scale.slice(0,2));
            g.uniform2fv(pg.offset, this.view.offset.slice(0,2));
            g.uniform1f(pg.canvasWidth, 2048);
        },

        // should be called any time the data in scatterPoints changes
        // however, for slightly more quickly changing data, perhaps a
        // separate array should be used
        setGLPointsData: function() {
            var g = this.gl;

            g.bindBuffer(g.ARRAY_BUFFER, this.glPoints);
            g.bufferData(g.ARRAY_BUFFER, this.points, g.STATIC_DRAW);
            g.bindBuffer(g.ARRAY_BUFFER, null);
        },

        // top-level drawing function for this plot
        draw: function() {
            var p = this;
            function draw_aux() {
                p.gl.drawArrays(p.gl.GL_POINTS, 0, p.nVertices);
            }
            requestAnimationFrame(draw_aux);
        }


    };
});
