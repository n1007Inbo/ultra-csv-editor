import React from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

interface FindReplaceProps {
  findText: string;
  setFindText: (val: string) => void;
  replaceText: string;
  setReplaceText: (val: string) => void;
  matchCase: boolean;
  setMatchCase: (val: boolean) => void;
  wholeCell: boolean;
  setWholeCell: (val: boolean) => void;
  useRegex: boolean;
  setUseRegex: (val: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
  onClose: () => void;
  matchCount: number;
  matchIndex: number; // 0-indexed active match
}

export const FindReplace: React.FC<FindReplaceProps> = ({
  findText,
  setFindText,
  replaceText,
  setReplaceText,
  matchCase,
  setMatchCase,
  wholeCell,
  setWholeCell,
  useRegex,
  setUseRegex,
  onNext,
  onPrev,
  onReplace,
  onReplaceAll,
  onClose,
  matchCount,
  matchIndex,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        onPrev();
      } else {
        onNext();
      }
    }
  };

  return (
    <div className="find-replace-bar">
      {/* Find Input */}
      <div className="search-input-group">
        <input
          type="text"
          placeholder="Find..."
          value={findText}
          onChange={(e) => setFindText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="search-options">
          <button
            className={`search-opt-btn ${matchCase ? 'active' : ''}`}
            onClick={() => setMatchCase(!matchCase)}
            title="Match Case (Cc)"
          >
            Cc
          </button>
          <button
            className={`search-opt-btn ${wholeCell ? 'active' : ''}`}
            onClick={() => setWholeCell(!wholeCell)}
            title="Match Whole Cell (Wc)"
          >
            Wc
          </button>
          <button
            className={`search-opt-btn ${useRegex ? 'active' : ''}`}
            onClick={() => setUseRegex(!useRegex)}
            title="Use Regular Expression (.*)"
          >
            .*
          </button>
        </div>
      </div>

      {/* Match Count Indicator */}
      <span className="search-nav-info">
        {matchCount > 0
          ? `${matchIndex + 1} of ${matchCount}`
          : 'No matches'}
      </span>

      {/* Prev & Next Buttons */}
      <button
        className="btn btn-icon-only"
        onClick={onPrev}
        disabled={matchCount === 0}
        title="Previous Match (Shift+Enter)"
      >
        <ChevronUp size={16} />
      </button>
      <button
        className="btn btn-icon-only"
        onClick={onNext}
        disabled={matchCount === 0}
        title="Next Match (Enter)"
      >
        <ChevronDown size={16} />
      </button>

      <div className="toolbar-divider" />

      {/* Replace Input */}
      <input
        type="text"
        placeholder="Replace with..."
        className="input-field"
        style={{ width: '180px' }}
        value={replaceText}
        onChange={(e) => setReplaceText(e.target.value)}
      />

      <button
        className="btn"
        onClick={onReplace}
        disabled={matchCount === 0}
        title="Replace active match"
      >
        Replace
      </button>

      <button
        className="btn"
        onClick={onReplaceAll}
        disabled={matchCount === 0}
        title="Replace all matches"
      >
        Replace All
      </button>

      <div style={{ flex: 1 }} />

      {/* Close button */}
      <button
        className="btn btn-icon-only"
        onClick={onClose}
        style={{ borderColor: 'transparent', background: 'none' }}
        title="Close (Esc)"
      >
        <X size={16} />
      </button>
    </div>
  );
};
