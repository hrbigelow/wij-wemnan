import * as glUtils from './webgl_utils';
import glyph_xml_string from './glyphs.xml';

// console.log('glyphs: ', glyph_xml_string)

// managing textures
// for each image, create a mipmapped texture and store it in 'point_shapes'
// also create one
var textures = {
    int32: null,
    // point_shapes: [],
    user_selection: null,
    user_selection_unit: null,

    init: async function(gl) {
        // var point_shapes = this.point_shapes;

        var glyph_frag = document.createDocumentFragment();

        var b = document.createElement('body');
        b.innerHTML = glyph_xml_string;
        glyph_frag.appendChild(b);
        var svg_nodes = glyph_frag.querySelectorAll('svg');

        var cnv = document.createElement('canvas');
        cnv.setAttribute('width', 256);
        cnv.setAttribute('height', 256);
        var ctx = cnv.getContext('2d');

        var level_sizes = [256, 128, 64, 32, 16, 8, 4, 2, 1];
        var serial = new XMLSerializer();

        this.int32 = new Int32Array(svg_nodes.length);
        for (var i = 0; i != svg_nodes.length; i += 1) { this.int32[i] = i; }

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        function get_data_url(unit, size) {
            let shape = svg_nodes.item(unit);
            let ratio = size / shape.width.baseVal.value;
            shape.width.baseVal.value = size;
            shape.height.baseVal.value = size;

            // in this shape assume the polygon is sized at 256 x 256
            let poly = shape.getElementsByTagName('polygon')[0];
            if (poly) {
                for (let i = 0; i != poly.points.numberOfItems; i++) {
                    poly.points.getItem(i).x *= ratio;
                    poly.points.getItem(i).y *= ratio;
                }
            }
            let svg_xml = serial.serializeToString(shape);
            let url = 'data:image/svg+xml;base64,' + window.btoa(svg_xml);
            return url;
        }

        function image_load_fcn(img, unit, size, level) {
            // console.log(`drawing image ${unit} ${size} ${level}`);
            ctx.clearRect(0, 0, cnv.width, cnv.height);
            ctx.drawImage(img, 0, 0);
            var idat = ctx.getImageData(0, 0, size, size);
            gl.texImage2D(gl.TEXTURE_2D, level, gl.ALPHA, gl.ALPHA, gl.UNSIGNED_BYTE, idat);
        }


        for (let unit = 0; unit != svg_nodes.length; unit++) {
            let tex = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            let this_unit_promises = level_sizes.map(async (sz, lvl) => {
                const loaded = await new Promise((resolve, reject) => {
                    var img = new Image();
                    img.onload = () => { image_load_fcn(img, unit, sz, lvl); resolve(); }
                    img.onerror = () => reject(`Couldn't load unit ${unit} level ${lvl}`);
                    img.src = get_data_url(unit, sz); 
                });
            });
            let rv = await Promise.all(this_unit_promises);
            // console.log(rv);
        }
    }

};

export default textures;

