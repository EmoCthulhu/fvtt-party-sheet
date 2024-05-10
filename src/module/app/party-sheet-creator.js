/* eslint-disable no-undef */

import { addColumn, delColumn, createTable, getColumnCount, addRow, delRow } from "../table-utils";
import { setPropertyByString } from "../utils";
import { colTypes, getCustomData } from "./parser";

/**
 * @typedef {Object.<string, import("../types").SystemDataColumnType>} SystemDataColumnTypeMap
 */

/**
 * @typedef {{key:string, item:any}} FocusChainLink
 * @typedef {FocusChainLink[]} FocusChain
 */

// @ts-ignore
export class PartySheetCreatorForm extends FormApplication {
  constructor({ actor_types, inspect_objects = {} }) {
    super();
    this.base_inspect_objects = inspect_objects;
    this.inspect_objects = this.copyInspectObjects();
    this.actor_types = actor_types;

    /** @type {FocusChain} */
    this.currentFocusChain = [];
    this.currentFocusType = null;
    this.currentColumnCount = 1;
    this.currentRowCount = 1;
    this.table = createTable();
    this.selectedColumnIndex = 0;
    this.selectedRowIndex = 0;
    this.curEditing = "none";
    this.currentTemplateData = {
      name: "",
      author: "",
      // @ts-ignore
      system: game.system.id,
      /** @type {Array<Array<import("../types").SystemDataColumn>>} */
      rows: [
        [
          {
            header: "show",
            name: "Unnamed",
            type: "direct",
            text: "",
          },
        ],
      ],
      offline_excludes: [],
    };
    this.curColumn = this.getColumn(0, 0);
    this.demo_actor = null;
    this.currentTransferData = "";
    this.chainAddress = "";
    this.jsonDisplay = "";
    this.subtype = "";
    this.errorMsg = "";
    this.selectedSubItemIndex = 0;
    this.highlightSelectedColumn();
  }

  // eslint-disable-next-line no-unused-vars
  _updateObject(_event, _formData) {}

  /**
   * Get the column at the specified row and column index
   *
   * @param {number} row - The row index
   * @param {number} col - The column index
   * @returns {import("../types").SystemDataColumn}  The column at the specified row and column index
   * @memberof PartySheetCreatorForm
   */
  getColumn(row, col) {
    return this.currentTemplateData.rows[row][col];
  }

  getData(options) {
    const coreItems = this.currentFocusType ? [...Object.keys(this.inspect_objects), "<= back"] : [];
    // @ts-ignore
    return mergeObject(super.getData(options), {
      coreItems,
      actorTypes: this.actor_types,
      currentRowCount: this.currentRowCount,
      currentColumnCount: this.currentColumnCount,
      selectedColumnIndex: this.selectedColumnIndex,
      selectedRowIndex: this.selectedRowIndex,
      currentFocusType: this.currentFocusType,
      focusTypeList: this.base_inspect_objects ? Object.keys(this.base_inspect_objects) : [],
      chainAddress: this.chainAddress,
      curColumn: this.curColumn,
      curEditing: this.curEditing,
      jsonDisplay: this.jsonDisplay,
      subtype: this.subtype,
      currentTemplateData: this.currentTemplateData,
      // @ts-ignore
      currentSystem: game.system.id,
      colTypes,
      table: this.table.outerHTML,
      errorMsg: this.errorMsg,
      selectedSubItemIndex: this.selectedSubItemIndex,
    });
  }

