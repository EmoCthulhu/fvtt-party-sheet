/* eslint-disable no-undef */
import {
  extractPropertyByString,
  getCustomTemplates,
  setSelectedTemplate,
  TemplateProcessError,
  updateSelectedTemplate,
} from "../utils.js";
import { HiddenCharactersSettings } from "./hidden-characters-settings.js";
import { getCustomData } from "./parser.js";

const FEEDBACK_URL = "https://github.com/EddieDover/fvtt-party-sheet/issues/new/choose";
const BUGREPORT_URL =
  "https://github.com/EddieDover/fvtt-party-sheet/issues/new?assignees=EddieDover&labels=bug&projects=&template=bug_report.yml&title=%5BBug%5D%3A+";

const DEFAULT_EXCLUDES = ["npc"];

let generated_dropdowns = 0;
// @ts-ignore
export class PartySheetForm extends FormApplication {
  constructor() {
    super();
  }

  /**
   * Get the custom player data.
   * @param { import("../types.js").SystemData } data - The system data
   * @returns { import("../types.js").CustomPlayerData } The custom player data
   * @memberof PartySheetForm
   */
  getCustomPlayerData(data) {
    //@ts-ignore
    const showDebugOutput = game.settings.get("fvtt-party-sheet", "showDebugInfo");
    const excludeTypes = data?.offline_excludes ? data.offline_excludes : DEFAULT_EXCLUDES;

    if (!data) {
      return { name: "", author: "", players: [], rowcount: 0 };
    }

    // @ts-ignore
    const showOnlyOnlineUsers = game.settings.get("fvtt-party-sheet", "enableOnlyOnline");
    // @ts-ignore
    const hiddenCharacters = game.settings.get("fvtt-party-sheet", "hiddenCharacters");

    if (showDebugOutput) {
      console.log("======= FVTT-PARTY-SHEET DEBUG ACTORS LIST ======= ");
      console.log(
        "These are all the actors in your game. They have not yet been filtered based on your inclusions/exclusions.",
      );
    }

    let actorList = showOnlyOnlineUsers
      ? // @ts-ignore
        game.users.filter((user) => user.active && user.character).map((user) => user.character)
      : // @ts-ignore
        game.actors.filter((actor) => {
          // @ts-ignore
          if (game.settings.get("fvtt-party-sheet", "showDebugInfo")) {
            console.log(actor);
          }
          if (data.offline_includes_property && data.offline_includes) {
            const propval = extractPropertyByString(actor, data.offline_includes_property);
            return data.offline_includes.includes(propval);
          } else if (excludeTypes) {
            let incpropval = actor.type;
            if (data.offline_excludes_property) {
              incpropval = extractPropertyByString(actor, data.offline_excludes_property);
            }
            return !excludeTypes.includes(incpropval);
          }
        });

    if (showDebugOutput) {
      console.log("====================================== ");
    }

    if (!showOnlyOnlineUsers) {
      actorList = actorList.filter((player) => !hiddenCharacters.includes(player.uuid));
    }

    try {
      if (showDebugOutput) {
        console.log("======= FVTT-PARTY-SHEET DEBUG CHARACTER LIST ======= ");
        console.log("These are all the actors your party sheet will display.");
      }
      const finalActorList = actorList
        .map((character) => {
          const userChar = character;

          // @ts-ignore
          if (game.settings.get("fvtt-party-sheet", "showDebugInfo")) {
            console.log(userChar);
          }

          let row_data = [];

          //TODO: Does this work if forEach instead of map?
          data.rows.forEach((row_obj) => {
            let customData = {};

            row_obj.forEach((colobj) => {
              const colname = colobj.name;
              customData[colname] = {
                text: getCustomData(userChar, colobj.type, colobj.text, generated_dropdowns),
                options: {
                  align: colobj.align,
                  valign: colobj.valign,
                  colspan: colobj.colspan,
                  maxwidth: colobj.maxwidth,
                  minwidth: colobj.minwidth,
                  header: colobj.header,
                },
              };
            });
            row_data.push(customData);
          });

          return row_data;
        })
        .filter((player) => player);
      if (showDebugOutput) {
        console.log("========================================= ");
      }
      return { name: data.name, author: data.author, players: finalActorList, rowcount: data.rows.length };
    } catch (ex) {
      // Detect if this is a TemplateProcessError or not
      if (ex instanceof TemplateProcessError) {
        ex.data.name = data.name;
        ex.data.author = data.author;
        throw ex;
      } else {
        console.log(ex);
      }
    }
    return { name: "", author: "", players: [], rowcount: 0 };
  }

  // eslint-disable-next-line no-unused-vars
  _updateObject(event, formData) {
    // Don't delete this function or FoundryVTT complains...
  }

