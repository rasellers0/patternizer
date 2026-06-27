const outputContainer = document.getElementById("outputContainer");
outputContainer.classList.add("d-none");

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("generateBtn").addEventListener("click", generatePattern);
});

// function transposeCells(cells) {
//     const rows = cells.length;
//     const cols = cells[0].length;
//     const result = Array.from( { length: cols }, () => Array(rows));
//     for (let r = 0; r < rows; r++) {
//         for (let c = 0; c < cols; c++) {
//             result[c][r] = cells[r][c];
//         }
//     }

//     return result;
// }

function renderColoredPattern(el, chart) {
    if (!chart || !chart.length) {
        el.innerHTML = "";
        return;
    }

    let html = "";
    for (let r = 0; r < chart.length; r++) {
        const row = chart[r];
        html += `<div class="pattern-row">`;
        for (let c = 0; c < row.length; c++) {
            const cell = row[c];
            const stitch = cell?.stitch ?? "K";
            const region = cell?.region ?? "body";
            const stitchClass = stitch === "K" ? "k" : "p";

            let regionClass = "";
            if (region === "leftBorder") regionClass = " border-left";
            if (region === "rightBorder") regionClass = " border-right";
            if (region === "topBorder") regionClass = " border-top";
            if (region === "bottomBorder") regionClass = " border-bottom";

            html += `<span class="${stitchClass}${regionClass}">${stitch}</span>`;
        }
        html += `</div>`;
    }
    return html;
}

function validateInput(text, warningEL, instructionsEL) {
    if (!text) {
        warningEL.style.display = "block";
        warningEL.textContent = "Input cannot be empty.";
        instructionsEL.innerHTML = "<li>Please enter text to generate a pattern.</li>";
        outputContainer.classList.remove("d-none");
        return false;
    }
    return true;
}

function buildCanvas(ctx, canvas, text, baseFontPx, orientation) {
    const fontSpec = `bold ${baseFontPx}px monospace`;
    ctx.font = fontSpec;
    const paddingPx = 20;
    // const transform = getCanvasTransform(orientation, baseFontPx);
    const metrics = ctx.measureText(text);
    let textPxW = Math.ceil(metrics.width);
    let textPxH = Math.ceil(baseFontPx * 1.2);

    // const dims = computeCanvasDimensions(textPxW, textPxH, paddingPx, transform);
    const dims = computeCanvasDimensions(textPxW, textPxH, paddingPx, orientation, text.length);

    canvas.width = Math.max(10, dims.width);
    canvas.height = Math.max(10, dims.height);
    const ctx2 = canvas.getContext("2d");
    drawTextToCanvas(ctx2, text, paddingPx, orientation);
    // drawTextToCanvas(ctx2, text, paddingPx, transform);

    return { ctx2, paddingPx };
}

function rasterize(ctx2, canvasW, canvasH) {
    const img = ctx2.getImageData(0, 0, canvasW, canvasH);
    return img.data;
}

function buildCells(pixels, canvas, minX, minY, maxX, maxY, targetRows, targetStitches) {
    const glyphPxW = maxX - minX + 1;
    const glyphPxH = maxY - minY + 1;

    console.log({
        glyphPxW: glyphPxW,
        glyphPxH: glyphPxH,
        targetRows: targetRows,
        targetStitches: targetStitches
    });

    const threshold = 128;
    const cells = Array.from({ length: targetRows }, () => new Array(targetStitches).fill(false));

    for (let r = 0; r < targetRows; r++) {
        const y0 = Math.floor(minY + (r / targetRows) * glyphPxH);
        const y1 = Math.ceil(minY + ((r + 1) / targetRows) * glyphPxH);

        for (let c = 0; c < targetStitches; c++) {
            const x0 = Math.floor(minX + (c / targetStitches) * glyphPxW);
            const x1 = Math.ceil(minX + ((c + 1) / targetStitches) * glyphPxW);
            let sum = 0, count = 0;

            let foundDark = false;
            for (let y = y0; y < y1 && !foundDark; y++) {
                for (let x = x0; x < x1; x++) {
                    if (getPixels(x, y, pixels, canvas) < threshold) {
                        foundDark = true;
                        break;
                    }
                }
            }

            cells[r][c] = foundDark;

            // for (let y = y0; y < y1; y++) {
            //     for (let x = x0; x < x1; x++) {
            //         sum += getPixels(x, y, pixels, canvas);
            //         count++;
            //     }
            // }

            // const avg = count ? sum / count : 255;
            // cells[r][c] = avg < threshold;
        }
    }
    return { cells, glyphPxW, glyphPxH };
}

