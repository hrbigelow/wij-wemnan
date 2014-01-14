var gl = $('#glcanvas')[0].getContext('webgl'); var cb = $('#select-back')[0].getContext('2d'); scatter.init(gl, 1000);

// now wait a few seconds...

scatter.setGLPlotUniforms(); scatter.setGLPointsData(); scatter.useVisualizationProgram();

// initialize the selection functionality
selection.init($('#select-front')[0], $('#select-back')[0]);


// draw something on the canvas...

// now transfer the drawn image onto the selection texture
gl.activeTexture(gl.TEXTURE3); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cb.canvas);

// now, load that into TEXTURE0 (which used to be a square or something)
gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, scatter.visProgram.textures[3]); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cb.canvas); gl.generateMipmap(gl.TEXTURE_2D);

gl.drawArrays(gl.GL_POINTS, 0, scatter.nVertices);




