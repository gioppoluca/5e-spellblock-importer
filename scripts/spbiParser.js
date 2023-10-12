import {
    spbiUtils
} from "./spbiUtils.js";


export class spbiParser {
    static #spellLevelSchool = /^((?<level>\d+)?(nd|rd|st|th)?[-\t ]?(level|cantrip)?[ ]?)?(?<school>abjuration|conjuration|enchantment|divination|illusion|transmutation|necromancy|evocation)[ ]?(?<spelltype>spell|cantrip)?(\((?<ritual>ritual)\))?/i
    static #castingTime = /(casting time)[:\s]*((?<amount>\d*)\s+(?<act>bonus action|action))/i
    static #duration = /(duration)[:\s]*(?<conc>concentration, up to|Concentration,)?\s?((?<amount>\d*)?\s?(?<time>permanent|until dispelled or triggered|until dispelled|special|hours|minutes|rounds|months|turns|years|round|minute|hour|month|turn|year|instantaneous))/i
    static #comps = /(components)[:\s]*(?<vocal>v)?[\t ,]*(?<somatic>s)?[\t ,]*(?<material>m)?[\t ,]*(\((?<components>.*)\))?/i
    static #source = /source[: \t-]*(?<source>.*)/i
    static #range = /(range)[:\s]*(?<amount>\d+)?[\s,]*(?<units>self|feet|touch|special, see below|special)?[\s,]*(\(((?<area_amount>\d+)[\s,-]*(?<area_units>foot|mile)?[\s,]*(?<area_shape>radius|line)?)\))?/i
    static #text = /(\.\s?)/ig

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

    static async parseInput(content, selectedFolderId) {
        spbiUtils.log(content);
        spbiUtils.log(selectedFolderId);
        // Clean up string and remove all empty lines and trim existing ones
        let cleaned = content.replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, "");
        cleaned = cleaned.split(/\r?\n/).filter(line => line.trim() !== '').join('\n')
        spbiUtils.log(cleaned);
        // First line will be name
        var lines = cleaned.split("\n");   // split all lines into array
        var spellName = lines.shift();   // read and remove first line
        var rest = lines.join("\n");
        var spellObj = {
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
        }
        rest = await this.mapLevelSchool(rest, spellObj);
        rest = await this.castingTime(rest, spellObj);
        rest = await this.duration(rest, spellObj);
        rest = await this.components(rest, spellObj);
        rest = await this.range(rest, spellObj);
        rest = await this.source(rest, spellObj);
        console.log(rest);
        rest = rest.replace(this.#text, ".<br/>");
        spellObj.system.description.value = rest;
        console.log(spellObj)

        const spell = await Item.create(spellObj);
        spbiUtils.log(spell);

        // Open the sheet.
        spell.sheet.render(true);
        //     // re-join the remaining lines

    }

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
            spellObj.system.components.ritual = spellLevelSchool.groups.ritual ? true : false;
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
            activation.type = castTime.groups.act.toLowerCase()
            spellObj.system.activation = activation
        }
        return rest.replace(this.#castingTime, "");
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
            spellObj.system.components.concentration = durationReg.groups.conc ? true : false;
        }
        return rest.replace(this.#duration, "");
    }

    static async components(rest, spellObj) {
        console.log(rest)
        const compReg = this.#comps.exec(rest);
        console.log(compReg);
        if (compReg) {
            spellObj.system.components.vocal = compReg.groups.vocal ? true : false;
            spellObj.system.components.material = compReg.groups.material ? true : false;
            spellObj.system.components.somatic = compReg.groups.somatic ? true : false;
            spellObj.system.materials.value = compReg.groups.components ? compReg.groups.components : "";
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