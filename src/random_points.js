// create attributes for N points, to be pushed to webGL
var plotConfig = {
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
    randomPos: function(rand) { 
        return {
            x: this.xmin + rand * (this.xmax - this.xmin),
            y: this.ymin + rand * (this.ymax - this.ymin),
            z: this.zmin + rand * (this.zmax - this.zmin)
        }
    }

}

// generate attributes for a certain number of points
// the attributes will be interleaved as:
// [ x, y, z, r, g, b, a, t, s]
// x, y, z are spatial coordinates
// r, g, b, a are color
// t is the texture
// s is the size of the point
function randomPoints(nPoints) {
    var n = nPoints * 9,
    attr = new Float32Array(n), 
    p,
    pos,
    c = plotConfig;

    for (p = 0; p != n; p += 9) {
        pos = p.randomPos(Math.random());
        attr[p] = pos.x;
        attr[p+1] = pos.y; // y
        attr[p+2] = pos.z; // z
        attr[p+3] = Math.random(); // r
        attr[p+4] = Math.random(); // g
        attr[p+5] = Math.random(); // b
        attr[p+6] = Math.random(); // a
        attr[p+7] = p.randomTexture(Math.random()); // texture (t)
        attr[p+8] = p.randomSize(Math.random()); // size (s)

    }
    return attr;
}
