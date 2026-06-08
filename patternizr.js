const PRESETS = {
    small: 20,
    medium: 30,
    large: 40,
    xlarge: 60
};


const ORIENTATION = {
    HORIZONTAL: "horizontal",
    VERTICAL: "vertical"
};

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

function debugStep(name, data) {
    console.log(`[generatePattern] ${name}`, data || "");
}

function validateInput(text, warningEL, instructionsEL) {
    if (!text) {
        instructionsEL.innerHTML = "<li>Please enter text to generate a pattern.</li>";
        return false;
    }

    // if (text === "MAGA") {
    //     warningEL.style.display = "block";
    //     warningEL.textContent = "No. Fuck you.";
    //     return false;
    // }

    // const dirtyWords = ["ASS", "FUCK", "DAMN", "SHIT", "BALLS"];
    // if (dirtyWords.includes(text)) {
    //     warningEL.style.display = "block";
    //     warningEL.textContent = "What are you, thirteen? Fine, whatever.";
    // }

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

function buildCells(pixels, canvasW, canvasH, minX, minY, maxX, maxY, targetRows,targetStitches) {
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
                    const idx = (y * canvasW + x) * 4;
                    const rpx = pixels[idx];
                    const gpx = pixels[idx + 1];
                    const bpx = pixels[idx + 2];
                    sum += (rpx + gpx + bpx) / 3;
                    count++;
                }
            }
            const avg = count ? sum / count : 255;
            cells[r][c] = avg < threshold;
        }
    }
    return { cells, glyphPxW, glyphPxH };
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


function determinePatternDimensions(glyphPxW, glyphPxH, wChoice, hChoice, warningEL) {
    let targetStitches = wChoice && PRESETS[wChoice] ? PRESETS[wChoice].width : null;
    let targetRows = hChoice && PRESETS[hChoice] ? PRESETS[hChoice].height : null;
    const defaultStitches = 30;
    const defaultRows = Math.round((glyphPxH / glyphPxW) * defaultStitches) || 15;
    if (!targetStitches && !targetRows) {
        targetStitches = defaultStitches;
        targetRows = defaultRows;
    } else if (targetStitches && !targetRows) {
        const stitchSizePx = glyphPxW / targetStitches;
        targetRows = Math.max(1, Math.round(glyphPxH / stitchSizePx));
    } else if (!targetStitches && targetRows) {
        const rowSizePx = glyphPxH / targetRows;
        targetStitches = Math.max(1, Math.round(glyphPxW / rowSizePx));
    }

    const stitchSizeX = glyphPxW / targetStitches;
    const stitchSizeY = glyphPxH / targetRows;
 
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


function generatePattern() {
    debugStep("start");

    const text = (document.getElementById("wordInput").value || "").trim().toUpperCase();
    const widthChoice = document.getElementById("widthPreset").value;
    const heightChoice = document.getElementById("heightPreset").value;
    const invert = !!document.getElementById("invertToggle").checked;
    const orientation = document.getElementById("orientation")?.value || "horizontal";

    const warningEL = document.getElementById("warning");
    const instructionsEL = document.getElementById("instructions");
    const patternEL = document.getElementById("patternOutput");
    const notesEL = document.getElementById("notes");

    warningEL.style.display = "none";
    warningEL.textContent = "";

    instructionsEL.innerHTML = "";
    patternEL.innerHTML = "";
    notesEL.textContent = "";

    if (!validateInput(text, warningEL, instructionsEL)) {
        debugStep("validation failed");
        return;
    }

    const canvas = document.getElementById("hiddenCanvas");
    const ctx = canvas.getContext("2d");
    const baseFontPx = 200;

    const { ctx2 } = buildCanvas(ctx, canvas, text, baseFontPx, orientation);
    debugStep("canvas built");

    const pixels = rasterize(ctx2, canvas.width, canvas.height);
    debugStep("rasterized");

    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            const brightness = (r + g + b) / 3;
            if (brightness < 240) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }
    debugStep("bounds", { minX, minY, maxX, maxY });

    glyphDimensions = getGlyphDimensions(maxX, minX, maxY, minY);
    debugStep("glyph dimensions", glyphDimensions);

    const dims = determinePatternDimensions(glyphDimensions.glyphPxW, glyphDimensions.glyphPxH, widthChoice, heightChoice, warningEL);
    const glyph = buildCells(pixels, canvas.width, canvas.height, minX, minY, maxX, maxY, dims.targetRows, dims.targetStitches);
    debugStep("cells built");

    const chart = addBuffer(buildChart(glyph.cells, invert), 2);
    debugStep("chart built");

    const borderEnable = document.getElementById("borderEnable");
    const borderSelected = document.querySelectorAll('.border-sides');
    const borderControls = document.querySelectorAll('.border-settings');

    const selectedValues = Object.fromEntries(
        Array.from(borderSelected).map(cb => [cb.name || cb.id, cb.value === 'on' ? true : false])
    );
    const borderSettings = Object.fromEntries(
        Array.from(borderControls).map(select => [select.name || select.id, select.value])
    );

    const borderOpts = {...selectedValues, ...borderSettings, borderEnabled: borderEnable.checked};
    const chartWithBorders = applyBorders(chart, borderOpts);
    debugStep("borders applied");

    const instructions = buildInstructions(chartWithBorders);
    instructions.push("<strong>Bind off all stitches, you're done!</strong>");
    instructionsEL.innerHTML = instructions.join("<br>");
    renderPipeline(chartWithBorders, patternEL);
    debugStep("render complete");

    notesEL.textContent = "Pattern generated successfully.";
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
        console.log(`Applying region: ${region.regionName} (rows ${region.startRow}-${region.endRow}, cols ${region.startCol}-${region.endCol})`);
        fillRegion(result, settings, region);
    }

    return result;
}


