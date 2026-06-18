import { Check, X } from 'lucide-react';

interface Row {
  feature: string;
  ultra: string | boolean;
  modern: string | boolean;
  excel: string | boolean;
}

const rows: Row[] = [
  { feature: 'Price',            ultra: 'Free',    modern: 'Paid',    excel: '$$$' },
  { feature: 'Large File Support', ultra: 'GB+',   modern: 'Limited', excel: '1M rows' },
  { feature: 'Multi-Cursor',    ultra: true,       modern: true,      excel: false },
  { feature: 'Command Palette', ultra: true,       modern: true,      excel: false },
  { feature: 'Streaming Parser', ultra: true,      modern: false,     excel: false },
  { feature: 'Dark Theme',      ultra: true,       modern: true,      excel: false },
  { feature: 'Offline Support', ultra: true,       modern: true,      excel: true },
  { feature: 'Open Source',     ultra: true,       modern: false,     excel: false },
];

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check size={18} className="check" />
    ) : (
      <X size={18} className="cross" />
    );
  }
  if (value === 'Free') return <span className="free-tag">{value}</span>;
  return <span>{value}</span>;
}

export default function Comparison() {
  return (
    <section className="section" id="compare">
      <div className="container">
        <div className="section-header">
          <span className="section-label">Compare</span>
          <h2 className="section-title">
            See how we <span className="gradient-text">stack up</span>
          </h2>
          <p className="section-sub">
            An honest, feature-by-feature comparison with the alternatives.
          </p>
        </div>

        <div className="comparison-wrapper glass">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th className="highlight">Ultra CSV Editor</th>
                <th>Modern CSV</th>
                <th>Excel</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.feature}>
                  <td>{r.feature}</td>
                  <td className="highlight"><Cell value={r.ultra} /></td>
                  <td><Cell value={r.modern} /></td>
                  <td><Cell value={r.excel} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
