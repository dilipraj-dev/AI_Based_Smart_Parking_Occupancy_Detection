import { LayoutGrid, Activity, ShieldCheck, PieChart } from 'lucide-react';

export default function ParkingOverview({ analysisResult }) {
  if (!analysisResult) {
    return (
      <div className="panel-card" id="overview">
        <div className="panel-header">
          <div className="panel-header-left">
            <div className="panel-icon-wrap">
              <LayoutGrid size={18} />
            </div>
            <div>
              <h2 className="panel-title">Parking Overview &amp; KPIs</h2>
              <span className="panel-subtitle-inline">Live facility telemetry &amp; capacity state</span>
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
          
          <h3 className="placeholder-title">Awaiting parking image analysis</h3>
          
          <p className="placeholder-desc">
            Upload a calibrated Parking Lot 5 frame below and click <strong>Analyze Parking</strong> to compute real-time capacity, occupancy distribution, and MobileNetV2 classification confidence.
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

  // Real data calculations directly from analysisResult
  const total = analysisResult.total_slots || 0;
  const occupied = analysisResult.occupied_slots || 0;
  const vacant = analysisResult.vacant_slots || 0;
  const occupancyPct = analysisResult.occupancy_percentage; // e.g. 57.14
  const confidencePct = (analysisResult.average_confidence * 100).toFixed(1); // e.g. 96.0

  // Exact proportions for horizontal stacked bar
  const occupiedBarWidth = total > 0 ? (occupied / total) * 100 : 0;
  const vacantBarWidth = total > 0 ? (vacant / total) * 100 : 0;

  // SVG Circular Ring calculation
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (Math.min(Math.max(occupancyPct, 0), 100) / 100) * ringCircumference;

  return (
    <div className="panel-card" id="overview">
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-icon-wrap">
            <LayoutGrid size={18} />
          </div>
          <div>
            <h2 className="panel-title">Parking Overview &amp; KPIs</h2>
            <span className="panel-subtitle-inline">Live inference metrics &amp; capacity state</span>
          </div>
        </div>
        <span className="phase-pill phase-pill-emerald">
          Live Telemetry
        </span>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-dashboard-grid">
        <div className="kpi-card">
          <span className="kpi-label">TOTAL SLOTS</span>
          <span className="kpi-value font-mono">{total}</span>
          <span className="kpi-sub">Configured slots</span>
        </div>

        <div className="kpi-card kpi-card-occupied">
          <span className="kpi-label text-occupied">OCCUPIED</span>
          <span className="kpi-value text-occupied font-mono">{occupied}</span>
          <span className="kpi-sub">Active vehicles</span>
        </div>

        <div className="kpi-card kpi-card-vacant">
          <span className="kpi-label text-vacant">VACANT</span>
          <span className="kpi-value text-vacant font-mono">{vacant}</span>
          <span className="kpi-sub">Available bays</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">OCCUPANCY</span>
          <span className="kpi-value font-mono">{occupancyPct}%</span>
          <span className="kpi-sub">Capacity load</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">AI CONFIDENCE</span>
          <span className="kpi-value text-cyan font-mono">{confidencePct}%</span>
          <span className="kpi-sub">MobileNetV2 avg</span>
        </div>
      </div>

      {/* Visual Analytics Row: Circular Ring + Stacked Bar + Confidence Progress */}
      <div className="overview-visual-analytics">
        {/* Left: Circular Occupancy Gauge */}
        <div className="visual-meter-card">
          <div className="meter-card-header">
            <PieChart size={14} />
            <span>Capacity Gauge</span>
          </div>
          <div className="circular-meter-wrapper">
            <svg className="circular-meter-svg" viewBox="0 0 100 100" width="104" height="104">
              {/* Background Ring */}
              <circle
                className="ring-bg"
                cx="50"
                cy="50"
                r={ringRadius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="8"
              />
              {/* Progress Ring */}
              <circle
                className="ring-progress"
                cx="50"
                cy="50"
                r={ringRadius}
                fill="none"
                stroke="url(#occupancyGradient)"
                strokeWidth="8"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
              <defs>
                <linearGradient id="occupancyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
              </defs>
            </svg>
            <div className="circular-meter-text">
              <span className="meter-percent font-mono">{occupancyPct}%</span>
              <span className="meter-label">LOAD</span>
            </div>
          </div>
        </div>

        {/* Right: Proportional Horizontal Stacked Bar & Confidence Progress */}
        <div className="visual-bars-card">
          {/* Horizontal Proportional Stacked Bar */}
          <div className="stacked-bar-section">
            <div className="bar-header-row">
              <span className="bar-title">Occupancy Distribution</span>
              <span className="bar-legend font-mono">
                <span className="legend-occupied-dot" /> {occupied} Occupied &nbsp;|&nbsp; 
                <span className="legend-vacant-dot" /> {vacant} Vacant
              </span>
            </div>

            <div className="proportional-stacked-bar" role="progressbar" aria-valuenow={occupancyPct} aria-valuemin="0" aria-valuemax="100">
              <div 
                className="stacked-portion portion-occupied" 
                style={{ width: `${occupiedBarWidth}%` }}
                title={`Occupied: ${occupied} slots (${occupiedBarWidth.toFixed(1)}%)`}
              />
              <div 
                className="stacked-portion portion-vacant" 
                style={{ width: `${vacantBarWidth}%` }}
                title={`Vacant: ${vacant} slots (${vacantBarWidth.toFixed(1)}%)`}
              />
            </div>

            <div className="bar-footer-row font-mono">
              <span className="text-occupied">
                {occupiedBarWidth.toFixed(1)}% Occupied
              </span>
              <span className="text-vacant">
                {vacantBarWidth.toFixed(1)}% Vacant
              </span>
            </div>
          </div>

          {/* AI Prediction Confidence Progress Meter */}
          <div className="confidence-meter-section">
            <div className="bar-header-row">
              <div className="confidence-title-wrap">
                <ShieldCheck size={14} color="#10b981" />
                <span className="bar-title">Average AI Prediction Confidence</span>
              </div>
              <span className="confidence-score font-mono text-cyan">{confidencePct}%</span>
            </div>

            <div className="confidence-progress-track">
              <div 
                className="confidence-progress-fill" 
                style={{ width: `${analysisResult.average_confidence * 100}%` }}
              />
            </div>
            
            <div className="confidence-meta font-mono">
              <span>MobileNetV2 Sigmoid Probability</span>
              <span>Calibrated: 1.0 = 100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
