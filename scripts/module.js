import {
    spbiUtils
} from "./spbiUtils.js";
import {
    spbiWindow
} from "./spbiWindow.js";

Hooks.once('init', async function () {

});

Hooks.once('ready', async function () {

});


Hooks.on("renderItemDirectory", (app, html, data) => {
    spbiUtils.log("Rendering spbi button");

    // Add the import button to the UI in the characters tab.
    if (game.release.generation < 13) {
        const importButton = $("<button id='sbi-main-button'><i class='fas fa-file-import'></i></i>" + game.i18n.localize('5e-spellblock-importer.importTextTab') + "</button>");
        html.find(".directory-footer").append(importButton);

        importButton.click(async (ev) => {
            spbiUtils.log("Module button clicked");

            await spbiWindow.renderWindow();
        });
    } else {
        const importButton = `<button id='sbi-main-button'><i class='fas fa-file-import'></i></i>` + game.i18n.localize('5e-spellblock-importer.importTextTab') + `</button>`;
        html.querySelector(".directory-footer").insertAdjacentHTML('beforeend', importButton);

        html.querySelector("#sbi-main-button").addEventListener("click", async (ev) => {

            //    importButton.click(async (ev) => {
            spbiUtils.log("Module button clicked");

            await spbiWindow.renderWindow();
        });
    }
});

/*
Hooks.on("renderItemDirectory", async (app, html) => {
    spbiUtils.log("Rendering spbi button");

    console.log(app.querySelector(".directory-footer"))
    console.log(app)
    // Add the import button to the UI in the characters tab.
    //    const importButton = $("<button id='sbi-main-button'><i class='fas fa-file-import'></i></i>"+game.i18n.localize('5e-spellblock-importer.importTextTab')+"</button>");
    const importButton = `<button id='sbi-main-button'><i class='fas fa-file-import'></i></i>` + game.i18n.localize('5e-spellblock-importer.importTextTab') + `</button>`;
    html.querySelector(".directory-footer").insertAdjacentHTML('beforeend', importButton);

    html.querySelector("#sbi-main-button").addEventListener("click", async (ev) => {

        //    importButton.click(async (ev) => {
        spbiUtils.log("Module button clicked");

        await spbiWindow.renderWindow();
    });
});
*/