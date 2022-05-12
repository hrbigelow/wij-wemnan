import * as glUtils from './webgl_utils';
import glyph_xml_string from './glyphs.xml';

// console.log('glyphs: ', glyph_xml_string)

// managing textures
// for each image, create a mipmapped texture and store it in 'point_shapes'
// also create one
var textures = {
    int32: null,
    point_shapes: [],
    user_selection: null,
    user_selection_unit: null,

    init: function(gl) {
        var point_shapes = this.point_shapes;

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
        var idat = null;
        var svg_xml = null;
        var shape = null;

        this.int32 = new Int32Array(svg_nodes.length);
        for (var i = 0; i != svg_nodes.length; i += 1) { this.int32[i] = i; }

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        function image_load_fcn(img, unit, size, level) {
            return function() {
                ctx.clearRect(0, 0, cnv.width, cnv.height);
                ctx.drawImage(img, 0, 0);
                var idat = ctx.getImageData(0, 0, size, size);
                gl.activeTexture(gl.TEXTURE0 + unit);
                gl.texImage2D(gl.TEXTURE_2D, level, gl.ALPHA, gl.ALPHA, gl.UNSIGNED_BYTE, idat);
            };
        }

        for (var unit = 0; unit != svg_nodes.length; unit++) {
            shape = svg_nodes.item(unit);
            point_shapes[unit] = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, point_shapes[unit]);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            
            level_sizes.forEach(function (sz, lvl) {
                var ratio = sz / shape.width.baseVal.value;
                shape.width.baseVal.value = sz;
                shape.height.baseVal.value = sz;

                // hack for resizing polygon points.  assume only one polygon element in this shape
                // assume the polygon is sized at 256 x 256
                var poly = shape.getElementsByTagName('polygon')[0];
                if (poly) {
                    for (var i = 0; i != poly.points.numberOfItems; i++) {
                        poly.points.getItem(i).x *= ratio;
                        poly.points.getItem(i).y *= ratio;
                    }
                }

                svg_xml = serial.serializeToString(shape);
                var img = new Image();
                img.onload = image_load_fcn(img, unit, sz, lvl);
                img.src = 'data:image/svg+xml;base64,' + window.btoa(svg_xml);
            });
        }
                
        this.user_selection_unit = this.int32.length;
        this.user_selection = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + this.user_selection_unit);
        gl.bindTexture(gl.TEXTURE_2D, this.user_selection);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

};
    
export default textures;

