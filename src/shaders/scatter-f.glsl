precision mediump float;

varying mediump vec4 vColor;
varying float vShape;

uniform sampler2D tex[4];
int ind;
mediump float tex_alpha;

void main(void) {
    ind = int(vShape);
    if      (ind == 0) { tex_alpha = texture2D(tex[0], gl_PointCoord).a; }
    else if (ind == 1) { tex_alpha = texture2D(tex[1], gl_PointCoord).a; }
    else if (ind == 2) { tex_alpha = texture2D(tex[2], gl_PointCoord).a; }
    else if (ind == 3) { tex_alpha = texture2D(tex[3], gl_PointCoord).a; }

    // simply use the texture as a transparency multiplier for the point
    // gl_FragColor = vec4(vColor.r, vColor.g, vColor.b, vColor.a * tex_alpha);

    // this still results in flickering.
    vec4 col = vec4(vColor.rgb, min(vColor.a, tex_alpha));
    gl_FragColor = col;
    
}
