attribute vec2 pos;
attribute mediump vec4 color;
attribute float ind;

varying mediump vec4 vColor;

// position in the selection texture rectangle of this vertex
varying mediump vec2 vSelectionPos;

uniform vec2 scale;
uniform vec2 offset;

uniform float nVertices;

// offset of selection texture in the main viewport
uniform vec2 texOrigin;

// dimension, in pixels, of the selection texture (i.e. 8096,8096)
uniform vec2 texSize;

// dimension, in pixels, of the visible canvas
uniform vec2 viewSize;

// one-to-one mapping between an integer and a color.
//vec4 colorIndex(float i)
//{
//   return vec4(mod(floor(i / 16777216), 256),
//                mod(floor(i / 65536), 256),
//                mod(floor(i / 256), 256),
//                mod(i, 256));
//}


/*
  Represent each vertex as a single pixel, positioned according to its
  index, and colored according to its index.
 */
void main(void) {
    // assume a buffer of nVertices * 1 pixels in size
    gl_Position = vec4(ind * 2.0 / (nVertices), 1.0/2.0, 0.0, 1.0);
    
    // point size is a single pixel
    gl_PointSize = 1.0;

    // not sure what i was thinking here...there is no reason to encode the
    // index as a color, because the position in the buffer will suffice
    //vColor = colorIndex(ind);

    // the original color attribute. partly, this will also determine
    // whether the vertex is 'visible' or not, and thus whether the
    // user can select it.
    vColor = color;

    // viewport position of the vertex in the on-screen display
    // !! this must match the formula given in the visible vertex shader.
    // for the x and y coordinates
    vSelectionPos = 
        ((pos * scale + offset) - texOrigin) *
        (viewSize / texSize);
}
