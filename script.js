document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("generateBtn").addEventListener("click", () => {
            const textRows = {};
            document.querySelectorAll(".forminput").forEach(input => {textRows[input.name] = input.value;});
            generatePatternWithBorders(textRows);
        });

});
const PRESETS = {
    small: { width: 40, height: 10 },
    medium: { width: 60, height: 15 },
    large: { width: 80, height: 20 },
    xlarge: { width: 100, height: 25 }
};

function getBorderOptions(){
    return {
    top: document.getElementById("borderTop").checked,
    bottom: document.getElementById("borderBottom").checked,
    left: document.getElementById("borderLeft").checked,
    right: document.getElementById("borderRight").checked,
    width: parseInt(document.getElementById("borderWidth").value, 10),
    pattern: document.getElementById("borderPattern").value
  };
}

function addBorderToChart(chart, options, invert=false){
    const {top, bottom, left, right, width, pattern} = options;
    const newChart = [];
    const rows = chart.length;
    const cols = chart[0].length;
    function ribAt(rowIndex, colIndex){
        let val = (rowIndex + colIndex) % 2 === 0 ? "K" : "P";
        if(invert){val = (val === "K" ? "P" : "K");}
        return val;
    }
    if (top){
        for (let r = 0; r < width; r++) {
            const row = [];
            const totalCols = cols + (left ? width : 0) + (right ? width : 0);
            for (let c = 0; c < totalCols; c++) {row.push(ribAt(r, c));}
            newChart.push(row)
        }
    }
    for (let r = 0; r < rows; r++){
        const row = [];
        if(left) {
            for (let c = 0; c < width; c++) {row.push(ribAt(r, c));}
        }
        row.push(...chart[r]);
        if(right) {
            for (let c = 0; c < width; c++) {row.push(ribAt(r, c));}
        }
        newChart.push(row);
    }
    if(bottom) {
        for (let r = 0; r < width; r++) {
            const row = [];
            const totalCols = cols + (left ? width : 0) + (right ? width : 0);
            const rowIndex = rows + r;
            for (let c = 0; c < totalCols; c++) {row.push(ribAt(rowIndex, c));}
            newChart.push(row)
        }
    }
    return newChart;
}

function buildInstructionsWithBorders(chart, invert=false) {
    const instructions = [];
    const totalRows = chart.length;
    const totalCols = chart[0].length;

    instructions.push(`<strong>Cast on ${totalCols} stitches.</strong>`);
    for (let r = 0; r < totalRows; r++) {
        const row = chart[r];
        const sideLabel = (r % 2 === 0) ? "RS" : "WS";
        const mainStart = r < options.width || r >= totalRows - options.width ? 0 : options.width;
        const mainEnd =   r < options.width || r >= totalRows - options.width ? totalCols : totalCols - options.width;
        const leftBorder = row.slice(0, mainStart).join("");
        const main = row.slice(mainStart, mainEnd).join("");
        const rightBorder = row.slice(mainEnd).join("");

        let rowInstruction = `<strong>Row {r+1} (${sideLabel}):</strong>`;
        if (leftBorder) {
            rowInstruction += `[${leftBorder}] , `;
        }
        rowInstruction += main;
        if(rightBorder) {
            rowInstruction += ` , [${rightBorder}]`
        }
        instructions.push(rowInstruction);

    }
    instructions.push(`<strong>Bind off all stitches. You're done!</strong>`);
    return instructions;
}

function generatePatternWithBorders(textRows) {
    let grid = rasterizeTextToCells(textRows);
    let borderOpts = {thickness: 5, pattern: "rib", invert: true}
    grid = applyBorderToGrid(grid, borderOpts);

    const formattedText = formatGridWithLabels(grid);

    const instructionsEL = document.getElementById("instructions");
    instructionsEL.innerHTML = formattedText.join("<br>");

    return grid;

}


// function generatePattern() {
//     const text = (document.getElementById("wordInput").value || "").trim().toUpperCase();
//     if (!text) {
//         return;
//     }

//     const widthChoice = document.getElementById("widthPreset").value;
//     const heightChoice = document.getElementById("heightPreset").value;
//     const invert = !!document.getElementById("invertToggle").checked;
//     const options = getBorderOptions();

