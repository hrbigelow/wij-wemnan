attribute vec3 pos;
attribute float ind;

varying float vColor;
varying vec3 vSelectionPos;

uniform vec3 scale;
uniform vec3 offset;

uniform float nVertices;

// offset of selection texture in the main viewport
uniform vec3 selectionOffset;

// dimension, in pixels, of the selection texture (i.e. 8096,8096,0)
uniform vec3 selectionDims;

// dimension, in pixels, of the visible canvas
uniform vec3 visibleDims;

// one-to-one mapping between an integer and a color.
vec4 colorIndex(float i)
{
    return vec4(mod(floor(i / 16777216), 256),
                mod(floor(i / 65536), 256),
                mod(floor(i / 256), 256),
                mod(i, 256));
}


/*
  Represent each vertex as a single pixel, positioned according to
  its index, and colored according to its index
 */
void main(void) {
    // assume a buffer of nVertices * 1 pixels in size
    gl_Position = vec4(ind * 2 / (nVertices), 1/2, 0.0, 1.0);
    
    // point size is a single pixel
    gl_PointSize = 1.0;

    vColor = colorIndex(ind);

    // viewport position of the vertex in the on-screen display
    // !! this must match the formula given in the visible vertex shader.
    vSelectionPos = 
        (vec3(pos * scale + offset) - selectionOffset) *
        (visibleDims / selectionDims);
}
