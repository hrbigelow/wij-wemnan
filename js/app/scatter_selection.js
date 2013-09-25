/*
what do we need at runtime?

Situation:  The user is dragging a growing box, or with Ctrl depressed,,
is creating an additional box to define a disjoint selection area over the canvas.

Question:  Should the original box be visible during the selection of the
new box?

No, that is pointless.  Instead, let's just factor out the logic of
'append to list' vs. 'clear and restart' to the upper level of the application.

On the JS side, the 'selected' attributes in the auxiliary data
structure, can easily be cleared (and the visible display
replotted to reflect it) if the user initiates a new
selection (without depressing the Ctrl key).

If, on the other hand, the user initiates a selection with ctrl
depressed, then the original auxiliary data structure (which
keeps track of which points are 'selected') will not be touched.

At this point, the functionality is completely separate.  The
other major steps of this operation are:

(Preparation)
Allocate large-as-possible single texture



(Upon mouse-down)
1. Clear the existing selecting texture
2. Clear the existing off-screen color-coded selection hitlist.

(As the user is dragging)
1. Find the upper left and lower right bounds of the rectangle.

2. set the selectionOffset uniform to the visible viewport
   coordinate of the upper left corner position of the bounding
   rectangle.

3. clear the texture.

4. draw the color (0, 0, 0, 1) (against a (0, 0, 0, 0)
   background) using a fixed draw triangles call (or how?)

5. call DrawArrays(GL_POINTS) using the center-selection shaders, onto the
   hitlist

6. call readPixels on the hitlist.

7. traverse the read pixels, decoding the vec4's into indices,
   and updating the auxiliary data selection state.

8. replot the visible canvas, using a given color for the
   selection state.

9. Possibly, update the secondary canvas' SVG elements, if the
   points are set to be labeled.

*/


// functionality for off-screen center-point selection encoding buffer
define([
    'app/webgl_utils',
    'text!shaders/center-selection-v.cc',
    'text!shaders/center-selection-f.cc'
], function(glUtils, vShaderSource, fShaderSource) {

    