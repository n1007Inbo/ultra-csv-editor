export class FlatCSVData {
  rawText: string;
  rowStartIndices: Int32Array;
  offsets: Int32Array;
  totalRows: number;
  colCount: number;
  headerOffset: number;
  editedCells: Map<string, string>;

  constructor(
    rawText: string,
    rowStartIndices: Int32Array,
    offsets: Int32Array,
    totalRows: number,
    colCount: number,
    headerOffset: number = 0,
    editedCells: Map<string, string> = new Map()
  ) {
    this.rawText = rawText;
    this.rowStartIndices = rowStartIndices;
    this.offsets = offsets;
    this.totalRows = totalRows;
    this.colCount = colCount;
    this.headerOffset = headerOffset;
    this.editedCells = editedCells;
  }

  getCell(row: number, col: number): string {
    const editKey = `${row},${col}`;
    if (this.editedCells.has(editKey)) {
      return this.editedCells.get(editKey)!;
    }
    const actualRow = row + this.headerOffset;
    if (actualRow >= this.totalRows || actualRow < 0) return '';
    
    const startCell = this.rowStartIndices[actualRow];
    const endCell = this.rowStartIndices[actualRow + 1];
    const rowCols = endCell - startCell;
    
    if (col < 0 || col >= rowCols) return '';
    
    const cellIdx = (startCell + col) * 2;
    const start = this.offsets[cellIdx];
    const len = this.offsets[cellIdx + 1];
    const val = this.rawText.substring(start, start + len);
    
    // Unescape double quotes
    if (val.startsWith('"') && val.endsWith('"')) {
      let unescaped = val.substring(1, val.length - 1);
      if (unescaped.includes('""')) {
        unescaped = unescaped.replace(/""/g, '"');
      }
      return unescaped;
    }
    return val;
  }

  cloneWithCellEdit(row: number, col: number, newValue: string): FlatCSVData {
    const newEdited = new Map(this.editedCells);
    newEdited.set(`${row},${col}`, newValue);
    return new FlatCSVData(
      this.rawText,
      this.rowStartIndices,
      this.offsets,
      this.totalRows,
      this.colCount,
      this.headerOffset,
      newEdited
    );
  }

  get length() {
    return Math.max(0, this.totalRows - this.headerOffset);
  }
}

export function createFlatCSVProxy(flatData: FlatCSVData): string[][] {
  const rowHandler = (rowIdx: number) => ({
    get(target: any, prop: string | symbol): any {
      if (prop === 'length') {
        return flatData.colCount;
      }
      if (prop === 'map') {
        return (cb: (val: string, index: number) => any) => {
          const res = [];
          for (let c = 0; c < flatData.colCount; c++) {
            res.push(cb(flatData.getCell(rowIdx, c), c));
          }
          return res;
        };
      }
      if (prop === Symbol.iterator) {
        return function* () {
          for (let c = 0; c < flatData.colCount; c++) {
            yield flatData.getCell(rowIdx, c);
          }
        };
      }
      if (typeof prop === 'string') {
        const c = parseInt(prop, 10);
        if (!isNaN(c)) {
          return flatData.getCell(rowIdx, c);
        }
      }
      return Reflect.get(target, prop);
    }
  });

  return new Proxy([], {
    get(target: any, prop: string | symbol): any {
      if (prop === 'length') {
        return flatData.length;
      }
      if (prop === 'map') {
        return (cb: (row: any, index: number) => any) => {
          const res = [];
          const len = flatData.length;
          for (let r = 0; r < len; r++) {
            res.push(cb(new Proxy([], rowHandler(r)), r));
          }
          return res;
        };
      }
      if (prop === 'forEach') {
        return (cb: (row: any, index: number) => void) => {
          const len = flatData.length;
          for (let r = 0; r < len; r++) {
            cb(new Proxy([], rowHandler(r)), r);
          }
        };
      }
      if (prop === 'filter') {
        return (cb: (row: any, index: number) => boolean) => {
          const res = [];
          const len = flatData.length;
          for (let r = 0; r < len; r++) {
            const rowProxy = new Proxy([], rowHandler(r));
            if (cb(rowProxy, r)) {
              res.push(rowProxy);
            }
          }
          return res;
        };
      }
      if (prop === 'slice') {
        return (start?: number, end?: number) => {
          const len = flatData.length;
          const s = start === undefined ? 0 : (start < 0 ? Math.max(0, len + start) : start);
          const e = end === undefined ? len : (end < 0 ? Math.max(0, len + end) : end);
          const res = [];
          for (let r = s; r < e; r++) {
            res.push(new Proxy([], rowHandler(r)));
          }
          return res;
        };
      }
      if (prop === Symbol.iterator) {
        return function* () {
          const len = flatData.length;
          for (let r = 0; r < len; r++) {
            yield new Proxy([], rowHandler(r));
          }
        };
      }
      if (typeof prop === 'string') {
        const r = parseInt(prop, 10);
        if (!isNaN(r)) {
          return new Proxy([], rowHandler(r));
        }
      }
      return Reflect.get(target, prop);
    }
  }) as unknown as string[][];
}

export function stringArrayToFlatCSV(arr: string[][]): FlatCSVData {
  let totalCells = 0;
  for (let r = 0; r < arr.length; r++) {
    totalCells += arr[r].length;
  }

  const offsets = new Int32Array(totalCells * 2);
  const rowStartIndices = new Int32Array(arr.length + 1);
  rowStartIndices[0] = 0;

  const pieces: string[] = [];
  let currentOffset = 0;
  let cellIdx = 0;

  for (let r = 0; r < arr.length; r++) {
    const row = arr[r];
    for (let c = 0; c < row.length; c++) {
      const cellVal = row[c] || '';
      pieces.push(cellVal);
      const len = cellVal.length;
      offsets[cellIdx * 2] = currentOffset;
      offsets[cellIdx * 2 + 1] = len;
      currentOffset += len;
      cellIdx++;
    }
    rowStartIndices[r + 1] = cellIdx;
  }

  const rawText = pieces.join('');
  let maxCols = 0;
  for (let r = 0; r < arr.length; r++) {
    const cols = rowStartIndices[r + 1] - rowStartIndices[r];
    if (cols > maxCols) maxCols = cols;
  }

  return new FlatCSVData(
    rawText,
    rowStartIndices,
    offsets,
    arr.length,
    maxCols,
    0
  );
}

export function convertToArrayOfArrays(flatData: FlatCSVData): string[][] {
  const result: string[][] = [];
  const rows = flatData.length;
  for (let r = 0; r < rows; r++) {
    const row: string[] = [];
    for (let c = 0; c < flatData.colCount; c++) {
      row.push(flatData.getCell(r, c));
    }
    result.push(row);
  }
  return result;
}
