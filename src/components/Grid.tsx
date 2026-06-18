import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  FolderEdit,
} from 'lucide-react';

interface GridProps {
  data: string[][];
  columns: string[];
  onChangeData: (newData: string[][]) => void;
  onColumnResize: (colIndex: number, width: number) => void;
  columnWidths: number[];
  
  // Search parameters
  searchMatches: { row: number; col: number }[];
  searchIndex: number;
  
  // Selection export to parent
  activeCell: { row: number; col: number } | null;
  setActiveCell: (cell: { row: number; col: number } | null) => void;
  selection: { startRow: number; startCol: number; endRow: number; endCol: number } | null;
  setSelection: (sel: { startRow: number; startCol: number; endRow: number; endCol: number } | null) => void;

  // Header Operations
  onSortColumn: (colIndex: number, direction: 'asc' | 'desc') => void;
  onDeleteColumn: (colIndex: number) => void;
  onInsertColumn: (colIndex: number, where: 'left' | 'right') => void;
  onRenameColumn: (colIndex: number, newName: string) => void;
  
  onInsertRow: (rowIndex: number, where: 'above' | 'below') => void;
  onDeleteRow: (rowIndex: number) => void;
  onDuplicateRow: (rowIndex: number) => void;

  // Modern CSV Features
  freezeRows: number;
  freezeCols: number;
  zebraStripes: boolean;
  readOnly: boolean;
  activeFilters: { [colIndex: number]: string };
  onFilterColumn: (colIndex: number, query: string) => void;
  visibleRowIndices: number[];
}

