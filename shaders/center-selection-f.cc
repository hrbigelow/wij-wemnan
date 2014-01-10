varying mediump vec4 vColor;
varying mediump vec2 vSelectionPos;

uniform sampler2D tex;


void main(void) {
    gl_FragColor = 
        texture2D(tex, vSelectionPos).aaaa *
        vColor;
}