function getPixels(x, y, pixels, canvas){
    const idx = (y * canvas.width + x) * 4;
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];
    const sum = (r + g + b) / 3;
    return sum;

}

function buildChart(cells, invert) {
    const stitchFor = (bit) => bit ? (invert ? "K" : "P") : (invert ? "P" : "K");
    return cells.map(row => row.map(bit => ({stitch: stitchFor(bit), region: "body"})));
}

function addBuffer(chart, buffer = 2) {
    if (!chart.length) return chart;
    const width = chart[0].length;
    const makeBufferCell = () => ({stitch: "K", region: "buffer"});
    const makeBufferRow = () => Array(width + buffer * 2).fill(null).map(makeBufferCell);
    const paddedRows = chart.map(row => {
        const side = Array(buffer).fill(null).map(makeBufferCell);
        return [...side, ...row, ...side];
    });

    const topBottom = Array(buffer).fill(null).map(makeBufferRow);
    return [...topBottom, ...paddedRows, ...topBottom];
}

function renderPipeline(chart, el) {
    el.innerHTML = renderColoredPattern(el, chart);
}

function doReset(el){
    el.warningEL.style.display = "none";
    el.warningEL.textContent = "";
    el.instructionsEL.innerHTML = "";
    el.patternEL.innerHTML = "";
    el.notesEL.textContent = "";
}

function map_pixels(canvas, inp){
    const ctx = canvas.getContext("2d");
    const baseFontPx = 200;

    const { ctx2 } = buildCanvas(ctx, canvas, inp.text, baseFontPx, inp.orientation);
    const pixels = rasterize(ctx2, canvas.width, canvas.height);
    return pixels
}

function generatePattern() {
    const inp = getInputSettings();
    const el = getElementSettings();
    const bs = getBorderSettings();

    doReset(el);
    if (!validateInput(inp.text, el.warningEL, el.instructionsEL)) return;
    
    const canvas = document.getElementById("hiddenCanvas");
    const pixels = map_pixels(canvas, inp)

    const { maxX, minX, maxY, minY } = getXYBounds(canvas, pixels);

    // const dims = determinePatternDimensions(maxX, minX, maxY, minY, inp, el.warningEL);
    
    // const t_rows = (inp.orientation === ORIENTATION.VERTICAL ? dims.targetStitches : dims.targetRows);
    // const t_stitches = (inp.orientation === ORIENTATION.VERTICAL ? dims.targetRows : dims.targetStitches);

    // const glyph = buildCells(pixels, canvas, minX, minY, maxX, maxY, t_rows, t_stitches);

    // // const glyph = buildCells(pixels, canvas, minX, minY, maxX, maxY, dims.targetRows, dims.targetStitches);

    const dims = determinePatternDimensions(maxX, minX, maxY, minY, inp);
    const glyph = buildCells(pixels, canvas, minX, minY, maxX, maxY, dims.targetRows, dims.targetStitches);

    const chart = addBuffer(buildChart(glyph.cells, inp.invert), 2);
    const chartWithBorders = buildChartWithBorders(chart, bs)

    const instructions = buildInstructions(chartWithBorders);
    instructions.push("<strong>Bind off all stitches, you're done!</strong>");
    el.instructionsEL.innerHTML = instructions.join("<br>");
    renderPipeline(chartWithBorders, el.patternEL);

    el.notesEL.textContent = "Pattern generated successfully.";
    outputContainer.classList.remove("d-none");
}

