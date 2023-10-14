import {
    spbiUtils
} from "./spbiUtils.js";
import {
    spbiWindow
} from "./spbiWindow.js";

Hooks.once('init', async function() {

});

Hooks.once('ready', async function() {

});


Hooks.on("renderItemDirectory", (app, html, data) => {
    spbiUtils.log("Rendering spbi button");

    // Add the import button to the UI in the characters tab.
    const importButton = $("<button id='sbi-main-button'><i class='fas fa-file-import'></i></i>{{ localize '5e-spellblock-importer.importTextTab' }}</button>");
    html.find(".directory-footer").append(importButton);

    importButton.click(async (ev) => {
        spbiUtils.log("Module button clicked");

        await spbiWindow.renderWindow();
    });
});