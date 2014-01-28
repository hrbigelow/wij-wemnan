define([
], function() {
    
    // a renderbuffer for representing each vertex as a single pixel
    // creates a framebuffer, renderbuffer, and attaches the latter
    function VertexPicker(gl) {
        this.gl = gl;
        this.npoints = null;
        this.width = this.default_width;
        this.height = Math.ceil(this.npoints / this.width);
        this.jsbuf = null;

        this.fb = this.gl.createFramebuffer();
        this.rb = this.gl.createRenderbuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fb);
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, 
                                        this.gl.COLOR_ATTACHMENT0, 
                                        this.gl.RENDERBUFFER,
                                        this.rb);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    }

    VertexPicker.prototype = {
        default_width: 1000,

        resize: function(npoints, new_arraybuf) {
            this.npoints = npoints;
            this.height = Math.ceil(this.npoints / this.width);
            this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.rb);
            this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.RGBA4, 
                                        this.width, this.height);
            this.jsbuf = new Float32Array(new_arraybuf, this.npoints);
        },
        destroy: function() {
            this.gl.deleteRenderbuffer(this.rb);
            this.gl.deleteFramebuffer(this.fb);
        },
        // reads pixels from gl framebuffer into jsbuf
        read_from_gl: function() {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fb);
            this.gl.readPixels(0, 0, this.width, this.height, 
                               this.gl.RGBA, this.gl.UNSIGNED_BYTE,
                               this.jsbuf);
        }

    };
        
    return {
        VertexPicker: VertexPicker
    };

});
