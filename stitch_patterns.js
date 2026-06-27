function ribStitch(region, r, c) {
    if (region === "topBorder" || region === "bottomBorder") {
        return (r % 2 === 0) ? "K" : "P";
    }
    if (region === "leftBorder" || region === "rightBorder") {
        return (r % 2 === 0) ? "K" : "P";
    }
    return "K";
}