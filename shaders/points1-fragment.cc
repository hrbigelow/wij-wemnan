precision mediump float;

varying lowp vec4 vColor;
varying lowp float vShape;

uniform sampler2D tex[3];

void main(void) {
    lowp float tex_alpha;
    int shape = int(floor(vShape));
    if      (shape == 0) { tex_alpha = texture2D(tex[0], gl_PointCoord).a; }
    else if (shape == 1) { tex_alpha = texture2D(tex[1], gl_PointCoord).a; }
    else if (shape == 2) { tex_alpha = texture2D(tex[2], gl_PointCoord).a; }

    // simply use the texture as a transparency multiplier for the point
    gl_FragColor = vec4(vColor.r, vColor.g, vColor.b, vColor.a * tex_alpha);
    
}