export const Grid: React.FC<GridProps> = ({
  data,
  columns,
  onChangeData,
  onColumnResize,
  columnWidths,
  searchMatches,
  searchIndex,
  activeCell,
  setActiveCell,
  selection,
  setSelection,
  onSortColumn,
  onDeleteColumn,
  onInsertColumn,
  onRenameColumn,
  onInsertRow,
  onDeleteRow,
  onDuplicateRow,
  freezeRows,
  freezeCols,
  zebraStripes,
  readOnly,
  activeFilters,
  onFilterColumn,
  visibleRowIndices,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(600);
  const [scrollTop, setScrollTop] = useState(0);

  // Cell editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const editorRef = useRef<HTMLInputElement>(null);

  // Selection state
  const [isSelecting, setIsSelecting] = useState(false);

  // Column resizing state
  const [resizingCol, setResizingCol] = useState<number | null>(null);
  const resizeStartMouseX = useRef(0);
  const resizeStartWidth = useRef(0);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'column' | 'row';
    index: number;
  } | null>(null);

  // Column renaming Modal state
  const [renamingColIndex, setRenamingColIndex] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const rowHeight = 32;
  const rowIndices = useMemo(() => {
    return visibleRowIndices || Array.from({ length: data.length }, (_, i) => i);
  }, [visibleRowIndices, data.length]);
  const numRows = rowIndices.length;

  // Track viewport height using ResizeObserver
  useEffect(() => {
    if (!viewportRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportHeight(entry.contentRect.height || 600);
      }
    });
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, []);

  // Sync scroll positions
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
  };

  // Virtualization boundaries
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 5);
  const endIndex = Math.min(numRows - 1, Math.ceil((scrollTop + viewportHeight) / rowHeight) + 5);

  const totalHeight = numRows * rowHeight;
  const totalWidth = useMemo(() => {
    return columnWidths.reduce((sum, w) => sum + w, 0) + 50; // +50 for row header
  }, [columnWidths]);

  // Check if a cell is selected
  const isCellSelected = useCallback((r: number, c: number) => {
    if (!selection) return false;
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    return r >= minRow && r <= maxRow && c >= minCol && c <= maxCol;
  }, [selection]);

  // Check if cell is active
  const isCellActive = useCallback((r: number, c: number) => {
    return activeCell !== null && activeCell.row === r && activeCell.col === c;
  }, [activeCell]);

  // Check if a cell is search match
  const getSearchMatchStatus = useCallback((r: number, c: number) => {
    const activeMatch = searchMatches[searchIndex];
    const isActive = activeMatch && activeMatch.row === r && activeMatch.col === c;
    const isMatched = searchMatches.some(m => m.row === r && m.col === c);
    return { isActive, isMatched };
  }, [searchMatches, searchIndex]);

  // Copy selection to clipboard (TSV format)
  const copySelection = useCallback(() => {
    if (!selection) return;
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);

    const rowsText: string[] = [];
    for (let r = minRow; r <= maxRow; r++) {
      const rowCells: string[] = [];
      for (let c = minCol; c <= maxCol; c++) {
        rowCells.push(data[r][c] || '');
      }
      rowsText.push(rowCells.join('\t'));
    }

    navigator.clipboard.writeText(rowsText.join('\n'));
  }, [selection, data]);

  // Paste from clipboard (TSV format)
  const pasteSelection = useCallback(async () => {
    if (!activeCell || readOnly) return;
    try {
      const text = await navigator.clipboard.readText();
      const rows = text.split(/\r?\n/).map(row => row.split('\t'));
      
      const newData = data.map(row => [...row]);
      for (let r = 0; r < rows.length; r++) {
        const targetRow = activeCell.row + r;
        if (targetRow >= newData.length) break;
        
        for (let c = 0; c < rows[r].length; c++) {
          const targetCol = activeCell.col + c;
          if (targetCol >= columns.length) break;
          newData[targetRow][targetCol] = rows[r][c];
        }
      }

      onChangeData(newData);
      
      // Update selection box
      setSelection({
        startRow: activeCell.row,
        startCol: activeCell.col,
        endRow: Math.min(data.length - 1, activeCell.row + rows.length - 1),
        endCol: Math.min(columns.length - 1, activeCell.col + rows[0].length - 1)
      });
    } catch (err) {
      console.error('Failed to read from clipboard', err);
    }
  }, [activeCell, data, columns, onChangeData, setSelection, readOnly]);

  // Handle global clipboard actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if editing
      if (isEditing) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          copySelection();
        } else if (e.key === 'v' || e.key === 'V') {
          if (readOnly) return;
          e.preventDefault();
          pasteSelection();
        } else if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          setSelection({
            startRow: 0,
            startCol: 0,
            endRow: data.length - 1,
            endCol: columns.length - 1
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, copySelection, pasteSelection, data.length, columns.length, setSelection]);

  // Scroll active cell into view if outside viewport
  const scrollActiveCellIntoView = useCallback((row: number, col: number) => {
    if (!viewportRef.current) return;
    const viewport = viewportRef.current;

    // Row bounds
    const rowTop = row * rowHeight;
    const rowBottom = rowTop + rowHeight;
    
    // Column bounds
    let colLeft = 50; // space of row index header
    for (let i = 0; i < col; i++) {
      colLeft += columnWidths[i];
    }
    const colRight = colLeft + columnWidths[col];

    // Check vertical scroll
    if (rowTop < viewport.scrollTop) {
      viewport.scrollTop = rowTop;
    } else if (rowBottom > viewport.scrollTop + viewportHeight) {
      viewport.scrollTop = rowBottom - viewportHeight;
    }

    // Check horizontal scroll
    if (colLeft < viewport.scrollLeft + 50) {
      viewport.scrollLeft = colLeft - 50;
    } else if (colRight > viewport.scrollLeft + viewport.clientWidth) {
      viewport.scrollLeft = colRight - viewport.clientWidth;
    }
  }, [columnWidths, viewportHeight]);

  // Navigate active cell
  const navigateGrid = useCallback((direction: 'up' | 'down' | 'left' | 'right' | 'tab' | 'shifttab') => {
    if (!activeCell) return;
    let { row, col } = activeCell;

    if (direction === 'up' && row > 0) row--;
    else if (direction === 'down' && row < numRows - 1) row++;
    else if (direction === 'left' && col > 0) col--;
    else if (direction === 'right' && col < columns.length - 1) col++;
    else if (direction === 'tab') {
      if (col < columns.length - 1) {
        col++;
      } else if (row < numRows - 1) {
        col = 0;
        row++;
      }
    } else if (direction === 'shifttab') {
      if (col > 0) {
        col--;
      } else if (row > 0) {
        col = columns.length - 1;
        row--;
      }
    }

    setActiveCell({ row, col });
    setSelection({ startRow: row, startCol: col, endRow: row, endCol: col });
    scrollActiveCellIntoView(row, col);
  }, [activeCell, numRows, columns.length, scrollActiveCellIntoView, setActiveCell, setSelection]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Context Menu Close
    setContextMenu(null);

    if (isEditing) {
      if (e.key === 'Enter') {
        saveEdit();
        navigateGrid('down');
        e.preventDefault();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
        viewportRef.current?.focus();
        e.preventDefault();
      } else if (e.key === 'Tab') {
        saveEdit();
        navigateGrid(e.shiftKey ? 'shifttab' : 'tab');
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        navigateGrid('up');
        e.preventDefault();
        break;
      case 'ArrowDown':
        navigateGrid('down');
        e.preventDefault();
        break;
      case 'ArrowLeft':
        navigateGrid('left');
        e.preventDefault();
        break;
      case 'ArrowRight':
        navigateGrid('right');
        e.preventDefault();
        break;
      case 'Tab':
        navigateGrid(e.shiftKey ? 'shifttab' : 'tab');
        e.preventDefault();
        break;
      case 'Enter':
        if (activeCell && !readOnly) {
          setIsEditing(true);
          setEditValue(data[activeCell.row][activeCell.col] || '');
          e.preventDefault();
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (selection && !readOnly) {
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
          onChangeData(newData);
        }
        e.preventDefault();
        break;
      default:
        // Start typing to edit cell directly
        if (activeCell && !readOnly && !e.ctrlKey && !e.metaKey && e.key.length === 1) {
          setIsEditing(true);
          setEditValue(e.key);
          e.preventDefault();
        }
        break;
    }
  };

  const saveEdit = () => {
    if (!activeCell || readOnly) return;
    
    const shouldApplyToSelection = selection && 
      (selection.startRow !== selection.endRow || selection.startCol !== selection.endCol);

    const newData = data.map((row, r) => {
      if (shouldApplyToSelection) {
        const minRow = Math.min(selection!.startRow, selection!.endRow);
        const maxRow = Math.max(selection!.startRow, selection!.endRow);
        const minCol = Math.min(selection!.startCol, selection!.endCol);
        const maxCol = Math.max(selection!.startCol, selection!.endCol);

        if (r >= minRow && r <= maxRow) {
          return row.map((cell, c) => (c >= minCol && c <= maxCol ? editValue : cell));
        }
      } else {
        if (r === activeCell.row) {
          return row.map((cell, c) => (c === activeCell.col ? editValue : cell));
        }
      }
      return row;
    });
    onChangeData(newData);
    setIsEditing(false);
    // return focus to viewport wrapper
    viewportRef.current?.focus();
  };

  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.focus();
      editorRef.current.select();
    }
  }, [isEditing]);

  // Selection Drag Event Handlers
  const handleCellMouseDown = (r: number, c: number, e: React.MouseEvent) => {
    setContextMenu(null);
    if (e.button !== 0) return; // Only left-click

    setIsEditing(false);
    setIsSelecting(true);
    setActiveCell({ row: r, col: c });
    setSelection({ startRow: r, startCol: c, endRow: r, endCol: c });
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    if (!isSelecting || !selection) return;
    setSelection({
      ...selection,
      endRow: r,
      endCol: c
    });
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelecting(false);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Column Resizing mouse handlers
  const handleResizeMouseDown = (colIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingCol(colIndex);
    resizeStartMouseX.current = e.clientX;
    resizeStartWidth.current = columnWidths[colIndex];
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingCol === null) return;
      const delta = e.clientX - resizeStartMouseX.current;
      const newWidth = Math.max(50, resizeStartWidth.current + delta);
      
      const newWidths = [...columnWidths];
      newWidths[resizingCol] = newWidth;
      onColumnResize(resizingCol, newWidth);
    };

    const handleMouseUp = () => {
      setResizingCol(null);
    };

    if (resizingCol !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol, columnWidths, onColumnResize]);

  // Context Menu handlers
  const handleHeaderContextMenu = (colIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'column',
      index: colIndex
    });
  };

  const handleRowContextMenu = (rowIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'row',
      index: rowIndex
    });
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Scroll to active search match when it updates
  useEffect(() => {
    if (searchMatches.length > 0 && searchIndex >= 0 && searchIndex < searchMatches.length) {
      const match = searchMatches[searchIndex];
      setActiveCell(match);
      setSelection({ startRow: match.row, startCol: match.col, endRow: match.row, endCol: match.col });
      scrollActiveCellIntoView(match.row, match.col);
    }
  }, [searchIndex, searchMatches, setActiveCell, setSelection, scrollActiveCellIntoView]);

  return (
    <div
      ref={viewportRef}
      className="grid-container"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onScroll={handleScroll}
    >
      <div
        className="virtual-table-viewport"
        style={{ width: totalWidth, height: totalHeight + 40 }} // 40 for header
      >
        <table className="virtual-table">
          {/* Header Row */}
          <thead>
            <tr className="grid-header-row" style={{ height: 38 }}>
              {/* Top-Left Corner cell */}
              <th
                className="grid-header-cell grid-row-index-cell"
                style={{
                  position: 'sticky',
                  top: 0,
                  left: 0,
                  zIndex: 10,
                  borderBottom: '2px solid var(--border-color)',
                  width: '50px',
                  height: '38px',
                }}
              />
              {columns.map((col, c) => {
                const isColFrozen = c < freezeCols;
                const isFiltered = activeFilters[c] !== undefined && activeFilters[c] !== '';
                const leftPos = isColFrozen ? (() => {
                  let left = 50;
                  for (let i = 0; i < c; i++) {
                    left += columnWidths[i] || 120;
                  }
                  return left;
                })() : undefined;

                return (
                  <th
                    key={c}
                    className="grid-header-cell"
                    style={{
                      width: columnWidths[c],
                      position: 'sticky',
                      top: 0,
                      left: leftPos,
                      zIndex: isColFrozen ? 10 : 8,
                      height: '38px',
                    }}
                    onContextMenu={(e) => handleHeaderContextMenu(c, e)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{col}</span>
                      {isFiltered && <span style={{ color: 'var(--accent)', marginLeft: '4px', fontSize: '10px' }} title={`Filtered: "${activeFilters[c]}"`}>⚡</span>}
                    </div>
                    <div
                      className={`grid-header-resizer ${resizingCol === c ? 'resizing' : ''}`}
                      onMouseDown={(e) => handleResizeMouseDown(c, e)}
                    />
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body Virtualized */}
          <tbody style={{ position: 'relative' }}>
            {/* Frozen Rows */}
            {Array.from({ length: Math.min(freezeRows, numRows) }).map((_, idx) => {
              return (() => {
                const r = rowIndices[idx];
                if (r === undefined) return null;
                const row = data[r];
                if (!row) return null;

                const rowIndexStyle: React.CSSProperties = {
                  height: rowHeight,
                  left: 0,
                };
                rowIndexStyle.position = 'sticky';
                rowIndexStyle.top = 38 + idx * rowHeight;
                rowIndexStyle.zIndex = 7;

                return (
                  <tr key={r} className="grid-row" style={{ height: rowHeight }}>
                    <td
                      className="grid-row-index-cell"
                      style={rowIndexStyle}
                      onContextMenu={(e) => handleRowContextMenu(r, e)}
                    >
                      {r + 1}
                    </td>

                    {columns.map((_, c) => {
                      const selected = isCellSelected(r, c);
                      const active = isCellActive(r, c);
                      const { isActive, isMatched } = getSearchMatchStatus(r, c);
                      const isColFrozen = c < freezeCols;

                      let cellStyle: React.CSSProperties = {
                        width: columnWidths[c],
                      };

                      cellStyle.position = 'sticky';
                      cellStyle.top = 38 + idx * rowHeight;
                      cellStyle.zIndex = isColFrozen ? 9 : 6;

                      if (isColFrozen) {
                        let left = 50;
                        for (let i = 0; i < c; i++) {
                          left += columnWidths[i] || 120;
                        }
                        cellStyle.left = left;
                      }

                      if (isActive) {
                        cellStyle.backgroundColor = 'rgba(255, 235, 59, 0.4)';
                        cellStyle.outline = '2px solid #ffc107';
                        cellStyle.outlineOffset = '-2px';
                        cellStyle.zIndex = 11;
                      } else if (isMatched) {
                        cellStyle.backgroundColor = 'rgba(255, 235, 59, 0.15)';
                      }

                      const isZebra = zebraStripes && idx % 2 === 1;

                      return (
                        <td
                          key={c}
                          className={`grid-cell ${selected ? 'selected' : ''} ${active ? 'active' : ''} ${isZebra ? 'zebra' : ''}`}
                          style={cellStyle}
                          onMouseDown={(e) => handleCellMouseDown(r, c, e)}
                          onMouseEnter={() => handleCellMouseEnter(r, c)}
                          onDoubleClick={() => {
                            if (readOnly) return;
                            setIsEditing(true);
                            setEditValue(row[c] || '');
                          }}
                        >
                          {active && isEditing ? (
                            <input
                              ref={editorRef}
                              className="grid-cell-editor"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                            />
                          ) : (
                            row[c] || ''
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })();
            })}

            {/* Scroll runway spacer to trigger parent scrollbar */}
            <tr style={{ height: Math.max(0, (Math.max(freezeRows, startIndex) - freezeRows) * rowHeight) }} />

            {/* Virtualized Rows */}
            {rowIndices.slice(Math.max(freezeRows, startIndex), endIndex + 1).map((r, relativeIndex) => {
              const idx = Math.max(freezeRows, startIndex) + relativeIndex;
              const row = data[r];
              if (!row) return null;

              const rowIndexStyle: React.CSSProperties = {
                height: rowHeight,
                left: 0,
              };

              return (
                <tr key={r} className="grid-row" style={{ height: rowHeight }}>
                  <td
                    className="grid-row-index-cell"
                    style={rowIndexStyle}
                    onContextMenu={(e) => handleRowContextMenu(r, e)}
                  >
                    {r + 1}
                  </td>

                  {columns.map((_, c) => {
                    const selected = isCellSelected(r, c);
                    const active = isCellActive(r, c);
                    const { isActive, isMatched } = getSearchMatchStatus(r, c);
                    const isColFrozen = c < freezeCols;

                    let cellStyle: React.CSSProperties = {
                      width: columnWidths[c],
                    };

                    if (isColFrozen) {
                      cellStyle.position = 'sticky';
                      let left = 50;
                      for (let i = 0; i < c; i++) {
                        left += columnWidths[i] || 120;
                      }
                      cellStyle.left = left;
                      cellStyle.zIndex = 4;
                    }

                    if (isActive) {
                      cellStyle.backgroundColor = 'rgba(255, 235, 59, 0.4)';
                      cellStyle.outline = '2px solid #ffc107';
                      cellStyle.outlineOffset = '-2px';
                      cellStyle.zIndex = 11;
                    } else if (isMatched) {
                      cellStyle.backgroundColor = 'rgba(255, 235, 59, 0.15)';
                    }

                    const isZebra = zebraStripes && idx % 2 === 1;

                    return (
                      <td
                        key={c}
                        className={`grid-cell ${selected ? 'selected' : ''} ${active ? 'active' : ''} ${isZebra ? 'zebra' : ''}`}
                        style={cellStyle}
                        onMouseDown={(e) => handleCellMouseDown(r, c, e)}
                        onMouseEnter={() => handleCellMouseEnter(r, c)}
                        onDoubleClick={() => {
                          if (readOnly) return;
                          setIsEditing(true);
                          setEditValue(row[c] || '');
                        }}
                      >
                        {active && isEditing ? (
                          <input
                            ref={editorRef}
                            className="grid-cell-editor"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                          />
                        ) : (
                          row[c] || ''
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Bottom runway spacer */}
            <tr style={{ height: Math.max(0, (numRows - 1 - endIndex) * rowHeight) }} />
          </tbody>
        </table>
      </div>

      {/* Column / Row Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'column' ? (
            <>
              {!readOnly && (
                <div
                  className="context-menu-item"
                  onClick={() => {
                    setRenameValue(columns[contextMenu.index]);
                    setRenamingColIndex(contextMenu.index);
                    setContextMenu(null);
                  }}
                >
                  <FolderEdit size={14} />
                  <span>Rename Column</span>
                </div>
              )}
              {!readOnly && <div className="context-menu-divider" />}
              <div className="context-menu-item" onClick={() => { onSortColumn(contextMenu.index, 'asc'); setContextMenu(null); }}>
                <span>Sort A-Z</span>
              </div>
              <div className="context-menu-item" onClick={() => { onSortColumn(contextMenu.index, 'desc'); setContextMenu(null); }}>
                <span>Sort Z-A</span>
              </div>
              <div className="context-menu-divider" />
              <div
                className="context-menu-item"
                onClick={() => {
                  const currentFilter = activeFilters[contextMenu.index] || '';
                  const query = prompt(`Filter column "${columns[contextMenu.index]}" by text (empty to clear):`, currentFilter);
                  if (query !== null) {
                    onFilterColumn(contextMenu.index, query);
                  }
                  setContextMenu(null);
                }}
              >
                <span>Filter Column...</span>
              </div>
              {!readOnly && (
                <>
                  <div className="context-menu-divider" />
                  <div className="context-menu-item" onClick={() => { onInsertColumn(contextMenu.index, 'left'); setContextMenu(null); }}>
                    <Plus size={14} />
                    <span>Insert Left</span>
                  </div>
                  <div className="context-menu-item" onClick={() => { onInsertColumn(contextMenu.index, 'right'); setContextMenu(null); }}>
                    <Plus size={14} />
                    <span>Insert Right</span>
                  </div>
                  <div className="context-menu-divider" />
                  <div
                    className="context-menu-item"
                    onClick={() => { onDeleteColumn(contextMenu.index); setContextMenu(null); }}
                    style={{ color: 'var(--danger)' }}
                  >
                    <Trash2 size={14} />
                    <span>Delete Column</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {readOnly ? (
                <div className="context-menu-item disabled" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                  <span>Read-Only Mode Active</span>
                </div>
              ) : (
                <>
                  <div className="context-menu-item" onClick={() => { onInsertRow(contextMenu.index, 'above'); setContextMenu(null); }}>
                    <Plus size={14} />
                    <span>Insert Above</span>
                  </div>
                  <div className="context-menu-item" onClick={() => { onInsertRow(contextMenu.index, 'below'); setContextMenu(null); }}>
                    <Plus size={14} />
                    <span>Insert Below</span>
                  </div>
                  <div className="context-menu-item" onClick={() => { onDuplicateRow(contextMenu.index); setContextMenu(null); }}>
                    <Copy size={14} />
                    <span>Duplicate Row</span>
                  </div>
                  <div className="context-menu-divider" />
                  <div
                    className="context-menu-item"
                    onClick={() => { onDeleteRow(contextMenu.index); setContextMenu(null); }}
                    style={{ color: 'var(--danger)' }}
                  >
                    <Trash2 size={14} />
                    <span>Delete Row</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Rename Column Modal */}
      {renamingColIndex !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Rename Column</h3>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="input-field"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setRenamingColIndex(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onRenameColumn(renamingColIndex, renameValue);
                  setRenamingColIndex(null);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
