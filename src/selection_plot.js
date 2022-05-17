import * as tf from '@tensorflow/tfjs';
import randomPoints from './random_points';
import ScatterPlot from './scatter_plot';
import VisualSelect from './visual_selection';


function SelectionPlot(front_canvas, back_canvas, gl_canvas) {
    this.front_canvas = front_canvas;
    this.back_canvas = back_canvas;
    this.gl_canvas = gl_canvas;
    this.width = this.gl_canvas.width;
    this.height = this.gl_canvas.height;

    var gl_opts = {
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true
    };

    this.front_ctx2d = this.front_canvas.getContext('2d');
    this.back_ctx2d = this.back_canvas.getContext('2d');
    this.ctxgl = this.gl_canvas.getContext('webgl', gl_opts) || 
        this.gl_canvas.getContext('experimental-webgl', gl_opts);

    this.view_state = {
        scale: [1, 1, 1],
        offset: [0, 0, 0],
        pointFactor: 1
    };

    this.scatter_plot = new ScatterPlot(this.ctxgl, this.view_state);
    this.visual_select = new VisualSelect(this.front_ctx2d, this.back_ctx2d);
    this.drag_point = null;
    this.freeform = false; 

};

SelectionPlot.prototype = {

    constructor: SelectionPlot,

    refreshData: function(num_points) {
        console.log('in refreshData with ', num_points);
        this.scatter_plot.load_data(randomPoints(this.scatter_plot, num_points));
        this.scatter_plot.zoom();
        this.scatter_plot.draw_points();
    },

    setPointFactor(point_factor) {
        this.view_state.pointFactor = point_factor;
        this.scatter_plot.resize_dots();
        this.scatter_plot.draw_points();
    },

    mouseDown(evt) {
        this.drag_point = evt.target;
        if (! evt.ctrlKey) {
            this.back_ctx2d.clearRect(0, 0, this.width, this.height);
        }
        this.freeform = evt.altKey;
        this.visual_select.clearPoints();
        this.visual_select.appendPoint(evt);
    },

    mouseUp(evt) {
        this.drag_point = null;
        this.front_ctx2d.clearRect(0, 0, this.width, this.height);
        this.visual_select.drawPolygon(this.back_ctx2d);
    },

    mouseMove(evt) {
        if (this.drag_point == null) { return; }
        if (this.freeform) { this.visual_select.appendPoint(evt); }
        else { this.visual_select.setRectPoints(evt); }

        let self = this;
        function draw_aux() {
            self.visual_select.clearContext(self.front_ctx2d);
            self.visual_select.drawPolygon(self.front_ctx2d);
            let [w, h] = [self.width, self.height];
            let image = self.front_ctx2d.getImageData(0, 0, w, h);

            let schema = self.scatter_plot.layout;
            let gldata = schema.pos.data;
            let N = gldata.num_items();

            // flattened shape xyzxyz...
            let vertex_pos = schema.pos.export();

            // flattened, in order H, W, C
            // retrieve just the alpha channel
            const total_marked = tf.tidy(() => {
                let region_ten = tf.browser.fromPixels(image, 1);

                // shape: W, H
                region_ten = region_ten.squeeze(2).transpose([1,0]);
                region_ten = region_ten.notEqual(0).cast('int32');

                // create a tensor of vertex pixel coordinates
                // shape: N, 2 (but inner dimension is x, y
                let vertex_ten = tf.tensor(vertex_pos, [N, 3]);
                vertex_ten = vertex_ten.slice([0,0],[-1,2]);

                let scale2 = self.view_state.scale.slice(0, 2);
                let off2 = self.view_state.offset.slice(0, 2);

                // translate to pixel coordinates
                // shape N, 2.  N = number of vertices
                vertex_ten = vertex_ten.mul(scale2).add(off2);

                vertex_ten = vertex_ten.add(1.0).mul([w, h]).div(2.0);
                vertex_ten = tf.cast(vertex_ten, 'int32');

                console.log('min vertex coords: ', vertex_ten.min(0).dataSync());
                console.log('max vertex coords: ', vertex_ten.max(0).dataSync());
                // perform a gather
                let mask_ten = tf.gatherND(region_ten, vertex_ten);

                self.scatter_plot.layout.selected.populate(mask_ten.dataSync());
                self.scatter_plot.data.write_to_gl();
                self.scatter_plot.draw_points();


                return mask_ten.sum().dataSync();
                // return region_ten.sum().dataSync();
              
              
            });
            // console.log('total_marked = ', total_marked);

            console.log('numTensors: ' + tf.memory().numTensors);
            console.log('numDataBuffers: ' + tf.memory().numDataBuffers);

        }
        requestAnimationFrame(draw_aux);
    }

};

export default SelectionPlot;

