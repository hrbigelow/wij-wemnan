import * as glutils from './webgl_utils';

// a renderbuffer for representing each vertex as a single pixel
// creates a framebuffer, renderbuffer, and attaches the latter
function VertexPicker(gl) {
    this.gl = gl;
    this.data = new glutils.GlData(gl, 1);
    this.npoints = null;
    this.width = this.default_width;
    this.height = null;
    this.uint8_view = null;

    this.fb = gl.createFramebuffer();
    this.rb = gl.createRenderbuffer();
    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);

    // Is this necessary?  Since we don't yet know the width and height
    // needed by this VertexPicker, it doesn't really make sense to try to
    // call this function with invald values...
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 
    //               rttFramebuffer.width, 
    //               rttFramebuffer.height, 
    //               0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,
                            gl.COLOR_ATTACHMENT0,
                            gl.TEXTURE_2D,
                            this.tex,
                            0);

    // are these necessary ?
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.rb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, 10, 10);

    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, 
                               gl.COLOR_ATTACHMENT0, 
                               gl.RENDERBUFFER,
                               this.rb);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

}

VertexPicker.prototype = {
    default_width: 1000,

    resize: function(npoints) {
        this.npoints = npoints;
        this.height = Math.ceil(this.npoints / this.width);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.rb);

        // resize the texture (does this work?)
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 
                           this.width, this.height, 
                           0, this.gl.RGBA, this.gl.UNSIGNED_BYTE,
                           null);

        // this is the command given from learningwebgl.com lesson 16
        // this.gl.renderbufferStorage(this.gl.RENDERBUFFER, 
        //                             this.gl.DEPTH_COMPONENT16, 
        //                             this.width, this.height);

        // this is my command
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER,
                                    this.gl.RGBA4, 
                                    // this.gl.COLOR_ATTACHMENT0,
                                    this.width,
                                    this.height);

        this.data.destroy_jsbuf();
        this.data.create_jsbuf(this.width * this.height * 4);
    },
    destroy: function() {
        this.gl.deleteRenderbuffer(this.rb);
        this.gl.deleteFramebuffer(this.fb);
        this.data.destroy_jsbuf();
    },
    // reads pixels from gl framebuffer into the uint8_view
    read_from_gl: function() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fb);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.rb);
        var u8 = new Uint8Array(this.data.jsbuf);

        this.gl.readPixels(0, 0, this.width, this.height, 
                           this.gl.RGBA, this.gl.UNSIGNED_BYTE,
                           u8);
        var s = 0;
        for (var i = 0; i != u8.byteLength; i++) { s += u8[i]; }
        console.log('Sum: ' + s);
    }

};

export { VertexPicker };
