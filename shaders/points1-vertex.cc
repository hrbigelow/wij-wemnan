attribute vec3 pos;
attribute vec4 color;
attribute float shape;
attribute float size;
    
varying lowp vec4 vColor;
varying lowp float vShape;

// easy way to modify size of points all at once.
uniform float uPointFactor;
uniform vec3 scale;
uniform vec3 offset;

// need some way to modify the position.
    

void main(void) {
    gl_Position = vec4(pos * scale + offset, 1.0);
    gl_PointSize = size * uPointFactor;
    vColor = color; // modify this as well?
    vShape = shape;
}
