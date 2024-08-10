import {
    spbiUtils
} from "./spbiUtils.js";


export class spbiParser {
    static #spellLevelSchool = /^((?<level>\d+)?(nd|rd|st|th)?[-\t ]?(level|cantrip)?[ ]?)?(?<school>abjuration|conjuration|enchantment|divination|illusion|transmutation|necromancy|evocation)[ ]?(?<spelltype>spell|cantrip)?(\((?<ritual>ritual)\))?/i
    static #castingTime = /(casting time)[:\s]*((?<amount>\d*)\s+(?<act>bonus action|action|minutes|reaction))/i
    static #duration = /(duration)[:\s]*(?<conc>concentration, up to|Concentration,)?\s?((?<amount>\d*)?\s?(?<time>permanent|until dispelled or triggered|until dispelled|special|hours|minutes|rounds|months|turns|years|round|minute|hour|month|turn|year|instantaneous))/i
    static #comps = /(components)[:\s]*(?<vocal>v)?[\t ,]*(?<somatic>s)?[\t ,]*(?<material>m)?[\t ,]*(\((?<materials_inline>.*)\))?/i
    static #materials = /(materials)[:\s]*((?<materials>.*))?/i
    static #classes = /(classes|Available for)[:\s]*((?<classes>.*))?/i
    static #source = /source:[ \t-]*(?<source>.*)/i
    static #range = /(range:)[\s]*(?<amount>\d+)?[\s,]*(?<units>self|feet|touch|mile|special, see below|special)?[\s,]*(\(((?<area_amount>\d+)[\s,-]*(?<area_units>foot|mile)?[\s,]*(?<area_shape>radius|line)?)\))?/i
    static #text = /(\.\s?)/ig
    static #item = /^(?<type>ammunition|bomb|oil|poison|adventuring gear|wondrous item|potion|weapon|armor|ring|staff|wand)?[ ]?(\((?<subtype>firearm|longsword|tattoo|shield|[^)]*)\))?[, ]*(?<rarity>very rare|rare|uncommon|legendary|artifact)?[ ]?(\((?<attunement>requires attunement by a|requires attunement)[ ]?(?<attuning_class>.*)?\))?/i

    static activationMap = {
        "action": "action",
        "minutes": "minute",
        "bonus action": "bonus",
        "reaction": "reaction"
    };
    static schoolMap = {
        "abjuration": "abj",
        "conjuration": "con",
        "divination": "div",
        "enchantment": "enc",
        "evocation": "evo",
        "illusion": "ill",
        "necromancy": "nec",
        "transmutation": "trs"
    };
    static timeMap = {
        "day": "day",
        "until dispelled": "disp",
        "until dispelled or triggered": "dstr",
        "hour": "hour",
        "hours": "hour",
        "instantaneous": "inst",
        "minute": "minute",
        "minutes": "minute",
        "month": "month",
        "months": "month",
        "permanent": "perm",
        "round": "round",
        "rounds": "round",
        "special": "spec",
        "turn": "turn",
        "turns": "turn",
        "year": "year",
        "years": "year"
    }
    static rangeUnitsMap = {
        "any": "any",
        "feet": "ft",
        "foot": "ft",
        "kilometers": "km",
        "meters": "m",
        "miles": "mi",
        "mile": "mi",
        "self": "self",
        "special": "spec",
        "special, see below": "spec",
        "touch": "touch"
    };
    static targetAreaMap = {
        "cone": "cone",
        "cylinder": "cylinder",
        "line": "line",
        "radius": "radius",
        "sphere": "sphere"
    }

    static itemMap = {
        "armor": { type: "equipment", img: "", subtype: { "plate": "heavy", "shield": "shield" }, subtypekey: "armor" },
        "weapon": { type: "weapon", img: "", subtype: { "longsword": "heavy", "shield": "shield" }, subtypekey: "weaponType" },
        "poison": { type: "consumable", img: "", subtype: "poison", subtypekey: "consumableType" },
        "ammunition": { type: "consumable", img: "", subtype: "ammo", subtypekey: "consumableType" },
        "potion": { type: "consumable", img: "", subtype: "potion", subtypekey: "consumableType" },
        "rod": { type: "consumable", img: "", subtype: "rod", subtypekey: "consumableType" },
        "scroll": { type: "consumable", img: "", subtype: "scroll", subtypekey: "consumableType" },
        "food": { type: "consumable", img: "", subtype: "food", subtypekey: "consumableType" },
        "wand": { type: "consumable", img: "", subtype: "wand", subtypekey: "consumableType" },
        "wondrous item": { type: "consumable", img: "", subtype: "trinket", subtypekey: "consumableType" }
    };

