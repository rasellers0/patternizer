const PRESETS = {
    small: { width: 20, height: 12 },
    medium: { width: 30, height: 18 },
    large: { width: 40, height: 24 },
    xlarge: { width: 60, height: 36 }
};

// const PRESETS = {
//     small: { width: 20, height: 20 },
//     medium: { width: 30, height: 30 },
//     large: { width: 40, height: 40 },
//     xlarge: { width: 60, height: 60 }
// };


const ORIENTATION = {
    HORIZONTAL: "horizontal",
    VERTICAL: "vertical"
};

const outputContainer = document.getElementById("outputContainer");
outputContainer.classList.add("d-none");

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("generateBtn").addEventListener("click", generatePattern);
});

function getInputSettings() {
    widthChoice = document.getElementById("widthPreset").value;
    heightChoice = document.getElementById("heightPreset").value;

    settingsObj = {
        text: document.getElementById("wordInput").value.trim().toUpperCase(),
        orientation: document.getElementById("orientation")?.value || "horizontal",
        invert: !!document.getElementById("invertToggle").checked,
        width: widthChoice || "medium",
        height: heightChoice || "medium"
    };
    return settingsObj;
}

function getElementSettings(){
    elementSettingsObj = {
        warningEL: document.getElementById("warning"),
        instructionsEL: document.getElementById("instructions"),
        patternEL: document.getElementById("patternOutput"),
        notesEL: document.getElementById("notes")
    }
    return elementSettingsObj;
}

function getBorderSettings() {
    const borderSettings = {
        borderEnabled: document.getElementById("borderEnable")?.checked ,
        borderWidth: parseInt(document.getElementById("borderWidth")?.value || "5"),
        borderTop: document.getElementById("borderTop")?.checked ?? true,
        borderBottom: document.getElementById("borderBottom")?.checked ?? true,
        borderLeft: document.getElementById("borderLeft")?.checked ?? true,
        borderRight: document.getElementById("borderRight")?.checked ?? true,
        borderPattern: document.getElementById("borderPattern")?.value || "rib",
        borderSelected: document.querySelectorAll('.border-sides'),
        borderControls: document.querySelectorAll('.border-settings')
    };
    return borderSettings;
}

function transposeCells(cells) {
    const rows = cells.length;
    const cols = cells[0].length;

    const result = Array.from(
        { length: cols },
        () => Array(rows)
    );

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            result[c][r] = cells[r][c];
        }
    }

    return result;
}

function logCells(cells, label = "cells") {
    console.log(`=== ${label} ===`);

    const output = cells
        .map(row =>
            row.map(cell => cell ? "#" : ".").join("")
        )
        .join("\n");

    console.log(output);
}

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