function buildChartWithBorders(chart, bs){
    const selectedValues = Object.fromEntries(
        Array.from(bs.borderSelected).map(cb => [cb.name || cb.id, cb.value === 'on' ? true : false])
    );
    const borderSettings = Object.fromEntries(
        Array.from(bs.borderControls).map(select => [select.name || select.id, select.value])
    );

    const chartWithBorders = applyBorders(chart, {...selectedValues, ...borderSettings, borderEnabled: bs.borderEnabled});
    return chartWithBorders;
}

// function getCanvasTransform(orientation, baseFontPx) {
//     if (orientation === ORIENTATION.HORIZONTAL) {
//         return {rotate: 0, translateX: 0, translateY: 0, swapDimensions: false};
//     }
//     return {rotate: -Math.PI / 2, translateX: 0, translateY: 0, swapDimensions: true};
// }

function getCanvasTransform(orientation) {
    return {
        orientation
    };
}

function drawTextToCanvas(ctx, text, paddingPx, orientation) {
    const fontSize = 200;

    ctx.save();

    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = "black";

    if (orientation === ORIENTATION.HORIZONTAL) {
        ctx.textBaseline = "top";
        ctx.fillText(text, paddingPx, paddingPx);
        ctx.restore();
        return;
    }

    drawVerticalText(ctx, text, paddingPx, fontSize);

    ctx.restore();
    debugCanvas(ctx);
}

function debugCanvas(ctx){
    const url = ctx.canvas.toDataURL();
    const img = new Image();
    img.src = url;
    document.body.appendChild(img);
}

function debugCanvasScaling(ctx) {
    const canvas = ctx.canvas;

    console.log("CSS size:");
    console.log(canvas.clientWidth, canvas.clientHeight);

    console.log("Bitmap size:");
    console.log(canvas.width, canvas.height);

    console.log("DevicePixelRatio:");
    console.log(window.devicePixelRatio);
}

function drawVerticalText(ctx, text, paddingPx, fontSize) {
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = "black";

    // Measure one monospace character.
    const metrics = ctx.measureText("M");
    const glyphWidth = Math.ceil(metrics.width);
    const glyphHeight = Math.ceil(fontSize * 1.2);

    // Offscreen canvas large enough for one glyph.
    const glyphCanvas = document.createElement("canvas");
    glyphCanvas.width = glyphWidth;
    glyphCanvas.height = glyphHeight;

    const glyphCtx = glyphCanvas.getContext("2d");
    glyphCtx.font = ctx.font;
    glyphCtx.textBaseline = "top";

    let destX = paddingPx;
    // let destY = paddingPx;

    for (const ch of text) {
        const glyph = buildGlyphBitmap(ch, ctx.font, fontSize);
        ctx.save();

        ctx.translate(destX, paddingPx + glyph.width);
        // ctx.translate(paddingPx, destY + glyph.width);

        ctx.rotate(-Math.PI / 2);
        ctx.drawImage(glyph.canvas, 0, 0);
        ctx.restore();

        destX += glyph.height;
        // destY += glyph.height;
    }
}

function buildGlyphBitmap(ch, fontSpec, fontSize) {
    const canvas = document.createElement("canvas");

    const measureCtx = canvas.getContext("2d");
    measureCtx.font = fontSpec;

    const glyphWidth = Math.ceil(measureCtx.measureText(ch).width);
    const glyphHeight = Math.ceil(fontSize * 1.2);

    canvas.width = glyphWidth;
    canvas.height = glyphHeight;

    const ctx = canvas.getContext("2d");

    ctx.font = fontSpec;
    ctx.textBaseline = "top";

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "black";
    ctx.fillText(ch, 0, 0);

    return {canvas, width: glyphWidth, height: glyphHeight};
}