//     const chart = rasterizeTextToCells(text, widthChoice, heightChoice, invert);

// }


// function generatePatternOld() {
//     const text = (document.getElementById("wordInput").value || "").trim().toUpperCase();
//     const widthChoice = document.getElementById("widthPreset").value;
//     const heightChoice = document.getElementById("heightPreset").value;

//     const invert = !!document.getElementById("invertToggle").checked;

//     const warningEL = document.getElementById("warning");
//     const instructionsEL = document.getElementById("instructions");
//     const patternEL = document.getElementById("patternOutput");
//     const notesEL = document.getElementById("notes");

//     warningEL.style.display = "none";
//     warningEL.textContent = "";

//     instructionsEL.innerHTML = "";
//     patternEL.textContent = "";
//     notesEL.textContent = "";

//     if (!text) {
//         instructionsEL.innerHTML = "<li>Please enter text to generate a pattern. </li>";
//         return;
//     }

//     if (text === 'MAGA') {
//         warningEL.style.display = "block";
//         warningEL.textContent = "No. Fuck you."
//         return;
//     }

//     let dirtyWords = ["ASS", "FUCK", "DAMN", "SHIT", "BALLS"]
//     if (dirtyWords.includes(text)) {
//         warningEL.style.display = "block";
//         warningEL.textContent = "What are you, thirteen? Fine, whatever."
//     }

//     const canvas = document.getElementById("hiddenCanvas");
//     const ctx = canvas.getContext("2d");

//     const baseFontPx = 200;
//     const fontSpec = `bold ${baseFontPx}px monospace`;
//     ctx.font = fontSpec;

//     const paddingPx = 20;
//     const metrics = ctx.measureText(text);
//     const textPxW = Math.ceil(metrics.width);
//     const textPxH = Math.ceil(baseFontPx * 1.2);

//     canvas.width = Math.max(10, textPxW + paddingPx * 2);
//     canvas.height = Math.max(10, textPxH + paddingPx * 2);

//     const ctx2 = canvas.getContext("2d");
//     ctx2.fillStyle = "white";
//     ctx2.fillRect(0, 0, canvas.width, canvas.height);
//     ctx2.fillStyle = "black";
//     ctx.font = fontSpec;
//     ctx2.textBaseline = "top";

//     ctx2.fillText(text, paddingPx, paddingPx);

//     const img = ctx2.getImageData(0, 0, canvas.width, canvas.height);
//     const pixels = img.data;
//     const canvasW = canvas.width;
//     const canvasH = canvas.height;

//     const desiredWidth = widthChoice ? PRESETS[widthChoice].width : null;
//     const desiredHeight = heightChoice ? PRESETS[heightChoice].height : null;

//     let minX = canvasW, minY = canvasH, maxX = 0, maxY = 0;
//     for (let y = 0; y < canvasH; y++) {
//         for (let x = 0; x < canvasW; x++) {
//             const idx = (y * canvasW + x) * 4;
//             const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
//             const brightness = (r + g + b) / 3;
//             if (brightness < 240) {
//                 minX = Math.min(minX, x);
//                 minY = Math.min(minY, y);
//                 maxX = Math.max(maxX, x);
//                 maxY = Math.max(maxY, y);
//             }
//         }
//     }

//     if (minX > maxX || minY > maxY) {
//         instructionsEL.innerHTML = "<li>No visible glyph detected. Try different text.</li>";
//         return;
//     }

//     const glyphPxW = maxX - minX + 1;
//     const glyphPxH = maxY - minY + 1;

//     const defaultStitches = 30;
//     const defaultRows = Math.round((glyphPxH / glyphPxW) * defaultStitches) || 15;

//     let targetStitches = desiredWidth || null;
//     let targetRows = desiredHeight || null;

//     if (!targetStitches && !targetRows) {
//         targetStitches = defaultStitches;
//         targetRows = defaultRows;
//     } else if (targetStitches && !targetRows) {
//         const stitchSizePx = glyphPxW / targetStitches;
//         targetRows = Math.max(1, Math.round(glyphPxH / stitchSizePx));
//     }

//     const stitchSizeX = glyphPxW / targetStitches;
//     const stitchSizeY = glyphPxH / targetRows;

