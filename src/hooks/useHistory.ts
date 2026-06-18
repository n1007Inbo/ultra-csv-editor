import { useState, useCallback, useMemo } from 'react';
import { FlatCSVData, createFlatCSVProxy, stringArrayToFlatCSV } from '../utils/flatCSV';

export interface HistoryState {
  data: FlatCSVData;
  columns: string[];
}

export function useHistory(initialData: string[][] | FlatCSVData, initialColumns: string[]) {
  const [state, setState] = useState<{
    history: HistoryState[];
    pointer: number;
  }>(() => {
    const flat = initialData instanceof FlatCSVData 
      ? initialData 
      : stringArrayToFlatCSV(initialData);
    return {
      history: [{ data: flat, columns: initialColumns }],
      pointer: 0,
    };
  });

  const pushState = useCallback((newData: string[][] | FlatCSVData, newColumns: string[]) => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.pointer + 1);
      
      const flat = newData instanceof FlatCSVData 
        ? newData 
        : stringArrayToFlatCSV(newData);
      const clonedCols = [...newColumns];
      
      newHistory.push({ data: flat, columns: clonedCols });
      
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

  const reset = useCallback((data: string[][] | FlatCSVData, columns: string[]) => {
    const flat = data instanceof FlatCSVData 
      ? data 
      : stringArrayToFlatCSV(data);
    setState({
      history: [{ data: flat, columns: [...columns] }],
      pointer: 0,
    });
  }, []);

  const currentState = state.history[state.pointer] || { data: new FlatCSVData('', new Int32Array(0), new Int32Array(0), 0, 0), columns: [] };

  const proxyData = useMemo(() => {
    return createFlatCSVProxy(currentState.data);
  }, [currentState.data]);

  return {
    data: proxyData,
    columns: currentState.columns,
    pushState,
    undo,
    redo,
    reset,
    canUndo: state.pointer > 0,
    canRedo: state.pointer < state.history.length - 1,
  };
}
