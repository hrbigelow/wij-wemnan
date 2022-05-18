wij-wemnan
==========

Using Tensorflow.js and WebGL rendering for interactive visualization of large
datasets.  ([Demo](https://www.mlcrumbs.com/wij-wemnan/))

# Installation

```sh
git clone https://github.com/hrbigelow/wij-wemnan.git
cd wij-wemnan
npm update
npm run dev
```

# Usage

Wij-wemnan (name from [this skit](https://www.youtube.com/watch?v=4sBiOz2hA3I))
is a proof-of-concept web app for large-scale data interactive visualization.
It is capable of plotting about 100k data points while still providing
performant interaction.

The visualization is a scatter plot which allows specifying point shape
(extensibly provided by [svg
glyphs](https://github.com/hrbigelow/wij-wemnan/blob/master/src/glyphs.xml)),
size, 2D position, RGBA color, and an additional boolean 'selected' state.  The 
user may click-drag rectangular or free-form regions on the plot to mark points
as selected.

The boolean array marking which data points are selected is updated on the CPU
side and an interactive field displays the total number selected in real time.
As a proof of concept, this is meant to demonstrate that other more complex
logic can be used on the CPU side with this updated information, such as
displaying summary statistics or providing search functionality over the
selected points.

# Implementation

Wij-wemnan is implemented using two overlayed canvases.  One is a WebGL canvas
where the scatterplot data is plotted.  The second is a 2D canvas which
supports the user-drawn selection region (using an SVG polygon).  The drawing
logic for the scatter plot is very straightforward, see [shaders
folder](https://github.com/hrbigelow/wij-wemnan/tree/master/src/shaders) The
selection logic makes use of [tfjs](https://github.com/tensorflow/tfjs) GPU
tensor operations, as implemented in the
[mouseMove](https://github.com/hrbigelow/wij-wemnan/blob/f2b850eff053f32073ce40c62e11845a00171d87/src/selection_plot.js#L83).
handler.  

The flow is as follows.  There are two relevant sizes here.  Pixel data is
width x height x 4 bytes, roughly 4MB.  Vertex data is the interleaved fields,
which turns out to be 4 x 10 x nvertices, roughly 4MB as well if nvertices is
100k.  Let's call these sizes P and V.

1. Draw a rectangle or free-form polygon on the 2D canvas
2. Use `ctx.getImageData` to download pixel data from GPU to CPU (size P)
3. Use `tf.browser.fromPixels` to create a GPU tensor from the selection region
   CPU pixel data (size P)
4. Use `tf.tensor` to create a GPU tensor from CPU vertex position data (size V)
5. Transform the vertex position data to pixel positions using the same User space
   -> Clip Space -> NDC -> device coordinates transformation of the WebGL plot
   (done on GPU)
6. Use `tf.gatherND` to create a mask tensor, one entry per vertex (done on
   GPU)
7. Transfer the mask tensor to CPU (size N * 4)
7. Update the CPU side 'selected' field in the vertex data
8. Upload CPU vertex data to GPU (size V)
9. Redraw plot

To provide a smooth user experience, this flow must execute at 30-60 times per
second.   So this flow contains these data transfers:

1. download P (step 2)
2. upload P (steps 3)
3. upload V (steps 4, 8)
4. download Nx4 mask (step 7)

All of these round trips except perhaps step 7 could potentially be eliminated
if it were possible to create a tf.tensor directly from existing WebGL context
  memory buffers, such as
  [WebGLBuffer](https://developer.mozilla.org/en-US/docs/Web/API/WebGLBuffer)
  and
  [WebGLTexture](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture).
  It doesn't appear to be possible, but in principle it could be.


# Demo

A functioning demo is available at
[mlcrumbs.com/wij-wemnan](https://www.mlcrumbs.com/wij-wemnan/)

<!-- 
main.html loads a sorted list of ~40,000 names of human genes, and
provides a simple interactive search box to search them.  The first 20
gene names matching the search (prefix, case-insensitive) appear
dynamically as LI items in an OL.

The point of this is to demonstrate good performance in spite of the
substantial size of the word list.

How it works:

In Javascript main memory (not in DOM):

* a 40,000 element array of the gene names (lower-cased)
* a 40,000 element array of LI HTMLElement's (with id=<gene name>, innerText = <gene_name>)

In the DOM:
* a search box with an oninput listener
* an OL element with up to 20 LI elements

Upon input, the O(log2(N)) binary search functions lower_bound and
upper_bound are used to find a [start, end) interval (after C++ STL
algorithm) within the gene names array / LI HTMLElement array.

A DocumentFragment is created, and the sub-set of LI elements in the
array is inserted (appendChild) into it, up to 20 elements.

The OL is cleared (.innerHTML = ''), then appended (appendChild(df))
with the constructed document fragment.

Also, the listener (created with makeUpdateListener) provides a
closure around the arrays of nodes, words, the OL update target, and
the maximum number of LI's to display.
-->

