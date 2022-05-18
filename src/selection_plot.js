// import * as tf from '@tensorflow/tfjs-core';
import * as tf from '@tensorflow/tfjs';
// import '@tensorflow/tfjs-backend-webgl';
import randomPoints from './random_points';
import ScatterPlot from './scatter_plot';
import VisualSelect from './visual_selection';


function SelectionPlot(canvas, gl_canvas) {
    this.canvas = canvas;
    this.gl_canvas = gl_canvas;
    this.width = this.gl_canvas.width;
    this.height = this.gl_canvas.height;

    var gl_opts = {
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true
    };

    this.ctx2d = this.canvas.getContext('2d');
    this.ctxgl = this.gl_canvas.getContext('webgl', gl_opts) || 
        this.gl_canvas.getContext('experimental-webgl', gl_opts);

    this.view_state = {
        scale: [1, 1, 1],
        offset: [0, 0, 0],
        pointFactor: 1
    };

    this.scatter_plot = new ScatterPlot(this.ctxgl, this.view_state);
    this.visual_select = new VisualSelect(this.ctx2d);
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

    async getNumSelected() {
        let s = this.scatter_plot.schema.selected;

        let total = tf.tidy(() => {
            return s.export().sum()
        });

        let val = await total.data();
        total.dispose();
        return val[0];
    },

    mouseDown(evt) {
        this.drag_point = evt.target;
        this.ctx2d.clearRect(0, 0, this.width, this.height);
        this.freeform = evt.altKey;
        this.visual_select.clearPoints();
        this.visual_select.appendPoint(evt);
    },

    mouseUp(evt) {
        this.drag_point = null;
        this.ctx2d.clearRect(0, 0, this.width, this.height);
    },

    mouseMove(evt) {
        if (this.drag_point == null) { return; }
        if (this.freeform) { this.visual_select.appendPoint(evt); }
        else { this.visual_select.setRectPoints(evt); }

        let self = this;
        function draw_aux() {
            self.visual_select.clearContext(self.ctx2d);
            self.visual_select.drawPolygon(self.ctx2d);
            let [w, h] = [self.width, self.height];

            // GPU -> CPU
            let image = self.ctx2d.getImageData(0, 0, w, h);

            let schema = self.scatter_plot.schema;
            let gldata = schema.pos.data;
            let N = gldata.num_items();

            // flattened, in order H, W, C
            // retrieve just the alpha channel
            tf.tidy(() => {

                // CPU -> GPU
                let region_ten = tf.browser.fromPixels(image, 1);

                // shape: W, H
                region_ten = region_ten.squeeze(2).transpose([1,0]);
                region_ten = region_ten.notEqual(0).cast('int32');

                // create a tensor of vertex pixel coordinates
                // shape: N, 2 (but inner dimension is x, y
                let vertex_ten = schema.pos.export();
                vertex_ten = vertex_ten.slice([0,0],[-1,2]);

                let scale2 = self.view_state.scale.slice(0, 2);
                let off2 = self.view_state.offset.slice(0, 2);

                // translate to pixel coordinates
                // shape N, 2.  N = number of vertices
                vertex_ten = vertex_ten.mul(scale2).add(off2);

                vertex_ten = vertex_ten.add(1.0).mul([w, h]).div(2.0);
                vertex_ten = tf.cast(vertex_ten, 'int32');

                // perform a gather
                let mask_ten = tf.gatherND(region_ten, vertex_ten);

                if (evt.shiftKey) {
                    let current_sel = self.scatter_plot.schema.selected.export();
                    current_sel = current_sel.squeeze(1).cast('int32');
                    mask_ten = mask_ten.maximum(current_sel);
                }

                self.scatter_plot.schema.selected.populate(mask_ten.dataSync());
                self.scatter_plot.data.write_to_gl();
                self.scatter_plot.draw_points();

                // return mask_ten.sum().dataSync();
              
            });

            console.log('numTensors: ' + tf.memory().numTensors);
            // console.log('numDataBuffers: ' + tf.memory().numDataBuffers);

        }
        requestAnimationFrame(draw_aux);
    }

};

export default SelectionPlot;

