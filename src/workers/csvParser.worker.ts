import Papa from 'papaparse';

function parseCSVFlat(text: string, delimiter: string = ',') {
  const len = text.length;
  
  let cellCapacity = 100000;
  let offsets = new Int32Array(cellCapacity * 2);
  let cellCount = 0;

  let rowCapacity = 10000;
  let rowStartIndices = new Int32Array(rowCapacity + 1);
  let rowCount = 0;
  
  rowStartIndices[0] = 0;
  
  let i = 0;
  let inQuotes = false;
  let cellStart = 0;
  
  const addCell = (start: number, end: number) => {
    if (cellCount >= cellCapacity) {
      cellCapacity *= 2;
      const newOffsets = new Int32Array(cellCapacity * 2);
      newOffsets.set(offsets);
      offsets = newOffsets;
    }
    offsets[cellCount * 2] = start;
    offsets[cellCount * 2 + 1] = end - start;
    cellCount++;
  };
  
  const addRow = () => {
    rowCount++;
    if (rowCount >= rowCapacity) {
      rowCapacity *= 2;
      const newRowStarts = new Int32Array(rowCapacity + 1);
      newRowStarts.set(rowStartIndices);
      rowStartIndices = newRowStarts;
    }
    rowStartIndices[rowCount] = cellCount;
  };

  while (i < len) {
    const char = text[i];
    
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        // Escaped quote
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
    } else if (!inQuotes && char === delimiter) {
      addCell(cellStart, i);
      i++;
      cellStart = i;
    } else if (!inQuotes && (char === '\n' || char === '\r')) {
      addCell(cellStart, i);
      if (char === '\r' && text[i + 1] === '\n') {
        i += 2;
      } else {
        i++;
      }
      addRow();
      cellStart = i;
    } else {
      i++;
    }
  }
  
  // Trailing cell
  if (cellStart < len || (len > 0 && (text[len - 1] === delimiter || text[len - 1] === '\n' || text[len - 1] === '\r'))) {
    addCell(cellStart, len);
  }
  
  if (rowStartIndices[rowCount] < cellCount) {
    addRow();
  }
  
  const finalOffsets = offsets.subarray(0, cellCount * 2);
  const finalRowStarts = rowStartIndices.subarray(0, rowCount + 1);
  
  // Find max columns
  let maxCols = 0;
  for (let r = 0; r < rowCount; r++) {
    const cols = finalRowStarts[r + 1] - finalRowStarts[r];
    if (cols > maxCols) maxCols = cols;
  }
  
  return {
    offsets: finalOffsets,
    rowStartIndices: finalRowStarts,
    rowCount,
    maxCols
  };
}

function unescapeCell(val: string): string {
  if (val.startsWith('"') && val.endsWith('"')) {
    val = val.substring(1, val.length - 1);
    if (val.includes('""')) {
      val = val.replace(/""/g, '"');
    }
  }
  return val;
}

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'PARSE_CSV') {
    const { text, file, config } = payload;
    try {
      let textToParse = text || '';
      if (file) {
        textToParse = await file.text();
      }

      const delimiter = config?.delimiter || ',';
      const { offsets, rowStartIndices, rowCount, maxCols } = parseCSVFlat(textToParse, delimiter);

      // Extract headers from row 0
      const headers: string[] = [];
      if (rowCount > 0) {
        const startCell = rowStartIndices[0];
        const endCell = rowStartIndices[1];
        for (let c = startCell; c < endCell; c++) {
          const start = offsets[c * 2];
          const len = offsets[c * 2 + 1];
          const val = textToParse.substring(start, start + len);
          headers.push(unescapeCell(val));
        }
      }

      // To keep types serializable and copy-free, transfer the ArrayBuffers
      // copy offsets and rowStartIndices to ensure we pass original untrimmed buffers or fresh transferables
      const finalOffsets = new Int32Array(offsets);
      const finalRowStarts = new Int32Array(rowStartIndices);

      (self as any).postMessage({
        type: 'PARSE_SUCCESS',
        payload: {
          rawText: textToParse,
          offsets: finalOffsets,
          rowStartIndices: finalRowStarts,
          rowCount,
          maxCols,
          headers,
          meta: {
            delimiter,
            size: file ? file.size : (config?.size || textToParse.length),
          },
        },
      }, [finalOffsets.buffer, finalRowStarts.buffer]);
    } catch (err: any) {
      self.postMessage({
        type: 'PARSE_ERROR',
        payload: err.message || 'Failed to parse CSV file',
      });
    }
  } else if (type === 'UNPARSE_CSV') {
    const { data, config } = payload;
    try {
      // Unparsing can use Papa.unparse for compatibility
      const csv = Papa.unparse(data, {
        quotes: false,
        ...config,
      });

      self.postMessage({
        type: 'UNPARSE_SUCCESS',
        payload: csv,
      });
    } catch (err: any) {
      self.postMessage({
        type: 'UNPARSE_ERROR',
        payload: err.message || 'Failed to generate CSV data',
      });
    }
  }
};
