// 
function start(canvas_id, load_data_button_id) {
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
    
}


// should be called any time the data in scatterPoints changes
// however, for slightly more quickly changing data, perhaps a
// separate array should be used
function loadPointsData(gl, scatterPoints) {
    var glbuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, glbuf);
    gl.bufferData(gl.ARRAY_BUFFER, scatterPoints, gl.STATIC_DRAW);
    gl.bindBuffer(null);
}


// set the GL state.  Should only be called once
function setGLState(gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);                  // Set clear color to black, fully opaque
    gl.enable(gl.DEPTH_TEST);                           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);                            // Near things obscure far things
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);  // Clear the color as well as the depth buffer.
}



// set the scale and offset uniforms in order so that the
// real position coordinates are scaled to the [-1, 1] x [-1, 1] interval
function setZoom(gl, glprog, minX, maxX, minY, maxY) {
    gl.uniform3f(glprog.scale, 2 * (maxX - minX), 2 * (maxY - minY), 1.0);
    gl.uniform3f(glprog.offset, -2 * (minX + 1), -2 * (minY + 1), 0.0);
}




function start() {
    var canvas = document.getElementById("glcanvas");
    
    initWebGL(canvas);      // Initialize the GL context
    
    // Only continue if WebGL is available and working
    
    function initProgram(program) {
        gl.useProgram(program);
        program.vertexPosAttrib = gl.getAttribLocation(program, 'aVertexPosition');
        program.offsetUniform = gl.getUniformLocation(program, 'uOffset');
        gl.enableVertexAttribArray(program.vertexPosAttrib);
        gl.vertexAttribPointer(program.vertexPosAttrib, vertexPosBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.uniform2f(program.offsetUniform, offset[0], offset[1]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPosBuffer.numItems);
    }
    


        gl.clearColor(0.0, 0.0, 0.0, 1.0);                  // Set clear color to black, fully opaque
        gl.enable(gl.DEPTH_TEST);                           // Enable depth testing
        gl.depthFunc(gl.LEQUAL);                            // Near things obscure far things
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);  // Clear the color as well as the depth buffer.
    }
}

