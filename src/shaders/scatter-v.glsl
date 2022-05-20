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

void main(void) {

    // specified in clip space coordinates.  here they are in [-1, 1]
    gl_Position = vec4(pos * scale + offset, 1.0);
    gl_PointSize = size * pointFactor;

    vColor = (selected != 0.0) ? vec4(1.0, 0.0, 0.0, 1.0) : color;
    vShape = shape;
}

