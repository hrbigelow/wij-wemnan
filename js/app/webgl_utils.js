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


    // create an image.  pass in the callback to this function
    // for delayed initialization of the image
    function createImage(filename, index, callback) {
        var img = new Image();
        function onload() { callback(img, index); }
        img.onload = onload;
        img.src = filename;
        return img;
    }


    // create a new texture from an image object (after it has been
    // loaded) returns the initialized WebGLTexture object the
    // consumer must bind it to the unit desired.  temporarily uses
    // TEXTURE0 as a unit in which to do the initialization work, but
    // finally leaves the TEXTURE0 unit unbound.
    function createTexture(img, gl) {
        var tex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return tex;
    }
    
    
    return {
        
        // creates a compiled and linked program from shader source strings,
        // within the 'gl' context given.
        createProgram: function(vss, fss, textureFiles, callback, gl) {
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
	        
            // this bizarre code is required to make 'every' fail
            // when merely testing the 'falsy' quality of undefined.
            program.textures = [];
            for (i = 0; i != textureFiles.length; i += 1) {
                program.textures.push(undefined);
            }
            
            program.images = textureFiles.map(function(filename, index) {
                return createImage(filename, index, imageLoaded);
            });
            
            function imageLoaded(img, index) {
                program.textures[index] = createTexture(img, gl);
                if (program.textures.every(function (el, i, a) { return el; })) {
                    callback(program, gl);
                }    
            }
	        
	    return program;
        },


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