function debugStep(name, data) {
    console.log(`[generatePattern] ${name}`, data || "");
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
    const transform = getCanvasTransform(orientation, baseFontPx);
    const metrics = ctx.measureText(text);
    let textPxW = Math.ceil(metrics.width);
    let textPxH = Math.ceil(baseFontPx * 1.2);

    const dims = computeCanvasDimensions(textPxW, textPxH, paddingPx, transform);

    canvas.width = Math.max(10, dims.width);
    canvas.height = Math.max(10, dims.height);
    const ctx2 = canvas.getContext("2d");
    drawTextToCanvas(ctx2, text, paddingPx, transform);

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

            for (let y = y0; y < y1; y++) {
                for (let x = x0; x < x1; x++) {
                    sum += getPixels(x, y, pixels, canvas);
                    count++;
                }
            }
            const avg = count ? sum / count : 255;
            cells[r][c] = avg < threshold;
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

function determinePatternDimensions(glyph, wChoice, hChoice, warningEL) {
    let targetStitches = wChoice && PRESETS[wChoice] ? PRESETS[wChoice].width : null;
    let targetRows = hChoice && PRESETS[hChoice] ? PRESETS[hChoice].height : null;
    const defaultStitches = 30;
    const defaultRows = Math.round((glyph.glyphPxH / glyph.glyphPxW) * defaultStitches) || 15;
    if (!targetStitches && !targetRows) {
        targetStitches = defaultStitches;
        targetRows = defaultRows;
    } else if (targetStitches && !targetRows) {
        const stitchSizePx = glyph.glyphPxW / targetStitches;
        targetRows = Math.max(1, Math.round(glyph.glyphPxH / stitchSizePx));
    } else if (!targetStitches && targetRows) {
        const rowSizePx = glyph.glyphPxH / targetRows;
        targetStitches = Math.max(1, Math.round(glyph.glyphPxW / rowSizePx));
    }

    const stitchSizeX = glyph.glyphPxW / targetStitches;
    const stitchSizeY = glyph.glyphPxH / targetRows;
 
    const ratio = stitchSizeX / stitchSizeY;
    const percentStretch = Math.max(ratio, 1 / ratio) - 1;

    const DISTORTION_THRESHOLD = 0.20;
    if (warningEL) {
        if (percentStretch > DISTORTION_THRESHOLD) {
            const pct = Math.round(percentStretch * 100);
            warningEL.style.display = "block";
            warningEL.textContent = `The requested dimensions will distort letters by ~${pct}%.`;
        } else {
            warningEL.style.display = "none";
            warningEL.textContent = "";
        }
    }
    return {targetStitches, targetRows, stitchSizeX, stitchSizeY};
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

function doReset(el){
    el.warningEL.style.display = "none";
    el.warningEL.textContent = "";
    el.instructionsEL.innerHTML = "";
    el.patternEL.innerHTML = "";
    el.notesEL.textContent = "";
}

function generatePattern() {
    const inp = getInputSettings();
    const el = getElementSettings();
    const bs = getBorderSettings();

    doReset(el);
    if (!validateInput(inp.text, el.warningEL, el.instructionsEL)) return;
    

    const canvas = document.getElementById("hiddenCanvas");
    const ctx = canvas.getContext("2d");
    const baseFontPx = 200;

    const { ctx2 } = buildCanvas(ctx, canvas, inp.text, baseFontPx, inp.orientation);
    const pixels = rasterize(ctx2, canvas.width, canvas.height);

    const { maxX, minX, maxY, minY } = getXYBounds(canvas, pixels);

    const glyphDimensions = getGlyphDimensions(maxX, minX, maxY, minY);
    const dims = determinePatternDimensions(glyphDimensions, inp.width, inp.height, el.warningEL);
    const glyph = buildCells(pixels, canvas, minX, minY, maxX, maxY, dims.targetRows, dims.targetStitches);

    const chart = addBuffer(buildChart(glyph.cells, inp.invert), 2);

    const selectedValues = Object.fromEntries(
        Array.from(bs.borderSelected).map(cb => [cb.name || cb.id, cb.value === 'on' ? true : false])
    );
    const borderSettings = Object.fromEntries(
        Array.from(bs.borderControls).map(select => [select.name || select.id, select.value])
    );

    const borderOpts = {...selectedValues, ...borderSettings, borderEnabled: bs.borderEnabled};
    const chartWithBorders = applyBorders(chart, borderOpts);

    const instructions = buildInstructions(chartWithBorders);
    instructions.push("<strong>Bind off all stitches, you're done!</strong>");
    el.instructionsEL.innerHTML = instructions.join("<br>");
    renderPipeline(chartWithBorders, el.patternEL);

    el.notesEL.textContent = "Pattern generated successfully.";
    outputContainer.classList.remove("d-none");
}

function fillRegion(result, settings, region) {
    const {startRow, endRow, startCol, endCol, regionName} = region;
    for (let r = startRow; r < endRow; r++) {
        for (let c = startCol; c < endCol; c++) {
            if (result[r][c]) continue;
            result[r][c] = {
                stitch: generateBorderStitch(regionName, r, c, settings),
                region: regionName
            };
        }
    }
}

function buildBorderRegions(rows, cols, w, settings) {
    const regions = [];
    for (const spec of BORDER_SPECS) {
        if (!settings[spec.enabledKey]) continue;
        regions.push({
            regionName: spec.name,
            startRow: spec.startRow(rows, w),
            endRow: spec.endRow(rows, w),
            startCol: spec.startCol(rows, cols, w),
            endCol: spec.endCol(rows, cols, w)
        });
    }
    return regions;
}

function applyBorders(chart, settings) {
    if (!settings.borderEnabled) return chart;

    const w = parseInt(settings.borderWidth);
    const rows = chart.length;
    const cols = chart[0].length;

    const newRows = rows + (settings.borderTop ? w : 0) + (settings.borderBottom ? w : 0);
    const newCols = cols + (settings.borderLeft ? w : 0) + (settings.borderRight ? w : 0);

    const result = Array.from({ length: newRows }, () => Array.from({ length: newCols }, () => null));

    const rowOffset = settings.borderTop ? w : 0;
    const colOffset = settings.borderLeft ? w : 0;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            rowIndex = r + parseInt(rowOffset);
            colIndex = c + parseInt(colOffset);
            result[rowIndex][colIndex] = chart[r][c];
        }
    }

    const regions = buildBorderRegions(newRows, newCols, w, settings);
    for (const region of regions) {
        fillRegion(result, settings, region);
    }

    return result;
}

