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

function VisualSelect(front_ctx2d, back_ctx2d) {

    this.polygon_points = { x:[], y:[] };
    this.fillStyle = '#EEEEEE';
    this.strokeStyle = 'gray';
    this.lineWidth = 1;
    this.globalAlpha = 0.3; // want transparent selection
    this.plots = [];

    this.front_ctx2d = front_ctx2d;
    this.back_ctx2d = back_ctx2d;

    this.setAttributes(this.front_ctx2d);
    this.setAttributes(this.back_ctx2d);
}

VisualSelect.prototype = {

    attachPlot: function(plot) {
        this.plots.push(plot);
    },

    clearPoints: function() {
        this.polygon_points.x = [];
        this.polygon_points.y = [];
    },

    appendPoint: function(evt) {
        var rect = evt.target.getBoundingClientRect();
        var x = evt.pageX - rect.left,
            y = evt.pageY - rect.top;

        this.polygon_points.x.push(x);
        this.polygon_points.y.push(y);
    },

    // sets the 2nd and 3rd and 4th points of polygon_points,
    // based on the 3rd point
    setRectPoints: function(evt) {
        var rect = evt.target.getBoundingClientRect();
        var x = evt.pageX - rect.left,
            y = evt.pageY - rect.top;

        // var off = jfront_canvas.offset(),
        // x = evt.pageX - off.left,
        // y = evt.pageY - off.top;

        this.polygon_points.x[1] = this.polygon_points.x[0];
        this.polygon_points.y[1] = y;
        this.polygon_points.x[2] = x;
        this.polygon_points.y[2] = y;
        this.polygon_points.x[3] = x;
        this.polygon_points.y[3] = this.polygon_points.y[0];
    },

    setAttributes: function(ctx) {
        ctx.lineWidth = this.lineWidth;
        ctx.fillStyle = this.fillStyle;
        ctx.strokeStyle = this.strokeStyle;
        ctx.globalAlpha = this.globalAlpha;
    },


    // initialize variables and attach listeners
    clearContext: function(ctx) {
        var w = ctx.canvas.width,
            h = ctx.canvas.height;

        ctx.clearRect(0, 0, w, h);
    },

    drawPolygon: function(ctx) {
        let self = this;

        function draw_aux() {
            var x = self.polygon_points.x,
                y = self.polygon_points.y;

            if (x.length < 2) { return; }

            ctx.moveTo(x[0], y[0]);
            ctx.beginPath();
            for (var i = 1; i != x.length; i++) {
                ctx.lineTo(x[i], y[i]);
            }
            ctx.lineTo(x[0], y[0]);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        draw_aux();
        // requestAnimationFrame(draw_aux);
    }
}

export default VisualSelect;

