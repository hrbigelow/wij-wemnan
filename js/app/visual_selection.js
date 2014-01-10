/*
 Implement a lasso-like tool in canvas.  The user clicks mouse-button
 1 and drags the pointer in a lasso shape, finally releasing it.  This
 action paints a filled polygon outline dynamically, using a straight
 line to connect the beginning and end points.

 In the case that Ctrl is held down, the results are cumulative so
 that each new user interaction adds another selection area to the
 canvas.

*/




define([
    'jquery'
], function($) {

    var polygon_points = { x:[], y:[] },
        jcanvas = undefined,
        context = undefined,
        fillStyle = '#8ED6FF',
        strokeStyle = 'blue',
        lineWidth = 1;

    function clearPoints() {
        polygon_points.x = [];
        polygon_points.y = [];
    };

    function append(evt) {
        var off = jcanvas.offset(),
            x = evt.pageX - off.left,
            y = evt.pageY - off.top;

        polygon_points.x.push(x);
        polygon_points.y.push(y);
    };

    

    function mouseDown(evt) {
        if (evt.which != 1) { return; }
        jcanvas.mousemove(mouseMove);
        clearPoints();
        clearCanvas();
        append(evt);
    };

    function mouseMove(evt) {
        append(evt);
        clearCanvas();
        clearPrevDraw();
        draw();
    };

    function mouseUp(evt) {
        if (evt.which != 1) { return; }
        jcanvas.unbind('mousemove', mouseMove);
        context.save();
    };

    // initialize variables and attach listeners
    function init(canvas) {
        context = canvas.getContext('2d');
        jcanvas = $(canvas);

        jcanvas.mousedown(mouseDown);
        jcanvas.mouseup(mouseUp);
    };

    function clearCanvas() {
        var w = context.canvas.width,
            h = context.canvas.height;

        context.clearRect(0, 0, w, h);
    };

    function clearPrevDraw() {
        context.restore();
    };

    function draw() {
        var c = context,
            x = polygon_points.x,
            y = polygon_points.y;

        if (x.length < 2) { return; }

        c.moveTo(x[0], y[0]);
        c.beginPath();
        for (var i = 1; i != x.length; i++) {
            c.lineTo(x[i], y[i]);
        }
        c.closePath();
        c.lineWidth = lineWidth;
        c.fillStyle = fillStyle;
        c.fill();
        c.strokeStyle = strokeStyle;
        c.stroke();
    };

    return {
        init: init
    };
    
});

