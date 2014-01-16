attribute vec3 pos;
attribute vec4 color;
attribute float shape;
attribute highp float size;
    
varying highp vec4 vColor;
varying float vShape;

// easy way to modify size of points all at once.
uniform highp float pointFactor;
uniform vec3 scale;
uniform vec3 offset;

uniform sampler2D seltex;

// need some way to modify the position.
    

void main(void) {
    // in the [-1, 1] interval
    gl_Position = vec4(pos * scale + offset, 1.0);

    gl_PointSize = size * pointFactor;

    // vColor = vec4(texture2DLod(seltex, gl_Position.xy / 2.0 + vec2(0.5, 0.5), 0.0).rgb, color.a);
    bool selected = texture2DLod(seltex, gl_Position.xy / 2.0 + vec2(0.5, 0.5), 0.0).a != 0.0;

    vColor = selected ? vec4(1.0, 0.0, 0.0, 1.0) : color;
        
    vShape = shape;
}
