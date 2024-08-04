![](https://img.shields.io/badge/Foundry-v10-informational)
<!--- Downloads @ Latest Badge -->
<!--- replace <user>/<repo> with your username/repository -->
![Latest Release Download Count](https://img.shields.io/github/downloads/gioppoluca/5e-spellblock-importer/latest/module.zip)

<!--- Forge Bazaar Install % Badge -->
<!--- replace <your-module-name> with the `name` in your manifest -->
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2F5e-spellblock-importer&colorB=4aa94a)

# 5e Spellblock Importer

Do you have a number of homebrewed spells or items around that you want to use in your foundry 5e game?  Are you tired of manually entering all of them?

5e Spellblock Importer got you covered! You can now copy and paste the standard spell or item format in the import dialog and "Voilà!" the new spell or item is ready to be used or further customized in your world.

You will find this button in the bottom of the **Items** tab:

![Import Button](doc/item-button.png)

It will open the import dialog

![Import Dialog](doc/import-dialog.png)

You can paste and edit, if necessary, the spellblock or the itemblock.

Remeber to choose in the **small dialog** if you are importing a spell or an item.

The important thing is that the spell or item name **has** to be the first line of the block.
Here is an example of a spellblock:
![Import Dialog with spell](doc/import-dialog-spell.png)
When you are satisfied you can press the **Import** button and you will see the spell or item imported in your world.
![Imported Spell](doc/imported-spell.png)

For items Weapons that have a subtype that matches an existing object in the SRD compendium it will clone the attributes from there to speed edit time, you will be able to alter the datails after the import without having to rewrite all the data of the weapon.

## Acknoledments
Thanks to [ArcaneRoboBrain](https://foundryvtt.com/community/arcanerobobrain) for the creation of [5e Statblock importer](https://foundryvtt.com/packages/5e-statblock-importer) from which module i've taken code and inspiration.

## Support
Please open issues on this repo for any problems that you can have using this module.

If you want to support this work 
<a href="https://www.buymeacoffee.com/lucagioppo" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
