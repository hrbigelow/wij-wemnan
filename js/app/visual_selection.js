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
        fillStyle = '#EEEEEE',
        strokeStyle = 'gray',
        lineWidth = 1,
        globalAlpha = 0.3, // want transparent selection
        freeform_selection = false,
        plots = [];

    function attachPlot(plot) {
        plots.push(plot);
    };

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

    // sets the 2nd and 3rd and 4th points of polygon_points,
    // based on the 3rd point
    function setRectPoints(evt) {
        var off = jcanvas_front.offset(),
            x = evt.pageX - off.left,
            y = evt.pageY - off.top;

        polygon_points.x[1] = polygon_points.x[0];
        polygon_points.y[1] = y;
        polygon_points.x[2] = x;
        polygon_points.y[2] = y;
        polygon_points.x[3] = x;
        polygon_points.y[3] = polygon_points.y[0];
    }


    function mouseDown(evt) {
        if (evt.which != 1) { return; }
        if (! evt.ctrlKey) { clearContext(context_back); }
        freeform_selection = evt.altKey;
        jcanvas_front.mousemove(mouseMove);
        clearPoints();
        append(evt);
    };

    function mouseMove(evt) {
        if (freeform_selection) { append(evt); }
        else { setRectPoints(evt); }
        clearContext(context_front);
        draw(context_front);
        plots.forEach(function(p) {
            var g = p.gl;
            g.activeTexture(g.TEXTURE0 + p.textures.user_selection_unit);
            g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true);
            g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, context_front.canvas);
            p.draw();
        });
        
                           
    };

    function mouseUp(evt) {
        if (evt.which != 1) { return; }
        jcanvas_front.unbind('mousemove', mouseMove);
        clearContext(context_front);
        draw(context_back);
    };

    function setAttributes(ctx) {
        ctx.lineWidth = lineWidth;
        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.globalAlpha = globalAlpha;
    }
    

    // initialize variables and attach listeners
    function init(canvas_front, canvas_back) {
        context_front = canvas_front.getContext('2d');
        context_back = canvas_back.getContext('2d');

        setAttributes(context_front);
        setAttributes(context_back);

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
        c.lineTo(x[0], y[0]);
        c.closePath();
        c.fill();
        c.stroke();
    };

    return {
        init: init,
        attachPlot: attachPlot
    };
    
});