  getData(options) {
    // @ts-ignore
    const minimalView = game.settings.get("fvtt-party-sheet", "enableMinimalView");
    // @ts-ignore
    const hiddenCharacters = game.settings.get("fvtt-party-sheet", "hiddenCharacters");
    // @ts-ignore
    const enableOnlyOnline = game.settings.get("fvtt-party-sheet", "enableOnlyOnline");
    // @ts-ignore
    const customSystems = getCustomTemplates();

    const applicableSystems = customSystems.filter((data) => {
      // @ts-ignore
      return data.system === game.system.id;
    });
    let selectedIdx = setSelectedTemplate() ? applicableSystems.findIndex((data) => data === setSelectedTemplate()) : 0;

    updateSelectedTemplate(applicableSystems[selectedIdx]);
    const selectedSystem = setSelectedTemplate();
    let selectedName, selectedAuthor, players, rowcount;
    let invalidTemplateError = false;
    try {
      let result = this.getCustomPlayerData(selectedSystem);
      selectedName = result.name;
      selectedAuthor = result.author;
      players = result.players;
      rowcount = result.rowcount;
    } catch (ex) {
      if (ex instanceof TemplateProcessError) {
        // @ts-ignore
        ui.notifications.error(
          `There was an error processing the template for ${selectedSystem.name} by ${selectedSystem.author}.`,
        );
        selectedName = ex.data.name;
        selectedAuthor = ex.data.author;
        invalidTemplateError = true;
      } else {
        console.log(ex);
      }
    }

    // @ts-ignore
    return mergeObject(super.getData(options), {
      minimalView,
      hiddenCharacters,
      enableOnlyOnline,
      rowcount,
      players,
      applicableSystems,
      selectedName,
      selectedAuthor,
      invalidTemplateError,
      // @ts-ignore
      overrides: this.overrides,
    });
  }

  static get defaultOptions() {
    // @ts-ignore
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "fvtt-party-sheet-party-sheet",
      classes: ["form"],
      title: "Party Sheet",
      // resizable: true,
      template: "modules/fvtt-party-sheet/templates/party-sheet.hbs",
      // @ts-ignore
      width: "auto", // $(window).width() > 960 ? 960 : $(window).width() - 100,
      height: "auto", //$(window).height() > 800 ? 800 : $(window).height() - 100,
    });
  }

  openOptions(event) {
    event.preventDefault();
    const overrides = {
      onexit: () => {
        setTimeout(() => {
          // @ts-ignore
          this.render(true);
        }, 350);
      },
    };
    const hcs = new HiddenCharactersSettings(overrides);
    // @ts-ignore
    hcs.render(true);
  }

  closeWindow() {
    // @ts-ignore
    this.close();
  }

  openActorSheet(event) {
    event.preventDefault();
    const actorId = event.currentTarget.dataset.actorid;
    // @ts-ignore
    const actor = game.actors.get(actorId.replace("Actor.", ""));
    actor.sheet.render(true);
  }

  changeSystem(event) {
    const selectedSystemName = event.currentTarget.value.split("___")[0];
    const selectedSystemAuthor = event.currentTarget.value.split("___")[1];
    const selectedIndex =
      getCustomTemplates().findIndex(
        (data) => data.name === selectedSystemName && data.author === selectedSystemAuthor,
      ) ?? -1;
    if (selectedIndex != -1) {
      const selectedCustomTemplate = getCustomTemplates()[selectedIndex];
      updateSelectedTemplate(selectedCustomTemplate);
    }
    // @ts-ignore
    this.render(true);
  }

  activateListeners(html) {
    super.activateListeners(html);

    // @ts-ignore
    $('button[name="fvtt-party-sheet-options"]', html).click(this.openOptions.bind(this));
    // @ts-ignore
    $('button[name="fvtt-party-sheet-close"]', html).click(this.closeWindow.bind(this));
    // @ts-ignore
    $('input[name="fvtt-party-sheet-actorimage"]', html).click(this.openActorSheet.bind(this));
    // @ts-ignore
    $('select[name="fvtt-party-sheet-system"]', html).change(this.changeSystem.bind(this));
    // @ts-ignore
    $('button[name="fvtt-party-sheet-creator"]', html).click(this.openCreator.bind(this));
    // @ts-ignore
    $('button[name="feedback"]', html).click(this.onFeedback.bind(this));
    // @ts-ignore
    $('button[name="bugreport"]', html).click(this.onBugReport.bind(this));
    // @ts-ignore
    $('select[class="fvtt-party-sheet-dropdown"]', html).change((event) => {
      const dropdownSection = event.currentTarget.dataset.dropdownsection;
      const dropdownValue = event.currentTarget.value;

      // @ts-ignore
      $(`div[data-dropdownsection="${dropdownSection}"]`).hide();

      // @ts-ignore
      $(`div[data-dropdownsection="${dropdownSection}"][data-dropdownoption="${dropdownValue}"]`).show();
    });
  }

  // eslint-disable-next-line no-unused-vars
  openCreator(event) {
    // Fire the hook "openPartySheetCreator"
    console.log("firing hook");
    // @ts-ignore
    Hooks.call("renderPartySheetCreator");
  }

  onFeedback(event) {
    event.preventDefault();
    const newWindow = window.open(FEEDBACK_URL, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = undefined;
  }

  onBugReport(event) {
    event.preventDefault();
    const newWindow = window.open(BUGREPORT_URL, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = undefined;
  }
}
