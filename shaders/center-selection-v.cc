attribute vec2 pos;
attribute mediump vec4 color;
attribute float ind;

varying mediump float vSelected;


uniform vec2 scale;
uniform vec2 offset;
uniform vec2 canvasDims;
uniform sampler2D seltex;


void main(void) {
    vec2 visPos;

    // assume an offscreen buffer of canvasWidth * canvasWidth
    gl_Position = vec4(mod(ind, canvasDims[0]) * 2.0 / canvasDims[0] - 1.0, 
                       floor(ind / canvasDims[0]) * 2.0 / canvasDims[1] - 1.0, 0.0, 1.0);
    
    // point size is a single pixel
    gl_PointSize = 1.0;

    // 
    visPos = pos * scale + offset;

    vSelected = min(texture2DLod(seltex, visPos / 2.0 + vec2(0.5, 0.5), 0.0).a, color.a) == 0.0 ? 0.0 : 1.0;
}
