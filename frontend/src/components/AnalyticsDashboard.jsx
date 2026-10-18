import { useState, useMemo } from 'react';
import { 
  BarChart3, 
  PieChart, 
  Activity, 
  ShieldCheck, 
  Car, 
  Camera, 
  Clock, 
  FileSpreadsheet, 
  Download,
  Crosshair,
  SlidersHorizontal
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function AnalyticsDashboard({ 
  analysisResult, 
  lastAnalysisTime, 
  selectedSlotId, 
  onSelectSlot 
}) {
  const [hoveredSlot, setHoveredSlot] = useState(null);

  // Normalize slot records directly from real powerbi_records or analysisResult.slots
  const slotRecords = useMemo(() => {
    if (analysisResult?.powerbi_records && Array.isArray(analysisResult.powerbi_records) && analysisResult.powerbi_records.length > 0) {
      return [...analysisResult.powerbi_records]
        .map((rec) => {
          const rawConf = typeof rec.Confidence === 'number' ? rec.Confidence : parseFloat(rec.Confidence) || 0;
          return {
            slotId: rec.Slot_ID,
            status: rec.Status,
            confidence: rawConf <= 1.0 ? +(rawConf * 100).toFixed(2) : +rawConf.toFixed(2),
            date: rec.Date,
            time: rec.Time,
            lot: rec.Parking_Lot,
          };
        })
        .sort((a, b) => {
          const numA = parseInt(a.slotId.replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(b.slotId.replace(/\D/g, ''), 10) || 0;
          return numA - numB;
        });
    }

    if (analysisResult?.slots && Array.isArray(analysisResult.slots)) {
      return [...analysisResult.slots]
        .map((slot) => {
          const rawConf = typeof slot.confidence === 'number' ? slot.confidence : parseFloat(slot.confidence) || 0;
          return {
            slotId: slot.slot_id,
            status: slot.status,
            confidence: rawConf <= 1.0 ? +(rawConf * 100).toFixed(2) : +rawConf.toFixed(2),
            date: null,
            time: null,
            lot: analysisResult.parking_lot,
          };
        })
        .sort((a, b) => {
          const numA = parseInt(a.slotId.replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(b.slotId.replace(/\D/g, ''), 10) || 0;
          return numA - numB;
        });
    }

    return [];
  }, [analysisResult]);

  // Confidence Statistics
  const confidenceStats = useMemo(() => {
    if (!slotRecords.length) return { min: 0, max: 0, highCount: 0 };
    let min = 100;
    let max = 0;
    let highCount = 0;

    slotRecords.forEach((s) => {
      if (s.confidence < min) min = s.confidence;
      if (s.confidence > max) max = s.confidence;
      if (s.confidence >= 90) highCount += 1;
    });

    return { min, max, highCount };
  }, [slotRecords]);

  // --------------------------------------------------------------------------
  // EMPTY STATE (Task 12)
  // --------------------------------------------------------------------------
  if (!analysisResult) {
    return (
      <div className="panel-card dashboard-full-width" id="overview">
        <div className="panel-header">
          <div className="panel-header-left">
            <div className="panel-icon-wrap">
              <BarChart3 size={18} />
            </div>
            <div>
              <h2 className="panel-title">Analytics Dashboard</h2>
              <span className="panel-subtitle-inline">AI occupancy telemetry &amp; Power BI analytics</span>
            </div>
          </div>
          <span className="phase-pill">
            Awaiting Analysis
          </span>
        </div>

        <div className="placeholder-empty-state">
          <div className="placeholder-icon-halo">
            <Activity size={26} />
          </div>

          <h3 className="placeholder-title">No parking analysis available</h3>

          <p className="placeholder-desc">
            Upload a valid parking-lot image to generate AI occupancy analytics.
          </p>

          <div className="placeholder-spec-grid">
            <div className="spec-cell">
              <div className="spec-label">Total Slots</div>
              <div className="spec-value">--</div>
            </div>
            <div className="spec-cell">
              <div className="spec-label">Occupied</div>
              <div className="spec-value">--</div>
            </div>
            <div className="spec-cell">
              <div className="spec-label">Vacant</div>
              <div className="spec-value">--</div>
            </div>
            <div className="spec-cell">
              <div className="spec-label">Occupancy</div>
              <div className="spec-value">-- %</div>
            </div>
            <div className="spec-cell">
              <div className="spec-label">AI Confidence</div>
              <div className="spec-value">-- %</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // DYNAMIC VALUES FROM REAL API RESPONSE (Tasks 2, 3, 4, 6)
  // --------------------------------------------------------------------------
  const totalSlots = analysisResult.total_slots || slotRecords.length;
  const occupiedSlots = analysisResult.occupied_slots || 0;
  const vacantSlots = analysisResult.vacant_slots || 0;
  const occupancyPct = typeof analysisResult.occupancy_percentage === 'number'
    ? analysisResult.occupancy_percentage
    : parseFloat(analysisResult.occupancy_percentage) || 0;

  const avgConfidencePct = typeof analysisResult.average_confidence === 'number'
    ? (analysisResult.average_confidence <= 1 
        ? (analysisResult.average_confidence * 100).toFixed(1) 
        : Number(analysisResult.average_confidence).toFixed(1))
    : '0.0';

  const lotDisplayName = analysisResult.parking_lot
    ? analysisResult.parking_lot.replace(/_/g, ' ')
    : 'Parking Lot 5';

  const resWidth = analysisResult.image_size?.width;
  const resHeight = analysisResult.image_size?.height;

  const displayTime = lastAnalysisTime || (slotRecords[0]?.time ? `${slotRecords[0].date} ${slotRecords[0].time}` : 'Live');

  // Exact Occupancy Distribution Proportions
  const occupiedProportion = totalSlots > 0 ? (occupiedSlots / totalSlots) : 0;
  const vacantProportion = totalSlots > 0 ? (vacantSlots / totalSlots) : 0;
  const occupiedPercent = (occupiedProportion * 100).toFixed(1);
  const vacantPercent = (vacantProportion * 100).toFixed(1);

  // SVG Donut Calculations for Occupancy Distribution
  const donutRadius = 40;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const occupiedDashLength = occupiedProportion * donutCircumference;
  const vacantDashLength = vacantProportion * donutCircumference;

  // SVG Bar Chart Dimensions for Slot Prediction Confidence
  const chartWidth = 820;
  const chartHeight = 220;
  const plotLeft = 46;
  const plotTop = 24;
  const plotWidth = 750;
  const plotHeight = 150;
  const plotBottom = plotTop + plotHeight;

  const slotCount = slotRecords.length || 1;
  const barStep = plotWidth / slotCount;
  const barWidth = Math.max(barStep - 2.5, 3.5);

  const handleBarClick = (slotId) => {
    if (!onSelectSlot) return;
    onSelectSlot(selectedSlotId === slotId ? null : slotId);
  };

  return (
    <div className="panel-card dashboard-full-width" id="overview">
      {/* ----------------------------------------------------------------------
          Section Header
          ---------------------------------------------------------------------- */}
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-icon-wrap">
            <BarChart3 size={18} />
          </div>
          <div>
            <h2 className="panel-title">Analytics Dashboard</h2>
            <span className="panel-subtitle-inline">
              Real-time AI telemetry &amp; Power BI occupancy analytics ({slotRecords.length} slots)
            </span>
          </div>
        </div>

        <div className="panel-header-right-badges">
          <span className="phase-pill phase-pill-emerald">
            Live Inference
          </span>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          TASK 6: Analysis Metadata Row
          ---------------------------------------------------------------------- */}
      <div className="analytics-metadata-bar" role="region" aria-label="Analysis Metadata">
        <div className="metadata-item">
          <div className="meta-icon-label">
            <Car size={13} className="text-cyan" />
            <span className="meta-dim-label">PARKING LOT</span>
          </div>
          <span className="meta-dim-value font-mono">{lotDisplayName}</span>
        </div>

        {resWidth && resHeight && (
          <div className="metadata-item">
            <div className="meta-icon-label">
              <Camera size={13} className="text-cyan" />
              <span className="meta-dim-label">IMAGE RESOLUTION</span>
            </div>
            <span className="meta-dim-value font-mono">
              {resWidth} × {resHeight}
            </span>
          </div>
        )}

        <div className="metadata-item">
          <div className="meta-icon-label">
            <SlidersHorizontal size={13} className="text-cyan" />
            <span className="meta-dim-label">TOTAL BAYS ANALYZED</span>
          </div>
          <span className="meta-dim-value font-mono">{totalSlots}</span>
        </div>

        <div className="metadata-item">
          <div className="meta-icon-label">
            <Clock size={13} className="text-cyan" />
            <span className="meta-dim-label">LAST ANALYSIS TIME</span>
          </div>
          <span className="meta-dim-value font-mono text-cyan">{displayTime}</span>
        </div>

        {/* Live Power BI CSV Dataset link */}
        <div className="metadata-item metadata-item-action">
          <a
            href={`${API_BASE_URL}${analysisResult.powerbi_csv_url || '/powerbi-files/parking_occupancy.csv'}`}
            download="parking_occupancy.csv"
            target="_blank"
            rel="noopener noreferrer"
            className="powerbi-dataset-pill"
            title="Download the real Power BI CSV generated from this inference run"
          >
            <FileSpreadsheet size={13} />
            <span>Power BI CSV</span>
            <Download size={11} />
          </a>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          TASK 2: Parking Occupancy Overview (KPI Cards)
          ---------------------------------------------------------------------- */}
      <div className="kpi-dashboard-grid analytics-kpis">
        <div className="kpi-card">
          <span className="kpi-label">TOTAL SLOTS</span>
          <span className="kpi-value font-mono">{totalSlots}</span>
          <span className="kpi-sub">Configured bays</span>
        </div>

        <div className="kpi-card kpi-card-occupied">
          <span className="kpi-label text-occupied">OCCUPIED SLOTS</span>
          <span className="kpi-value text-occupied font-mono">{occupiedSlots}</span>
          <span className="kpi-sub">{occupiedPercent}% of capacity</span>
        </div>

        <div className="kpi-card kpi-card-vacant">
          <span className="kpi-label text-vacant">VACANT SLOTS</span>
          <span className="kpi-value text-vacant font-mono">{vacantSlots}</span>
          <span className="kpi-sub">{vacantPercent}% available</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">OCCUPANCY PERCENTAGE</span>
          <span className="kpi-value font-mono">{occupancyPct}%</span>
          <span className="kpi-sub">Dynamic facility load</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">AVERAGE AI CONFIDENCE</span>
          <span className="kpi-value text-cyan font-mono">{avgConfidencePct}%</span>
          <span className="kpi-sub">MobileNetV2 sigmoid</span>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          TASKS 3 & 4: Visual Analytics Grid
          ---------------------------------------------------------------------- */}
      <div className="analytics-visual-grid">
        {/* TASK 3: Occupancy Distribution Visualization */}
        <div className="analytics-card occupancy-distribution-card">
          <div className="analytics-card-header">
            <div className="card-header-title-wrap">
              <PieChart size={15} className="text-cyan" />
              <div>
                <h3 className="analytics-card-title">Occupancy Distribution</h3>
                <span className="analytics-card-subtitle">Real-time capacity allocation</span>
              </div>
            </div>
            <span className="analytics-sub-badge font-mono">{totalSlots} bays</span>
          </div>

          <div className="occupancy-donut-container">
            {/* SVG Donut Chart */}
            <div className="donut-chart-wrapper">
              <svg className="donut-svg" viewBox="0 0 100 100" width="130" height="130">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r={donutRadius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeWidth="10"
                />

                {/* Vacant Base / Segment (Emerald) */}
                {vacantSlots > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r={donutRadius}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray={`${vacantDashLength} ${donutCircumference}`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                    strokeLinecap={occupiedSlots > 0 ? 'butt' : 'round'}
                  />
                )}

                {/* Occupied Segment (Rose) */}
                {occupiedSlots > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r={donutRadius}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="10"
                    strokeDasharray={`${occupiedDashLength} ${donutCircumference}`}
                    strokeDashoffset={`${-vacantDashLength}`}
                    transform="rotate(-90 50 50)"
                    strokeLinecap={vacantSlots > 0 ? 'butt' : 'round'}
                  />
                )}
              </svg>

              <div className="donut-center-content">
                <span className="donut-center-pct font-mono">{occupancyPct}%</span>
                <span className="donut-center-label">LOAD</span>
              </div>
            </div>

            {/* Distribution Legend & Breakdown */}
            <div className="distribution-details">
              <div className="dist-row dist-row-occupied">
                <div className="dist-indicator-group">
                  <span className="dist-dot dot-occupied" />
                  <span className="dist-name">OCCUPIED</span>
                </div>
                <div className="dist-values font-mono">
                  <span className="dist-count text-occupied">{occupiedSlots} slots</span>
                  <span className="dist-pct">({occupiedPercent}%)</span>
                </div>
              </div>

              <div className="dist-row dist-row-vacant">
                <div className="dist-indicator-group">
                  <span className="dist-dot dot-vacant" />
                  <span className="dist-name">VACANT</span>
                </div>
                <div className="dist-values font-mono">
                  <span className="dist-count text-vacant">{vacantSlots} slots</span>
                  <span className="dist-pct">({vacantPercent}%)</span>
                </div>
              </div>

              {/* Dual Proportional Horizontal Progress Bar */}
              <div className="dist-bar-track" role="progressbar" aria-valuenow={occupancyPct} aria-valuemin="0" aria-valuemax="100">
                <div 
                  className="dist-bar-fill fill-occupied" 
                  style={{ width: `${occupiedPercent}%` }}
                  title={`Occupied: ${occupiedSlots} (${occupiedPercent}%)`}
                />
                <div 
                  className="dist-bar-fill fill-vacant" 
                  style={{ width: `${vacantPercent}%` }}
                  title={`Vacant: ${vacantSlots} (${vacantPercent}%)`}
                />
              </div>

              <div className="dist-bar-sub font-mono">
                <span>Facility Allocation</span>
                <span className="text-cyan">{totalSlots} Total configured</span>
              </div>
            </div>
          </div>
        </div>

        {/* TASK 4: AI Prediction Confidence Visualization */}
        <div className="analytics-card confidence-chart-card">
          <div className="analytics-card-header">
            <div className="card-header-title-wrap">
              <ShieldCheck size={15} className="text-cyan" />
              <div>
                <h3 className="analytics-card-title">AI Prediction Confidence</h3>
                <span className="analytics-card-subtitle">
                  Per-slot MobileNetV2 classification probability (Power BI dataset)
                </span>
              </div>
            </div>

            {/* Active slot or benchmark badge */}
            <div className="chart-header-actions">
              {selectedSlotId ? (
                <span className="selected-slot-badge font-mono">
                  <Crosshair size={12} />
                  <span>Inspecting {selectedSlotId}</span>
                </span>
              ) : (
                <span className="benchmark-tag font-mono">
                  90% High Confidence
                </span>
              )}
            </div>
          </div>

          {/* Interactive Confidence Bar Chart */}
          <div className="confidence-chart-wrapper">
            <svg 
              className="confidence-svg" 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Horizontal Gridlines & Y-Axis Labels */}
              {[100, 75, 50, 25, 0].map((val) => {
                const y = plotTop + (plotHeight * (100 - val)) / 100;
                return (
                  <g key={val}>
                    <line
                      x1={plotLeft}
                      y1={y}
                      x2={plotLeft + plotWidth}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.07)"
                      strokeWidth="1"
                    />
                    <text
                      x={plotLeft - 8}
                      y={y + 3}
                      textAnchor="end"
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="var(--font-mono)"
                    >
                      {val}%
                    </text>
                  </g>
                );
              })}

              {/* 90% Benchmark Reference Line */}
              <line
                x1={plotLeft}
                y1={plotTop + (plotHeight * 0.1)}
                x2={plotLeft + plotWidth}
                y2={plotTop + (plotHeight * 0.1)}
                stroke="rgba(16, 185, 129, 0.45)"
                strokeDasharray="4 3"
                strokeWidth="1.2"
              />
              <text
                x={plotLeft + plotWidth - 4}
                y={plotTop + (plotHeight * 0.1) - 4}
                textAnchor="end"
                fill="#10b981"
                fontSize="8.5"
                fontFamily="var(--font-mono)"
                opacity="0.85"
              >
                90% Target
              </text>

              {/* Slot Confidence Bars */}
              {slotRecords.map((slot, index) => {
                const isOccupied = slot.status === 'OCCUPIED';
                const isSelected = selectedSlotId === slot.slotId;
                const isHovered = hoveredSlot?.slotId === slot.slotId;

                const barHeight = Math.max((slot.confidence / 100) * plotHeight, 2);
                const x = plotLeft + index * barStep + 1;
                const y = plotBottom - barHeight;

                const baseColor = isOccupied ? '#f43f5e' : '#10b981';

                return (
                  <g 
                    key={slot.slotId}
                    className="confidence-bar-group"
                    onClick={() => handleBarClick(slot.slotId)}
                    onMouseEnter={() => setHoveredSlot(slot)}
                    onMouseLeave={() => setHoveredSlot(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Background hit area for easy hover/tap */}
                    <rect
                      x={x - 1}
                      y={plotTop}
                      width={barWidth + 2}
                      height={plotHeight}
                      fill="transparent"
                    />

                    {/* Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="1.5"
                      fill={baseColor}
                      opacity={isSelected ? 1 : isHovered ? 0.95 : 0.78}
                      stroke={isSelected ? '#10b981' : isHovered ? 'var(--text-primary, #ffffff)' : 'none'}
                      strokeWidth={isSelected ? 2 : isHovered ? 1 : 0}
                    />

                    {/* Selection Indicator Arrow above the bar */}
                    {isSelected && (
                      <polygon
                        points={`${x + barWidth / 2 - 4},${y - 8} ${x + barWidth / 2 + 4},${y - 8} ${x + barWidth / 2},${y - 3}`}
                        fill="#10b981"
                      />
                    )}
                  </g>
                );
              })}

              {/* X-Axis Base Line */}
              <line
                x1={plotLeft}
                y1={plotBottom}
                x2={plotLeft + plotWidth}
                y2={plotBottom}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1"
              />

              {/* X-Axis Range Markers */}
              {slotRecords.length > 0 && (
                <>
                  <text
                    x={plotLeft}
                    y={plotBottom + 16}
                    textAnchor="start"
                    fill="#94a3b8"
                    fontSize="9.5"
                    fontFamily="var(--font-mono)"
                  >
                    {slotRecords[0].slotId}
                  </text>
                  <text
                    x={plotLeft + plotWidth / 2}
                    y={plotBottom + 16}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="var(--font-mono)"
                  >
                    {slotRecords[Math.floor(slotRecords.length / 2)]?.slotId || ''}
                  </text>
                  <text
                    x={plotLeft + plotWidth}
                    y={plotBottom + 16}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="9.5"
                    fontFamily="var(--font-mono)"
                  >
                    {slotRecords[slotRecords.length - 1].slotId}
                  </text>
                </>
              )}
            </svg>

            {/* Dynamic Interactive Tooltip */}
            {hoveredSlot && (
              <div className="confidence-tooltip font-mono">
                <span className="tooltip-slot-id">{hoveredSlot.slotId}</span>
                <span className={`tooltip-status ${hoveredSlot.status === 'OCCUPIED' ? 'text-occupied' : 'text-vacant'}`}>
                  {hoveredSlot.status}
                </span>
                <span className="tooltip-conf text-cyan">{hoveredSlot.confidence}%</span>
                <span className="tooltip-hint">(Click to inspect)</span>
              </div>
            )}
          </div>

          {/* Chart Summary Footer */}
          <div className="confidence-chart-footer">
            <div className="chart-legend-group">
              <span className="chart-legend-item">
                <span className="legend-box box-occupied" /> Occupied
              </span>
              <span className="chart-legend-item">
                <span className="legend-box box-vacant" /> Vacant
              </span>
              <span className="chart-legend-item">
                <span className="legend-dash-cyan" /> 90% Benchmark
              </span>
            </div>

            <div className="chart-stat-pills font-mono">
              <span className="stat-pill">
                Min: <strong>{confidenceStats.min}%</strong>
              </span>
              <span className="stat-pill">
                Max: <strong>{confidenceStats.max}%</strong>
              </span>
              <span className="stat-pill text-cyan">
                &ge;90%: <strong>{confidenceStats.highCount}/{slotRecords.length}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
