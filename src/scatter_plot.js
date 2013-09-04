// 
var SOMBRERO = (function (my) {

    my.scatterPlot = {

        gl: undefined,
        glprog: undefined,

        start: function(canvas_id, load_data_button_id) {
            var load_data_button = document.getElementById(load_data_button_id);
            load_data_button.disabled = true;
            
            var gl = getGLContext(document.getElementById(canvas_id)),
            glprog = loadProgram('src/points1-vertex.cc',
                                 'src/points1-fragment.cc',
                                 ['img/sprite1.png',
                                  'img/sprite2.png',
                                  'img/sprite3.png'],
                                 initScatterProgram,
                                 gl);
            
            function initScatterProgram(glprog, gl) {
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
                
                // define pointer semantics
                gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 36, 0);
                gl.vertexAttribPointer(glprog.color, 4, gl.FLOAT, false, 36, 12);
                gl.vertexAttribPointer(glprog.shape, 1, gl.FLOAT, false, 36, 28);
                gl.vertexAttribPointer(glprog.size, 1, gl.FLOAT, false, 36, 32);
                
                // set GL global state
                gl.clearColor(0.0, 0.0, 0.0, 1.0);
                gl.enable(gl.DEPTH_TEST);
                gl.depthFunc(gl.LEQUAL);
                gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
                
                // enable a 'load data' button again
                load_data_button.disabled = false;
            }
        },


        // should be called any time the data in scatterPoints changes
        // however, for slightly more quickly changing data, perhaps a
        // separate array should be used
        loadPointsData: function(gl, scatterPoints) {
            var glbuf = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, glbuf);
            gl.bufferData(gl.ARRAY_BUFFER, scatterPoints, gl.STATIC_DRAW);
            gl.bindBuffer(null);
        },


        // set the scale and offset uniforms in order so that the
        // real position coordinates are scaled to the [-1, 1] x [-1, 1] interval
        setZoom: function(gl, glprog, minX, maxX, minY, maxY) {
            gl.uniform3f(glprog.scale, 2 * (maxX - minX), 2 * (maxY - minY), 1.0);
            gl.uniform3f(glprog.offset, -2 * (minX + 1), -2 * (minY + 1), 0.0);
        }
    }

    return my;
}(SOMBRERO || {}));


