/// <reference types="vite/client" />

declare module '*?worker' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

interface Window {
  electronAPI?: {
    openFile: () => Promise<{ filePath: string; name: string; size: number } | null>;
    readChunk: (filePath: string) => Promise<string>;
    saveFile: (filePath: string, content: string) => Promise<boolean>;
    saveFileAs: (defaultName: string) => Promise<string | null>;
  };
}
