import Papa from 'papaparse';

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'PARSE_CSV') {
    const { text, config } = payload;
    try {
      const result = Papa.parse(text, {
        skipEmptyLines: false, // We want to show empty rows too
        dynamicTyping: false,   // Keep everything as string for editor editing
        ...config,
      }) as any;

      self.postMessage({
        type: 'PARSE_SUCCESS',
        payload: {
          data: result.data,
          errors: result.errors,
          meta: result.meta,
        },
      });
    } catch (err: any) {
      self.postMessage({
        type: 'PARSE_ERROR',
        payload: err.message || 'Failed to parse CSV file',
      });
    }
  } else if (type === 'UNPARSE_CSV') {
    const { data, config } = payload;
    try {
      const csv = Papa.unparse(data, {
        quotes: false, // default Papa quotes logic
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
