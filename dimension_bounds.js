
 function getTargetStitches(size, orientation) {
    switch (size) {
        case "CUSTOM":
            throw new Error("Custom sizing not implemented.");
        default:
            return SIZE_PRESETS[orientation][size] ?? SIZE_PRESETS[orientation].AUTO;
    }
}
 
 function determinePatternDimensions(maxX, minX, maxY, minY, inpChoice) {
    const glyph = getGlyphDimensions(maxX, minX, maxY, minY);

    const targetStitches = getTargetStitches(inpChoice.size, inpChoice.orientation);

    const targetRows = Math.max(1, Math.round(targetStitches * glyph.glyphPxH / glyph.glyphPxW));

    //-------------------------------------------------------
    // Debug info
    //-------------------------------------------------------

    const stitchSizeX = glyph.glyphPxW / targetStitches;
    const stitchSizeY = glyph.glyphPxH / targetRows;
    const ratio = stitchSizeX / stitchSizeY;

    console.log({
        glyphWidth: glyph.glyphPxW,
        glyphHeight: glyph.glyphPxH,
        targetRows,
        targetStitches,
        distortion: ratio
    });

    return {targetRows, targetStitches};
}

function getGlyphDimensions(maxX, minX, maxY, minY) {
    let glyphPxW = maxX - minX + 1;
    let glyphPxH = maxY - minY + 1;
    return {'glyphPxW': glyphPxW, 'glyphPxH': glyphPxH};
}

function getXYBounds(canvas, pixels){
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const brightness = getPixels(x, y, pixels, canvas);
            if (brightness < 240) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }
    return {minX, minY, maxX, maxY};
}

function computeCanvasDimensions(textPxW, textPxH, paddingPx, orientation, textLength) {
    if (orientation === ORIENTATION.HORIZONTAL) {
        return {width: textPxW + paddingPx * 2, height: textPxH + paddingPx * 2};
    }

    const charWidth = textPxW / Math.max(1, textLength);
    return {width: (textLength * textPxH) + paddingPx * 2, height: charWidth + paddingPx * 2};
}