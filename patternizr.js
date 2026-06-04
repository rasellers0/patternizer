const PRESETS = {
    small: 20,
    medium: 30,
    large: 40,
    xlarge: 60
};

document.addEventListener("DOMContentLoaded", () => {
    document
        .getElementById("generateBtn")
        .addEventListener("click", generatePattern);
});

function generatePattern() {

    const settings = readSettings();

    const warningEL = document.getElementById("warning");
    const instructionsEL = document.getElementById("instructions");
    const patternEL = document.getElementById("patternOutput");
    const notesEL = document.getElementById("notes");
    const outputContainer = document.getElementById("outputContainer");

    warningEL.textContent = "";
    instructionsEL.innerHTML = "";
    patternEL.innerHTML = "";
    notesEL.textContent = "";

    if (!settings.text) {
        warningEL.textContent = "Please enter text.";
        return;
    }

    const preparedText =
        prepareText(settings.text, settings.orientation);

    const raster =
        rasterizeText(preparedText);

    const bounds =
        findGlyphBounds(raster);

    if (!bounds) {
        warningEL.textContent =
            "Unable to detect any visible text.";
        return;
    }

    const cells =
        sampleToGrid(
            raster,
            bounds,
            settings.width,
            settings.height
        );

    const chart =
        cellsToChart(cells, settings.invert);

    const instructions =
        buildInstructions(chart);

    renderPattern(patternEL, chart);
    renderInstructions(instructionsEL, instructions);

    notesEL.textContent =
        `${chart[0].length} stitches × ${chart.length} rows`;

    outputContainer.style.display = "block";
}

function readSettings() {

    const widthChoice =
        document.getElementById("widthPreset").value;

    const heightChoice =
        document.getElementById("heightPreset").value;

    return {
        text:
            document
                .getElementById("wordInput")
                .value
                .trim()
                .toUpperCase(),

        orientation:
            document
                .getElementById("orientationSelect")
                .value,

        invert:
            document
                .getElementById("invertToggle")
                .checked,

        width:
            PRESETS[widthChoice] || 30,

        height:
            PRESETS[heightChoice] || 30
    };
}

function prepareText(text, orientation) {

    if (orientation === "vertical") {
        return text.split("").join("\n");
    }

    return text;
}

function rasterizeText(text) {

    const canvas =
        document.getElementById("hiddenCanvas");

    const ctx =
        canvas.getContext("2d");

    const fontSize = 200;
    const padding = 20;
    const lineHeight = fontSize * 1.2;

    ctx.font = `bold ${fontSize}px monospace`;

    const lines = text.split("\n");

    const maxWidth =
        Math.max(
            ...lines.map(
                line => ctx.measureText(line).width
            )
        );

    canvas.width =
        Math.ceil(maxWidth + padding * 2);

    canvas.height =
        Math.ceil(
            lines.length * lineHeight +
            padding * 2
        );

    ctx.fillStyle = "white";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "black";
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textBaseline = "top";

    lines.forEach((line, index) => {

        ctx.fillText(
            line,
            padding,
            padding + (index * lineHeight)
        );

    });

    const imageData =
        ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );

    return {
        pixels: imageData.data,
        width: canvas.width,
        height: canvas.height
    };
}

function findGlyphBounds(raster) {

    const pixels = raster.pixels;

    let minX = raster.width;
    let minY = raster.height;
    let maxX = 0;
    let maxY = 0;

    for (let y = 0; y < raster.height; y++) {

        for (let x = 0; x < raster.width; x++) {

            const idx =
                (y * raster.width + x) * 4;

            const brightness =
                (
                    pixels[idx] +
                    pixels[idx + 1] +
                    pixels[idx + 2]
                ) / 3;

            if (brightness < 240) {

                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);

            }
        }
    }

    if (
        minX > maxX ||
        minY > maxY
    ) {
        return null;
    }

    return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX + 1,
        height: maxY - minY + 1
    };
}

function sampleToGrid(
    raster,
    bounds,
    targetWidth,
    targetHeight
) {

    const cells =
        Array.from(
            { length: targetHeight },
            () => new Array(targetWidth).fill(false)
        );

    for (let row = 0; row < targetHeight; row++) {

        for (let col = 0; col < targetWidth; col++) {

            const x =
                bounds.minX +
                Math.floor(
                    (col / targetWidth) *
                    bounds.width
                );

            const y =
                bounds.minY +
                Math.floor(
                    (row / targetHeight) *
                    bounds.height
                );

            const idx =
                (y * raster.width + x) * 4;

            const brightness =
                (
                    raster.pixels[idx] +
                    raster.pixels[idx + 1] +
                    raster.pixels[idx + 2]
                ) / 3;

            cells[row][col] =
                brightness < 200;
        }
    }

    return cells;
}

function cellsToChart(cells, invert) {

    return cells.map(row =>
        row.map(bit =>
            bit
                ? (invert ? "K" : "P")
                : (invert ? "P" : "K")
        )
    );
}

function buildInstructions(chart) {

    const instructions = [];

    instructions.push(
        `<strong>Cast on ${chart[0].length} stitches.</strong>`
    );

    chart.forEach((row, index) => {

        instructions.push(
            `<strong>Row ${index + 1}:</strong> ${compressRow(row)}`
        );

    });

    instructions.push(
        "<strong>Bind off all stitches.</strong>"
    );

    return instructions;
}

function compressRow(row) {

    const result = [];

    let current = row[0];
    let count = 1;

    for (let i = 1; i < row.length; i++) {

        if (row[i] === current) {
            count++;
        }
        else {

            result.push(
                `${current}${count}`
            );

            current = row[i];
            count = 1;
        }
    }

    result.push(
        `${current}${count}`
    );

    return result.join(", ");
}

function renderInstructions(
    container,
    instructions
) {

    container.innerHTML =
        instructions.join("<br>");
}

function renderPattern(
    container,
    chart
) {

    container.innerHTML = "";

    chart.forEach((row, rowIndex) => {

        const rowDiv =
            document.createElement("div");

        rowDiv.className =
            "pattern-row";

        const chip =
            document.createElement("span");

        chip.className =
            `row-chip ${
                rowIndex % 2 === 0
                    ? "chip-rs"
                    : "chip-ws"
            }`;

        rowDiv.appendChild(chip);

        const label =
            document.createElement("span");

        label.className =
            "rowlabel";

        label.textContent =
            `Row ${rowIndex + 1}: `;

        rowDiv.appendChild(label);

        row.forEach(stitch => {

            const span =
                document.createElement("span");

            span.className =
                stitch === "K"
                    ? "k"
                    : "p";

            span.textContent =
                stitch;

            rowDiv.appendChild(span);

        });

        container.appendChild(rowDiv);

    });
}