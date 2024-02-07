/**
 * @param {number[][]} a
 * @param {number[][]} b
 * @returns {number} return -1 when out of order, 0 when equal, and 1 when in correct order
 */
function compareMatrix(a, b) {
    // Smaller matrix come first
    if(a.length != b.length) return a.length < b.length ? 1 : -1;
    if(a[0].length != b[0].length) return a[0].length < b[0].length ? 1 : -1;

    const height = a.length;
    const width = a[0].length;
    for(var y = 0; y < height; y++) {
        const aRow = a[y];
        const bRow = b[y];
        for(var x = 0; x < width; x++) {
            const aVal = aRow[x];
            const bVal = bRow[x];
            if(aVal === bVal) continue;
            return aVal < bVal ? 1 : -1;
        }
    }
    return 0;
}

function multiplyMatrix(a, b) {
    const height = a.length;
    const width = b[0].length;
    const c = [];
    for(var i = 0; i < height; i++) {
        c[i] = [];
        for(var j = 0; j < height; j++) {
            var sum = 0;
            const len = a[i].length;
            for(var k = 0; k < len; k++) {
                sum += a[i][k] * b[k][j];
            }
            c[i][j] = sum;
        }
    }
    return c;
}

