function ribStitch(stitch, width) {
    return (Math.floor(stitch / width) % 2 === 0) ? "K" : "P";
}

function rib1x1Stitch(stitch) {
    return ribStitch(stitch, 1);
}

function rib2x2Stitch(stitch) {
    return ribStitch(stitch, 2)
}

function garterStitch() {
    return "K"
}

function stockinetteStitch(col) {
    return (col % 2 === 0) ? "K" : "P";
}



function seedStitch(row, col) {
    return ((row + col) % 2 === 0) ? "K" : "P";
}