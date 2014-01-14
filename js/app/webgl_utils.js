define([
    'webgl_debug'
], function(WebGLDebugUtils){

    window.onerror = function(msg, url, lineno) {
	    alert(url + '(' + lineno + '): ' + msg);
    };

    // create a shader of a given type from a string source
    function createShader(gl, str, type) {
	    var shader = gl.createShader(type);
	    gl.shaderSource(shader, str);
	    gl.compileShader(shader);
	    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		    throw gl.getShaderInfoLog(shader) + ', type: ' + type;
	    }
	    return shader;
    }

    // creates a compiled and linked program from shader source strings,
    // within the 'gl' context given.
    function createProgram(vss, fss, progSpec, gl) {

	    var program = gl.createProgram(),
	     vshader = createShader(gl, vss, gl.VERTEX_SHADER),
	     fshader = createShader(gl, fss, gl.FRAGMENT_SHADER),
         i;
	    
	    gl.attachShader(program, vshader);
	    gl.attachShader(program, fshader);
        gl.linkProgram(program);
	    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		    throw gl.getProgramInfoLog(program) + ', program linking';
	    }

        gl.useProgram(program);

        // locate attributes
        progSpec.attributes.forEach(
            function (a) { program[a] = gl.getAttribLocation(program, a); }
        );
        
        // locate uniforms
        progSpec.uniforms.forEach(
            function(u) { program[u] = gl.getUniformLocation(program, u); }
        );
	    
        gl.useProgram(null);
	    
	    return program;
    }


    return {
        
        createProgram: createProgram,

        // initialize the gl context
        getGLContext: function(canvas) {
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
        },

        throwOnGLError: function(err, funcName, args) {
            throw WebGLDebugUtils.glEnumToString(err) 
                + " was caused by call to: " + funcName;
        },


        logAndValidate: function(functionName, args) {
            function logGLCalls(functionName, args) {   
                console.log("gl." + functionName + "(" + 
                            WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");   
            }
            
            function validateUndef(functionName, args) {
                for (var ii = 0; ii < args.length; ++ii) {
                    if (args[ii] === undefined) {
                        console.error("undefined passed to gl." + functionName + "(" +
                                      WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
                    }
                }
            }
            
            logGLCalls(functionName, args);
            validateUndef(functionName, args);
        },
        
      glDebug: WebGLDebugUtils
      
    };
});



// (function() {
//     var lastTime = 0;
//     var vendors = ['ms', 'moz', 'webkit', 'o'];
//     for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
//         window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
//         window.cancelRequestAnimationFrame = window[vendors[x]+
//                                                     'CancelRequestAnimationFrame'];
//     }

//     if (!window.requestAnimationFrame)
//         window.requestAnimationFrame = function(callback, element) {
//             var currTime = new Date().getTime();
//             var timeToCall = Math.max(0, 16 - (currTime - lastTime));
//             var id = window.setTimeout(function() { callback(currTime + timeToCall); },
//                                        timeToCall);
//             lastTime = currTime + timeToCall;
//             return id;
//         };

//     if (!window.cancelAnimationFrame)
//         window.cancelAnimationFrame = function(id) {
//             clearTimeout(id);
//         };
// }())
