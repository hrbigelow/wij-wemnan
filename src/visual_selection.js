/*
 Implement a lasso-like tool in canvas.  The user clicks mouse-button
 1 and drags the pointer in a lasso shape, finally releasing it.  This
 action paints a filled polygon outline dynamically, using a straight
 line to connect the beginning and end points.

 In the case that Shift is held down, the results are cumulative so
 that each new user interaction adds another selection area to the
 canvas.

*/

function VisualSelect(ctx2d) {

    this.polygon_points = { x:[], y:[] };
    this.ctx = ctx2d;
    this.initContext()
}

VisualSelect.prototype = {

    initContext: function() {
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = '#EEEEEE';
        this.ctx.strokeStyle = 'gray'
        this.ctx.globalAlpha = 0.3;
    },

    getDims: function() {
        return [this.ctx.canvas.width, this.ctx.canvas.height];
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

        this.polygon_points.x[1] = this.polygon_points.x[0];
        this.polygon_points.y[1] = y;
        this.polygon_points.x[2] = x;
        this.polygon_points.y[2] = y;
        this.polygon_points.x[3] = x;
        this.polygon_points.y[3] = this.polygon_points.y[0];
    },


    resize_canvas: function() {
        this.initContext();
    },

    // initialize variables and attach listeners
    clearContext: function() {
        var w = this.ctx.canvas.width,
            h = this.ctx.canvas.height;

        this.ctx.clearRect(0, 0, w, h);
    },

    drawPolygon: function() {
        let self = this;

        function draw_aux() {
            var x = self.polygon_points.x,
                y = self.polygon_points.y;

            if (x.length < 2) { return; }

            self.ctx.moveTo(x[0], y[0]);
            self.ctx.beginPath();
            for (var i = 1; i != x.length; i++) {
                self.ctx.lineTo(x[i], y[i]);
            }
            self.ctx.lineTo(x[0], y[0]);
            self.ctx.closePath();
            self.ctx.fill();
            self.ctx.stroke();
        }
        draw_aux();
        // requestAnimationFrame(draw_aux);
    },

    getImageData: function() {
        let [w, h] = this.getDims();
        return this.ctx.getImageData(0, 0, w, h);
    }
}

export default VisualSelect;

