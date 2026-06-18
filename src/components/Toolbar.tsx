import React, { useRef } from 'react';
import {
  FileUp,
  FileDown,
  FilePlus,
  Undo2,
  Redo2,
  Search,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Eraser,
  BarChart3,
  AlignLeft,
} from 'lucide-react';

interface ToolbarProps {
  onFileSelect: (file: File) => void;
  onDownload: () => void;
  onNewFile: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onToggleFind: () => void;
  isFindOpen: boolean;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;

  // Grid operations
  onAddRow: (where: 'above' | 'below') => void;
  onAddColumn: (where: 'left' | 'right') => void;
  onDeleteRow: () => void;
  onDeleteColumn: () => void;
  onDuplicateRow: () => void;
  onClearCells: () => void;

  // Text tools
  onTrimWhitespace: () => void;
  onChangeCase: (mode: 'upper' | 'lower' | 'title') => void;
  
  hasActiveFile: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onFileSelect,
  onDownload,
  onNewFile,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onToggleFind,
  isFindOpen,
  onToggleSidebar,
  isSidebarOpen,
  onAddRow,
  onAddColumn,
  onDeleteRow,
  onDeleteColumn,
  onDuplicateRow,
  onClearCells,
  onTrimWhitespace,
  onChangeCase,
  hasActiveFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="toolbar-panel">
      {/* Left section: File operations & History */}
      <div className="toolbar-group">
        <input
          type="file"
          accept=".csv,.txt,.tsv"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        
        <button
          className="btn"
          onClick={triggerFileSelect}
          data-tooltip="Open CSV File"
        >
          <FileUp size={16} />
          <span>Open</span>
        </button>

        <button
          className="btn"
          onClick={onNewFile}
          data-tooltip="Create New CSV Grid"
        >
          <FilePlus size={16} />
          <span>New</span>
        </button>

        <button
          className="btn btn-primary"
          onClick={onDownload}
          disabled={!hasActiveFile}
          data-tooltip="Download CSV File"
        >
          <FileDown size={16} />
          <span>Export</span>
        </button>

        <div className="toolbar-divider" />

        <button
          className="btn btn-icon-only"
          onClick={onUndo}
          disabled={!canUndo}
          data-tooltip="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>

        <button
          className="btn btn-icon-only"
          onClick={onRedo}
          disabled={!canRedo}
          data-tooltip="Redo (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </button>
      </div>

      {/* Middle section: Edit actions & Row/Col manipulation */}
      <div className="toolbar-group">
        <button
          className={`btn btn-icon-only ${isFindOpen ? 'btn-accent' : ''}`}
          onClick={onToggleFind}
          disabled={!hasActiveFile}
          data-tooltip="Find & Replace (Ctrl+F)"
        >
          <Search size={16} />
        </button>

        <div className="toolbar-divider" />

        {/* Row Operations */}
        <button
          className="btn"
          onClick={() => onAddRow('below')}
          disabled={!hasActiveFile}
          data-tooltip="Insert Row Below"
        >
          <Plus size={14} />
          <span>Row</span>
        </button>

        <button
          className="btn"
          onClick={() => onAddColumn('right')}
          disabled={!hasActiveFile}
          data-tooltip="Insert Column Right"
        >
          <Plus size={14} />
          <span>Col</span>
        </button>

        <button
          className="btn btn-icon-only"
          onClick={onDuplicateRow}
          disabled={!hasActiveFile}
          data-tooltip="Duplicate Selected Row"
        >
          <Copy size={15} />
        </button>

        <button
          className="btn btn-icon-only"
          onClick={onClearCells}
          disabled={!hasActiveFile}
          data-tooltip="Clear Selected Cell Values"
        >
          <Eraser size={15} />
        </button>

        <button
          className="btn btn-icon-only"
          onClick={onDeleteRow}
          disabled={!hasActiveFile}
          data-tooltip="Delete Selected Row"
          style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
        >
          <Trash2 size={15} style={{ stroke: 'currentColor' }} />
        </button>

        <button
          className="btn btn-icon-only"
          onClick={onDeleteColumn}
          disabled={!hasActiveFile}
          data-tooltip="Delete Selected Column"
          style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
        >
          <Trash2 size={15} style={{ stroke: 'currentColor' }} />
        </button>
      </div>

      {/* Right section: Advanced text transformations and Panels */}
      <div className="toolbar-group">
        <button
          className="btn"
          onClick={onTrimWhitespace}
          disabled={!hasActiveFile}
          data-tooltip="Trim spaces from selected cells"
        >
          <AlignLeft size={14} />
          <span>Trim</span>
        </button>

        <button
          className="btn"
          onClick={() => onChangeCase('upper')}
          disabled={!hasActiveFile}
          data-tooltip="Convert to UPPERCASE"
        >
          <Sparkles size={14} />
          <span>UPPER</span>
        </button>

        <button
          className="btn"
          onClick={() => onChangeCase('lower')}
          disabled={!hasActiveFile}
          data-tooltip="Convert to lowercase"
        >
          <span>lower</span>
        </button>

        <button
          className="btn"
          onClick={() => onChangeCase('title')}
          disabled={!hasActiveFile}
          data-tooltip="Convert to Title Case"
        >
          <span>Title</span>
        </button>

        <div className="toolbar-divider" />

        <button
          className={`btn ${isSidebarOpen ? 'btn-accent' : ''}`}
          onClick={onToggleSidebar}
          disabled={!hasActiveFile}
          data-tooltip="Toggle Analysis Sidebar"
        >
          <BarChart3 size={16} />
          <span>Stats & Charts</span>
        </button>
      </div>
    </div>
  );
};
