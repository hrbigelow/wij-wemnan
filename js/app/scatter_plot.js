define([
    'app/webgl_utils',
    'app/random_points',
    'text!shaders/points1-vertex.cc',
    'text!shaders/points1-fragment.cc'
], function(glUtils, randomPoints, vshaderSource, fshaderSource) {

    // this should only be called once during the program's lifetime
    function initScatterProgram(glprog, gl) {

        // set GL global state
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

        gl.useProgram(glprog);
        
        // locate attributes
        glprog.pos = gl.getAttribLocation(glprog, 'pos');
        glprog.color = gl.getAttribLocation(glprog, 'color');
        glprog.shape = gl.getAttribLocation(glprog, 'shape');
        glprog.size = gl.getAttribLocation(glprog, 'size');
        
        // locate uniforms
        glprog.pointFactor = gl.getUniformLocation(glprog, 'uPointFactor');
        glprog.scale = gl.getUniformLocation(glprog, 'scale');
        glprog.offset = gl.getUniformLocation(glprog, 'offset');
        
        // enable vertex attributes
        gl.enableVertexAttribArray(glprog.pos);
        gl.enableVertexAttribArray(glprog.color);
        gl.enableVertexAttribArray(glprog.shape);
        gl.enableVertexAttribArray(glprog.size);

        glprog.mainBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, glprog.mainBuf);

        // load default data
        // gl.bufferData(gl.ARRAY_BUFFER, randomPoints.randomPoints(100), gl.STATIC_DRAW);

        // define pointer semantics
        gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 36, 0);
        gl.vertexAttribPointer(glprog.color, 4, gl.FLOAT, false, 36, 12);
        gl.vertexAttribPointer(glprog.shape, 1, gl.FLOAT, false, 36, 28);
        gl.vertexAttribPointer(glprog.size, 1, gl.FLOAT, false, 36, 32);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        
    }
    
    return {
        glprog: undefined,
        
        init: function(gl) {
            this.glprog = glUtils.createProgram(vshaderSource,
                                                fshaderSource,
                                                ['img/circle.png',
                                                 'img/triangle.png',
                                                 'img/square.png'],
                                                initScatterProgram,
                                                gl);

        },

        postInit: function(gl) {
            var rp = randomPoints,
            pc = rp.plotConfig;

            this.loadPointsData(gl, rp.randomPoints(100));
            this.setZoom(gl, pc.xmin, pc.xmax, pc.ymin, pc.ymax);
            gl.uniform1f(this.glprog.pointFactor, 1.0);
        },

        // should be called any time the data in scatterPoints changes
        // however, for slightly more quickly changing data, perhaps a
        // separate array should be used
        loadPointsData: function(gl, scatterPoints) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.glprog.mainBuf);
            gl.bufferData(gl.ARRAY_BUFFER, scatterPoints, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        },


        // set the scale and offset uniforms in order so that the
        // real position coordinates are scaled to the [-1, 1] x [-1, 1] interval
        setZoom: function(gl, minX, maxX, minY, maxY) {
            gl.useProgram(this.glprog);
            gl.uniform3f(this.glprog.scale, 2 / (maxX - minX), 2 / (maxY - minY), 1.0);
            gl.uniform3f(this.glprog.offset, -2 * (minX + 1), -2 * (minY + 1), 0.0);
        }
    }
});

