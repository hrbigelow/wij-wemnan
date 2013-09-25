varying mediump vec4 vColor;
varying vec3 vOriginalPos;

uniform sampler2D sel;


void main(void) {
    gl_FragColor = 
        texture2D(sel, vSelectionPos).aaaa *
        vColor;
}
