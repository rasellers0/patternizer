document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("generateBtn").addEventListener("click", generatePattern);
        generatePattern();
    }
);

const PRESETS = {
  small: { width: 40, height: 10 },
  medium: { width: 60, height: 15 },
  large: { width: 80, height: 20 },
  xlarge: { width: 100, height: 25 }
};

function generatePattern() {
    const DEBUG = false;

    const text = (document.getElementById("wordInput").value || "").trim().toUpperCase();
    const widthChoice = document.getElementById("widthPreset").value;
    const heightChoice = document.getElementById("heightPreset").value;

    // const alternateRows = !!document.getElementById("alternateRows").checked;
    const invert = !!document.getElementById("invertToggle").checked;

    const warningEL = document.getElementById("warning");
    const instructionsEL = document.getElementById("instructions");
    const patternEL = document.getElementById("patternOutput");
    const notesEL = document.getElementById("notes");

    warningEL.style.display = "none";
    warningEL.textContent = "";

    instructionsEL.innerHTML = "";
    patternEL.textContent = "";
    notesEL.textContent = "";

    if(!text){
        instructionsEL.innerHTML = "<li>Please enter text to generate a pattern. </li>"; 
        return;
    }

    if(text === 'MAGA'){
        warningEL.style.display = "block";
        warningEL.textContent = "No. Fuck you."
        return;
    }

    let dirtyWords = ["ASS", "FUCK", "DAMN", "SHIT", "BALLS"]
    if(dirtyWords.includes(text)){
        warningEL.style.display = "block";
        warningEL.textContent = "What are you, thirteen? Fine, whatever."
    }

    const canvas = document.getElementById("hiddenCanvas");
    const ctx = canvas.getContext("2d");

    const baseFontPx = 200;
    const fontSpec = `bold ${baseFontPx}px monospace`;
    ctx.font = fontSpec;

    const paddingPx = 20;
    const metrics = ctx.measureText(text);
    const textPxW = Math.ceil(metrics.width);
    const textPxH = Math.ceil(baseFontPx * 1.2);
    

    canvas.width = Math.max(10, textPxW + paddingPx * 2);
    canvas.height = Math.max(10, textPxH + paddingPx * 2);

    const ctx2 = canvas.getContext("2d");
    ctx2.fillStyle = "white";
    ctx2.fillRect(0, 0, canvas.width, canvas.height);
    ctx2.fillStyle = "black";
    ctx.font = fontSpec;
    ctx2.textBaseline = "top";

    ctx2.fillText(text, paddingPx, paddingPx);

    const img = ctx2.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = img.data;
    const canvasW = canvas.width;
    const canvasH = canvas.height;

    const desiredWidth = widthChoice ? PRESETS[widthChoice].width : null;
    const desiredHeight = heightChoice ? PRESETS[heightChoice].height : null;

    let minX = canvasW, minY = canvasH, maxX = 0, maxY = 0;
    for(let y = 0; y < canvasH; y++){
        for(let x = 0; x < canvasW; x++){
            const idx = (y * canvasW + x) * 4;
            const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
            const brightness = (r + g + b) / 3;
            if(brightness < 240){
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }

    if(minX > maxX || minY > maxY) {
        instructionsEL.innerHTML = "<li>No visible glyph detected. Try different text.</li>";
        return;
    }

    const glyphPxW = maxX - minX + 1;
    const glyphPxH = maxY - minY + 1;

    const defaultStitches = 30;
    const defaultRows = Math.round((glyphPxH / glyphPxW) * defaultStitches) || 15;

    let targetStitches = desiredWidth || null;
    let targetRows = desiredHeight || null;

    if(!targetStitches && !targetRows){
        targetStitches = defaultStitches;
        targetRows = defaultRows;
    } else if (targetStitches && ! targetRows){
        const stitchSizePx = glyphPxW / targetStitches;
        targetRows = Math.max(1, Math.round(glyphPxH / stitchSizePx));
    }

    const stitchSizeX = glyphPxW / targetStitches;
    const stitchSizeY = glyphPxH / targetRows;

    const ratio = stitchSizeX /stitchSizeY;
    const percentStretch = (Math.max(ratio, 1 / ratio) - 1);

    const DISTORTION_THRESHOLD = 0.20;
    if (percentStretch > DISTORTION_THRESHOLD){
        const pct = Math.round(percentStretch * 100);
        warningEL.style.display = "block";
        warningEL.textContent = `The requested dimensions will distort the letters by about ${pct}%. Letters may appear stretched or squashed.`;
    } else if(warningEL.textContent === "") {
        warningEL.style.display = "none";
        warningEL.textContent = "";
    }


    const threshold = 128;
    const cells = Array.from( {length: targetRows}, () => new Array(targetStitches).fill(false));
    for (let r = 0; r < targetRows; r++){
        const y0f = minY + (r/ targetRows) * glyphPxH;
        const y1f = minY + ((r + 1) / targetRows) * glyphPxH;
        const y0 = Math.floor(y0f), y1 = Math.ceil(y1f);
        for (let c = 0; c < targetStitches; c++){
            const x0f = minX + (c /targetStitches) * glyphPxW;
            const x1f = minX +((c + 1) / targetStitches) * glyphPxW;
            const x0 = Math.floor(x0f), x1 = Math.ceil(x1f);
            let sum = 0, count = 0;
            for (let y = y0; y < y1; y++) {
                for (let x = x0; x < x1; x++){
                    if(x < 0 || x >= canvasW || y < 0 || y >= canvasH){
                        continue;
                    }
                    const idx = (y * canvasW + x) * 4;
                    const rpx = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
                    sum += (rpx + g + b) / 3;
                    count++;
                }
            }
            const avg = count ? sum /count : 255;
            cells[r][c] = avg < threshold;
        }
    }

    const chart = cells.map(row => row.map(bit => (bit ? (invert ? "K" : "P") : (invert ? "P" : "K"))));
    
    const instructions = [];
    instructions.push(`<strong>Cast on ${targetStitches} stitches.</strong>`);
    // instructions.push(`Cast on ${targetStitches} stitches.`);
    // instructions.push(`Work ${targetRows} rows following the instructions below.`);

    function rle(seq) {
        if(!seq || seq.length === 0){
            return "";
        }
        const name = {K: "Knit", P: "Purl"};
        let runs = [];
        let cur = seq[0], n = 1;
        for (let i = 1; i < seq.length; i++) {
            if(seq[i] === cur){
                n++;
            } else {
                runs.push({ch: cur, n});
                cur = seq[i];
                n = 1;
            }
        }
        runs.push({ch: cur, n});
        return runs.map(r => `${name[r.ch]} ${r.n}`).join(", ");
    }

    for (let i = 0; i < targetRows; i++) {
        const rowNum = i + 1;
        let seq = chart[i].join("");
        let workingSeq = seq;
        if(rowNum % 2 === 1) {
            workingSeq = seq.split("").reverse().join("");
            directionNote = "RS ";
        } else {
            directionNote = "WS ";
        }

        let side = (directionNote.trim() === "RS" ? "right-side" : "wrong-side");
        let rowData = `<strong class="${side}">Row ${rowNum}. ${directionNote}:</strong> ${rle(workingSeq)}`
        instructions.push(rowData);
    }

    instructions.push(`<strong style='padding-top:10px;'>Bind off all stitches, you're done! </strong>`);

    instructionsEL.innerHTML = instructions.join("<br>");

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
  
        patternEl.innerHTML = html;
}

    // patternEL.textContent = chart.map(r => r.join("")).join("\n");
    renderColoredPattern(patternEL, chart);
    notesEL.textContent = `Pattern: ${targetStitches} stitches × ${targetRows} rows. 
    (glyph pixel box: ${glyphPxW}×${glyphPxH} px). 
    Cell size X:${(stitchSizeX).toFixed(2)} px, Y:${(stitchSizeY).toFixed(2)} px.`;
}