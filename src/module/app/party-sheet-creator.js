/* eslint-disable no-undef */

import { addColumn, delColumn, createTable, getColumnCount, addRow, delRow } from "../table-utils";
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
      rows: [
        [
          {
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
  }

  // eslint-disable-next-line no-unused-vars
  _updateObject(event, formData) {
    // @ts-ignore
    console.log("Updating object");
  }

  getColumn(row, col) {
    return this.currentTemplateData.rows[row][col];
  }

  getData(options) {
    const coreItems = [...Object.keys(this.inspect_objects), "<= back"];
    // @ts-ignore
    return mergeObject(super.getData(options), {
      coreItems,
      actorTypes: this.actor_types,
      currentRowCount: this.currentRowCount,
      currentColumnCount: this.currentColumnCount,
      selectedColumnIndex: this.selectedColumnIndex,
      selectedRowIndex: this.selectedRowIndex,
      currentFocusType: this.currentFocusType,
      chainAddress: this.chainAddress,
      curColumn: this.curColumn,
      curEditing: this.curEditing,
      jsonDisplay: this.jsonDisplay,
      currentTemplateData: this.currentTemplateData,
      // @ts-ignore
      currentSystem: game.system.id,
      colTypes,
      table: this.table.outerHTML,
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
      this.currentTemplateData.rows[this.selectedRowIndex][this.selectedColumnIndex]?.colName ?? "Unnamed";
    this.curColumn.type =
      this.currentTemplateData.rows[this.selectedRowIndex][this.selectedColumnIndex]?.colType ?? "direct";
    this.curColumn.text = this.currentTemplateData.rows[this.selectedRowIndex][this.selectedColumnIndex]?.colText ?? {};
  }
  setCellData() {
    this.currentTemplateData.rows[this.selectedRowIndex][this.selectedColumnIndex] = {
      name: this.curColumn.name,
      type: this.curColumn.type,
      text: this.curColumn.text,
    };
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

    // @ts-ignore
    $("thead td", html).click((event) => {
      // @ts-ignore
      const index = $(event.currentTarget).index();
      console.log(index);
      this.selectedColumnIndex = index;
      this.selectedRowIndex = 0;

      this.fetchCellData();

      this.curEditing = "none";

      this.jsonDisplay = JSON.stringify(this.currentTemplateData, null, 2);
      // @ts-ignore
      this.render(true);
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

  handleDCTypeChange(event) {}

  getColumnByIndex(index) {
    return this.table.rows[0].cells[index];
  }

  updateColumn() {
    this.currentTemplateData.rows[this.selectedRowIndex][this.selectedColumnIndex] = {
      name: this.curColumn.name,
      type: this.curColumn.type,
      text: this.curColumn.text,
    };
    console.log(this.selectedColumnIndex, this.selectedRowIndex);
    console.log(this.curColumn);

    this.table.tHead.rows[this.selectedRowIndex].cells[this.selectedColumnIndex].innerHTML = this.curColumn.name;

    let outStr = this.curColumn.text;
    let generated_dropdowns = 0;

    console.log(this.demo_actor, this.curColumn.type, this.curColumn.text, generated_dropdowns);
    try {
      if (this.demo_actor) {
        outStr = getCustomData(this.demo_actor, this.curColumn.type, this.curColumn.text, generated_dropdowns);
        console.log(outStr, typeof outStr);
      }
    } catch (ex) {
      console.log(ex);
    }

    for (const element of this.table.tBodies[0].rows) {
      element.cells[this.selectedColumnIndex].innerHTML = Array.isArray(outStr) ? "" : outStr;
    }

    this.jsonDisplay = JSON.stringify(this.currentTemplateData, null, 2);

    // @ts-ignore
    this.render(true);
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
    console.log("new type", this.curColumn.type);
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
    console.log(this.currentFocusChain);
    console.log(this.chainAddress);
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
    } else {
      this.currentFocusType = null;
    }

    console.log(this.chainAddress);

    return null;
  }

  copyInspectObjects() {
    //return structuredClone(this.base_inspect_objects);
    return JSON.parse(JSON.stringify(this.base_inspect_objects));
  }

  processItemClick(itemkey) {
    console.log("clicked", itemkey);
    if (itemkey === "<= back") {
      this.popChain();
      if (this.currentFocusChain.length === 0) {
        this.currentFocusType = null;
        this.inspect_objects = this.copyInspectObjects();
      } else {
        this.inspect_objects = this.currentFocusChain[this.currentFocusChain.length - 1].item;
      }
      // @ts-ignore
    } else if (Array.isArray(this.inspect_objects[itemkey]) || typeof this.inspect_objects[itemkey] === "object") {
      if (this.currentFocusType === null) {
        const type_name = itemkey;
        console.log("About to start grabbing ", type_name);
        // @ts-ignore
        const demo_actor = game.actors.filter((actor) => actor.type === type_name)[0] || null;
        if (demo_actor) {
          this.demo_actor = demo_actor;
          this.currentFocusType = type_name;
          this.updateColumn();
        }
      }

      this.pushChain(itemkey, this.inspect_objects[itemkey]);
      this.inspect_objects = this.inspect_objects[itemkey];
    }
    // @ts-ignore
    this.render(true);
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
