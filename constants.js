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