const outputContainer = document.getElementById("outputContainer");
outputContainer.classList.add("d-none");

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("generateBtn").addEventListener("click", generatePattern);
});

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
    const metrics = ctx.measureText(text);
    let textPxW = Math.ceil(metrics.width);
    let textPxH = Math.ceil(baseFontPx * 1.2);

    const dims = computeCanvasDimensions(textPxW, textPxH, paddingPx, orientation, text.length);

    canvas.width = Math.max(10, dims.width);
    canvas.height = Math.max(10, dims.height);
    const ctx2 = canvas.getContext("2d");
    drawTextToCanvas(ctx2, text, paddingPx, orientation);

    return { ctx2, paddingPx };
}

function rasterize(ctx2, canvasW, canvasH) {
    const img = ctx2.getImageData(0, 0, canvasW, canvasH);
    return img.data;
}

function buildCells(pixels, canvas, minX, minY, maxX, maxY, targetRows, targetStitches) {
    const glyphPxW = maxX - minX + 1;
    const glyphPxH = maxY - minY + 1;

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
    const makeBufferCell = () => ({stitch: "K", region: "Buffer"});
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

    for (const ch of text) {
        const glyph = buildGlyphBitmap(ch, ctx.font, fontSize);
        ctx.save();

        ctx.translate(destX, paddingPx + glyph.width);

        ctx.rotate(-Math.PI / 2);
        ctx.drawImage(glyph.canvas, 0, 0);
        ctx.restore();

        destX += glyph.height;
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

function formatRegion(region, compressed) {
    switch (region) {
        case "leftBorder":
            return `Left Border: (${compressed})`;
        case "rightBorder":
            return `Right Border: (${compressed})`;
        case "topBorder":
            return `Top Border: (${compressed})`;
        case "bottomBorder":
            return `Bottom Border: (${compressed})`;
        case "body":
            return `Body(${compressed})`;
        default:
            return `${region}: (${compressed})`;
    }
}