// function drawVerticalText(ctx, text, x, fontSize) {
//     debugCanvasScaling(ctx);

//     ctx.textBaseline = "top";
//     const advance = fontSize;
//     let y = x;

//     for (const ch of text) {
//         ctx.save();
//         ctx.translate(x, y);
//         ctx.rotate(-Math.PI / 2);
//         ctx.fillText(ch, 0, 0);

//         ctx.restore();

//         y += advance;
//     }
// }

// function drawTextToCanvas(ctx, text, paddingPx, orientation) {
//     ctx.save();

//     const fontSize = 200;
//     ctx.font = `bold ${fontSize}px monospace`;
//     ctx.fillStyle = "white";
//     ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
//     ctx.fillStyle = "black";
//     ctx.textBaseline = "alphabetic";

//     if (orientation === ORIENTATION.HORIZONTAL) {
//         ctx.fillText(text, paddingPx, paddingPx);
//         ctx.restore();
//         return;
//     }
//     ctx = drawVerticalText(paddingPx, text, ctx, fontSize);
//     ctx.restore();
// }

// function drawVerticalText(paddingPx, text, ctx, fontSize ){
//     let x = paddingPx;
//     for (const ch of text) {
//         const m = ctx.measureText(ch);
//         const ascent = m.actualBoundingBoxAscent ?? fontSize * 0.8;
//         const descent = m.actualBoundingBoxDescent ?? fontSize * 0.2;
//         const charHeight = ascent + descent;
//         ctx.save();

//         ctx.translate(x, paddingPx + ascent);
//         ctx.rotate(-Math.PI / 2);
//         ctx.fillText(ch, 0, 0);

//         ctx.restore();
//         const advance = m.width ?? fontSize * 0.9;
//         x += advance;
//     }
//     return ctx
// }

// function drawTextToCanvas(ctx, text, paddingPx, orientation) {
//     ctx.save();
//     const baseFontPx = 200;
//     const fontSpec = `bold ${baseFontPx}px monospace`;
//     ctx.font = fontSpec;
//     ctx.fillStyle = "white";
//     ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
//     ctx.fillStyle = "black";
//     ctx.textBaseline = "top";

//     if (orientation === ORIENTATION.HORIZONTAL) {
//         ctx.fillText(text, paddingPx, paddingPx);
//     } else {
//         const charMetrics = ctx.measureText("M");
//         const charAdvance = Math.ceil(baseFontPx * 0.9);
//         let x = paddingPx;
//         for (const ch of text) {
//             ctx.save();
//             ctx.translate(x, paddingPx + baseFontPx);
//             ctx.rotate(-Math.PI / 2);
//             ctx.fillText(ch, 0, 0);
//             ctx.restore();
//             // x += charAdvance;
//             x += ctx.measureText(ch).width;
//         }
//     }
//     ctx.restore();
// }

// function drawTextToCanvas(ctx, text, paddingPx, transform) {
//     ctx.save();

//     const baseFontPx = 200;
//     const fontSpec = `bold ${baseFontPx}px monospace`;
//     ctx.font = fontSpec;

//     ctx.fillStyle = "white";
//     ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
//     ctx.fillStyle = "black";
//     ctx.textBaseline = "top";
//     ctx.translate(paddingPx, paddingPx);

//     if (transform.rotate !== 0) {ctx.rotate(transform.rotate);}

//     ctx.fillText(text, 0, 0);
//     ctx.restore();
// }

function formatRegion(region, compressed) {
    switch (region) {
        case "leftBorder":
            return `Left Border(${compressed})`;
        case "rightBorder":
            return `Right Border(${compressed})`;
        case "topBorder":
            return `Top Border(${compressed})`;
        case "bottomBorder":
            return `Bottom Border(${compressed})`;
        case "body":
            return `Body(${compressed})`;
        default:
            return `${region}(${compressed})`;
    }
}
