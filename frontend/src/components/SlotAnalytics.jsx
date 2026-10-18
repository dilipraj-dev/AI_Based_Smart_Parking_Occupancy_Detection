import { useState, useMemo } from 'react';
import { BarChart3, Search, SlidersHorizontal, CheckCircle2, Car, ShieldAlert, Check } from 'lucide-react';

export default function SlotAnalytics({ analysisResult, selectedSlotId, onSelectSlot }) {
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'OCCUPIED' | 'VACANT'
  const [searchTerm, setSearchTerm] = useState('');

  // Sort slots by numeric slot ID (e.g. SLOT_001 -> 1, SLOT_049 -> 49)
  const sortedSlots = useMemo(() => {
    if (analysisResult?.powerbi_records && Array.isArray(analysisResult.powerbi_records) && analysisResult.powerbi_records.length > 0) {
      return [...analysisResult.powerbi_records]
        .map((rec) => {
          const rawConf = typeof rec.Confidence === 'number' ? rec.Confidence : parseFloat(rec.Confidence) || 0;
          return {
            slot_id: rec.Slot_ID,
            status: rec.Status,
            confidence: rawConf <= 1.0 ? rawConf : rawConf / 100,
            date: rec.Date,
            time: rec.Time,
          };
        })
        .sort((a, b) => {
          const numA = parseInt(a.slot_id.replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(b.slot_id.replace(/\D/g, ''), 10) || 0;
          return numA - numB;
        });
    }

    if (!analysisResult?.slots) return [];
    return [...analysisResult.slots].sort((a, b) => {
      const numA = parseInt(a.slot_id.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.slot_id.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [analysisResult]);

  // Apply status filter and search term
  const filteredSlots = useMemo(() => {
    return sortedSlots.filter((slot) => {
      const matchesStatus =
        filterStatus === 'ALL'
          ? true
          : filterStatus === 'OCCUPIED'
          ? slot.status === 'OCCUPIED'
          : slot.status === 'VACANT';

      const matchesSearch = slot.slot_id
        .toLowerCase()
        .includes(searchTerm.toLowerCase().trim());

      return matchesStatus && matchesSearch;
    });
  }, [sortedSlots, filterStatus, searchTerm]);

  if (!analysisResult) {
    return (
      <div className="panel-card dashboard-full-width" id="analytics">
        <div className="panel-header">
          <div className="panel-header-left">
            <div className="panel-icon-wrap">
              <BarChart3 size={18} />
            </div>
            <div>
              <h2 className="panel-title">Slot Analytics &amp; Telemetry</h2>
              <span className="panel-subtitle-inline">Per-slot distribution &amp; AI prediction confidence breakdown</span>
            </div>
          </div>
          <span className="phase-pill">
            Awaiting Analysis
          </span>
        </div>

        <div className="placeholder-empty-state">
          <div className="placeholder-icon-halo">
            <BarChart3 size={26} />
          </div>

          <h3 className="placeholder-title">Awaiting parking image analysis</h3>

          <p className="placeholder-desc">
            Complete telemetry for all individual parking bays will populate here upon running MobileNetV2 classification.
          </p>

          <div className="placeholder-spec-grid">
            <div className="spec-cell">
              <div className="spec-label">Slot Telemetry</div>
              <div className="spec-value">Awaiting Ingestion</div>
            </div>
            <div className="spec-cell">
              <div className="spec-label">AI Prediction Confidence</div>
              <div className="spec-value">-- %</div>
            </div>
            <div className="spec-cell">
              <div className="spec-label">Class States</div>
              <div className="spec-value">Occupied / Vacant</div>
            </div>
            <div className="spec-cell">
              <div className="spec-label">Engine</div>
              <div className="spec-value">FastAPI / MobileNetV2</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const occupiedCount = analysisResult.occupied_slots || 0;
  const vacantCount = analysisResult.vacant_slots || 0;
  const totalCount = analysisResult.total_slots || sortedSlots.length;

  const handleRowClick = (slotId) => {
    if (!onSelectSlot) return;
    // Toggle selection
    onSelectSlot(selectedSlotId === slotId ? null : slotId);
  };

  return (
    <div className="panel-card dashboard-full-width" id="analytics">
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-icon-wrap">
            <BarChart3 size={18} />
          </div>
          <div>
            <h2 className="panel-title">Slot Analytics &amp; Telemetry</h2>
            <span className="panel-subtitle-inline">
              Click any slot to inspect prediction in the monitoring viewer ({sortedSlots.length} slots)
            </span>
          </div>
        </div>

        {/* Slot Summary Counts */}
        <div className="slot-summary-pills">
          <div className="slot-count-badge badge-occupied">
            <Car size={13} />
            <span>Occupied: <strong>{occupiedCount}</strong></span>
          </div>
          <div className="slot-count-badge badge-vacant">
            <CheckCircle2 size={13} />
            <span>Vacant: <strong>{vacantCount}</strong></span>
          </div>
          <span className="phase-pill phase-pill-emerald">
            {sortedSlots.length} Slots Loaded
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="slot-toolbar">
        {/* Filter Buttons */}
        <div className="filter-pill-group" role="group" aria-label="Filter slots by status">
          <button
            type="button"
            className={`filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterStatus('ALL')}
          >
            <SlidersHorizontal size={13} />
            <span>ALL ({totalCount})</span>
          </button>
          <button
            type="button"
            className={`filter-btn ${filterStatus === 'OCCUPIED' ? 'active' : ''}`}
            onClick={() => setFilterStatus('OCCUPIED')}
          >
            <span className="dot-rose" />
            <span>OCCUPIED ({occupiedCount})</span>
          </button>
          <button
            type="button"
            className={`filter-btn ${filterStatus === 'VACANT' ? 'active' : ''}`}
            onClick={() => setFilterStatus('VACANT')}
          >
            <span className="dot-emerald" />
            <span>VACANT ({vacantCount})</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="search-input-wrap">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="search-input font-mono"
            placeholder="Search slot (e.g. SLOT_001)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search slots by ID"
          />
          {searchTerm && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Slots Table */}
      <div className="slots-table-wrapper">
        <table className="slots-table" aria-label="Individual slot occupancy table">
          <thead>
            <tr>
              <th scope="col">Slot ID</th>
              <th scope="col">Status</th>
              <th scope="col">AI Prediction Confidence</th>
              <th scope="col" style={{ width: '100px', textAlign: 'center' }}>Inspection</th>
            </tr>
          </thead>
          <tbody>
            {filteredSlots.length > 0 ? (
              filteredSlots.map((slot) => {
                const isOccupied = slot.status === 'OCCUPIED';
                const isSelected = selectedSlotId === slot.slot_id;
                const confidencePct = typeof slot.confidence === 'number'
                  ? `${(slot.confidence * 100).toFixed(1)}%`
                  : slot.confidence;

                return (
                  <tr 
                    key={slot.slot_id}
                    className={`slot-row-interactive ${isSelected ? 'slot-row-selected' : ''}`}
                    onClick={() => handleRowClick(slot.slot_id)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(slot.slot_id);
                      }
                    }}
                    aria-selected={isSelected}
                  >
                    <td className="slot-id-cell font-mono">
                      <div className="slot-id-flex">
                        <span>{slot.slot_id}</span>
                        {isSelected && (
                          <span className="active-slot-pill font-mono">
                            <Check size={10} /> Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`slot-status-pill ${isOccupied ? 'pill-occupied' : 'pill-vacant'}`}>
                        {slot.status}
                      </span>
                    </td>
                    <td className="slot-conf-cell font-mono">
                      <div className="conf-cell-wrap">
                        <div className="conf-mini-bar-track">
                          <div 
                            className={`conf-mini-bar-fill ${isOccupied ? 'fill-occupied' : 'fill-vacant'}`}
                            style={{ width: `${typeof slot.confidence === 'number' ? slot.confidence * 100 : 90}%` }}
                          />
                        </div>
                        <span>{confidencePct}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`inspect-action-tag font-mono ${isSelected ? 'tag-inspect-active' : ''}`}>
                        {isSelected ? 'Selected' : 'Inspect'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="no-slots-cell">
                  <div className="no-slots-msg">
                    <ShieldAlert size={16} />
                    <span>No slots match the search filter "{searchTerm}".</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
