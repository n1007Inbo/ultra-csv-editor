import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { Grid } from './components/Grid';
import { Sidebar } from './components/Sidebar';
import { FindReplace } from './components/FindReplace';
import { SettingsModal, type FileSettings } from './components/SettingsModal';
import { CommandPalette } from './components/CommandPalette';
import { LicenseModal } from './components/LicenseModal';
import { useHistory } from './hooks/useHistory';
import { UploadCloud, FileSpreadsheet, Sun, Moon, Info, Check, X, Download, Settings, Award } from 'lucide-react';
import CSVWorker from './workers/csvParser.worker?worker';

export default function App() {
  const [hasActiveFile, setHasActiveFile] = useState(false);
  const [fileName, setFileName] = useState('Untitled.csv');
  const [fileMeta, setFileMeta] = useState<{
    size: string;
    delimiter: string;
    encoding: string;
  } | null>(null);

  // Layout & Styling state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [dragActive, setDragActive] = useState(false);
  
  // Modern CSV settings & filters state
  const [settings, setSettings] = useState<FileSettings>({
    delimiter: ',',
    encoding: 'UTF-8',
    lineEnding: 'LF',
    hasHeader: true,
    readOnly: false,
    freezeRows: 0,
    freezeCols: 0,
    zebraStripes: true,
  });
  const [activeFilters, setActiveFilters] = useState<{ [colIndex: number]: string }>({});

  const handleFilterColumn = useCallback((colIndex: number, query: string) => {
    setActiveFilters(prev => {
      const next = { ...prev };
      if (!query.trim()) {
        delete next[colIndex];
      } else {
        next[colIndex] = query.trim().toLowerCase();
      }
      return next;
    });
  }, []);

  // Recent files state
  const [recentFiles, setRecentFiles] = useState<{ name: string; size: string; timestamp: number }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ultra_csv_recent_files') || '[]');
    } catch {
      return [];
    }
  });

  const addRecentFile = useCallback((name: string, size: string) => {
    setRecentFiles(prev => {
      const filtered = prev.filter(f => f.name !== name);
      const next = [{ name, size, timestamp: Date.now() }, ...filtered].slice(0, 5);
      localStorage.setItem('ultra_csv_recent_files', JSON.stringify(next));
      return next;
    });
  }, []);

  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Subscription/License state
  const [licenseKey, setLicenseKey] = useState<string | null>(localStorage.getItem('ultra_csv_license'));
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);

  const handleActivateLicense = (key: string): boolean => {
    localStorage.setItem('ultra_csv_license', key);
    setLicenseKey(key);
    showToast('Pro features unlocked!', 'success');
    return true;
  };

  const handleDeactivateLicense = () => {
    localStorage.removeItem('ultra_csv_license');
    setLicenseKey(null);
    showToast('Switched to Free plan', 'info');
  };

  // PWA Install Prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // Grid widths state
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const nativeFilePathRef = useRef<string | null>(null);

  // Selection state
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [selection, setSelection] = useState<{
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } | null>(null);

  // Search state
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeCell, setWholeCell] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [searchIndex, setSearchIndex] = useState(0);

  // History state management
  const {
    data,
    columns,
    pushState,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  } = useHistory([['', '', '']], ['A', 'B', 'C']);

  // Listen for PWA installation trigger
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect if already installed / standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBtn(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User install choice: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  // Web Worker ref
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Instantiate web worker
    workerRef.current = new CSVWorker();

    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'PARSE_SUCCESS') {
        const parsedRows = payload.data as string[][];
        const meta = payload.meta;

        if (parsedRows.length === 0) {
          showToast('CSV is empty', 'error');
          return;
        }

        // Parse headers
        let headers: string[] = [];
        let gridData: string[][] = [];

        // Simple header detection: if first row exists and columns length > 0
        if (parsedRows.length > 0) {
          headers = parsedRows[0].map((h, i) => (h ? h.trim() : `Column ${i + 1}`));
          gridData = parsedRows.slice(1);
        }

        // If no rows left in data, treat headers as first row of data and generate alphabet headers
        if (gridData.length === 0) {
          gridData = [parsedRows[0]];
          headers = parsedRows[0].map((_, i) => getColLetter(i));
        }

        // Ensure all rows match headers length
        const maxCols = headers.length;
        const normalizedData = gridData.map(row => {
          const newRow = [...row];
          while (newRow.length < maxCols) newRow.push('');
          return newRow.slice(0, maxCols);
        });

        // Initialize column widths based on content size
        const widths = headers.map((header, colIndex) => {
          let maxLen = header.length;
          // Check first 100 rows
          const sampleRows = normalizedData.slice(0, 100);
          sampleRows.forEach(row => {
            const cellVal = row[colIndex] || '';
            if (cellVal.length > maxLen) maxLen = cellVal.length;
          });
          return Math.max(80, Math.min(300, maxLen * 8 + 22));
        });

        reset(normalizedData, headers);
        setColumnWidths(widths);
        setHasActiveFile(true);
        setActiveCell({ row: 0, col: 0 });
        setSelection({ startRow: 0, startCol: 0, endRow: 0, endCol: 0 });
        showToast('CSV loaded successfully', 'success');

        if (meta) {
          setFileMeta({
            size: formatBytes(meta.size || 0),
            delimiter: meta.delimiter || 'Comma',
            encoding: 'UTF-8',
          });
        }
      } else if (type === 'UNPARSE_SUCCESS') {
        if (window.electronAPI && nativeFilePathRef.current) {
          window.electronAPI.saveFile(nativeFilePathRef.current, payload)
            .then(() => {
              showToast('File saved successfully', 'success');
            })
            .catch((err: any) => {
              showToast(`Save failed: ${err.message}`, 'error');
            });
        } else {
          // Trigger file download
          const blob = new Blob([payload], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', fileName);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast('CSV exported successfully', 'success');
        }
      } else if (type === 'PARSE_ERROR' || type === 'UNPARSE_ERROR') {
        showToast(payload, 'error');
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [fileName, reset]);

  // Toast notifier helper
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Convert index to column letter (A, B, C... Z, AA, AB...)
  const getColLetter = (index: number): string => {
    let temp = index;
    let letter = '';
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // File loading trigger
  const handleFileLoad = (file: File) => {
    setFileName(file.name);
    showToast(`Parsing ${file.name}...`, 'info');
    addRecentFile(file.name, formatBytes(file.size));

    workerRef.current?.postMessage({
      type: 'PARSE_CSV',
      payload: {
        file,
        config: {
          delimiter: settings.delimiter === ',' ? undefined : settings.delimiter,
        },
      },
    });
  };

  const handleBrowseFile = async () => {
    if (window.electronAPI) {
      try {
        const fileInfo = await window.electronAPI.openFile();
        if (!fileInfo) return;

        setFileName(fileInfo.name);
        nativeFilePathRef.current = fileInfo.filePath;
        showToast(`Opening ${fileInfo.name}...`, 'info');
        addRecentFile(fileInfo.name, formatBytes(fileInfo.size));

        const text = await window.electronAPI.readChunk(fileInfo.filePath);
        workerRef.current?.postMessage({
          type: 'PARSE_CSV',
          payload: {
            text,
            config: {
              size: fileInfo.size,
              delimiter: settings.delimiter === ',' ? undefined : settings.delimiter,
            },
          },
        });
      } catch (err: any) {
        showToast(err.message || 'Failed to open file natively', 'error');
      }
    } else {
      document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
    }
  };

  // Create new blank CSV
  const handleNewFile = () => {
    const defaultData = Array(50).fill(null).map(() => Array(10).fill(''));
    const defaultCols = Array(10).fill(null).map((_, i) => getColLetter(i));
    const defaultWidths = Array(10).fill(120);

    reset(defaultData, defaultCols);
    setColumnWidths(defaultWidths);
    setFileName('Untitled.csv');
    setFileMeta({
      size: '0 Bytes',
      delimiter: settings.delimiter,
      encoding: 'UTF-8',
    });
    setHasActiveFile(true);
    setActiveCell({ row: 0, col: 0 });
    setSelection({ startRow: 0, startCol: 0, endRow: 0, endCol: 0 });
    showToast('New CSV spreadsheet created', 'success');
  };

  // CSV Unparsing (Export)
  const handleDownload = () => {
    if (!workerRef.current) return;
    showToast('Exporting CSV...', 'info');
    
    // Stitch headers back as first row of output if configured
    const fullOutput = settings.hasHeader ? [columns, ...data] : data;
    workerRef.current.postMessage({
      type: 'UNPARSE_CSV',
      payload: {
        data: fullOutput,
        config: {
          delimiter: settings.delimiter,
          newline: settings.lineEnding === 'CRLF' ? '\r\n' : '\n',
        },
      },
    });
  };

  // Column Resizer Handler
  const handleColumnResize = useCallback((colIndex: number, width: number) => {
    setColumnWidths(prev => {
      const next = [...prev];
      next[colIndex] = width;
      return next;
    });
  }, []);

  // Theme Toggler
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileLoad(e.dataTransfer.files[0]);
    }
  };

  // Search logic highlights
  const searchMatches = useMemo(() => {
    if (!findText) return [];
    const matches: { row: number; col: number }[] = [];

    let regex: RegExp;
    try {
      let flags = 'g';
      if (!matchCase) flags += 'i';
      let pattern = findText;

      if (!useRegex) {
        pattern = findText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      }
      if (wholeCell) {
        pattern = `^${pattern}$`;
      }
      regex = new RegExp(pattern, flags);
    } catch {
      return []; // invalid regex, yield no matches
    }

    data.forEach((row, r) => {
      row.forEach((cell, c) => {
        regex.lastIndex = 0;
        if (regex.test(cell || '')) {
          matches.push({ row: r, col: c });
        }
      });
    });

    return matches;
  }, [data, findText, matchCase, wholeCell, useRegex]);

  // Reset search index when matches change
  useEffect(() => {
    setSearchIndex(0);
  }, [findText, matchCase, wholeCell, useRegex]);

  const handleSearchNext = () => {
    if (searchMatches.length > 0) {
      setSearchIndex(prev => (prev + 1) % searchMatches.length);
    }
  };

  const handleSearchPrev = () => {
    if (searchMatches.length > 0) {
      setSearchIndex(prev => (prev - 1 + searchMatches.length) % searchMatches.length);
    }
  };

  // Replace single match
  const handleReplace = () => {
    if (searchMatches.length === 0 || !activeCell) return;
    const currentMatch = searchMatches[searchIndex];
    
    const newData = data.map((row, r) => {
      if (r === currentMatch.row) {
        return row.map((cell, c) => (c === currentMatch.col ? replaceText : cell));
      }
      return row;
    });

    pushState(newData, columns);
    showToast('Replaced cell value', 'success');
  };

  // Replace all matches
  const handleReplaceAll = () => {
    if (searchMatches.length === 0) return;
    const matchesMap = new Map<string, boolean>();
    searchMatches.forEach(m => matchesMap.set(`${m.row},${m.col}`, true));

    const newData = data.map((row, r) => {
      return row.map((cell, c) => {
        if (matchesMap.has(`${r},${c}`)) {
          return replaceText;
        }
        return cell;
      });
    });

    pushState(newData, columns);
    showToast(`Replaced all ${searchMatches.length} occurrences`, 'success');
  };

  // Sorting
  const handleSortColumn = (colIndex: number, direction: 'asc' | 'desc') => {
    const sortedData = [...data].sort((a, b) => {
      const valA = (a[colIndex] || '').trim();
      const valB = (b[colIndex] || '').trim();
      
      const numA = Number(valA);
      const numB = Number(valB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return direction === 'asc' ? numA - numB : numB - numA;
      }

      return direction === 'asc'
        ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
        : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
    });

    pushState(sortedData, columns);
    showToast(`Sorted column ${columns[colIndex]}`, 'info');
  };

  // Grid editing operations
  const handleAddRow = (where: 'above' | 'below') => {
    const r = activeCell ? activeCell.row : data.length - 1;
    const insertIdx = where === 'above' ? r : r + 1;

    const newRow = Array(columns.length).fill('');
    const newData = [...data];
    newData.splice(insertIdx, 0, newRow);

    pushState(newData, columns);
    setActiveCell({ row: insertIdx, col: activeCell ? activeCell.col : 0 });
    showToast('Row inserted', 'success');
  };

  const handleAddColumn = (where: 'left' | 'right') => {
    const c = activeCell ? activeCell.col : columns.length - 1;
    const insertIdx = where === 'left' ? c : c + 1;

    const newHeader = getColLetter(columns.length);
    const newColumns = [...columns];
    newColumns.splice(insertIdx, 0, newHeader);

    const newData = data.map(row => {
      const r = [...row];
      r.splice(insertIdx, 0, '');
      return r;
    });

    const newWidths = [...columnWidths];
    newWidths.splice(insertIdx, 0, 120);

    pushState(newData, newColumns);
    setColumnWidths(newWidths);
    setActiveCell({ row: activeCell ? activeCell.row : 0, col: insertIdx });
    showToast('Column inserted', 'success');
  };

  const handleDeleteRow = () => {
    if (!selection) return;
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);

    // Filter out row indices
    const newData = data.filter((_, r) => r < minRow || r > maxRow);
    
    // Ensure we have at least 1 empty row
    if (newData.length === 0) {
      newData.push(Array(columns.length).fill(''));
    }

    pushState(newData, columns);
    setActiveCell({ row: Math.max(0, minRow - 1), col: activeCell ? activeCell.col : 0 });
    setSelection(null);
    showToast('Deleted selected row(s)', 'info');
  };

  const handleDeleteColumn = () => {
    if (!selection) return;
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);

    const newColumns = columns.filter((_, c) => c < minCol || c > maxCol);
    const newData = data.map(row => row.filter((_, c) => c < minCol || c > maxCol));
    const newWidths = columnWidths.filter((_, c) => c < minCol || c > maxCol);

    // Ensure at least 1 column remains
    if (newColumns.length === 0) {
      newColumns.push('A');
      newData.forEach(row => row.push(''));
      newWidths.push(120);
    }

    pushState(newData, newColumns);
    setColumnWidths(newWidths);
    setActiveCell({ row: activeCell ? activeCell.row : 0, col: Math.max(0, minCol - 1) });
    setSelection(null);
    showToast('Deleted selected column(s)', 'info');
  };

  const handleDuplicateRow = () => {
    if (!activeCell) return;
    const r = activeCell.row;
    
    const rowToClone = [...data[r]];
    const newData = [...data];
    newData.splice(r + 1, 0, rowToClone);

    pushState(newData, columns);
    setActiveCell({ row: r + 1, col: activeCell.col });
    showToast('Row duplicated', 'success');
  };

  const handleClearCells = () => {
    if (!selection) return;
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);

    const newData = data.map((row, r) => {
      if (r >= minRow && r <= maxRow) {
        return row.map((cell, c) => (c >= minCol && c <= maxCol ? '' : cell));
      }
      return row;
    });

    pushState(newData, columns);
    showToast('Cleared selected cells', 'info');
  };

  // Text Transform Utilities
  const handleTrimWhitespace = () => {
    if (!selection) return;
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);

    const newData = data.map((row, r) => {
      if (r >= minRow && r <= maxRow) {
        return row.map((cell, c) => (c >= minCol && c <= maxCol ? cell.trim() : cell));
      }
      return row;
    });

    pushState(newData, columns);
    showToast('Trimmed cells whitespace', 'success');
  };

  const handleChangeCase = (mode: 'upper' | 'lower' | 'title') => {
    if (!selection) return;
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);

    const toTitleCase = (str: string) => {
      return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    };

    const newData = data.map((row, r) => {
      if (r >= minRow && r <= maxRow) {
        return row.map((cell, c) => {
          if (c >= minCol && c <= maxCol) {
            if (mode === 'upper') return cell.toUpperCase();
            if (mode === 'lower') return cell.toLowerCase();
            return toTitleCase(cell);
          }
          return cell;
        });
      }
      return row;
    });

    pushState(newData, columns);
    showToast(`Converted cells to ${mode}case`, 'success');
  };

  const handleFillSeries = useCallback(() => {
    if (!selection) return;
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);

    const startValue = data[minRow][minCol] || '';
    const num = Number(startValue);
    const isNumber = !isNaN(num) && startValue.trim() !== '';

    const newData = data.map((row, r) => {
      if (r >= minRow && r <= maxRow) {
        return row.map((cell, c) => {
          if (c >= minCol && c <= maxCol) {
            if (isNumber) {
              const step = (r - minRow) + (c - minCol);
              return String(num + step);
            } else {
              return startValue;
            }
          }
          return cell;
        });
      }
      return row;
    });

    pushState(newData, columns);
    showToast('Filled selection series', 'success');
  }, [selection, data, columns, pushState]);

  const handleGenerateUUIDs = useCallback(() => {
    if (!selection) return;
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);

    const uuidv4 = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };

    const newData = data.map((row, r) => {
      if (r >= minRow && r <= maxRow) {
        return row.map((cell, c) => {
          if (c >= minCol && c <= maxCol) {
            return uuidv4();
          }
          return cell;
        });
      }
      return row;
    });

    pushState(newData, columns);
    showToast('Generated UUIDs in selected cells', 'success');
  }, [selection, data, columns, pushState]);

  // Column renaming
  const handleRenameColumn = (colIndex: number, newName: string) => {
    if (!newName.trim()) return;
    const newColumns = [...columns];
    newColumns[colIndex] = newName.trim();
    
    pushState(data, newColumns);
    showToast(`Column renamed to ${newName}`, 'success');
  };

  // Filter active indices
  const visibleRowIndices = useMemo(() => {
    const indices: number[] = [];
    data.forEach((row, r) => {
      let matches = true;
      for (const [colIdxStr, filterText] of Object.entries(activeFilters)) {
        const colIdx = parseInt(colIdxStr);
        const cellValue = (row[colIdx] || '').toLowerCase();
        if (!cellValue.includes(filterText)) {
          matches = false;
          break;
        }
      }
      if (matches) {
        indices.push(r);
      }
    });
    return indices;
  }, [data, activeFilters]);

  // Command palette items
  const commands = useMemo(() => {
    const list = [
      { id: 'new-file', label: 'Create New CSV Grid', category: 'File', action: handleNewFile },
      { id: 'open-file', label: 'Open CSV File...', category: 'File', action: () => document.querySelector<HTMLInputElement>('input[type="file"]')?.click() },
      { id: 'export-csv', label: 'Export to CSV File', category: 'File', action: handleDownload },
      { id: 'preferences', label: 'Open Preferences & Settings', category: 'Settings', action: () => setIsSettingsOpen(true), shortcut: 'Ctrl+,' },
      { id: 'toggle-theme', label: 'Toggle Dark/Light Theme', category: 'Settings', action: toggleTheme },
      { id: 'toggle-zebra', label: 'Toggle Alternating Row Colors (Zebra)', category: 'Settings', action: () => setSettings(s => ({ ...s, zebraStripes: !s.zebraStripes })) },
    ];

    if (hasActiveFile) {
      list.push(
        { id: 'undo', label: 'Undo Last Edit', category: 'Edit', action: undo, shortcut: 'Ctrl+Z' },
        { id: 'redo', label: 'Redo Last Edit', category: 'Edit', action: redo, shortcut: 'Ctrl+Y' },
        { id: 'find-replace', label: 'Find & Replace Panel', category: 'Edit', action: () => setIsFindOpen(true), shortcut: 'Ctrl+F' },
        { id: 'clear-selection', label: 'Clear Selected Cells', category: 'Edit', action: handleClearCells },
        { id: 'trim-whitespace', label: 'Trim Whitespace in Selection', category: 'Format', action: handleTrimWhitespace },
        { id: 'uppercase', label: 'Convert Selection to UPPERCASE', category: 'Format', action: () => handleChangeCase('upper') },
        { id: 'lowercase', label: 'Convert Selection to lowercase', category: 'Format', action: () => handleChangeCase('lower') },
        { id: 'titlecase', label: 'Convert Selection to Title Case', category: 'Format', action: () => handleChangeCase('title') },
        { id: 'fill-series', label: 'Fill Series in Selection (Numeric Increment)', category: 'Advanced', action: handleFillSeries },
        { id: 'generate-uuids', label: 'Generate UUIDs in Selection', category: 'Advanced', action: handleGenerateUUIDs },
        { id: 'clear-filters', label: 'Clear All Active Column Filters', category: 'Filters', action: () => setActiveFilters({}) }
      );
    }
    return list;
  }, [hasActiveFile, undo, redo, handleClearCells, handleTrimWhitespace, handleChangeCase, handleFillSeries, handleGenerateUUIDs, toggleTheme]);

  // Global keydown listeners for shortcuts
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Ctrl+L or F1 for command palette
      if (((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'L')) || e.key === 'F1') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      // Ctrl+Comma for settings/preferences
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  return (
    <div className="app-container" onDragEnter={handleDrag}>
      {/* Top Header */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">CSV</div>
          <span className="logo-text">UltraCSV Editor</span>
        </div>
        
        {hasActiveFile && (
          <div className="file-info">
            <span className="file-name">{fileName}</span>
            {fileMeta && (
              <span className="file-meta">
                ({fileMeta.size} • Delimiter: {settings.delimiter === ',' ? 'Comma' : settings.delimiter === ';' ? 'Semicolon' : settings.delimiter === '\t' ? 'Tab' : settings.delimiter})
              </span>
            )}
          </div>
        )}

        <div className="header-actions">
          {licenseKey ? (
            <div
              className="pro-badge-header"
              onClick={() => setIsLicenseOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'linear-gradient(135deg, #00f5d4, #7b2cbf)',
                color: '#0a0a0f',
                padding: '0.3rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.7rem',
                fontWeight: 800,
                cursor: 'pointer',
                marginRight: '0.5rem',
                boxShadow: '0 0 10px rgba(0, 245, 212, 0.3)',
                letterSpacing: '0.05em'
              }}
              title="Pro Subscription Active - View License Details"
            >
              <Award size={12} />
              PRO ACTIVE
            </div>
          ) : (
            <button
              className="btn btn-accent"
              onClick={() => setIsLicenseOpen(true)}
              style={{
                marginRight: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="Activate Pro License"
            >
              <Award size={13} style={{ color: 'var(--accent)' }} />
              <span>Go Pro</span>
            </button>
          )}
          {showInstallBtn && (
            <button
              className="btn btn-accent"
              onClick={handleInstallApp}
              title="Download and Install Desktop App"
              style={{ marginRight: '0.5rem' }}
            >
              <Download size={14} />
              <span>Download App</span>
            </button>
          )}
          <button
            className="btn btn-icon-only"
            onClick={() => setIsSettingsOpen(true)}
            title="File Settings & Preferences (Ctrl+,)"
            style={{ border: 'none', background: 'none' }}
          >
            <Settings size={18} />
          </button>
          <button
            className="btn btn-icon-only"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            style={{ border: 'none', background: 'none' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Toolbar Options */}
      <Toolbar
        onFileSelect={handleFileLoad}
        onOpenFile={handleBrowseFile}
        onDownload={handleDownload}
        onNewFile={handleNewFile}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onToggleFind={() => setIsFindOpen(!isFindOpen)}
        isFindOpen={isFindOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onAddRow={handleAddRow}
        onAddColumn={handleAddColumn}
        onDeleteRow={handleDeleteRow}
        onDeleteColumn={handleDeleteColumn}
        onDuplicateRow={handleDuplicateRow}
        onClearCells={handleClearCells}
        onTrimWhitespace={handleTrimWhitespace}
        onChangeCase={handleChangeCase}
        hasActiveFile={hasActiveFile}
      />

      {/* Search Bar Panel */}
      {isFindOpen && hasActiveFile && (
        <FindReplace
          findText={findText}
          setFindText={setFindText}
          replaceText={replaceText}
          setReplaceText={setReplaceText}
          matchCase={matchCase}
          setMatchCase={setMatchCase}
          wholeCell={wholeCell}
          setWholeCell={setWholeCell}
          useRegex={useRegex}
          setUseRegex={setUseRegex}
          onNext={handleSearchNext}
          onPrev={handleSearchPrev}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
          onClose={() => setIsFindOpen(false)}
          matchCount={searchMatches.length}
          matchIndex={searchIndex}
        />
      )}

      {/* Workspace Area */}
      <div className="main-workspace">
        {hasActiveFile ? (
          <Grid
            data={data}
            columns={columns}
            onChangeData={(newData) => pushState(newData, columns)}
            onColumnResize={handleColumnResize}
            columnWidths={columnWidths}
            searchMatches={searchMatches}
            searchIndex={searchIndex}
            activeCell={activeCell}
            setActiveCell={setActiveCell}
            selection={selection}
            setSelection={setSelection}
            onSortColumn={handleSortColumn}
            onDeleteColumn={(c) => {
              setSelection({ startRow: 0, startCol: c, endRow: data.length - 1, endCol: c });
              handleDeleteColumn();
            }}
            onInsertColumn={(c, where) => {
              setActiveCell({ row: 0, col: c });
              handleAddColumn(where);
            }}
            onRenameColumn={handleRenameColumn}
            onInsertRow={(r, where) => {
              setActiveCell({ row: r, col: 0 });
              handleAddRow(where);
            }}
            onDeleteRow={(r) => {
              setSelection({ startRow: r, startCol: 0, endRow: r, endCol: columns.length - 1 });
              handleDeleteRow();
            }}
            onDuplicateRow={(r) => {
              setActiveCell({ row: r, col: 0 });
              handleDuplicateRow();
            }}
            freezeRows={settings.freezeRows}
            freezeCols={settings.freezeCols}
            zebraStripes={settings.zebraStripes}
            readOnly={settings.readOnly}
            activeFilters={activeFilters}
            onFilterColumn={handleFilterColumn}
            visibleRowIndices={visibleRowIndices}
          />
        ) : (
          <div
            className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => handleNewFile()}
          >
            <UploadCloud size={48} className="drop-zone-icon" />
            <h2 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Open a CSV File to Begin</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Drag and drop your spreadsheet here, or click to create a blank workspace
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); handleBrowseFile(); }}>
                <FileSpreadsheet size={16} />
                Browse Files
              </button>
              <input
                type="file"
                accept=".csv,.txt,.tsv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileLoad(e.target.files[0]);
                  }
                }}
              />
              <button className="btn" onClick={(e) => { e.stopPropagation(); handleNewFile(); }}>
                Create Blank
              </button>
            </div>

            {recentFiles.length > 0 && (
              <div className="recent-files-box" style={{ width: '100%', maxWidth: '440px', marginTop: '1rem' }} onClick={(e) => e.stopPropagation()}>
                <h4 style={{
                  marginBottom: '0.75rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: 600
                }}>Recent Files</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {recentFiles.map((file, i) => (
                    <div
                      key={i}
                      className="recent-file-item"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.6rem 1rem',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => {
                        // Trigger file dialog
                        document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
                      }}
                    >
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{file.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{file.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right drawer Sidebar */}
        {isSidebarOpen && hasActiveFile && (
          <Sidebar
            data={data}
            columns={columns}
            activeCell={activeCell}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}
      </div>

      {/* Footer Status Bar */}
      {hasActiveFile && (
        <footer className="status-bar">
          <div className="status-left">
            <span className="status-item">
              <strong>Rows:</strong> {data.length}
            </span>
            <span className="status-item">
              <strong>Columns:</strong> {columns.length}
            </span>
            {activeCell && (
              <span className="status-item" style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
                <strong>Active:</strong> {getColLetter(activeCell.col)}{activeCell.row + 1}
              </span>
            )}
            {settings.readOnly && (
              <span className="status-item" style={{ color: 'var(--danger)', fontWeight: 600 }}>
                READ-ONLY
              </span>
            )}
            {settings.freezeRows > 0 && (
              <span className="status-item" style={{ color: 'var(--accent)' }}>
                Rows Frozen: {settings.freezeRows}
              </span>
            )}
            {settings.freezeCols > 0 && (
              <span className="status-item" style={{ color: 'var(--accent)' }}>
                Cols Frozen: {settings.freezeCols}
              </span>
            )}
          </div>
          <div className="status-right">
            <span className="status-item" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Ctrl+L: Command Palette • Ctrl+,: Preferences • Press Esc to cancel edit
            </span>
          </div>
        </footer>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toast.type === 'success' && <Check size={16} style={{ color: 'var(--success)' }} />}
          {toast.type === 'info' && <Info size={16} style={{ color: 'var(--accent)' }} />}
          {toast.type === 'error' && <X size={16} style={{ color: 'var(--danger)' }} />}
          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{toast.message}</span>
        </div>
      )}

      {/* Settings Modal overlay */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onApply={(newSettings) => {
          setSettings(newSettings);
          showToast('Preferences updated', 'success');
        }}
      />

      {/* Command Palette overlay */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commands}
      />

      {/* License Modal overlay */}
      <LicenseModal
        isOpen={isLicenseOpen}
        onClose={() => setIsLicenseOpen(false)}
        currentLicense={licenseKey}
        onActivate={handleActivateLicense}
        onDeactivate={handleDeactivateLicense}
      />
    </div>
  );
}
