import { Download, Monitor, Cpu, HardDrive } from 'lucide-react';

export default function DownloadSection() {
  return (
    <section className="section download-section" id="download">
      <div className="container">
        <div className="section-header">
          <span className="section-label">Download</span>
          <h2 className="section-title">
            Ready to <span className="gradient-text">supercharge</span> your workflow?
          </h2>
          <p className="section-sub">
            Get the native desktop app for the best performance, or use the web version instantly.
          </p>
        </div>

        <div className="download-card glass">
          <div className="download-version">v2.0.0</div>
          <h3>Ultra CSV Editor for Windows</h3>
          <p>Free and open-source. No account required. No telemetry.</p>

          <a
            href="https://github.com/n1007Inbo/ultra-csv-editor/releases/download/v2.0.0/UltraCSV.Editor.Setup.0.0.0.exe"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-download"
          >
            <Download size={20} />
            Download for Windows (.exe)
          </a>

          <div className="download-meta">
            <span>
              <Monitor size={14} />
              Windows 10+
            </span>
            <span>
              <Cpu size={14} />
              x64 Architecture
            </span>
            <span>
              <HardDrive size={14} />
              4 GB RAM minimum
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
