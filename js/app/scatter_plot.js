define([
    'app/webgl_utils',
    'app/random_points',
    'text!shaders/points1-vertex.cc',
    'text!shaders/points1-fragment.cc'
], function(glUtils, randomPoints, vshaderSource, fshaderSource) {

       // this should only be called once during the program's lifetime
       function initScatterProgram(glprog, gl) {

           var a = new Int32Array(glprog.textures.length);

           // set GL global state
           gl.clearColor(0.0, 0.0, 0.0, 0.0);
           gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
           gl.enable(gl.BLEND);
           gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
           gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
           gl.disable(gl.DEPTH_TEST);
           // gl.depthFunc(gl.LEQUAL);

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
           glprog.tex = gl.getUniformLocation(glprog, 'tex');


           // enable vertex attributes
           gl.enableVertexAttribArray(glprog.pos);
           gl.enableVertexAttribArray(glprog.color);
           gl.enableVertexAttribArray(glprog.shape);
           gl.enableVertexAttribArray(glprog.size);

           glprog.mainBuf = gl.createBuffer();
           gl.bindBuffer(gl.ARRAY_BUFFER, glprog.mainBuf);

           // define pointer semantics
           gl.vertexAttribPointer(glprog.pos, 3, gl.FLOAT, false, 36, 0);
           gl.vertexAttribPointer(glprog.color, 4, gl.FLOAT, false, 36, 12);
           gl.vertexAttribPointer(glprog.shape, 1, gl.FLOAT, false, 36, 28);
           gl.vertexAttribPointer(glprog.size, 1, gl.FLOAT, false, 36, 32);

           gl.bindBuffer(gl.ARRAY_BUFFER, null);

           // bind the textures

           for (var i = 0; i != glprog.textures.length; i += 1) { a[i] = i; }
           gl.uniform1iv(glprog.tex, a);
           glprog.textures.forEach(function(s, i) {
               gl.activeTexture(gl.TEXTURE0 + i);
               gl.bindTexture(gl.TEXTURE_2D, s);
           });

       }

       return {
           glprog: undefined,
           points: undefined,
           zoom: {
               scale: [1, 1, 1],
               offset: [0, 0, 0]
           },
           pointFactor: 1.0,

           init: function(gl) {
               var rp = randomPoints,
                   pc = rp.plotConfig;

               this.glprog = glUtils.createProgram(vshaderSource,
                                                   fshaderSource,
                                                   ['img/circle_orig.png',
                                                    'img/triangle_orig.png',
                                                    'img/square.png'],
                                                   initScatterProgram,
                                                   gl);

               this.points = rp.randomPoints(100);
               this.setZoom(pc.xmin, pc.xmax, pc.ymin, pc.ymax);
           },

           // sets this.scale and this.offset to effect a [-1, 1] =>
           // [minX, maxX] transformation
           setZoom: function(minX, maxX, minY, maxY) {
               var Mx = 2 / (maxX - minX),
                   My = 2 / (maxY - minY),
                   Bx = Mx * minX - 1,
                   By = My * minY - 1;

               this.scale = [Mx, My, 1.0];
               this.offset = [Bx, By, 0.0];
           },

           // set the GL overall plot uniforms
           setGLPlotUniforms: function(gl) {
               gl.useProgram(this.glprog);
               gl.uniform1f(this.glprog.pointFactor, this.pointFactor);
               gl.uniform3fv(this.glprog.scale, this.scale);
               gl.uniform3fv(this.glprog.offset, this.offset);
           },

           // should be called any time the data in scatterPoints changes
           // however, for slightly more quickly changing data, perhaps a
           // separate array should be used
           setGLPointsData: function(gl) {
               gl.bindBuffer(gl.ARRAY_BUFFER, this.glprog.mainBuf);
               gl.bufferData(gl.ARRAY_BUFFER, this.points, gl.STATIC_DRAW);
               gl.bindBuffer(gl.ARRAY_BUFFER, null);
           }


       }
   });
