const BORDER_SPECS = [
    {
        name: "topBorder",
        enabledKey: "borderTop",
        startRow: (rows, cols, w) => 0,
        endRow: (rows, cols, w) => w,
        startCol: (rows, cols, w) => 0,
        endCol: (rows, cols, w) => cols
    },
    {
        name: "bottomBorder",
        enabledKey: "borderBottom",
        startRow: (rows, cols, w) => rows - w,
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