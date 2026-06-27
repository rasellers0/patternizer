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