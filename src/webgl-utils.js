window.onerror = function(msg, url, lineno) {
	alert(url + '(' + lineno + '): ' + msg);
}

// create a shader of a given type from a string source
function createShader(str, type) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, str);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw gl.getShaderInfoLog(shader);
	}
	return shader;
}


function loadImage(filename, index, callback) {
    var img = new Image();
    function onload() { callback(img, index) }
    img.onload = onload;
    img.src = filename;
}


// create a new texture from an image object (after it has been loaded)
function createTexture(img, gl) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE0, null);
    return tex;
}



// after program source is loaded as string properties 'vshaderSource'
// and 'fshaderSource', creates and attaches the shaders and links the
// program.
function linkProgram(program, gl) {
	var vshader = createShader(program.vshaderSource, gl.VERTEX_SHADER);
	var fshader = createShader(program.fshaderSource, gl.FRAGMENT_SHADER);
	gl.attachShader(program, vshader);
	gl.attachShader(program, fshader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		throw gl.getProgramInfoLog(program);
	}
}


function loadFile(file, callback, noCache, isJson) {
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
		if (request.readyState == 1) {
			if (isJson) {
				request.overrideMimeType('application/json');
			}
			request.send();
		} else if (request.readyState == 4) {
			if (request.status == 200) {
				callback(request.responseText);
			} else if (request.status == 404) {
				throw 'File "' + file + '" does not exist.';
			} else {
				throw 'XHR error ' + request.status + '.';
			}
		}
	};
	var url = file;
	if (noCache) {
		url += '?' + (new Date()).getTime();
	}
	request.open('GET', url, true);
}


// creates a program, asynchronously loads source code for vertex and
// fragment shaders from paths vs and fs, compiles and links it,
// returns the program and invokes the given callback once the program
// is ready.
function loadProgram(vs, fs, textureFiles, callback, gl) {
	var program = gl.createProgram(),
    i;
    
    // this bizarre code is required to make 'every' fail
    // when merely testing the 'falsy' quality of undefined.
    program.images = [];
    for (i = 0; i != textureFiles.length; i += 1) {
        program.images.push(undefined);
    }
    
    
	function vshaderLoaded(str) {
		program.vshaderSource = str;
		if (program.fshaderSource) {
			linkProgram(program, gl);
            loadTextures(textureFiles, callback);
		}
	}
    
	function fshaderLoaded(str) {
		program.fshaderSource = str;
		if (program.vshaderSource) {
			linkProgram(program, gl);
            loadTextures(textureFiles, callback);
		}
	}
    function imageLoaded(img, index) {
        program.images[index] = img;
        program.textures[index] = createTexture(img, gl);
        if (program.images.every(function (el, i, a) { return el })) {
            callback(program, gl);
        }    
    }
    
	loadFile(vs, vshaderLoaded, true);
	loadFile(fs, fshaderLoaded, true);
    textureFiles.forEach(function(filename, index) {
        loadImage(filename, index, imageLoaded);
    });
                         
	return program;
}


// this doesn't necessarily need to be part of the program -- it only
// modifies the gl context itself and returns handles to its state.
// however, the program will need to hold onto the handles in order to
// use them.
function loadTexture(filename, textureIndex, callback, gl) {
    var tex = gl.createTexture();
    var img = new Image();
    img.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE0, null);
    };
    img.src = filename;
    return tex;
}



(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelRequestAnimationFrame = window[vendors[x]+
          'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}())