function getChartColumn(chart, columnIndex) {
    return chart.map(row => row[columnIndex]);
}

function splitRowByRegion(cells) {
    if (!cells.length) return [];
    const segments = [];
    let currentRegion = cells[0].region;
    let buffer = [];
    for (const cell of cells) {
        if (!cell) continue;
        const region = cell.region || "body";
        if (region !== currentRegion) {
            segments.push({
                region: currentRegion,
                stitches: [...buffer]
            });
            buffer = [];
            currentRegion = region;
        }
        buffer.push(cell.stitch);
    }

    segments.push({
        region: currentRegion,
        stitches: [...buffer]
    });

    return segments;
}

function generateBorderStitch(region, r, c, settings) {
    const pattern = settings.borderPattern;
    if (pattern === "rib") { return ribStitch(region, r, c);}
    return "K";
}

function ribStitch(region, r, c) {
    if (region === "topBorder" || region === "bottomBorder") {
        return (r % 2 === 0) ? "K" : "P";
    }
    if (region === "leftBorder" || region === "rightBorder") {
        return (r % 2 === 0) ? "K" : "P";
    }
    return "K";
}

function getCanvasTransform(orientation, baseFontPx) {
    if (orientation === ORIENTATION.HORIZONTAL) {
        return {rotate: 0, translateX: 0, translateY: 0, swapDimensions: false};
    }
    return {rotate: -Math.PI / 2, translateX: 0, translateY: 0, swapDimensions: true};
}

function computeCanvasDimensions(textPxW, textPxH, paddingPx, transform) {
    if (!transform.swapDimensions) {
        return {width: textPxW + paddingPx * 2, height: textPxH + paddingPx * 2};
    }
    return {width: textPxH + paddingPx * 2, height: textPxW + paddingPx * 2};
}

function drawTextToCanvas(ctx, text, paddingPx, transform) {
    ctx.save();

    const baseFontPx = 200;
    const fontSpec = `bold ${baseFontPx}px monospace`;
    ctx.font = fontSpec;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "black";
    ctx.textBaseline = "top";
    ctx.translate(paddingPx, paddingPx);

    if (transform.rotate !== 0) {ctx.rotate(transform.rotate);}

    ctx.fillText(text, 0, 0);
    ctx.restore();
}

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

function buildInstructions(chart) {
    const instructions = [];
    instructions.push(`<strong>Cast on ${chart.length} stitches.</strong>`);
    for (let col = 0; col < chart[0].length; col++) {
        const knittingRow = getChartColumn(chart, col);
        const segments = splitRowByRegion(knittingRow);
        const lines = [];
        for (const seg of segments) {
            const compressed = compressStitches(seg.stitches);
            if (seg.region === "body") {
                lines.push(`Body(${compressed})`);
            } else {
                lines.push(formatRegion(seg.region, compressed));
            }
        }

        instructions.push(
            `<strong>Row ${col + 1}:</strong><br>` +
            lines.map(l => `&nbsp;&nbsp;${l}`).join("<br>")
        );
    }

    return instructions;
}

function compressStitches(stitches) {
    if (!stitches.length) return "";

    let result = [];
    let current = stitches[0];
    let count = 1;
    for (let i = 1; i < stitches.length; i++) {
        if (stitches[i] === current) {
            count++;
        } else {
            result.push(`${current}${count}`);
            current = stitches[i];
            count = 1;
        }
    }
    result.push(`${current}${count}`);
    return result.join(", ");
}
