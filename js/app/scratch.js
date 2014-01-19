// assume the user has drawn a rectangle or some such on the canvas
scatter.setGLSelectionUniforms();
scatter.useSelectionProgram();
var sel = scatter.selection;
var u = sel.userData;

scatter.draw();
gl.readPixels(0, 0, sel.width, sel.height, gl.RGBA, gl.UNSIGNED_BYTE, u);
var s = 0; for (var i = 0; i != u.length; i++) { s += u[i]; }