  static get defaultOptions() {
    // @ts-ignore
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "fvtt-party-sheet-creator",
      classes: ["form"],
      title: "Party Sheet Creator",
      template: "modules/fvtt-party-sheet/templates/party-sheet-creator.hbs",
      // @ts-ignore
      // eslint-disable-next-line no-undef
      width: $(window).width() > 960 ? 960 : $(window).width() - 100,
      // @ts-ignore
      // eslint-disable-next-line no-undef
      height: $(window).height() > 800 ? 800 : $(window).height() - 100,
    });
  }

  closeWindow() {
    // @ts-ignore
    this.close();
  }

  bindEvent(selector, eventName, handler, html) {
    // @ts-ignore
    $(selector, html).on(eventName, handler.bind(this));
  }

  handleOnNameChange(event) {
    this.currentTemplateData.name = event.currentTarget.value;
    this.updateColumn();
  }

  handleOnAuthorChange(event) {
    this.currentTemplateData.author = event.currentTarget.value;
    this.updateColumn();
  }

  fetchCellData() {
    this.curColumn.name =
      this.currentTemplateData.rows[this.selectedRowIndex][this.selectedColumnIndex]?.name ?? "Unnamed";
    this.curColumn.type =
      this.currentTemplateData.rows[this.selectedRowIndex][this.selectedColumnIndex]?.type ?? "direct";
    this.curColumn.text = this.currentTemplateData.rows[this.selectedRowIndex][this.selectedColumnIndex]?.text;
    this.curColumn.header =
      this.currentTemplateData.rows[this.selectedRowIndex][this.selectedColumnIndex]?.header ?? "show";
  }
  setCellData() {
    this.currentTemplateData.rows[this.selectedRowIndex][this.selectedColumnIndex] = {
      name: this.curColumn.name,
      type: this.curColumn.type,
      text: this.curColumn.text,
      header: this.curColumn.header,
    };
  }

  highlightSelectedColumn() {
    const rowCount = this.table.tHead.rows.length;
    for (let i = 0; i < rowCount; i++) {
      const cellCount = this.table.tHead.rows[i].cells.length;
      for (let j = 0; j < cellCount; j++) {
        const cell = this.table.tHead.rows[i].cells[j];
        if (cell.classList.contains("selectedColumn")) {
          cell.classList.remove("selectedColumn");
        }
      }
    }
    let cl = this.table.tHead.rows[this.selectedRowIndex].cells[this.selectedColumnIndex].classList;
    if (!cl.contains("selectedColumn")) {
      cl.add("selectedColumn");
    }
  }

  selectColumnByIndex(index) {
    this.selectedColumnIndex = index;
    this.selectedRowIndex = 0;

    this.highlightSelectedColumn();

    this.fetchCellData();

    this.curEditing = "none";

    this.jsonDisplay = JSON.stringify(this.currentTemplateData, null, 2);
    // @ts-ignore
    this.render(true);
  }

  activateListeners(html) {
    super.activateListeners(html);

    this.bindEvent("input[id='fvtt-creator-sheet-name']", "change", this.handleOnNameChange, html);
    this.bindEvent("input[id='fvtt-creator-sheet-author']", "change", this.handleOnAuthorChange, html);
    this.bindEvent('div[class="dd-item"]', "click", this.handleFocusItemClick, html);
    this.bindEvent('button[id="fvtt-creator-column-dec-btn"]', "click", this.handleColumnDec, html);
    this.bindEvent('button[id="fvtt-creator-add-column-btn"]', "click", this.handleColumnInc, html);
    this.bindEvent('button[id="fvtt-creator-row-dec-btn"]', "click", this.handleRowDec, html);
    this.bindEvent('button[id="fvtt-creator-row-inc-btn"]', "click", this.handleRowInc, html);
    this.bindEvent('input[id="fvtt-creator-col-name"]', "change", this.handleColNameChange, html);
    this.bindEvent('select[id="fvtt-creator-col-type"]', "change", this.handleColTypeChange, html);
    this.bindEvent('select[id="fvtt-creator-dc-type"]', "change", this.handleDCTypeChange, html);
    this.bindEvent('input[id="fvtt-creator-col-text"]', "change", this.handleColTextChange, html);
    this.bindEvent('select[id="fvtt-creator-sheet-demo-select"]', "change", this.handleDemoChange, html);
    this.bindEvent('input[class*="unitext"]', "change", this.universalTextChange, html);
    this.bindEvent('button[id="fvtt-creator-add-subcolumn-btn"]', "click", this.handleAddSubColumn, html);
    this.bindEvent('button[id="fvtt-creator-remove-column-btn"]', "click", this.handleRemSubColumn, html);
    this.bindEvent('select[id="subselector"]', "change", this.handleSelectSubItem, html);
    this.bindEvent('input[id="fvtt-creator-col-header"]', "change", this.handleColHeaderChange, html);

    // @ts-ignore
    $("thead td", html).click((event) => {
      // @ts-ignore
      const index = $(event.currentTarget).index();
      this.selectColumnByIndex(index);
    });

    const draggableElements = document.querySelectorAll('div[draggable="true"]');
    draggableElements.forEach((element) => {
      element.addEventListener("dragstart", (event) => {
        this.currentTransferData = element.textContent;
        // @ts-ignore
        event.data = element.textContent;
        // @ts-ignore
        event.dataTransfer.effectAllowed = "link";
      });
    });

    const droppableElements = document.querySelectorAll('input[class="dropzone"]');
    droppableElements.forEach((element) => {
      element.addEventListener("drop", (event) => {
        const modifiedAddress = this.chainAddress.split(".").slice(1).join(".") ?? [];
        const newText =
          modifiedAddress.length > 0 ? `${modifiedAddress}.${this.currentTransferData}` : this.currentTransferData;
        // @ts-ignore
        event.currentTarget.value =
          // @ts-ignore
          `${event.currentTarget.value} ${newText}`;
        // @ts-ignore
        event.currentTarget.value = event.currentTarget.value.trim();
        // @ts-ignore
        this.curColumn.text = event.currentTarget.value;
        event.currentTarget.dispatchEvent(new Event("change"));
      });
      element.addEventListener("dragover", (event) => {
        event.preventDefault();
        // @ts-ignore
        event.dataTransfer.dropEffect = "link";
      });
      element.addEventListener("dragenter", (event) => {
        event.preventDefault();
      });
    });
  }

  // eslint-disable-next-line no-unused-vars
  handleColHeaderChange(_event) {
    this.curColumn.header = this.curColumn.header == "show" ? "hide" : "show";
    this.updateColumn();
  }

  handleSelectSubItem(event) {
    // Get the index of the event.currentTarget.value in the Select
    if (event.currentTarget.selectedIndex === this.selectedSubItemIndex) {
      return false;
    }
    this.selectedSubItemIndex = event.currentTarget.selectedIndex;

    // @ts-ignore
    this.render(true);
  }

  handleAddSubColumn() {
    let validated = false;
    if (this.subtype === "exists") {
      validated = this.validateExistsColumns();
    }

    if (validated) {
      this.addSubTypeColumn();
    }

    // @ts-ignore
    this.render(true);
  }

  handleRemSubColumn() {}

  addSubTypeColumn() {
    this.selectedSubItemIndex += 1;
    // @ts-ignore
    this.curColumn.text.push({
      type: this.subtype,
      value: "",
      text: "",
      else: "",
    });
  }

  clearError() {
    this.errorMsg = "";
    // @ts-ignore
    this.render(true);
  }

  validateExistsColumns() {
    this.errorMsg = "";
    // @ts-ignore
    if ($("#fvtt-creator-dc-ifdata").val() === "" || $("#fvtt-creator-dc-text").val() === "") {
      this.errorMsg = "Please fill out required fields.";
      return false;
    }
    return true;
  }

  handleDemoChange(event) {
    if (event.currentTarget.value === this.currentFocusType) {
      // @ts-ignore
      this.render(true);
      return;
    }
    this.currentFocusType = event.currentTarget.value;
    this.clearChain();
    this.pushChain(this.currentFocusType, this.base_inspect_objects[this.currentFocusType]);
    this.inspect_objects = this.inspect_objects[this.currentFocusType];
    // @ts-ignore
    const demoActor = game.actors.filter((actor) => actor.type === this.currentFocusType)[0] || null;
    if (demoActor) {
      this.demo_actor = demoActor;
    }

    this.updateTable();

    // @ts-ignore
    this.render(true);
  }

  handleDCTypeChange(event) {
    this.subtype = event.currentTarget.value;
    // @ts-ignore
    this.render(true);
  }

  getColumnByIndex(index) {
    return this.table.rows[0].cells[index];
  }

  universalTextChange(event) {
    // get the json address from the data-name attribute eg data-name="match"
    // @ts-ignore
    const address = event.currentTarget.dataset.name;
    // @ts-ignore
    const value = event.currentTarget.value;
    if (!Array.isArray(this.curColumn.text)) {
      this.curColumn.text = [];
    }

    this.curColumn.text[this.selectedSubItemIndex] = setPropertyByString(this.generateSubItem(), address, value);
    this.updateColumn();
  }

  generateSubItem() {
    let curItm = this.curColumn.text[this.selectedSubItemIndex] ?? {};
    if (this.subtype === "exists") {
      curItm = {
        type: "exists",
        // @ts-ignore
        value: curItm.value ?? "",
        // @ts-ignore
        text: curItm.text ?? "",
        // @ts-ignore
        else: curItm.else ?? "",
      };
    } else if (this.subtype === "match") {
      curItm = {
        type: "match",
        // @ts-ignore
        ifdata: curItm.ifdata ?? "",
        // @ts-ignore
        matches: curItm.matches ?? "",
        // @ts-ignore
        text: curItm.text ?? "",
        // @ts-ignore
        else: curItm.else ?? "",
      };
    }
    return curItm;
  }

  updateColumn() {
    this.currentTemplateData.rows[this.selectedRowIndex][this.selectedColumnIndex] = {
      name: this.curColumn.name,
      type: this.curColumn.type,
      text: this.curColumn.text,
      header: this.curColumn.header,
    };

    this.updateTable();

    // @ts-ignore
    this.render(true);
  }

  updateTable() {
    this.table.tHead.rows[this.selectedRowIndex].cells[this.selectedColumnIndex].innerHTML =
      this.curColumn.header === "show" ? this.curColumn.name : "";

    let outStr = this.curColumn.text;
    let generated_dropdowns = 0;

    try {
      if (this.demo_actor) {
        outStr = getCustomData(this.demo_actor, this.curColumn.type, this.curColumn.text, generated_dropdowns);
      }
    } catch (ex) {
      console.log(ex);
    }

    for (const element of this.table.tBodies[0].rows) {
      element.cells[this.selectedColumnIndex].innerHTML = Array.isArray(outStr) ? "" : outStr;
    }

    this.jsonDisplay = JSON.stringify(this.currentTemplateData, null, 2);
  }

  handleColNameChange(event) {
    // @ts-ignore
    const colName = event.currentTarget.value;
    this.curColumn.name = colName;
    this.curEditing = "name";
    this.updateColumn();
  }

  handleColTypeChange(event) {
    // @ts-ignore
    // @ts-ignore
    const colType = event.currentTarget.value;
    // selectedColumn.colType = colType;
    // @ts-ignore
    this.curEditing = "type";
    this.curColumn.type = colType;
    if (this.curColumn.type === "direct-complex") {
      this.curColumn.text = [];
      this.subtype = "exists";
    }
    this.updateColumn();
  }

  handleColTextChange(event) {
    // @ts-ignore
    const colText = event.currentTarget.value;
    this.curColumn.text = colText;
    this.curEditing = "text";
    this.updateColumn();
  }

  pushChain(key, item) {
    this.currentFocusChain.push({
      key,
      item,
    });
    this.chainAddress += `.${key}`;
    if (this.chainAddress?.startsWith(".")) {
      this.chainAddress = this.chainAddress.substring(1);
    }
    if (this.chainAddress?.endsWith(".")) {
      this.chainAddress = this.chainAddress.substring(1);
    }
  }

  popChain() {
    if (this.currentFocusChain.length !== 0) {
      this.chainAddress = this.chainAddress.substring(0, this.chainAddress.lastIndexOf("."));
      if (this.chainAddress?.startsWith(".")) {
        this.chainAddress = this.chainAddress.substring(1);
      }
      if (this.chainAddress?.endsWith(".")) {
        this.chainAddress = this.chainAddress.substring(1);
      }
      return this.currentFocusChain.pop();
    }

    return null;
  }

  clearChain() {
    this.currentFocusChain = [];
    this.chainAddress = "";
  }

  copyInspectObjects() {
    //return structuredClone(this.base_inspect_objects);
    return JSON.parse(JSON.stringify(this.base_inspect_objects));
  }

  processItemClick(itemkey) {
    if (itemkey === "<= back") {
      this.popChain();
      if (this.currentFocusChain.length === 0) {
        this.inspect_objects = this.copyInspectObjects();
      } else {
        this.inspect_objects = this.currentFocusChain[this.currentFocusChain.length - 1].item;
      }
      // @ts-ignore
    } else if (Array.isArray(this.inspect_objects[itemkey]) || typeof this.inspect_objects[itemkey] === "object") {
      if (this.currentFocusType === null) {
        this.updateColumn();
      }

      this.pushChain(itemkey, this.inspect_objects[itemkey]);
      this.inspect_objects = this.inspect_objects[itemkey];
    }
    // @ts-ignore
    setTimeout(() => {
      // @ts-ignore
      this.render(true);
    }, 100);
  }

  handleFocusItemClick(event) {
    // @ts-ignore
    let itemkey = event.currentTarget.dataset.itemkey;
    this.processItemClick(itemkey);
    // @ts-ignore
    this.render(true);
  }

  handleColumnDec() {
    const column_count = getColumnCount(this.table);
    if (column_count > 1) {
      delColumn(this.table);
      this.currentColumnCount = column_count - 1;
      this.selectedColumnIndex = column_count - 2;
    }
    // @ts-ignore
    this.render(true);
  }

  handleColumnInc() {
    const column_count = getColumnCount(this.table);
    addColumn(this.table, "Unnamed");
    this.currentColumnCount = column_count + 1;
    this.selectedColumnIndex = column_count;
    this.selectColumnByIndex(this.selectedColumnIndex);
    // @ts-ignore
    this.render(true);
  }

  handleRowDec() {
    delRow(this.table);
    // // @ts-ignore
    // const row_count = table.find("tr").length;
    // if (row_count > 1) {
    //   table.find("tr").last().remove();
    // }
    // this.currentRowCount = row_count - 1;
    // @ts-ignore
    this.render(true);
  }

  handleRowInc() {
    addRow(this.table);
    // @ts-ignore
    // const row_count = table.find("tr").length;
    // const column_count = table.find("tr").first().children().length;
    // let new_row = "<tr>";
    // for (let i = 0; i < column_count; i++) {
    //   new_row += "<td></td>";
    // }
    // new_row += "</tr>";
    // table.append(new_row);
    // this.currentRowCount = row_count + 1;
    // // @ts-ignore
    this.render(true);
  }
}
