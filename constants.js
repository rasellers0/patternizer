const BORDER_SPECS = [
    {
        name: "topBorder",
        enabledKey: "borderTop",
        startRow: (rows, cols, w) => 0,
        endRow: (rows, cols, w) => rows,
        startCol: (rows, cols, w) => 0,
        endCol: (rows, cols, w) => cols
    },
    {
        name: "bottomBorder",
        enabledKey: "borderBottom",
        startRow: (rows, cols, w) => rows,
        endRow: (rows, cols, w) => rows,
        startCol: (rows, cols, w) => 0,
        endCol: (rows, cols, w) => cols
    },
    {
        name: "leftBorder",
        enabledKey: "borderLeft",
        startRow: (rows, cols, w) => 0,
        endRow: (rows, cols, w) => rows,
        startCol: (rows, cols, w) => 0,
        endCol: (rows, cols, w) => w
    },
    {
        name: "rightBorder",
        enabledKey: "borderRight",
        startRow: (rows, cols, w) => 0,
        endRow: (rows, cols, w) => rows,
        startCol: (rows, cols, w) => cols - w,
        endCol: (rows, cols, w) => cols
    }
];

const PRESETS = {
    small: { width: 20, height: 12 },
    medium: { width: 30, height: 18 },
    large: { width: 40, height: 24 },
    xlarge: { width: 60, height: 36 }
};

const SIZE_PRESETS = {
    "horizontal": {AUTO: 30, XS: 20, S: 30, M: 45, L: 60, XL: 90},
    "vertical": {AUTO: 60, XS: 45, S: 60, M: 90, L: 105, XL: 120},
};

const ORIENTATION = {
    HORIZONTAL: "horizontal",
    VERTICAL: "vertical"
};

const BORDER_PATTERN_DEFS = {
    garter: {
        label: "Garter",
        optValue: "garter",
        function: "garterStitch",
        repeat: {width: 1, height: 1},
        minimum: {width: 1, height: 1},
        allowedWidths: [1,2,3,4,5,6,7,8],
        defaultWidth: 5
    },
    stockinette: {
        label: "Stockinette",
        optValue: "stockinette",
        function: "stockinetteStitch",
        repeat: {width: 1, height: 2},
        minimum: {width: 1, height: 2},
        allowedWidths: [1,2,3,4,5,6,7,8],
        defaultWidth: 5
    },
    rib1x1: {
        label: "1×1 Rib",
        optValue: "rib1x1",
        function: "rib1x1Stitch",
        repeat: {width: 2, height: 1},
        minimum: {width: 2, height: 1},
        allowedWidths: [2,4,6,8],
        defaultWidth: 6
    },
    rib2x2: {
        label: "2×2 Rib",
        optValue: "rib2x2",
        function: "rib2x2Stitch",
        repeat: {width: 4, height: 1},
        minimum: {width: 4, height: 1},
        allowedWidths: [4,8],
        defaultWidth: 4
    },
    seed: {
        label: "Seed Stitch",
        optValue: "seed",
        function: "seedStitch",
        repeat: {width: 2, height: 2},
        minimum: {width: 2, height: 2},
        allowedWidths: [2,4,6,8],
        defaultWidth: 6
    }

};