/* eslint-disable no-undef */
import { registerSettings } from "./app/settings.js";
import { PartySheetForm } from "./app/party-sheet.js";
import { log, loadSystemTemplates, toProperCase, areTemplatesLoaded } from "./utils.js";
import { PartySheetCreatorForm } from "./app/party-sheet-creator.js";

let currentPartySheet = null;
let currentCreatorSheet = null;

// @ts-ignore
Handlebars.registerHelper("inArray", function (value, array, options) {
  return array.includes(value) ? options.fn(this) : options.inverse(this);
});

// @ts-ignore
Handlebars.registerHelper("carray", function () {
  return Array.prototype.slice.call(arguments, 0, -1);
});

// @ts-ignore
Handlebars.registerHelper("hccontains", function (needle, options) {
  // @ts-ignore
  needle = Handlebars.escapeExpression(needle);
  // @ts-ignore
  const haystack = game.settings.get("fvtt-party-sheet", "hiddenCharacters") ?? [];
  return haystack.indexOf(needle) > -1 ? options.fn(this) : options.inverse(this);
});

// @ts-ignore
Handlebars.registerHelper("hcifgte", function (v1, v2, options) {
  if (v1 >= v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

// @ts-ignore
Handlebars.registerHelper("hciflte", function (v1, v2, options) {
  if (v1 <= v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

// @ts-ignore
Handlebars.registerHelper("checkIndex", function (index, options) {
  if (index % 2 == 0) {
    return options.fn(this);
  }
  return options.inverse(this);
});

// @ts-ignore
Handlebars.registerHelper("hcifhidden", function (row, options) {
  const key = options.hash["key"];
  const myoptions = row[key]?.options ?? {};

  if (myoptions?.header === "show") {
    return options.inverse(this);
  } else {
    return options.fn(this);
  }
});

// @ts-ignore
Handlebars.registerHelper("getAlignment", function (row, key) {
  const myoptions = row[key]?.options ?? {};
  return myoptions.align ?? "center";
});

// @ts-ignore
Handlebars.registerHelper("getVAlignment", function (row, key) {
  const myoptions = row[key]?.options ?? {};
  if (myoptions.valign === "top" || myoptions.valign === "bottom") {
    return myoptions.valign;
  } else {
    return "inherit";
  }
});

// @ts-ignore
Handlebars.registerHelper("getColSpan", function (row, key) {
  const myoptions = row[key]?.options ?? {};
  return myoptions?.colspan ?? 1;
});

// @ts-ignore
Handlebars.registerHelper("getMaxWidth", function (row, key) {
  const myoptions = row[key]?.options ?? {};
  return myoptions?.maxwidth ? `${myoptions?.maxwidth}px` : "none";
});

// @ts-ignore
Handlebars.registerHelper("getMinWidth", function (row, key) {
  const myoptions = row[key]?.options ?? {};
  return myoptions?.minwidth ? `${myoptions?.minwidth}px` : "auto";
});

// @ts-ignore
Handlebars.registerHelper("eachInMap", function (map, block) {
  let out = "";
  //TODO: replaced map with forEach
  Object.keys(map).forEach(function (prop) {
    out += block.fn({ key: prop, value: map[prop] });
  });
  return out;
});

// @ts-ignore
Handlebars.registerHelper("debug", function (data) {
  console.log(data);
  return "";
});

// @ts-ignore
Handlebars.registerHelper("getKeys", function (obj, options) {
  const keys = Object.keys(obj);
  let result = "";
  for (const element of keys) {
    result += options.fn(element);
  }
  return result;
});

// @ts-ignore
Handlebars.registerHelper("getData", function (obj, key) {
  return obj[key].text;
});

// @ts-ignore
Handlebars.registerHelper("toUpperCase", function (str) {
  return str.toUpperCase();
});

// @ts-ignore
Handlebars.registerHelper("toProperCase", function (str) {
  return toProperCase(str);
});

// @ts-ignore
Handlebars.registerHelper("ifCond", function (v1, operator, v2, options) {
  switch (operator) {
    case "==":
      return v1 == v2 ? options.fn(this) : options.inverse(this);
    case "===":
      return v1 === v2 ? options.fn(this) : options.inverse(this);
    case "!=":
      return v1 != v2 ? options.fn(this) : options.inverse(this);
    case "!==":
      return v1 !== v2 ? options.fn(this) : options.inverse(this);
    case "<":
      return v1 < v2 ? options.fn(this) : options.inverse(this);
    case "<=":
      return v1 <= v2 ? options.fn(this) : options.inverse(this);
    case ">":
      return v1 > v2 ? options.fn(this) : options.inverse(this);
    case ">=":
      return v1 >= v2 ? options.fn(this) : options.inverse(this);
    case "&&":
      return v1 && v2 ? options.fn(this) : options.inverse(this);
    case "||":
      return v1 || v2 ? options.fn(this) : options.inverse(this);
    default:
      return options.inverse(this);
  }
});

/**
 *
 */
function togglePartySheet() {
  if (currentPartySheet?.rendered) {
    currentPartySheet.close();
  } else {
    currentPartySheet = new PartySheetForm();
    // @ts-ignore
    currentPartySheet.render(true);
  }
}

const showButton = () => {
  if (areTemplatesLoaded()) {
    // @ts-ignore
    const button = $(`<li class="control-tool "
      data-tool="PartySheet"
      aria-label="Show Party Sheet"
      role="button"
      data-tooltip="Party Sheet">
      <i class="fas fa-users"></i>
    </li>`);
    button.click(() => togglePartySheet());
    // @ts-ignore
    const controls = $("#tools-panel-token");

    if (controls.find(".control-tool[data-tool='PartySheet']")) {
      controls.append(button);
    }
  }
};

/* Hooks */

// @ts-ignore
Hooks.on("init", () => {
  log("Initializing");

  registerSettings();
});

// @ts-ignore
Hooks.on("ready", async () => {
  log("Ready");

  // @ts-ignore
  if (game.user.isGM) {
    if (!areTemplatesLoaded()) {
      log("Loading templates");
      await loadSystemTemplates();
    }
  }
  showButton();
});

// @ts-ignore
Hooks.on("renderPlayerList", () => {
  // @ts-ignore
  const showOnlyOnlineUsers = game.settings.get("fvtt-party-sheet", "enableOnlyOnline");

  // @ts-ignore
  if (!game.user.isGM || !showOnlyOnlineUsers) {
    return;
  }
  if (currentPartySheet?.rendered) {
    currentPartySheet.render(true);
  }
});

// @ts-ignore
Hooks.on("renderPartySheetCreator", () => {
  if (currentCreatorSheet?.rendered) {
    currentCreatorSheet.render(true);
  } else {
    // @ts-ignore
    const actor_types = new Set(game.actors.map((actor) => actor.type));
    // Select one actor of each type from game.actors and put it in an object with it's key being the type
    const final_objects = {};
    actor_types.forEach((type) => {
      // @ts-ignore
      const f_actor = game.actors.find((actor) => actor.type === type);
      final_objects[type] = f_actor;
    });
    // @ts-ignore
    // final_objects["system"] = game.system; - Adds System to the list of objects
    currentCreatorSheet = new PartySheetCreatorForm({ actor_types, inspect_objects: final_objects });
    // @ts-ignore
    currentCreatorSheet.render(true);
  }
});

// @ts-ignore
Hooks.on("renderSceneControls", () => {
  showButton();
});