    static async parseInput(content, selectedFolderId, selectedType) {
        spbiUtils.log(content);
        spbiUtils.log(selectedFolderId);
        console.log(selectedType)

        // Clean up string and remove all empty lines and trim existing ones
        let cleaned = content.replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, "");
        cleaned = cleaned.split(/\r?\n/).filter(line => line.trim() !== '').join('\n')
        spbiUtils.log(cleaned);
        // First line will be name
        switch (selectedType) {
            case "spell":
                await spbiParser.parseSpell(cleaned, selectedFolderId);
                break;
            case "item":
                await spbiParser.parseItem(cleaned, selectedFolderId);
                break;

            default:
                console.log("switch default")
                break;
        }

        //     // re-join the remaining lines

    }

    /**
     * Parses a string containing an item statblock and creates a Foundry VTT item from it.
     * 
     * @param {string} cleaned - The string containing the item statblock.
     * @param {string} selectedFolderId - The folder id to create the item in.
     * 
     * Splits the string into lines, extracts the item name from the first line. 
     * Uses regex to extract details like rarity, attunement etc.
     * Creates an item data object with the extracted info.
     * Does additional processing based on item type like handling consumable subtypes.
     * Replaces placeholders in the description text.
     * Creates the Foundry VTT item.
    */
    static async parseItem(cleaned, selectedFolderId) {
        console.log("in parseItem")
        var lines = cleaned.split("\n"); // split all lines into array
        var itemName = lines.shift(); // read and remove first line
        var rest = lines.join("\n");
        const parsedItem = this.#item.exec(rest);
        console.log(parsedItem)
        if (parsedItem) {
            var workingtype = parsedItem.groups.type.toLowerCase();
            var workingMap = this.itemMap[workingtype];
            console.log(workingtype)
            console.log(workingMap);
            var itemObi = {
                name: spbiUtils.capitalizeAll(itemName),
                type: workingMap.type,
                img: workingMap.img,
                system: {
                    rarity: parsedItem.groups.rarity ? (parsedItem.groups.rarity == "very rare" ? "veryRare" : parsedItem.groups.rarity) : "",
                    attunement: parsedItem.groups.attunement ? true : false,
                    description: {
                        value: ""
                    }
                },
                folder: selectedFolderId
            };
            console.log("first obj created");
            switch (workingMap.type) {
                case "consumable":
                    console.log("is a consumable")
                    itemObi.system[workingMap.subtypekey] = workingMap.subtype;
                    break;
                case "equipment":
                case "weapon":
                    console.log("is a equipment/weapon")
                    if (parsedItem.groups.subtype) {
                        console.log("Subtype found");
                        console.log(workingMap.subtype[parsedItem.groups.subtype]);
                        let pack = await game.packs.get("dnd5e.items");
                        console.log(pack);
                        let index = await pack.getIndex();
                        console.log(index);
                        let entry = index.find(e => e.name.toLowerCase() === parsedItem.groups.subtype)
                        console.log(entry);
                        if (entry) {
                            let entity = await pack.getDocument(entry._id);
                            console.log(entity);
                            console.log(entity.system);
                            itemObi.system = JSON.parse(JSON.stringify(entity.system));
                            itemObi.system.rarity = parsedItem.groups.rarity ? (parsedItem.groups.rarity == "very rare" ? "veryRare" : parsedItem.groups.rarity) : "";
                            itemObi.system.attunement = parsedItem.groups.attunement ? true : false;
                            itemObi.img = entity.img;
                        } else {
                            console.log("No entry found for subtype " + parsedItem.groups.subtype);
                            var armorObj = {
                                value: null,
                                type: workingMap.subtype[parsedItem.groups.subtype] ? workingMap.subtype[parsedItem.groups.subtype] : "",
                                dex: null
                            }
                            itemObi.system[workingMap.subtypekey] = armorObj
                        }
                    } else {
                        console.log("No entry found for subtype " + parsedItem.groups.subtype);
                        var armorObj = {
                            value: null,
                            type: workingMap.subtype[parsedItem.groups.subtype] ? workingMap.subtype[parsedItem.groups.subtype] : "",
                            dex: null
                        }
                        itemObi.system[workingMap.subtypekey] = armorObj
                    }

                    break;

                default:
                    break;
            }
            var itemSubst = parsedItem.groups.attuning_class ? parsedItem.groups.attunement + " " + parsedItem.groups.attuning_class : "";
            rest = rest.replace(this.#item, itemSubst);

            console.log(rest);
            rest = rest.replace(this.#text, ".<br/>");
            itemObi.system.description.value = rest;
            console.log(itemObi)
            const newItem = await Item.create(itemObi);
            newItem.sheet.render(true);

        }
    }

    static async parseSpell(cleaned, selectedFolderId) {
        var lines = cleaned.split("\n"); // split all lines into array
        var spellName = lines.shift(); // read and remove first line
        var rest = lines.join("\n");
        var properties = new Set();
        var spellObj = null;
        if (foundry.utils.isNewerVersion(game.system.version, '2.4.1')) {

            spellObj = {
                name: spbiUtils.capitalizeAll(spellName),
                type: "spell",
                img: "modules/5e-spellblock-importer/img/spell.png",
                system: {
                    description: {
                        value: ""
                    },
                    materials: {
                        value: ""
                    }
                },
                folder: selectedFolderId
            };
            spellObj.system.properties = properties;
        } else {
            spellObj = {
                name: spbiUtils.capitalizeAll(spellName),
                type: "spell",
                img: "modules/5e-spellblock-importer/img/spell.png",
                system: {
                    components: {
                        concentration: false,
                        material: false,
                        ritual: false,
                        somatic: false,
                        vocal: false
                    },
                    description: {
                        value: ""
                    },
                    materials: {
                        value: ""
                    }
                },
                folder: selectedFolderId
            };
        }
        rest = await this.mapLevelSchool(rest, spellObj);
        console.log('executed mapLevelSchool')
        rest = await this.castingTime(rest, spellObj);
        console.log('executed castingTime')
        rest = await this.duration(rest, spellObj);
        console.log('executed duration')
        rest = await this.components(rest, spellObj);
        console.log('executed components')
        rest = await this.range(rest, spellObj);
        console.log('executed range')
        rest = await this.source(rest, spellObj);
        console.log('executed source')
        // analyze classes as last
        const classes = this.#classes.exec(rest);
        var the_classes = [];
        console.log(classes);
        if (classes) {
            spbiUtils.log(classes.groups.classes);
            the_classes = classes.groups.classes.split(",").map((a_class) => a_class.trim());
        }
        rest = rest.replace(this.#classes, "");
        console.log(rest);

        rest = rest.replace(this.#text, ".<br/>");
        spellObj.system.description.value = rest;
        console.log(spellObj);

        const spell = await Item.create(spellObj);
        spbiUtils.log(spell);
        if ((the_classes.length > 0) && (foundry.utils.isNewerVersion(game.system.version, '2.4.1'))) {

            var spell_journal = game.journal.getName('imported-spells');
            console.log(spell_journal);
            console.log(the_classes);
            if (!spell_journal) {
                console.log("Creating journal");
                spell_journal = await JournalEntry.create({
                    name: 'imported-spells',
                });
                console.log(spell_journal);
                console.log(the_classes);
                var spells = new Set();
                spells.add(spell.uuid);
                console.log(spells);
                for (const theclass of the_classes) {
                    console.log(theclass);
                    var data = [{
                        name: theclass,
                        type: 'spells',
                        system: {
                            identifier: theclass,
                            grouping: "level",
                            type: "class",
                            spells: { 0: spell.uuid },
                        }
                    }];
                    var the_page = await spell_journal.createEmbeddedDocuments('JournalEntryPage', data);
                    //the_page.system.spells = new Set();
                    //the_page.system.spells.add(spell.uuid);
                }
            } else {
                // journal exists
                console.log('journal exists')
                for (const theclass of the_classes) {
                    console.log(theclass);

                    var pagelist = spell_journal.getEmbeddedCollection('pages').getName(theclass);
                    console.log(pagelist);
                    if (!pagelist) {
                        console.log('page for current class does not exists')
                        var data = [{
                            name: theclass,
                            type: 'spells',
                            system: {
                                identifier: theclass,
                                grouping: "level",
                                type: "class",
                                spells: { 0: spell.uuid },
                            }
                        }];
                        var the_page = await spell_journal.createEmbeddedDocuments('JournalEntryPage', data);
                    } else {
                        console.log('page exists so I add it')
                        //pagelist.system.spells.add(spell.uuid);
                        console.log(pagelist);
                        var arr = Array.from(pagelist.system.spells.values());
                        console.log(arr);
                        arr.push(spell.uuid)
                        console.log(arr);

                        var change = { system: { spells: arr } }
                        console.log(change)
                        pagelist.update(change)
                        //spell_journal.getEmbeddedCollection('pages').update(pagelist.toJSON());
                    }
                }
            }
        }
        // Open the sheet.
        spell.sheet.render(true);
    }

    /**
     * Parses the spell level and school from the input string, and assigns them to the spell data object.
     * 
     * @param {string} rest - The input string after extracting the spell name
     * @param {Object} spellObj - The spell data object to populate 
     * 
     * Uses a regex to match the level, school, and ritual tags. 
     * Assigns the level and school values to the spellObj.
     * Handles cantrips by setting level 0.
     * Returns the input string with the matched text removed.
    */
    static async mapLevelSchool(rest, spellObj) {
        //var levelString = lines.shift();
        console.log(rest)
        const spellLevelSchool = this.#spellLevelSchool.exec(rest);
        console.log(spellLevelSchool);
        if (spellLevelSchool) {
            spbiUtils.log(spellLevelSchool.groups.level);
            spellObj.system.level = spellLevelSchool.groups.level > 0 ? spellLevelSchool.groups.level : 0
            spbiUtils.log(spellLevelSchool.groups.school);
            spbiUtils.log(this.schoolMap[spellLevelSchool.groups.school.toLowerCase()]);
            spellObj.system.school = this.schoolMap[spellLevelSchool.groups.school.toLowerCase()]
            spbiUtils.log(spellLevelSchool.groups.spelltype);
            if (foundry.utils.isNewerVersion(game.system.version, '2.4.1')) {
                if (spellLevelSchool.groups.ritual) {
                    spellObj.system.properties.add("ritual")
                }
            } else {
                spellObj.system.components.ritual = spellLevelSchool.groups.ritual ? true : false;
            }
        }
        return rest.replace(this.#spellLevelSchool, "");
    }

    static async castingTime(rest, spellObj) {
        console.log(rest)
        const castTime = this.#castingTime.exec(rest);
        console.log(castTime);
        var activation = {
            condition: "",
            cost: 0,
            type: ""
        };
        if (castTime) {
            spbiUtils.log(castTime.groups.amount);
            activation.cost = castTime.groups.amount
            activation.type = this.activationMap[castTime.groups.act.toLowerCase()];
            spellObj.system.activation = activation
        }
        return rest.replace(this.#castingTime, "");
    }

    static async classes(rest, the_classes) {
        console.log(rest)
        const classes = this.#classes.exec(rest);
        console.log(classes);
        if (classes) {
            spbiUtils.log(classes.groups.classes);
            the_classes = classes.groups.classes.split(",").map((a_class) => a_class.trim());
        }
        return rest.replace(this.#classes, "");
    }

    static async duration(rest, spellObj) {
        console.log(rest)
        const durationReg = this.#duration.exec(rest);
        console.log(durationReg);
        var duration = {
            units: "",
            value: ""
        };
        if (durationReg) {
            spbiUtils.log(durationReg.groups.amount);
            duration.value = durationReg.groups.amount;
            duration.units = this.timeMap[durationReg.groups.time.toLowerCase()];
            spellObj.system.duration = duration;
            if (foundry.utils.isNewerVersion(game.system.version, '2.4.1')) {
                if (durationReg.groups.conc) {
                    spellObj.system.properties.add("concentration")
                }
            } else {
                spellObj.system.components.concentration = durationReg.groups.conc ? true : false;
            }
        }
        return rest.replace(this.#duration, "");
    }

    static async components(rest, spellObj) {
        console.log(rest)
        const compReg = this.#comps.exec(rest);
        console.log(compReg);
        if (compReg) {
            if (foundry.utils.isNewerVersion(game.system.version, '2.4.1')) {
                console.log('version after 2.4.1')
                if (compReg.groups.vocal) {
                    spellObj.system.properties.add("vocal")
                }
                if (compReg.groups.material) {
                    spellObj.system.properties.add("material")
                }
                if (compReg.groups.somatic) {
                    spellObj.system.properties.add("somatic")
                }
                console.log('checked svm')
                if (compReg.groups.materials_inline) {

                    spellObj.system.materials.value = compReg.groups.materials_inline
                } else {
                    console.log('no material inline')
                    const matReg = this.#materials.exec(rest);
                    console.log(matReg);
                    if (matReg?.groups?.materials) {
                        spellObj.system.materials.value = matReg.groups.materials;
                        rest.replace(this.#materials, "")
                    }
                }
            } else {
                console.log('version 2.4.1 or earlier')
                spellObj.system.components.vocal = compReg.groups.vocal ? true : false;
                spellObj.system.components.material = compReg.groups.material ? true : false;
                spellObj.system.components.somatic = compReg.groups.somatic ? true : false;
                spellObj.system.materials.value = compReg.groups.components ? compReg.groups.components : "";
            }
        }
        return rest.replace(this.#comps, "");
    }

    static async range(rest, spellObj) {
        console.log(rest)
        const rangeReg = this.#range.exec(rest);
        console.log(rangeReg);
        var range = {
            units: "",
            value: ""
        };
        if (rangeReg) {
            spbiUtils.log(rangeReg.groups.amount);
            range.value = rangeReg.groups.amount ? rangeReg.groups.amount : null;
            range.units = this.rangeUnitsMap[rangeReg.groups.units.toLowerCase()];
            spellObj.system.range = range;
        }
        if (rangeReg.groups.area_amount) {
            var target = {
                type: rangeReg.groups.area_shape ? this.targetAreaMap[rangeReg.groups.area_shape.toLowerCase()] : "",
                units: rangeReg.groups.area_units ? this.rangeUnitsMap[rangeReg.groups.area_units.toLowerCase()] : "",
                value: rangeReg.groups.area_amount ? rangeReg.groups.area_amount : 0
            };
            spellObj.system.target = target;

        }

        return rest.replace(this.#range, "");
    }

    static async source(rest, spellObj) {
        console.log(rest)
        const compSource = this.#source.exec(rest);
        console.log(compSource);
        if (compSource) {
            spellObj.system.source = compSource.groups.source ? compSource.groups.source : "";
        }
        return rest.replace(this.#source, "");
    }

}

/*


   ​
veryRare: "very rare"


equipmentTypes: Object { clothing: "Clothing", heavy: "Heavy Armor", light: "Light Armor", … }
   ​
clothing: "Clothing"
   ​
heavy: "Heavy Armor"
   ​
light: "Light Armor"
   ​
medium: "Medium Armor"
   ​
natural: "Natural Armor"
   ​
shield: "Shield"
   ​
trinket: "Trinket"
   ​
vehicle: "Vehicle Equipment"




armorTypes: Object { light: "Light Armor", medium: "Medium Armor", heavy: "Heavy Armor", … }
   ​
heavy: "Heavy Armor"
   ​
light: "Light Armor"
   ​
medium: "Medium Armor"
   ​
natural: "Natural Armor"
   ​
shield: "Shield"

toolTypes: Object { art: "Artisan's Tools", game: "Gaming Set", music: "Musical Instrument" }
   ​
art: "Artisan's Tools"
   ​
game: "Gaming Set"
   ​
music: "Musical Instrument"

*/