//     const ratio = stitchSizeX / stitchSizeY;
//     const percentStretch = (Math.max(ratio, 1 / ratio) - 1);

//     const DISTORTION_THRESHOLD = 0.20;
//     if (percentStretch > DISTORTION_THRESHOLD) {
//         const pct = Math.round(percentStretch * 100);
//         warningEL.style.display = "block";
//         warningEL.textContent = `The requested dimensions will distort the letters by about ${pct}%. Letters may appear stretched or squashed.`;
//     } else if (warningEL.textContent === "") {
//         warningEL.style.display = "none";
//         warningEL.textContent = "";
//     }

//     const threshold = 128;
//     const cells = Array.from({ length: targetRows }, () => new Array(targetStitches).fill(false));
//     for (let r = 0; r < targetRows; r++) {
//         const y0f = minY + (r / targetRows) * glyphPxH;
//         const y1f = minY + ((r + 1) / targetRows) * glyphPxH;
//         const y0 = Math.floor(y0f), y1 = Math.ceil(y1f);
//         for (let c = 0; c < targetStitches; c++) {
//             const x0f = minX + (c / targetStitches) * glyphPxW;
//             const x1f = minX + ((c + 1) / targetStitches) * glyphPxW;
//             const x0 = Math.floor(x0f), x1 = Math.ceil(x1f);
//             let sum = 0, count = 0;
//             for (let y = y0; y < y1; y++) {
//                 for (let x = x0; x < x1; x++) {
//                     if (x < 0 || x >= canvasW || y < 0 || y >= canvasH) {
//                         continue;
//                     }
//                     const idx = (y * canvasW + x) * 4;
//                     const rpx = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
//                     sum += (rpx + g + b) / 3;
//                     count++;
//                 }
//             }
//             const avg = count ? sum / count : 255;
//             cells[r][c] = avg < threshold;
//         }
//     }

//     const chart = cells.map(row => row.map(bit => (bit ? (invert ? "K" : "P") : (invert ? "P" : "K"))));

//     let instructions = [];
//     instructions.push(`<strong>Cast on ${targetStitches} stitches.</strong>`);
//     instructions = buildInstructions(instructions,targetRows, chart);

//     instructions.push(`<strong style='padding-top:10px;'>Bind off all stitches, you're done! </strong>`);

//     instructionsEL.innerHTML = instructions.join("<br>");

//     patternEL.innerHTML = renderColoredPattern(patternEL, chart);
//     notesEL.textContent = `Pattern: ${targetStitches} stitches × ${targetRows} rows. 
//     (glyph pixel box: ${glyphPxW}×${glyphPxH} px). 
//     Cell size X:${(stitchSizeX).toFixed(2)} px, Y:${(stitchSizeY).toFixed(2)} px.`;
// }


function rasterizeTextToCells(textRows) {
    const grid = [];
    if (textRows == null || textRows == undefined){
        return
    }
    Object.entries(textRows).forEach(([rowText, rowIndex]) => {
        const colonIndex = rowText.indexOf(":");
        let stitchPart = colonIndex >= 0 ? rowText.slice(colonIndex + 1) : rowText;

        const segments = stitchPart.split(",").map(s => s.trim()).filter(s => s.length);
        const rowStitches = [];

        segments.forEach(seg => {
            const match = seg.match(/(Knit|Purl)\s*(\d+)/i);
            if (match) {
                const stitch = match[1].toUpperCase().startsWith("K") ? "K" : "P";
                const count = parseInt(match[2], 10);
                for (let i = 0; i < count; i++) {
                    rowStitches.push(stitch);
                }
            }
        });

        grid.push(rowStitches);
    });

    return grid;
}

function ribSequence(count, startWithK=true) {
    const seq = [];
    let kNext = startWithK;
    for (let i = 0; i < count; i++) {
        seq.push(kNext ? "K" : "P");
        kNext = !kNext;
    }
    return seq;
}

