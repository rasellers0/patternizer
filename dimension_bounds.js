
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

    // const targetStitches = SIZE_PRESETS[inpChoice.size] ?? SIZE_PRESETS.AUTO;
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
 
 
 
//  function determinePatternDimensions(maxX, minX, maxY, minY, inpChoice, warningEL) {
//     const glyph = getGlyphDimensions(maxX, minX, maxY, minY);

//     let targetStitches = inpChoice.width && PRESETS[inpChoice.width] ? PRESETS[inpChoice.width].width : null;
//     let targetRows = inpChoice.height && PRESETS[inpChoice.height] ? PRESETS[inpChoice.height].height : null;
//     const defaultStitches = 30;
//     const defaultRows = Math.round((glyph.glyphPxH / glyph.glyphPxW) * defaultStitches) || 15;
//     if (!targetStitches && !targetRows) {
//         targetStitches = defaultStitches;
//         targetRows = defaultRows;
//     } else if (targetStitches && !targetRows) {
//         const stitchSizePx = glyph.glyphPxW / targetStitches;
//         targetRows = Math.max(1, Math.round(glyph.glyphPxH / stitchSizePx));
//     } else if (!targetStitches && targetRows) {
//         const rowSizePx = glyph.glyphPxH / targetRows;
//         targetStitches = Math.max(1, Math.round(glyph.glyphPxW / rowSizePx));
//     }

//     const stitchSizeX = glyph.glyphPxW / targetStitches;
//     const stitchSizeY = glyph.glyphPxH / targetRows;
 
//     const ratio = stitchSizeX / stitchSizeY;
//     const percentStretch = Math.max(ratio, 1 / ratio) - 1;

//     const DISTORTION_THRESHOLD = 0.20;
//     if (warningEL) {
//         if (percentStretch > DISTORTION_THRESHOLD) {
//             const pct = Math.round(percentStretch * 100);
//             warningEL.style.display = "block";
//             warningEL.textContent = `The requested dimensions will distort letters by ~${pct}%.`;
//         } else {
//             warningEL.style.display = "none";
//             warningEL.textContent = "";
//         }
//     }
//     return {targetStitches, targetRows, stitchSizeX, stitchSizeY};
// }

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

// function computeCanvasDimensions(textPxW, textPxH, paddingPx, transform) {
//     if (!transform.swapDimensions) {
//         return {width: textPxW + paddingPx * 2, height: textPxH + paddingPx * 2};
//     }
//     return {width: textPxH + paddingPx * 2, height: textPxW + paddingPx * 2};
// }

function computeCanvasDimensions(textPxW, textPxH, paddingPx, orientation, textLength) {
    if (orientation === ORIENTATION.HORIZONTAL) {
        return {width: textPxW + paddingPx * 2, height: textPxH + paddingPx * 2};
    }

    const charWidth = textPxW / Math.max(1, textLength);
    return {width: (textLength * textPxH) + paddingPx * 2, height: charWidth + paddingPx * 2};
}