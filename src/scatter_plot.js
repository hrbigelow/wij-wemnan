function start(canvas_id) {
    var gl = getGLContext(document.getElementById(canvas_id));
    var glprog = loadProgram('src/points1-vertex.cc',
                             'src/points1-fragment.cc',
                             ['img/sprite1.png',
                              'img/sprite2.png',
                              'img/sprite3.png'],
                             initScatterProgram,
                             gl);

}


// initialize the gl context
function getGLContext(canvas) {
    // Initialize the global variable gl to null.
    var gl = null;
    
    try {
        gl = canvas.getContext("webgl") 
            || canvas.getContext("experimental-webgl");
    }
    catch(e) {}
    
    // If we don't have a GL context, give up now
    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
    }
    return gl;
}





// initialize the scatter program.
// this is called as a callback to loadProgram
function initScatterProgram(glprog, gl) {
    gl.useProgram(glprog);

    // attributes
    glprog.pos = gl.getAttribLocation(glprog, 'pos');
    glprog.color = gl.getAttribLocation(glprog, 'color');
    glprog.shape = gl.getAttribLocation(glprog, 'shape');
    glprog.size = gl.getAttribLocation(glprog, 'size');

    // uniforms
    glprog.pointFactor = gl.getUniformLocation(glprog, 'uPointFactor');

    // textures
    glprog.textures = glprog.textureFiles.map(loadTexture);
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



function 

