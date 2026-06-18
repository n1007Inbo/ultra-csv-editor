import {
  Zap,
  HardDrive,
  MousePointerClick,
  Command,
  BarChart3,
  Search,
  Palette,
  Monitor,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

const features: Feature[] = [
  {
    icon: Zap,
    title: 'Lightning Fast Performance',
    desc: 'Virtualized rendering and streaming parser deliver 60fps scrolling even on million-row files.',
  },
  {
    icon: HardDrive,
    title: 'GB File Support',
    desc: 'Open and edit multi-gigabyte CSV files without loading the entire file into memory.',
  },
  {
    icon: MousePointerClick,
    title: 'Multi-Cursor Editing',
    desc: 'Edit multiple cells simultaneously with multi-cursor support, just like in VS Code.',
  },
  {
    icon: Command,
    title: 'Command Palette',
    desc: 'Access every action instantly with a fuzzy-search command palette. Power users rejoice.',
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    desc: 'Get instant column statistics — min, max, mean, median, unique count — without leaving the editor.',
  },
  {
    icon: Search,
    title: 'Find & Replace (Regex)',
    desc: 'Powerful find-and-replace with full regex support across millions of rows in milliseconds.',
  },
  {
    icon: Palette,
    title: 'Dark / Light Themes',
    desc: 'Beautiful themes that adapt to your system preference. Easy on the eyes, day and night.',
  },
  {
    icon: Monitor,
    title: 'Desktop + Web',
    desc: 'Use the native Windows desktop app or the web version — your workflow, your choice.',
  },
];

export default function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-header">
          <span className="section-label">Features</span>
          <h2 className="section-title">
            Everything you need.{' '}
            <span className="gradient-text">Nothing you don't.</span>
          </h2>
          <p className="section-sub">
            Built from scratch for speed and simplicity. No bloat, no lag, no limits.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div
              className="feature-card"
              key={f.title}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="feature-icon">
                <f.icon size={22} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
