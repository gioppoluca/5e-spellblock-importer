import {
    spbiUtils
} from "./spbiUtils.js";
import {
    spbiParser
} from "./spbiParser.js";
import {
    spbiConfig
} from "./spbiConfig.js";

export class spbiWindow extends Application {

    constructor(options) {
        super(options);
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "spbi-window";
        options.template = "modules/5e-spellblock-importer/templates/spbiWindow.html";
        options.width = 800;
        options.height = 600;
        options.resizable = true;
        options.classes = ["spbi-window"];
        options.popup = true;
        options.title = "5e Spellblock Importer";

        return options;
    }

    static sbiInputWindowInstance = {}

    static async renderWindow() {
        spbiWindow.sbiInputWindowInstance = new spbiWindow();
        spbiWindow.sbiInputWindowInstance.render(true);
    }

    activateListeners(html) {
        spbiUtils.log("Listeners activated")
        super.activateListeners(html);

        const folderSelect = $("#spbi-import-select")[0];
        const typeSelect = $("#spbi-import-type")[0];

        // Add a default option.
        const noneFolder = "None";
        folderSelect.add(new Option(noneFolder));

        // Add the available folders.
        for (const folder of [...game.folders]) {
            folderSelect.add(new Option(folder.name));
        }

        const importButton = $("#spbi-import-button");
        importButton.on("click", async function () {
            console.log("Clicked import button");

            // TODO: let user define the folder that the actor goes into
            /*
                        const lines = $("#spbi-input")
                            .val()
                            .trim()
                            .split(/\n/g)
                            .filter(str => str.length);
            */
            const content = $("#spbi-input").val();
            const selectedFolder = folderSelect.options[folderSelect.selectedIndex].text;
            const selectedType = typeSelect.options[typeSelect.selectedIndex].value;
            console.log(selectedType)
            const selectedFolderId = selectedFolder == noneFolder ? null : [...game.folders.keys()][folderSelect.selectedIndex - 1];

            if (spbiConfig.options.debug) {
                await spbiParser.parseInput(content, selectedFolderId, selectedType);
            } else {
                try {
                    await spbiParser.parseInput(content, selectedFolderId, selectedType);
                } catch (error) {
                    ui.notifications.error("5E SPELLBLOCK IMPORTER: An error has occured. Please report it using the module link so it can get fixed.")
                }
            }
        });

        // ###############################
        // DEBUG
        // ###############################
        if (spbiConfig.options.debug) {
            const stringToTest = `Acid Wind	

            1st-level Evocation 
            Casting Time 	1 action
            Range 	Self
            Components 	V S M (a Dried Lemon Peel)
            Duration 	Instantaneous
            
            You call forth a breeze full of stinging acid droplets from your outstretched hand. Each creature in a 15-foot cube originating from you must make a Constitution saving throw. On a failed save, a creature takes 2d6 acid damage and is blinded until the end of your next turn. On a successful save, the creature takes half as much damage and isn’t blinded.
            
            At Higher Levels: For each spell slot used higher than 1st level, the damage increases by 1d6.
            `
            $("#spbi-input").val(stringToTest);
        }
    }
}