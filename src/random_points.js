// create attributes for N points, to be pushed to webGL
var plotConfig = {
    minSize: 3,
    sizeFactor: 5,
    nShapes: 4,
    xmin: -30,
    xmax: 500,
    ymin: -640,
    ymax: 12349,
    zmin: 0,
    zmax: 0,
    randomSize: function(rand) { return rand * this.sizeFactor + this.minSize; },
    randomTexture: function(rand) { return Math.floor(rand * this.nShapes); },
    randomPos: function() { 
        var r1 = Math.random(),
            r2 = Math.random(),
            r3 = Math.random();
        return {
            x: this.xmin + r1 * (this.xmax - this.xmin),
            y: this.ymin + r2 * (this.ymax - this.ymin),
            z: this.zmin + r3 * (this.zmax - this.zmin)
        };
    }
    
};

// generate attributes for a certain number of points
// the attributes will be interleaved as:
// [ x, y, z, r, g, b, a, t, s]
// x, y, z are spatial coordinates
// r, g, b, a are color
// t is the texture
// s is the size of the point
export default function randomPoints(plot, npoints) {
    var schema = plot.schema,
        stride = schema.pos.data.stride,
        attr = new Float32Array(npoints * stride),
        p,
        pos,
        c = plotConfig;

    
    for (p = 0; p != attr.length; p += stride) {
        pos = c.randomPos();
        
        // attr[p + schema.pos.offset] = p;
        // attr[p + schema.pos.offset + 1] = p;
        attr[p + schema.pos.offset] = pos.x;
        attr[p + schema.pos.offset + 1] = pos.y;
        attr[p + schema.pos.offset + 2] = pos.z;
        attr[p + schema.color.offset] = Math.random();
        attr[p + schema.color.offset + 1] = Math.random();
        attr[p + schema.color.offset + 2] = Math.random();
        attr[p + schema.color.offset + 3] = Math.random() / 10.0 + 0.9;
        attr[p + schema.shape.offset] = c.randomTexture(Math.random());
        attr[p + schema.size.offset] = c.randomSize(Math.random());
        attr[p + schema.selected.offset] = 0.0;

    }
    return attr;
}

