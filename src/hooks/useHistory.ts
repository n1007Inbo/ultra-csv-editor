import { useState, useCallback } from 'react';

export interface HistoryState {
  data: string[][];
  columns: string[];
}

export function useHistory(initialData: string[][], initialColumns: string[]) {
  const [state, setState] = useState<{
    history: HistoryState[];
    pointer: number;
  }>(() => ({
    history: [{ data: initialData, columns: initialColumns }],
    pointer: 0,
  }));

  const pushState = useCallback((newData: string[][], newColumns: string[]) => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.pointer + 1);
      
      // Deep clone data to avoid reference leaks mutating historical states
      const clonedData = newData.map(row => [...row]);
      const clonedCols = [...newColumns];
      
      newHistory.push({ data: clonedData, columns: clonedCols });
      
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      return {
        history: newHistory,
        pointer: newHistory.length - 1,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.pointer > 0) {
        return {
          ...prev,
          pointer: prev.pointer - 1,
        };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.pointer < prev.history.length - 1) {
        return {
          ...prev,
          pointer: prev.pointer + 1,
        };
      }
      return prev;
    });
  }, []);

  const reset = useCallback((data: string[][], columns: string[]) => {
    setState({
      history: [{ data: data.map(row => [...row]), columns: [...columns] }],
      pointer: 0,
    });
  }, []);

  const currentState = state.history[state.pointer] || { data: [], columns: [] };

  return {
    data: currentState.data,
    columns: currentState.columns,
    pushState,
    undo,
    redo,
    reset,
    canUndo: state.pointer > 0,
    canRedo: state.pointer < state.history.length - 1,
  };
}
