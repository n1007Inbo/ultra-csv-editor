import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Command } from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  category: string;
  action: () => void;
}

interface CommandPaletteProps {
  commands: CommandItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  commands,
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Fuzzy filter commands
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(cmd => {
      const label = cmd.label.toLowerCase();
      const category = cmd.category.toLowerCase();
      // Fuzzy: check if all query chars appear in order
      let qi = 0;
      for (let i = 0; i < label.length && qi < q.length; i++) {
        if (label[i] === q[qi]) qi++;
      }
      if (qi === q.length) return true;
      // Also match category
      return category.includes(q) || label.includes(q);
    });
  }, [commands, query]);

  // Reset selection index when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('.cmd-palette-item');
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const executeSelected = () => {
    if (filtered[selectedIndex]) {
      filtered[selectedIndex].action();
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeSelected();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  // Group by category
  const grouped: { [cat: string]: typeof filtered } = {};
  filtered.forEach(cmd => {
    if (!grouped[cmd.category]) grouped[cmd.category] = [];
    grouped[cmd.category].push(cmd);
  });

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '15vh' }}>
      <div
        className="cmd-palette"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="cmd-palette-search">
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
            <kbd className="cmd-kbd">ESC</kbd>
          </div>
        </div>

        <div className="cmd-palette-list" ref={listRef}>
          {filtered.length === 0 && (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No commands found
            </div>
          )}
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="cmd-palette-category">{category}</div>
              {items.map((cmd) => {
                const globalIdx = filtered.indexOf(cmd);
                return (
                  <div
                    key={cmd.id}
                    className={`cmd-palette-item ${globalIdx === selectedIndex ? 'selected' : ''}`}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                  >
                    <span className="cmd-palette-label">{cmd.label}</span>
                    {cmd.shortcut && <kbd className="cmd-kbd">{cmd.shortcut}</kbd>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="cmd-palette-footer">
          <span><Command size={12} /> Command Palette</span>
          <span>↑↓ Navigate · Enter Select · Esc Close</span>
        </div>
      </div>
    </div>
  );
};
