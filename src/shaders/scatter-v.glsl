attribute vec3 pos;
attribute vec4 color;
attribute float shape;
attribute highp float size;
attribute float selected;
    
varying mediump vec4 vColor;
varying float vShape;

// easy way to modify size of points all at once.
uniform vec3 scale;
uniform vec3 offset;
uniform mediump float pointFactor;
// uniform sampler2D seltex;

void main(void) {

    // specified in clip space coordinates.  here they are in [-1, 1]
    gl_Position = vec4(pos * scale + offset, 1.0);
    gl_Position.y = - gl_Position.y;

    gl_PointSize = size * pointFactor;

    // translate from [-1, 1] clip space coords to [0, 1] in texture
    // coordinates
    // vec2 tex_coords = gl_Position.xy / 2.0 + vec2(0.5, 0.5);

    // bool selected = texture2DLod(seltex, tex_coords, 0.0).a != 0.0;

    vColor = (selected != 0.0) ? vec4(1.0, 0.0, 0.0, 1.0) : color;
    vShape = shape;
}
