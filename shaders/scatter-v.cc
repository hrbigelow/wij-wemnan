attribute vec3 pos;
attribute vec4 color;
attribute float shape;
attribute highp float size;
attribute float selected;
    
varying highp vec4 vColor;
varying float vShape;

// easy way to modify size of points all at once.
uniform highp float pointFactor;
uniform vec3 scale;
uniform vec3 offset;

// uniform sampler2D seltex;

void main(void) {

    gl_Position = vec4(pos * scale + offset, 1.0);
    gl_PointSize = size * pointFactor;

    // bool selected = texture2DLod(seltex, gl_Position.xy / 2.0 + vec2(0.5, 0.5), 0.0).a != 0.0;

    vColor = (selected != 0.0) ? vec4(1.0, 0.0, 0.0, 1.0) : color;
    vShape = shape;
}
