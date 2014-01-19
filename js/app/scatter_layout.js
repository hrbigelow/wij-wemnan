// layouts for defining data to be plotted.

/*
there are three separate categories of one-time initializations that
need to happen for createProgram:

1. getting attribute locations
2. getting uniform locations
3. setting data layout to the proper set of buffers

Each program really should have a symbolic name, and the layouts
should have as a top-level the name of this program.  Also, there
should be a separate 


*/
define({

    
           
    data: {
        vertex: { jsbuf: undefined, glbuf: undefined, stride: 10 },
        selection: { jsbuf: undefined, glbuf: undefined, stride: 1 }
    },
        
    // defines the 
    layout: {

        pos:   { data: this.data.vertex, size: 3, offset: 0 }, 
        color: { data: this.data.vertex, size: 4, offset: 3 },
        shape: { data: this.data.vertex, size: 1, offset: 7 },
        size:  { data: this.data.vertex, size: 1, offset: 8 },
        ind:   { data: this.data.vertex, size: 1, offset: 9 },
        selected: { data: this.data.selection, size: 1, offset: 0 }
    },

    // js copies of settings for this visualization
    userState : {
        scale: [1, 1, 1],
        offset: [0, 0, 0],
        canvasDims: [0, 0],
        seltex: undefined,
        pointFactor: 1,
        tex: undefined
    },

    // define locations of uniforms
    // all named uniforms must exist as keys in 'userState'
    // also, the keys of 'uniforms' define what we are expecting to find.
    shaders: {
        scatter: {
            vsource: 'scatter-v.cc',
            fsource: 'scatter-f.cc',
            program: undefined,
            uniforms: {
                scale: undefined,
                offset: undefined,
                pointFactor: undefined,
                tex: undefined
            }
        },
        
        scatter_select: {
            vsource: 'scatter_select-v.cc',
            fsource: 'scatter_select-f.cc',
            program: undefined,
            uniforms: {
                scale: undefined,
                offset: undefined,
                canvasDims: undefined,
                seltex: undefined
            }
        }
    }

});

