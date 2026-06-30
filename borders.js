function applyBorders(chart, settings) {
    if (!settings.borderEnabled) return chart;

    const w = parseInt(settings.borderWidth);
    const rows = chart.length;
    const cols = chart[0].length;
    
    const borderTopTest = document.getElementById("borderTop")?.checked
    const borderBtmTest = document.getElementById("borderBottom")?.checked


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

function generateBorderStitch(region, r, c, settings) {
    const pattern = settings.borderPattern;
    switch(pattern){
        case 'rib1x1':
            return rib1x1Stitch(r);
        case 'rib2x2':
            return rib2x2Stitch(r);
        case 'garter':
            return garterStitch()
        case 'stockinette':
            return stockinetteStitch(c)
        case 'seed':
            return seedStitch(r, c)
        default:
            return garterStitch()
    }

    if (pattern === "rib") { return rib1x1Stitch(r);}
    return "K";
}