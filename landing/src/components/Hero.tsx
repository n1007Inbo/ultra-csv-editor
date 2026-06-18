import { Download, ExternalLink, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-badge">
          <span className="badge-dot" />
          v2.0 — Now with Streaming Parser
        </div>

        <h1>
          The <span className="gradient-text">Fastest CSV Editor</span> Ever Built
        </h1>

        <p className="hero-sub">
          Open gigabyte-scale CSV files in seconds. Multi-cursor editing, command palette,
          smart analytics, and regex search — all in a free, open-source desktop &amp; web app.
        </p>

        <div className="hero-buttons">
          <a href="#download" className="btn btn-primary">
            <Download size={18} />
            Download for Windows (.exe)
          </a>
          <a
            href="https://ultra-csv-editor.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            <ExternalLink size={18} />
            Try Web Version
          </a>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-value gradient-text">
              <Sparkles size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              10GB+
            </div>
            <div className="hero-stat-label">File Support</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value gradient-text">60fps</div>
            <div className="hero-stat-label">Scroll Performance</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value gradient-text">100%</div>
            <div className="hero-stat-label">Free &amp; Open Source</div>
          </div>
        </div>
      </div>
    </section>
  );
}