function applyBorderToGrid(grid, options = {}) {
    if(grid == null || grid == undefined){
        return;
    }
    const thickness = options.thickness || 5;
    const pattern = options.pattern || "rib";
    const invert = !!options.invert;

    const rows = grid.length;
    const cols = grid[0].length;

    for (let t = 0; t < thickness; t++) {
        const topRow = ribSequence(cols,true);
        if(invert) {
            grid.unshift(topRow.map(s => (s === "K" ? "P" : "K")));
        } else {
            grid.unshift(topRow);
        }
    }

    for (let t = 0; t < thickness; t++) {
        const bottomRow = ribSequence(cols, true);
        if(invert){
            grid.push(bottomRow.map(s => (s === "K" ? "P" : "K")))
        } else {
            grid.push(bottomRow);
        }
    }

    grid.forEach((row, rIndex) => {
        const leftBorder = ribSequence(thickness, true);
        const rightBorder = ribSequence(thickness, true);

        grid[rIndex] = [
            ...(invert ? leftBorder.map(s => (s === "K" ? "P" : "K")) : leftBorder),
            ...row,
            ...(invert ? rightBorder.map(s => (s === "K" ? "P" : "K")) : rightBorder)
        ];
    });
    return grid;
}

function formatGridWithLabels(grid) {
    const formattedRows = [];
    let previousRow = null;
    let rangeStart = 0;

    for (let r = 0; r < grid.length; r++) {
        const row = grid[r];

        const leftBorderCount = 5;
        const rightBorderCount = 5;

        const left = row.slice(0, leftBorderCount);
        const right = row.slice(row.length - rightBorderCount);
        const body = row.slice(leftBorderCount, row.length - rightBorderCount);
        
        const leftStr = left.length ? `Left Border (${left.join(", ")})` : "";
        const rightStr = right.length ? `Right Border(${right.join(", ")})` : "";
        const bodyStr = body.length ? `Body(${body.join(", ")})` : "";

        const rowParts = [leftStr, bodyStr, rightStr].filter(Boolean).join(", ");

        formattedRows.push({index: r, content: rowParts});
    }

    const finalOutput = [];
    let r = 0;
    while (r < formattedRows.length){
        const start = r;
        let end = r;
        while(
            end + 1 < formattedRows.length &&
            formattedRows[end +1].content === formattedRows[start].content
        ) {
            end++;
        }

        const label = start === end 
        ? `Row ${start + 1}: ` 
        : `Row ${start + 1} - ${end + 1}: `;

        finalOutput.push(label + formattedRows[start].content);
        r = end + 1;
    }
    return finalOutput;
}


function renderColoredPattern(patternEl, chart) {
    const html = chart
        .map(row => row
            .map(stitch => {
                if (stitch === "K") {
                    return `<span class="stitch knit">K</span>`;
                } else if (stitch === "P") {
                    return `<span class="stitch purl">P</span>`;
                } else {
                    return stitch;
                }
            })
            .join("")
        )
        .join("<br>");

    return html;
}


function rle(seq) {
    if (!seq || seq.length === 0) {
        return "";
    }
    const name = { K: "Knit", P: "Purl" };
    let runs = [];
    let cur = seq[0], n = 1;
    for (let i = 1; i < seq.length; i++) {
        if (seq[i] === cur) {
            n++;
        } else {
            runs.push({ ch: cur, n });
            cur = seq[i];
            n = 1;
        }
    }
    runs.push({ ch: cur, n });
    return runs.map(r => `${name[r.ch]} ${r.n}`).join(", ");
}

function buildInstructions(instructions, targetRows, chart) {
    for (let i = 0; i < targetRows; i++) {
        const rowNum = i + 1;
        let seq = chart[i].join("");
        let workingSeq = seq;
        if (rowNum % 2 === 1) {
            workingSeq = seq.split("").reverse().join("");
            directionNote = "RS ";
        } else {
            directionNote = "WS ";
        }

        let side = (directionNote.trim() === "RS" ? "right-side" : "wrong-side");
        let rowData = `<strong class="${side}">Row ${rowNum}. ${directionNote}:</strong> ${rle(workingSeq)}`
        instructions.push(rowData);
    }
    return instructions;
}

function getBorderOptions() {
  return {
    top: document.getElementById("borderTop").checked,
    bottom: document.getElementById("borderBottom").checked,
    left: document.getElementById("borderLeft").checked,
    right: document.getElementById("borderRight").checked,
    width: parseInt(document.getElementById("borderWidth").value, 10),
    pattern: document.getElementById("borderPattern").value
  };
}