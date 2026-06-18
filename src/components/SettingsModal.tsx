import React, { useState } from 'react';
import { X, Settings2 } from 'lucide-react';

export interface FileSettings {
  delimiter: string;
  encoding: string;
  lineEnding: 'CRLF' | 'LF';
  hasHeader: boolean;
  readOnly: boolean;
  freezeRows: number;
  freezeCols: number;
  zebraStripes: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FileSettings;
  onApply: (settings: FileSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onApply,
}) => {
  const [local, setLocal] = useState<FileSettings>({ ...settings });

  if (!isOpen) return null;

  const update = (key: keyof FileSettings, value: any) => {
    setLocal(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings2 size={18} style={{ color: 'var(--accent)' }} />
            File Settings & Preferences
          </h3>
          <button className="btn btn-icon-only" onClick={onClose} style={{ border: 'none', background: 'none' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '1.25rem' }}>
          {/* Delimiter */}
          <div className="settings-row">
            <label className="settings-label">Delimiter</label>
            <select
              className="chart-select"
              value={local.delimiter}
              onChange={(e) => update('delimiter', e.target.value)}
              style={{ width: '160px', padding: '0.4rem 0.5rem' }}
            >
              <option value=",">Comma (,)</option>
              <option value="&#9;">Tab (\t)</option>
              <option value=";">Semicolon (;)</option>
              <option value="|">Pipe (|)</option>
              <option value=" ">Space</option>
            </select>
          </div>

          {/* Encoding */}
          <div className="settings-row">
            <label className="settings-label">Character Encoding</label>
            <select
              className="chart-select"
              value={local.encoding}
              onChange={(e) => update('encoding', e.target.value)}
              style={{ width: '160px', padding: '0.4rem 0.5rem' }}
            >
              <option value="UTF-8">UTF-8</option>
              <option value="UTF-16">UTF-16</option>
              <option value="ISO-8859-1">ISO 8859-1</option>
              <option value="Windows-1252">Windows-1252</option>
              <option value="ASCII">ASCII</option>
            </select>
          </div>

          {/* Line Ending */}
          <div className="settings-row">
            <label className="settings-label">Line Ending</label>
            <select
              className="chart-select"
              value={local.lineEnding}
              onChange={(e) => update('lineEnding', e.target.value as 'CRLF' | 'LF')}
              style={{ width: '160px', padding: '0.4rem 0.5rem' }}
            >
              <option value="CRLF">CRLF (Windows)</option>
              <option value="LF">LF (Unix/Mac)</option>
            </select>
          </div>

          {/* Header Row */}
          <div className="settings-row">
            <label className="settings-label">First Row is Header</label>
            <label className="toggle-switch">
              <input type="checkbox" checked={local.hasHeader} onChange={(e) => update('hasHeader', e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Read-Only Mode */}
          <div className="settings-row">
            <label className="settings-label">Read-Only Mode</label>
            <label className="toggle-switch">
              <input type="checkbox" checked={local.readOnly} onChange={(e) => update('readOnly', e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Zebra Stripes */}
          <div className="settings-row">
            <label className="settings-label">Alternating Row Colors</label>
            <label className="toggle-switch">
              <input type="checkbox" checked={local.zebraStripes} onChange={(e) => update('zebraStripes', e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Freeze Rows */}
          <div className="settings-row">
            <label className="settings-label">Freeze Top Rows</label>
            <input
              type="number"
              className="input-field"
              style={{ width: '80px' }}
              min={0}
              max={20}
              value={local.freezeRows}
              onChange={(e) => update('freezeRows', parseInt(e.target.value) || 0)}
            />
          </div>

          {/* Freeze Columns */}
          <div className="settings-row">
            <label className="settings-label">Freeze Left Columns</label>
            <input
              type="number"
              className="input-field"
              style={{ width: '80px' }}
              min={0}
              max={20}
              value={local.freezeCols}
              onChange={(e) => update('freezeCols', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleApply}>Apply Settings</button>
        </div>
      </div>
    </div>
  );
};