function splitRowByRegion(row) {
    const segments = [];
    let currentRegion = row[0].region;
    let buffer = [];

    for (const cell of row) {
        if(!cell || !cell.region){
            continue;
        }
        if (cell.region !== currentRegion) {
            segments.push({
                region: currentRegion,
                stitches: buffer
            });
            buffer = [];
            currentRegion = cell.region;
        }
        buffer.push(cell.stitch);
    }

    segments.push({
        region: currentRegion,
        stitches: buffer
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

// function readSettings() {
//     const widthChoice = document.getElementById("widthPreset").value;
//     const heightChoice = document.getElementById("heightPreset").value;
//     const orientation = document.getElementById("orientation")?.value || "horizontal";
    
//     return {
//         text: document.getElementById("wordInput").value.trim().toUpperCase(),
//         orientation: "horizontal", // default
//         invert: document.getElementById("invertToggle").checked,
//         width: PRESETS[widthChoice] || 30,
//         height: PRESETS[heightChoice] || 30,
//         borderEnabled: document.getElementById("borderEnable")?.checked ?? true,
//         borderWidth: parseInt(document.getElementById("borderWidth")?.value || "5"),
//         borderTop: document.getElementById("borderTop")?.checked ?? true,
//         borderBottom: document.getElementById("borderBottom")?.checked ?? true,
//         borderLeft: document.getElementById("borderLeft")?.checked ?? true,
//         borderRight: document.getElementById("borderRight")?.checked ?? true,
//         borderPattern: document.getElementById("borderPattern")?.value || "rib",
//     };
// }



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
    instructions.push(`<strong>Cast on ${chart[0].length} stitches.</strong>`);

    chart.forEach((row, rowIndex) => {
        const segments = splitRowByRegion(row);
        const lines = [];
        for (const seg of segments) {
            const compressed = compressStitches(seg.stitches);
            if (seg.region === "body") { lines.push(`Body(${compressed})`); }
            lines.push(formatRegion(seg.region, compressed));

            if (seg.region === "border") {
                lines.push(`Border(${compressed})`);
            }
        }

        instructions.push(
            `<strong>Row ${rowIndex + 1}:</strong><br>` +
            lines.map(l => `&nbsp;&nbsp;${l}`).join("<br>")
        );
    });

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
