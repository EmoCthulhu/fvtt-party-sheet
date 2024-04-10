import {
  cleanString,
  extractPropertyByString,
  parseExtras,
  parsePluses,
  removeTrailingComma,
  TemplateProcessError,
  trimIfString,
} from "../utils";

export const colTypes = [
  "direct",
  "direct-complex",
  "charactersheet",
  "array-string-builder",
  "string",
  "object-loop",
  "largest-from-array",
  "smallest-from-array",
];

/**
 * Get the custom data for a character.
 * @param {*} character - The character to get the data for
 * @param {string} type - The type of data to get
 * @param {*} value - The value to get
 * @param {number} generated_dropdowns - The number of dropdowns generated
 * @returns {string} The text to render
 * @memberof PartySheetForm
 */
export function getCustomData(character, type, value, generated_dropdowns) {
  try {
    switch (type) {
      case "direct":
        return processDirect(character, type, value);
      case "direct-complex":
        return processDirectComplex(character, type, value);
      case "charactersheet":
        // @ts-ignore
        return new Handlebars.SafeString(
          `<input type="image" name="fvtt-party-sheet-actorimage" data-actorid="${
            character.uuid
          }" class="token-image" src="${character.prototypeToken.texture.src}" title="${
            character.prototypeToken.name
          }" width="36" height="36" style="transform: rotate(${character.prototypeToken.rotation ?? 0}deg);"/>`,
        );
      case "array-string-builder":
        return processArrayStringBuilder(character, type, value);
      case "string":
        return value;
      case "object-loop":
        return processObjectLoop(character, type, value, generated_dropdowns);
      case "largest-from-array":
        return processLargestFromArray(character, type, value);
      case "smallest-from-array":
        return processSmallestFromArray(character, type, value);
      default:
        return "";
    }
  } catch (ex) {
    console.log(ex);
    throw new TemplateProcessError(ex);
  }
}

/**
 * Parse a direct string.
 * @param {*} character - The character to parse
 * @param {*} value - The value to parse
 * @returns {[boolean, string]} Whether a safe string is needed and the value
 */
export function parseDirect(character, value) {
  let isSafeStringNeeded = false;
  value = cleanString(value);
  //Parse out normal data
  for (const m of value.split(" ")) {
    const fValue = extractPropertyByString(character, m);
    if (fValue !== undefined) {
      value = value.replace(m, fValue);
    }
  }
  if (value.indexOf("{charactersheet}") > -1) {
    isSafeStringNeeded = true;
    value = value.replaceAll(
      "{charactersheet}",
      `<input type="image" name="fvtt-party-sheet-actorimage" data-actorid="${
        character.uuid
      }" class="token-image" src="${character.prototypeToken.texture.src}" title="${
        character.prototypeToken.name
      }" width="36" height="36" style="transform: rotate(${character.prototypeToken.rotation ?? 0}deg);"/>`,
    );
  }
  value = parsePluses(value);
  [isSafeStringNeeded, value] = parseExtras(value, isSafeStringNeeded);

  return [isSafeStringNeeded, value];
}

/**
 * Process a "direct" type
 * @param {*} character - The character to process
 * @param {string} type - The type of data to process
 * @param {*} value - The value to process
 * @returns {string} The text to render
 */
export function processDirect(character, type, value) {
  let isSafeStringNeeded = false;
  [isSafeStringNeeded, value] = parseDirect(character, value);

  //Finally detect if a safe string cast is needed.
  if (isSafeStringNeeded) {
    // @ts-ignore
    return new Handlebars.SafeString(value);
  } else {
    return value;
  }
}

/**
 * Process a "direct-complex" type
 * @param {*} character - The character to process
 * @param {string} type - The type of data to process
 * @param {import("../types").DirectComplexObject[]} value - The value to process
 * @returns {string} The text to render
 */
