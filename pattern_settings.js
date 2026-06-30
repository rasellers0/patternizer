function getInputSettings() {
    return {
        text: document.getElementById("wordInput").value.trim().toUpperCase(),
        orientation: document.getElementById("orientation")?.value || "horizontal",
        invert: !!document.getElementById("invertToggle").checked,
        size: document.getElementById("sizeChoice").value,
    };
}

function getElementSettings(){
    elementSettingsObj = {
        warningEL: document.getElementById("warning"),
        instructionsEL: document.getElementById("instructions"),
        patternEL: document.getElementById("patternOutput"),
        notesEL: document.getElementById("notes"),
        borderOptsEL: document.getElementById("borderPattern"),
        borderWidthEL: document.getElementById("borderWidth")
    }
    return elementSettingsObj;
}

function getBorderSettings() {
    const borderSettings = {
        borderEnabled: document.getElementById("borderEnable")?.checked ,
        borderWidth: parseInt(document.getElementById("borderWidth")?.value || "5"),
        borderTop: document.getElementById("borderTop")?.checked,
        borderBottom: document.getElementById("borderBottom")?.checked,
        borderLeft: document.getElementById("borderLeft")?.checked,
        borderRight: document.getElementById("borderRight")?.checked,
        borderPattern: document.getElementById("borderPattern")?.value || "rib1x1",
        borderSelected: document.querySelectorAll('.border-sides'),
        borderControls: document.querySelectorAll('.border-settings')
    };
    return borderSettings;
}