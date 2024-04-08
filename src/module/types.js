/**
 * @typedef { ''| 'direct' | 'direct-complex' | 'string' | 'array-string-builder' | 'largest-from-array' | 'smallest-from-array' | 'object-loop' | 'charactersheet'} SystemDataColumnType
 * @typedef { 'show' | 'hide' | 'skip' } SystemDataColumnHeader
 * @typedef { 'left' | 'center' | 'right' } SystemDataColumnAlignType
 * @typedef { 'top' | 'bottom' } SystemDataColumnVAlignType
 */

/**
 * @typedef DirectComplexObject
 * @property {string} type - The type of comparison against the primary object
 * @property {string} value - The value to compare against the primary object
 * @property {string} text - The text to process if the comparison is true
 * @property {string} [else] - The text to process if the comparison is false
 * @property {string} [ifdata] - The data to use for the comparison
 * @property {string} [matches] - The value to match against the primary object
 * @exports DirectComplexObject
 */

/**
 * @exports SystemDataColumn
 * @typedef SystemDataColumn
 * @property {string} name - The name of the column.
 * @property {SystemDataColumnType} type - The type of data to display. See below for details.
 * @property {SystemDataColumnHeader} header - Whether to show, hide, or skip the column.
 * @property {SystemDataColumnAlignType} [align] - The horizontal alignment of the column.
 * @property {SystemDataColumnVAlignType} [valign] - The vertical alignment of the column.
 * @property {number} [colspan] - The number of columns to span.
 * @property {number} [maxwidth] - The maximum width of the column in pixels.
 * @property {number} [minwidth] - The minimum width of the column in pixels.
 * @property {string | DirectComplexObject[] } text - The value to display. See below for details.
 */

/**
 * @typedef ColOptions
 * @property {SystemDataColumnHeader} header - Whether to show, hide, or skip the column.
 * @property {SystemDataColumnAlignType} [align] - The horizontal alignment of the column.
 * @property {SystemDataColumnVAlignType} [valign] - The vertical alignment of the column.
 * @property {number} [colspan] - The number of columns to span.
 * @property {number} [maxwidth] - The maximum width of the column in pixels.
 * @property {number} [minwidth] - The minimum width of the column in pixels.
 */

/**
 * @exports SystemData
 * @typedef SystemData
 * @property { string } system - The system this data is for.
 * @property { string } author - The author of this data.
 * @property { string } name - The name of this data.
 * @property { Array<Array<SystemDataColumn>> } rows - The rows of data to display. See below for details.
 * @property { string } [offline_excludes_property] - The property to use to exclude players. Note: This is optional and defaults to the actors.type property.
 * @property { Array<string> } offline_excludes - The types you want to exclude when showing offline players.
 * @property { string } [offline_includes_property] - The property to use to show players online.
 * @property { Array<string> } [offline_includes] - The types you want to include when showing online players.
 */

/**
 * @typedef { {name: string, author: string, players: any, rowcount: number} } CustomPlayerData
 */

export const no = () => {};
