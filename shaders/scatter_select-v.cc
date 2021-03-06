attribute vec2 pos;
attribute vec4 color;
attribute float ind;

uniform vec2 scale;
uniform vec2 offset;
uniform vec2 canvasDims;
uniform sampler2D seltex;

varying highp vec4 vColor;


void main(void) {
    vec2 visPos = pos * scale + offset;
    gl_PointSize = 1.0;

    float selected = 
        min(texture2DLod(seltex, visPos / 2.0 + vec2(0.5, 0.5), 0.0).a, color.a) == 0.0 ? 0.0 : 1.0;

    // these were for packing four vertices into one pixel.  no longer needed
    // float pixel_num = floor(ind / 4.0);
    // int pixel_slot = int(mod(ind, 4.0));

    float w = canvasDims[0];
    float h = canvasDims[1];

    float col = mod(ind, w);
    float row = floor(ind / w);

    float x = (col - ((w - 1.0) / 2.0)) / (w / 2.0);
    float y = (row - ((h - 1.0) / 2.0)) / (h / 2.0);

    gl_Position = vec4(x, y, 0.0, 1.0);

    // inefficient, but unfortunately, the only way to load vertex attribute
    // is from a Float32Array.  Thus, we want to generate a 32-bit value for each vertex.
    vColor = vec4(0.0, 0.0, 0.0, selected);
    // vColor = vec4(pixel_slot == 0 ? selected : 0.0,
    //               pixel_slot == 1 ? selected : 0.0,
    //               pixel_slot == 2 ? selected : 0.0,
    //               pixel_slot == 3 ? selected : 0.0);
}
