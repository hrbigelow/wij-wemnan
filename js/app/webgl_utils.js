define([
    'webgl_debug'
], function(debugGl){

    window.onerror = function(msg, url, lineno) {
	    alert(url + '(' + lineno + '): ' + msg);
    };

    // create a shader of a given type from a string source
    function createShader(gl, str, type) {
	    var shader = gl.createShader(type);
	    gl.shaderSource(shader, str);
	    gl.compileShader(shader);
	    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		    throw gl.getShaderInfoLog(shader) + ', type: ' + type
            + ', shader source:'
            + str;
	    }
	    return shader;
    }

    // creates a compiled and linked program from shader source strings,
    // within the 'gl' context given.
    // uses the layout and name of the shader
    function createProgram(vss, fss, shaderSpec, gl) {

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

        // locate attributes.
        // instead, using bindAttribLocation.  Will it work?
        // progSpec.attributes.forEach(
        //     function (a) { program[a] = gl.getAttribLocation(program, a); }
        // );
        
        // locate uniforms
        shaderSpec.uniforms.forEach(
            function(u) { 
                var l = gl.getUniformLocation(program, u);
                if (l == -1) { throw 'Error: uniform ' + u + ' not found.'; }
                shaderSpec.uniforms[u] = l;
            }
        );
	    
        gl.useProgram(null);
	    
	    shaderSpec.program = program;
    }

    // create and initialize a GL Program
    // manage and mirror GL resources to ease changing shaders
    function GlProgram(gl, vsrc, fsrc, attr_names, uniform_names) {
        this.gl = gl;
	    this.prog = this.gl.createProgram();
        this.vsrc = vsrc;
        this.fsrc = fsrc;
        this.vshader = null;
        this.fshader = null;
        this.attr_names = attr_names;
        this.uniform_names = uniform_names;
        this.uniforms = null;
    }

    GlProgram.prototype = {

        // cleanly update a shader when either this.vsrc or this.fsrc changes
        updateShader: function(shader_type) {
            var old_shader, new_source, new_shader;
            if (shader_type == this.gl.VERTEX_SHADER) {
                old_shader = this.vshader;
                new_source = this.vsrc;
            }
            else { 
                old_shader = this.fshader; 
                new_source = this.fsrc;
            }
            // clean up if necessary
            if (old_shader !== null) {
                this.gl.detachShader(this.prog, old_shader);
                this.gl.deleteShader(old_shader);
            }
            new_shader = createShader(this.gl, new_source, shader_type);
            if (shader_type == this.gl.VERTEX_SHADER) {
                this.vshader = new_shader;
            }
            else {
                this.fshader = new_shader;
            }

            this.gl.attachShader(this.prog, new_shader);

            if (this.fshader !== null && this.vshader !== null)
            {
                this.gl.linkProgram(this.prog);
	            if (!this.gl.getProgramParameter(this.prog, this.gl.LINK_STATUS)) {
		            throw this.gl.getProgramInfoLog(this.prog) + ', program linking';
	            }
            }
        },
        
        // update the uniform locations based on the names
        updateUniforms: function() {
            var _this = this;
            this.uniforms = {};
            this.uniform_names.forEach(function(el, i) {
                _this.uniforms[el] = _this.gl.getUniformLocation(_this.prog, el);
            });
        }
        
    };

    function GlData(gl, stride) {
        this.gl = gl;
        this.glbuf = this.gl.createBuffer();
        this.jsbuf = null;
        this.stride = stride;
    }

    GlData.prototype = {
        create_jsbuf: function(nbytes) { this.jsbuf = new ArrayBuffer(nbytes); },
        destroy_jsbuf: function() { if (this.jsbuf !== null) { this.jsbuf = null; } },
        adopt_jsbuf: function(buf) { this.jsbuf = buf; },
        write_to_gl: function() {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glbuf);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.jsbuf, this.gl.STATIC_DRAW);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        }
    };

    function GlLayout(gldata, size, offset) {
        this.data = gldata;
        this.size = size;
        this.offset = offset;
        this.attrib_location = GlLayout.getNextLoc();
    }

    GlLayout.nextLoc = 0;
    GlLayout.getNextLoc = function() { return this.nextLoc++; };

    GlLayout.prototype = {
        // sets the given attribute based on a pre-assigned
        // global location independent of which program.
        set: function(prog, attr) {
            var gl = this.data.gl,
                floatSize = 4;
            gl.bindAttribLocation(prog, this.attrib_location, attr);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.data.glbuf);
            gl.enableVertexAttribArray(this.attrib_location);
            gl.vertexAttribPointer(this.attrib_location,
                                   this.size,
                                   gl.FLOAT,
                                   false,
                                   this.data.stride * floatSize,
                                   this.offset * floatSize);
        }
    };

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
            throw debugGl.glEnumToString(err) 
                + " was caused by call to: " + funcName;
        },


        logAndValidate: function(functionName, args) {
            function logGLCalls(functionName, args) {   
                console.log("gl." + functionName + "(" + 
                            debugGl.glFunctionArgsToString(functionName, args) + ")");   
            }
            
            function validateUndef(functionName, args) {
                for (var ii = 0; ii < args.length; ++ii) {
                    if (args[ii] === undefined) {
                        console.error("undefined passed to gl." + functionName + "(" +
                                      debugGl.glFunctionArgsToString(functionName, args) + ")");
                    }
                }
            }
            
            logGLCalls(functionName, args);
            validateUndef(functionName, args);
        },
        
        debugGl: debugGl,
        GlData: GlData,
        GlLayout: GlLayout,
        GlProgram: GlProgram
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
