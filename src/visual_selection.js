import * as tf from '@tensorflow/tfjs';
/*
 Implement a lasso-like tool in canvas.  The user clicks mouse-button
 1 and drags the pointer in a lasso shape, finally releasing it.  This
 action paints a filled polygon outline dynamically, using a straight
 line to connect the beginning and end points.

 In the case that Ctrl is held down, the results are cumulative so
 that each new user interaction adds another selection area to the
 canvas.

 The result of this is the selection area being rendered to a texture.

*/

var polygon_points = { x:[], y:[] };
var ctx2d_front = undefined;
var ctx2d_back = undefined;
var fillStyle = '#EEEEEE';
var strokeStyle = 'gray';
var lineWidth = 1;
var globalAlpha = 0.3; // want transparent selection
var freeform_selection = false;
var plots = [];
var drag_point = null;

function attachPlot(plot) {
    plots.push(plot);
}

function clearPoints() {
    polygon_points.x = [];
    polygon_points.y = [];
}

function append(evt) {
    var rect = evt.target.getBoundingClientRect();
    var x = evt.pageX - rect.left,
        y = evt.pageY - rect.top;

    polygon_points.x.push(x);
    polygon_points.y.push(y);
}

// sets the 2nd and 3rd and 4th points of polygon_points,
// based on the 3rd point
function setRectPoints(evt) {
    var rect = evt.target.getBoundingClientRect();
    var x = evt.pageX - rect.left,
        y = evt.pageY - rect.top;

    // var off = jcanvas_front.offset(),
    // x = evt.pageX - off.left,
    // y = evt.pageY - off.top;

    polygon_points.x[1] = polygon_points.x[0];
    polygon_points.y[1] = y;
    polygon_points.x[2] = x;
    polygon_points.y[2] = y;
    polygon_points.x[3] = x;
    polygon_points.y[3] = polygon_points.y[0];
}


function mouseDown(evt) {
    drag_point = evt.target;
    console.log('visual_selection: mouseDown');
    // if (evt.which != 1) { return; }
    if (! evt.ctrlKey) { clearContext(ctx2d_back); }
    freeform_selection = evt.altKey;
    clearPoints();
    append(evt);
}

/* Draw the polygon determined by the mouse movement.
 * Read pixels from the selection renderbuffer.
 * Populate a tensor with the pixels.
 * Populate an index array of vertex centers.
 * Perform a tf.gather
 * Set the 'selected' field on the vertices
 */
function mouseMove(evt) {
    console.log('visual_selection: mouseMove');
    if (drag_point == null) return;
    if (freeform_selection) { append(evt); }
    else { setRectPoints(evt); }


    function draw_aux() {
        var w = ctx2d_front.canvas.width;
        var h = ctx2d_front.canvas.height;
        clearContext(ctx2d_front);
        drawPolygon(ctx2d_front);
        // var u8 = new Uint8Array(w * h);
        // ctxgl.readPixels(0, 0, w, h, gl.ALPHA, this.gl.UNSIGNED_BYTE, u8);
        // var ten = tf.tensor(u8);

        // read pixels from the selection renderbuffer
        let image = ctx2d_front.getImageData(0, 0, w, h)

        // flattened, in order H, W, C
        // retrieve just the alpha channel
        var ten = tf.tensor(image.data).reshape([h, w, -1]).slice([0,0,3],[-1,-1,1]);

        // 
        
        // console.log(image.data.length);
        // console.log(image.data.slice(0, 100));
        console.log(ten.toString());

        /*
        plots.forEach(function(p) {
            var g = p.gl;
            if (g.pending_draws < 3) {
                g.activeTexture(g.TEXTURE0 + p.textures.user_selection_unit);
                g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true);
                g.texImage2D(g.TEXTURE_2D, 0, g.ALPHA, g.ALPHA,
                    g.UNSIGNED_BYTE, ctx2d_front.canvas);
                // p.draw_picker();
            }
            g.pending_draws--;
        });
        */
    }
    requestAnimationFrame(draw_aux);

    plots.forEach(function(p) { p.gl.pending_draws++; });
    // console.log(plots[0].gl.pending_draws);
}

function mouseUp(evt) {
    console.log('visual_selection: mouseUp');
    drag_point = null;
    // if (evt.which != 1) { return; }
    clearContext(ctx2d_front);
    drawPolygon(ctx2d_back);
}

function setAttributes(ctx) {
    ctx.lineWidth = lineWidth;
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.globalAlpha = globalAlpha;
}


// initialize variables and attach listeners
function initVisualSelection(canvas_front, canvas_back) {
    ctx2d_front = canvas_front.getContext('2d');
    ctx2d_back = canvas_back.getContext('2d');

    setAttributes(ctx2d_front);
    setAttributes(ctx2d_back);
}

function clearContext(ctx) {
    var w = ctx.canvas.width,
        h = ctx.canvas.height;

    ctx.clearRect(0, 0, w, h);
}

function drawPolygon(ctx) {

    function draw_aux() {
        var c = ctx,
            x = polygon_points.x,
            y = polygon_points.y;

        if (x.length < 2) { return; }

        c.moveTo(x[0], y[0]);
        c.beginPath();
        for (var i = 1; i != x.length; i++) {
            c.lineTo(x[i], y[i]);
        }
        c.lineTo(x[0], y[0]);
        c.closePath();
        c.fill();
        c.stroke();
    }
    draw_aux();
    // requestAnimationFrame(draw_aux);
}

export { initVisualSelection, attachPlot, mouseDown, mouseMove, mouseUp };

