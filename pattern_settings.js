// function getInputSettings() {
//     widthChoice = document.getElementById("widthPreset").value;
//     heightChoice = document.getElementById("heightPreset").value;

//     settingsObj = {
//         text: document.getElementById("wordInput").value.trim().toUpperCase(),
//         orientation: document.getElementById("orientation")?.value || "horizontal",
//         invert: !!document.getElementById("invertToggle").checked,
//         width: widthChoice || "medium",
//         height: heightChoice || "medium"
//     };
//     return settingsObj;
// }

function getInputSettings() {
    return {
        text: document.getElementById("wordInput").value.trim().toUpperCase(),
        orientation: document.getElementById("orientation")?.value || "horizontal",
        invert: !!document.getElementById("invertToggle").checked,
        size: document.getElementById("sizeChoice").value
    };
}

function getElementSettings(){
    elementSettingsObj = {
        warningEL: document.getElementById("warning"),
        instructionsEL: document.getElementById("instructions"),
        patternEL: document.getElementById("patternOutput"),
        notesEL: document.getElementById("notes")
    }
    return elementSettingsObj;
}

function getBorderSettings() {
    const borderSettings = {
        borderEnabled: document.getElementById("borderEnable")?.checked ,
        borderWidth: parseInt(document.getElementById("borderWidth")?.value || "5"),
        borderTop: document.getElementById("borderTop")?.checked ?? true,
        borderBottom: document.getElementById("borderBottom")?.checked ?? true,
        borderLeft: document.getElementById("borderLeft")?.checked ?? true,
        borderRight: document.getElementById("borderRight")?.checked ?? true,
        borderPattern: document.getElementById("borderPattern")?.value || "rib",
        borderSelected: document.querySelectorAll('.border-sides'),
        borderControls: document.querySelectorAll('.border-settings')
    };
    return borderSettings;
}