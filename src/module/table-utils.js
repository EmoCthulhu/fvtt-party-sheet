/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable require-jsdoc */
export function createTable() {
  let table = document.createElement("table");
  table.setAttribute("id", "fvtt-creator-table");
  table.createTBody();
  table.createTHead();
  addRow(table);
  addColumn(table, "Unnamed");
  return table;
}

export function addRow(table) {
  const table_head = table.tHead;
  table_head.insertRow();
  const table_body = table.tBodies[0];
  table_body.insertRow();
}

export function delRow(table) {
  const table_head = table.tHead;
  table_head.rows[table_head.rows.length - 1].remove();
  const table_body = table.tBodies[0];
  table_body.rows[table_body.rows.length - 1].remove();
}

export function addColumn(table, colName) {
  const table_head = table.tHead;
  const new_head_cell = table_head.rows[0].insertCell();
  new_head_cell.innerHTML = colName;
  const table_body = table.tBodies[0];
  for (const element of table_body.rows) {
    element.insertCell();
  }
}

export function delColumn(table) {
  const table_head = table.tHead;
  table_head.deleteCell();
  const table_body = table.tBodies[0];
  const table_rows = table_body.rows;
  for (const element of table_rows) {
    element.deleteCell();
  }
}

export function getRowCount(table) {
  return table.rows.length;
}

export function getColumnCount(table) {
  return table.rows[0].cells.length;
}

export function getCell(table, row, col) {
  return table.rows[row].cells[col];
}

export function setCell(table, row, col, value) {
  table.rows[row].cells[col].innerHTML = value;
}