export function processDirectComplex(character, type, value) {
  // Call .trim() on item.value but only if it's a string
  let outputText = "";
  for (let item of value) {
    const trimmedItem = trimIfString(item);
    if (trimmedItem.type === "exists") {
      const eValue = extractPropertyByString(character, trimmedItem.value);
      if (eValue) {
        outputText += trimmedItem.text.replaceAll(trimmedItem.value, eValue);
      } else if (trimmedItem.else) {
        const nValue = extractPropertyByString(character, trimmedItem.else);
        if (nValue) {
          outputText += nValue;
        } else {
          outputText += trimmedItem.else;
        }
      }
    } else if (trimmedItem.type === "match") {
      const mValue = extractPropertyByString(character, trimmedItem.ifdata);
      const match_value = extractPropertyByString(character, trimmedItem.matches) ?? trimmedItem.matches;
      if (mValue === match_value) {
        outputText += extractPropertyByString(character, trimmedItem.text) ?? trimmedItem.text;
      } else if (trimmedItem.else) {
        const mnValue = extractPropertyByString(character, trimmedItem.else);
        if (mnValue) {
          outputText += mnValue;
        } else {
          outputText += trimmedItem.else;
        }
      }
    } else if (trimmedItem.type === "match-any") {
      const maValues = (Array.isArray(trimmedItem.text) ? trimmedItem.text : [trimmedItem.text]).map((val) =>
        extractPropertyByString(character, val),
      );
      const matchValue = extractPropertyByString(character, trimmedItem.matches) ?? trimmedItem.matches;

      for (const maVal of maValues) {
        if (maVal === matchValue) {
          outputText += extractPropertyByString(character, trimmedItem.text) ?? trimmedItem.text;
        } else if (trimmedItem.else) {
          const manValue = extractPropertyByString(character, trimmedItem.else);
          if (manValue) {
            outputText += manValue;
          } else {
            outputText += trimmedItem.else;
          }
        }
      }
    }
  }
  let isSafeStringNeeded = false;
  [isSafeStringNeeded, outputText] = parseDirect(character, outputText);
  // @ts-ignore
  return isSafeStringNeeded ? new Handlebars.SafeString(outputText) : outputText;
}

/**
 * Process an "array-string-builder" type
 * @param {*} character - The character to process
 * @param {string} type - The type of data to process
 * @param {string} value - The value to process
 * @returns {string} The text to rendera
 */
export function processArrayStringBuilder(character, type, value) {
  const objName = value.split("=>")[0].trim();
  let outStr = value.split("=>")[1];
  let finalStr = "";

  let objData = extractPropertyByString(character, objName);

  if (!Array.isArray(objData) && objData instanceof Set === false) {
    objData = Object.keys(objData).map((key) => {
      return objData[key];
    });
  }

  const regValue = /(?:\*\.|[\w.]+)+/g;
  const reg = new RegExp(regValue);
  const allMatches = Array.from(outStr.matchAll(reg), (match) => match[0]);

  if (objData.size ?? objData.length !== 0) {
    for (const objSubData of objData) {
      for (const m of allMatches) {
        if (m === "value") {
          finalStr += outStr.replace(m, objSubData);
          continue;
        }
        outStr = outStr.replace(m, extractPropertyByString(objSubData, m));
      }
    }
  } else {
    return "";
  }
  if (finalStr === "") {
    finalStr = outStr;
  }
  finalStr = finalStr.trim();
  finalStr = cleanString(finalStr);
  finalStr = removeTrailingComma(finalStr);
  return finalStr === value ? "" : finalStr;
}

/**
 * Process an "object-loop" type
 * @param {*} character - The character to process
 * @param {string} type - The type of data to process
 * @param {*} value - The value to process
 * @param {number} generated_dropdowns - The number of dropdowns generated
 * @returns {string} The text to render
 */
