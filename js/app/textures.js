// managing textures
define([
    'app/webgl_utils'
], function(glUtils) {

    // var source_images = ['img/circle.png',
    //                      'img/triangle.png',
    //                      'img/square.png'];

    var source_images = ['img/circle.svg',
                         'img/triangle.svg',
                         'img/square.svg'];

    var int32 = new Int32Array(source_images.length);
        for (var i = 0; i != source_images.length; i += 1) { int32[i] = i; }

    // for each image, create a mipmapped texture and store it in 'point_shapes'
    // also create one
    return {
        int32: int32,
        point_shapes: [],
        user_selection: undefined,
        user_selection_unit: undefined,

        init: function(gl) {
            var point_shapes = this.point_shapes;

            source_images.forEach(function (img_file, ind) {
                var img = new Image();
                img.onload = function() {
                    point_shapes[ind] = gl.createTexture();
                    gl.activeTexture(gl.TEXTURE0 + ind);
                    gl.bindTexture(gl.TEXTURE_2D, point_shapes[ind]);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                    // gl.generateMipmap(gl.TEXTURE_2D);
                    console.log(img.height + " by " + img.width);
                };
                img.src = img_file;
            });

            this.user_selection_unit = source_images.length;
            this.user_selection = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0 + this.user_selection_unit);
            gl.bindTexture(gl.TEXTURE_2D, this.user_selection);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

    };
        
});

