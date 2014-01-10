define([
    'app/webgl_utils',
    'app/random_points',
    'app/data_layouts',
    'text!shaders/points1-vertex.cc',
    'text!shaders/points1-fragment.cc',
    'text!shaders/center-selection-v.cc',
    'text!shaders/center-selection-f.cc'
], function(glUtils, randomPoints, dataLayout,
            vVisShaderStr, fVisShaderStr,
            vSelShaderStr, fSelShaderStr) {

    // vertex attribute encoding for this scatter plot
    var shaderSpec = {
        sel: { 
            uniforms: ['scale', 'offset', 'nVertices', 
                       'texOrigin', 'texSize', 'viewSize', 'tex'],
            attributes: ['pos', 'color', 'ind']
        },
        vis: {
            uniforms: ['pointFactor', 'scale', 'offset', 'tex'],
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

    // locates attributes and uniforms.
    // progSpec holds the names of attributes and uniforms
    // prog holds a 'textures' field with initialized textures.
    // assumes the presence of a sampler2D uniform called 'tex'
    // which may be an array or not.
    function initProg(prog, progSpec, gl)
    {
        // locate attributes
        progSpec.attributes.forEach(
            function (a) { prog[a] = gl.getAttribLocation(prog, a); }
        );

        // locate uniforms
        progSpec.uniforms.forEach(
            function(u) { prog[u] = gl.getUniformLocation(prog, u); }
        );

        // bind the textures to their texture units 0, 1,
        // etc. these should correspond semantically to the 'shape'
        // vertex attribute
        prog.textures.forEach(function(s, i) {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, s);
        });

        gl.useProgram(prog);
        var ints = new Int32Array(prog.textures.length);
        for (var i = 0; i != prog.textures.length; i += 1) { ints[i] = i; }
        gl.uniform1iv(prog.tex, ints);
        gl.useProgram(null);

    }

    // this should only be called once during the program's lifetime
    // assumes a buffer has been initialized
    function initVisProgram(vis, gl) {
        initProg(vis, shaderSpec.vis, gl);
    }

    // this should only be called once during the program's lifetime
    // assumes a buffer has been initialized
    function initSelProgram(sel, gl) {
        initProg(sel, shaderSpec.sel, gl);
    }


    function useVisProgram(vis, glBuf, gl) {

        // set GL global state
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
        gl.disable(gl.DEPTH_TEST);
        // gl.depthFunc(gl.LEQUAL);

        // define pointer semantics.  these link up the offsets in the
        // gl program with the offsets in the buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, glBuf);
        
        shaderSpec.vis.attributes.forEach(
            function(att) { setAtt(att, vis, gl); }
        );
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.useProgram(vis);
    }


    // this function does just the minimal amount of work needed to get
    // the gl context ready to use the 'sel' program.
    // the caller is responsible for setting uniforms in the sel program itself.
    function useSelProgram(sel, glBuf, gl) {

        // set GL global state
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.disable(gl.BLEND);
        // !!! gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
        // !!! gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
        gl.disable(gl.DEPTH_TEST);
        // gl.depthFunc(gl.LEQUAL);

        // define pointer semantics.  these link up the offsets in the
        // gl program with the offsets in the buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, glBuf);
        shaderSpec.sel.attributes.forEach(
            function(att) { setAtt(att, sel, gl); }
        );
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.useProgram(sel);

    }





    return {
        visProgram: undefined,
        selProgram: undefined,
        points: undefined,
        glPoints: undefined,
        nVertices: undefined,

        zoom: {
            scale: [1, 1, 1],
            offset: [0, 0, 0]
        },
        pointFactor: 1.0,

        init: function(gl, nVertices) {
            var rp = randomPoints,
                pc = rp.plotConfig;

            this.visProgram = glUtils.createProgram(vVisShaderStr,
                                                    fVisShaderStr,
                                                    ['img/circle.png',
                                                     'img/triangle.png',
                                                     'img/square.png'],
                                                    initVisProgram,
                                                    gl);
            
            this.selProgram = glUtils.createProgram(vSelShaderStr,
                                                    fSelShaderStr,
                                                    [],
                                                    initSelProgram,
                                                    gl);

            this.nVertices = nVertices;
            this.points = rp.randomPoints(nVertices);
            this.glPoints = gl.createBuffer();
            this.setZoom(pc.xmin, pc.xmax, pc.ymin, pc.ymax);

        },

        useSelectionProgram: function(gl)
        {
            useSelProgram(this.selProgram, this.glPoints, gl);
        },

        useVisualizationProgram: function(gl)
        {
            useVisProgram(this.visProgram, this.glPoints, gl);
        },

        // sets this.scale and this.offset to effect a [-1, 1] =>
        // [minX, maxX] transformation
        setZoom: function(minX, maxX, minY, maxY) {
            var Mx = 2 / (maxX - minX),
                My = 2 / (maxY - minY),
                Bx = Mx * minX - 1,
                By = My * minY - 1;

            this.scale = [Mx, My, 1.0];
            this.offset = [Bx, By, 0.0];
        },

        // set the GL overall plot uniforms. This function will be
        // called any time the user-space parameters affecting the
        // visualization are altered
        setGLPlotUniforms: function(gl) {
            gl.useProgram(this.visProgram);
            gl.uniform1f(this.visProgram.pointFactor, this.pointFactor);
            gl.uniform3fv(this.visProgram.scale, this.scale);
            gl.uniform3fv(this.visProgram.offset, this.offset);
        },

        // set GL uniforms for center-selection shaders
        setGLSelectionUniforms: function(gl) {
            var pg = this.selProgram;
            gl.useProgram(pg);

            gl.uniform2fv(pg.scale, this.scale.slice(0,2));
            gl.uniform2fv(pg.offset, this.offset.slice(0,2));
            gl.uniform1f(pg.nVertices, this.nVertices);
            gl.uniform2fv(pg.texOrigin, this.texOrigin);
            gl.uniform2fv(pg.texSize, this.texSize);
            gl.uniform2fv(pg.viewSize, [gl.drawingBufferWidth, gl.drawingBufferHeight]);
        },

        // should be called any time the data in scatterPoints changes
        // however, for slightly more quickly changing data, perhaps a
        // separate array should be used
        setGLPointsData: function(gl) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.glPoints);
            gl.bufferData(gl.ARRAY_BUFFER, this.points, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }


    };
});