export function processObjectLoop(character, type, value, generated_dropdowns) {
  const isDropdown = value.trim().startsWith("{dropdown} ");
  const dropdownKeys = [];

  if (isDropdown) {
    value = value.replace("{dropdown} ", "");
    generated_dropdowns += 1;
  }
  const chunks = value.split("||").map((thing) => thing.trim());
  let finStr = "";
  let finStrs = [];
  let outputText = "";
  let validDropdownSections = 0;

  chunks.forEach((chunk) => {
    let outStr = "";
    let prefix = "";
    let objName = chunk.split("=>")[0].trim();
    const findPrefixMatches = objName.match(/^(.*)\s/);

    if (findPrefixMatches?.length) {
      prefix = findPrefixMatches[1].trim();

      objName = objName.replace(prefix, "").trim();
    }

    let objFilter = null;

    const filterMatches = objName.match(/(?<=.)\{([^}]+)\}(?=$)/);

    if (filterMatches?.length) {
      objFilter = filterMatches[1];
      objName = objName.replace(`{${objFilter}}`, "");
    }

    if (isDropdown) {
      dropdownKeys.push(objFilter || objName);
      validDropdownSections += 1;
    }

    const actualValue = chunk.split("=>")[1];

    const objData = extractPropertyByString(character, objName);
    if (!objData) {
      return "";
    }

    let loopData = [];
    const objKeys = Object.keys(objData);
    if (
      objKeys.length == 6 &&
      objKeys[0] == "documentClass" &&
      objKeys[1] == "name" &&
      objKeys[2] == "model" &&
      objKeys[3] == "_initialized" &&
      objKeys[4] == "_source" &&
      objKeys[5] == "invalidDocumentIds"
    ) {
      loopData = Object.keys(objData._source).map((key) => {
        return objData._source[key];
      });
    } else {
      loopData = Object.keys(objData).map((key) => {
        return objData[key];
      });
    }

    if (objFilter) {
      loopData = loopData.filter((data) => data.type === objFilter);
    }

    if (loopData.length === 0) {
      if (isDropdown) {
        dropdownKeys.pop();
        validDropdownSections -= 1;
      }
    }

    const regValue = /(?<!{)\s(?:\w+(?:\.\w+)*)+\s(?!})/g;
    const reg = new RegExp(regValue);
    const allMatches = Array.from(actualValue.matchAll(reg), (match) => match[0].trim());

    if (loopData.length ?? loopData.length !== 0) {
      for (const objSubData of loopData) {
        let tempLine = actualValue;
        for (const m of allMatches) {
          tempLine = tempLine.replace(m, extractPropertyByString(objSubData, m));
        }
        outStr += tempLine;
      }
    } else {
      return "";
    }
    if (outStr) {
      finStrs.push(prefix + outStr);
    }
  });

  let dropdownString = "";
  let isSafeStringNeeded = false;

  if (isDropdown && dropdownKeys.length === validDropdownSections && validDropdownSections > 1) {
    isSafeStringNeeded = true;
    dropdownString = `<select class='fvtt-party-sheet-dropdown' data-dropdownsection='${generated_dropdowns}' >`;
    for (let i = 0; i < finStrs.length; i++) {
      dropdownString += `<option value="${i}">${dropdownKeys[i]}</option>`;
    }
    dropdownString += "</select><br/>";
  }
  if (isDropdown) {
    const dd_section_start = (idx) =>
      `<div data-dropdownsection='${generated_dropdowns}' data-dropdownoption='${idx}' ${
        idx != 0 ? 'style="display: none;"' : ""
      } >`;
    const dd_section_end = "</div>";
    finStrs = finStrs.map((str, idx) => dd_section_start(idx) + cleanString(str) + dd_section_end);
    finStr = finStrs.join("");
  } else {
    finStr = finStrs.join(chunks?.length > 0 ? "" : ", ");
    finStr = finStr.trim();
    finStr = cleanString(finStr);
  }

  [isSafeStringNeeded, outputText] = parseExtras(finStr);

  return isSafeStringNeeded
    ? // @ts-ignore
      new Handlebars.SafeString((dropdownString || "") + outputText)
    : outputText;
}

/**
 * Process the largest value from an array.
 * @param {*} character - The character to process
 * @param {*} type - The type of data to process
 * @param {*} value - The value to process
 * @returns {string} The text to render
 */
export function processLargestFromArray(character, type, value) {
  let lArr = extractPropertyByString(character, value);

  if (!Array.isArray(lArr) && lArr instanceof Set === false) {
    lArr = Object.keys(lArr).map((key) => {
      if (typeof lArr[key] !== "object") {
        return lArr[key];
      } else if (lArr[key].value) {
        return lArr[key].value;
      } else return "";
    });
  } else return "";

  if (lArr.length ?? lArr.length !== 0) {
    return lArr.reduce((a, b) => (a > b ? a : b));
  } else {
    return "";
  }
}

/**
 * Process the smallest value from an array.
 * @param {*} character - The character to process
 * @param {*} type - The type of data to process
 * @param {*} value - The value to process
 * @returns {string} The text to render
 */
export function processSmallestFromArray(character, type, value) {
  let sArr = extractPropertyByString(character, value);

  if (!Array.isArray(sArr) && sArr instanceof Set === false) {
    sArr = Object.keys(sArr).map((key) => {
      if (typeof sArr[key] !== "object") {
        return sArr[key];
      } else if (sArr[key].value) {
        return sArr[key].value;
      } else return "";
    });
  } else return "";

  if (sArr.length ?? sArr.length !== 0) {
    return sArr.reduce((a, b) => (a < b ? a : b));
  } else {
    return "";
  }
}
