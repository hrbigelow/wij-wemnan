define({
    
    // create attributes for N points, to be pushed to webGL
    plotConfig: {
        minSize: 3,
        sizeFactor: 30,
        nShapes: 3,
        xmin: -100,
        xmax: 520,
        ymin: -320,
        ymax: 9000,
        zmin: 0,
        zmax: 1,
        randomSize: function(rand) { return rand * this.sizeFactor + this.minSize },
        randomTexture: function(rand) { return Math.floor(rand * this.nShapes) },
        randomPos: function() { 
            var r1 = Math.rand(),
            r2 = Math.rand(),
            r3 = Math.rand();
            return {
                x: this.xmin + r1 * (this.xmax - this.xmin),
                y: this.ymin + r2 * (this.ymax - this.ymin),
                z: this.zmin + r3 * (this.zmax - this.zmin)
            }
        }
        
    },
    
    // generate attributes for a certain number of points
    // the attributes will be interleaved as:
    // [ x, y, z, r, g, b, a, t, s]
    // x, y, z are spatial coordinates
    // r, g, b, a are color
    // t is the texture
    // s is the size of the point
    randomPoints: function(nPoints) {
        var n = nPoints * 9,
        attr = new Float32Array(n), 
        p,
        pos,
        c = this.plotConfig;

        for (p = 0; p != n; p += 9) {
            pos = c.randomPos();
            attr[p] = pos.x;
            attr[p+1] = pos.y; // y
            attr[p+2] = pos.z; // z
            attr[p+3] = Math.random(); // r
            attr[p+4] = Math.random(); // g
            attr[p+5] = Math.random(); // b
            attr[p+6] = Math.random(); // a
            attr[p+7] = c.randomTexture(Math.random()); // texture (t)
            attr[p+8] = c.randomSize(Math.random()); // size (s)

        }
        return attr;
    }
});
