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
        jcanvas_front = undefined,
        jcanvas_back = undefined,
        context_front = undefined,
        context_back = undefined,
        fillStyle = '#8ED6FF',
        strokeStyle = 'blue',
        lineWidth = 1;

    function clearPoints() {
        polygon_points.x = [];
        polygon_points.y = [];
    };

    function append(evt) {
        var off = jcanvas_front.offset(),
            x = evt.pageX - off.left,
            y = evt.pageY - off.top;

        polygon_points.x.push(x);
        polygon_points.y.push(y);
    };


    function mouseDown(evt) {
        if (evt.which != 1) { return; }
        if (! evt.ctrlKey) { clearContext(context_back); }
        jcanvas_front.mousemove(mouseMove);
        clearPoints();
        append(evt);
    };

    function mouseMove(evt) {
        append(evt);
        clearContext(context_front);
        draw(context_front);
    };

    function mouseUp(evt) {
        if (evt.which != 1) { return; }
        jcanvas_front.unbind('mousemove', mouseMove);
        clearContext(context_front);
        draw(context_back);
    };

    // initialize variables and attach listeners
    function init(canvas_front, canvas_back) {
        context_front = canvas_front.getContext('2d');
        context_back = canvas_back.getContext('2d');
        jcanvas_front = $(canvas_front);

        jcanvas_front.mousedown(mouseDown);
        jcanvas_front.mouseup(mouseUp);
    };

    function clearContext(ctx) {
        var w = ctx.canvas.width,
            h = ctx.canvas.height;

        ctx.clearRect(0, 0, w, h);
    };

    function draw(ctx) {
        var c = ctx,
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

