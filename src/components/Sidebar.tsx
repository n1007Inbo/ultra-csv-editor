import React, { useMemo, useState } from 'react';
import { X, BarChart3, TrendingUp, Info } from 'lucide-react';

interface SidebarProps {
  data: string[][];
  columns: string[];
  activeCell: { row: number; col: number } | null;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  data,
  columns,
  activeCell,
  onClose,
}) => {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  // Determine active column index and details
  const activeColIndex = activeCell ? activeCell.col : 0;
  const columnName = columns[activeColIndex] || `Column ${activeColIndex + 1}`;

  // Extract values from the active column
  const colValues = useMemo(() => {
    return data.map((row) => row[activeColIndex] || '');
  }, [data, activeColIndex]);

  // Compute stats
  const stats = useMemo(() => {
    const total = colValues.length;
    let emptyCount = 0;
    const distinctSet = new Set<string>();
    const numericValues: number[] = [];

    colValues.forEach((val) => {
      const trimmed = val.trim();
      if (trimmed === '') {
        emptyCount++;
      } else {
        distinctSet.add(trimmed);
        const num = Number(trimmed);
        if (!isNaN(num)) {
          numericValues.push(num);
        }
      }
    });

    const isNumeric = numericValues.length > 0 && numericValues.length >= (total - emptyCount) * 0.5;

    let sum = 0;
    let avg = 0;
    let min = 0;
    let max = 0;

    if (isNumeric && numericValues.length > 0) {
      sum = numericValues.reduce((s, v) => s + v, 0);
      avg = sum / numericValues.length;
      min = Math.min(...numericValues);
      max = Math.max(...numericValues);
    }

    return {
      total,
      emptyCount,
      filledCount: total - emptyCount,
      distinctCount: distinctSet.size,
      isNumeric,
      numericCount: numericValues.length,
      sum: isNumeric ? sum.toFixed(2) : '-',
      avg: isNumeric ? avg.toFixed(2) : '-',
      min: isNumeric ? min.toFixed(2) : '-',
      max: isNumeric ? max.toFixed(2) : '-',
    };
  }, [colValues]);

  // Prepare categorical frequencies (Top 5)
  const categoryData = useMemo(() => {
    const freq: { [key: string]: number } = {};
    colValues.forEach((val) => {
      const v = val.trim() === '' ? '(Blank)' : val.trim();
      freq[v] = (freq[v] || 0) + 1;
    });

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [colValues]);

  // Prepare sequential numeric values (up to 150 points for performance)
  const lineChartData = useMemo(() => {
    const numbers: number[] = [];
    colValues.forEach((val) => {
      const num = Number(val.trim());
      if (!isNaN(num) && val.trim() !== '') {
        numbers.push(num);
      }
    });
    // Sample if too long to make rendering fast
    if (numbers.length > 150) {
      const step = Math.floor(numbers.length / 150);
      return numbers.filter((_, idx) => idx % step === 0).slice(0, 150);
    }
    return numbers;
  }, [colValues]);

  // SVG Chart builders
  const renderChart = () => {
    const width = 300;
    const height = 180;
    const padding = 25;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    if (chartType === 'bar' || !stats.isNumeric) {
      // Bar chart for top categories
      if (categoryData.length === 0) return null;
      
      const maxCount = Math.max(...categoryData.map((d) => d.count), 1);
      const barWidth = chartW / categoryData.length - 8;

      return (
        <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`}>
          {/* Axis lines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="chart-axis" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="chart-axis" />

          {categoryData.map((d, i) => {
            const barH = (d.count / maxCount) * chartH;
            const x = padding + i * (barWidth + 8) + 4;
            const y = height - padding - barH;

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  className="chart-bar"
                  rx={3}
                />
                <text
                  x={x + barWidth / 2}
                  y={height - padding + 12}
                  textAnchor="middle"
                  className="chart-text"
                  style={{ fontSize: '8px' }}
                >
                  {d.name.length > 8 ? `${d.name.slice(0, 6)}..` : d.name}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  className="chart-text"
                  style={{ fontWeight: 600, fill: 'var(--accent)' }}
                >
                  {d.count}
                </text>
              </g>
            );
          })}
        </svg>
      );
    } else {
      // Line chart for numerical trends
      if (lineChartData.length < 2) {
        return (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Not enough data points
          </div>
        );
      }

      const minVal = Math.min(...lineChartData);
      const maxVal = Math.max(...lineChartData);
      const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

      // Calculate path points
      const points = lineChartData.map((val, idx) => {
        const x = padding + (idx / (lineChartData.length - 1)) * chartW;
        const y = height - padding - ((val - minVal) / range) * chartH;
        return { x, y, val };
      });

      const pathD = points.reduce(
        (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
        ''
      );

      const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

      return (
        <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--border-color)" strokeDasharray="2,2" />
          <line x1={padding} y1={padding + chartH / 2} x2={width - padding} y2={padding + chartH / 2} stroke="var(--border-color)" strokeDasharray="2,2" />

          {/* Axis lines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="chart-axis" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="chart-axis" />

          {/* Area under the line */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Trend Line */}
          <path d={pathD} className="chart-line" />

          {/* Dot Markers for small lengths */}
          {lineChartData.length <= 20 &&
            points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={4}
                className="chart-point"
              >
                <title>Value: {p.val}</title>
              </circle>
            ))}

          {/* Range text */}
          <text x={padding + 5} y={padding + 10} className="chart-text" style={{ fontSize: '8px' }}>
            Max: {maxVal.toFixed(1)}
          </text>
          <text x={padding + 5} y={height - padding - 5} className="chart-text" style={{ fontSize: '8px' }}>
            Min: {minVal.toFixed(1)}
          </text>
        </svg>
      );
    }
  };

  return (
    <div className="sidebar-panel">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <span className="sidebar-title">
          <BarChart3 size={18} className="logo-icon" style={{ padding: '0.2rem', boxShadow: 'none' }} />
          <span>Column Analytics</span>
        </span>
        <button
          className="btn btn-icon-only"
          onClick={onClose}
          style={{ border: 'none', background: 'none' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Sidebar Scrollable Body */}
      <div className="sidebar-content">
        {/* Column Info Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Selected Column</div>
          <div
            style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              wordBreak: 'break-all',
              fontFamily: 'var(--mono)',
            }}
          >
            {columnName}
          </div>
        </div>

        {/* Basic Counts */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Rows</span>
            <span className="stat-val">{stats.total}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Unique Values</span>
            <span className="stat-val">{stats.distinctCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Filled Cells</span>
            <span className="stat-val">{stats.filledCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Blank Cells</span>
            <span className="stat-val" style={{ color: stats.emptyCount > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
              {stats.emptyCount}
            </span>
          </div>
        </div>

        {/* Math & Numbers Block (only if numeric values present) */}
        {stats.isNumeric ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <TrendingUp size={14} style={{ color: 'var(--accent)' }} />
              Numerical Statistics
            </span>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Sum</span>
                <span className="stat-val" style={{ color: 'var(--accent-purple)' }}>{stats.sum}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Average</span>
                <span className="stat-val" style={{ color: 'var(--accent-purple)' }}>{stats.avg}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Minimum</span>
                <span className="stat-val" style={{ color: 'var(--danger)' }}>{stats.min}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Maximum</span>
                <span className="stat-val" style={{ color: 'var(--success)' }}>{stats.max}</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}
          >
            <Info size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--text-muted)' }} />
            <span>This column contains mostly text. Mathematical statistics (Sum, Min, Max) are hidden.</span>
          </div>
        )}

        {/* Chart Card */}
        <div className="chart-container">
          <div className="chart-header">
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Quick Visualization
            </span>
            {stats.isNumeric && (
              <select
                className="chart-select"
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'bar' | 'line')}
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
              </select>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '180px' }}>
            {renderChart()}
          </div>
        </div>
      </div>
    </div>
  );
};
