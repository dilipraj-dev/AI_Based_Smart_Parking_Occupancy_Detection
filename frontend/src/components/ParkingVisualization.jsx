import { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Scan, 
  Eye, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Minimize2,
  Car,
  Info,
  ShieldCheck,
  Camera,
  X
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function ParkingVisualization({ 
  analysisResult, 
  originalPreviewUrl,
  selectedSlotId,
  onSelectSlot
}) {
  const [viewMode, setViewMode] = useState('annotated'); // 'annotated' | 'original'
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const viewerContainerRef = useRef(null);

  const hasAnalysis = Boolean(analysisResult && analysisResult.annotated_image_url);
  const fullAnnotatedUrl = hasAnalysis ? `${API_BASE_URL}${analysisResult.annotated_image_url}` : null;

  // Dynamic values directly from real analysisResult (no hardcoding)
  const lotRaw = analysisResult?.parking_lot || 'Parking_Lot_5';
  const lotDisplayName = lotRaw.replace(/_/g, ' '); // e.g. "Parking Lot 5"
  const width = analysisResult?.image_size?.width;
  const height = analysisResult?.image_size?.height;
  const totalSlots = analysisResult?.total_slots;
  const occupiedSlots = analysisResult?.occupied_slots;
  const vacantSlots = analysisResult?.vacant_slots;
  const occupancyPct = analysisResult?.occupancy_percentage;

  // Selected slot lookup from analysisResult.slots
  const selectedSlot = (hasAnalysis && selectedSlotId)
    ? analysisResult.slots.find((s) => s.slot_id === selectedSlotId) || null
    : null;

  // Fullscreen state listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Zoom handlers (clamped between 1.0x and 3.0x in increments of 0.25x)
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(parseFloat((prev + 0.25).toFixed(2)), 3.0));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(parseFloat((prev - 0.25).toFixed(2)), 1.0));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
  };

  // Fullscreen toggle handler
  const handleToggleFullscreen = async () => {
    if (!viewerContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await viewerContainerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Graceful fallback if fullscreen is blocked by browser policy
    }
  };

  return (
    <div 
      className="panel-card dashboard-full-width" 
      id="visualization"
      ref={viewerContainerRef}
    >
      {/* Viewer Panel Header */}
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-icon-wrap">
            <Video size={18} />
          </div>
          <div>
            <div className="viewer-title-row">
              <h2 className="panel-title">{lotDisplayName}</h2>
              <span className="viewer-subtitle-tag">
                {hasAnalysis ? (viewMode === 'annotated' ? 'AI Annotated View' : 'Original Frame') : 'AI Annotated View'}
              </span>
            </div>
            <span className="panel-subtitle-inline">
              Interactive spatial monitoring &amp; computer vision verification viewer
            </span>
          </div>
        </div>

        <div className="panel-header-right">
          {/* View Mode Toggle */}
          {hasAnalysis && (
            <div className="view-toggle-pills" role="tablist" aria-label="Viewer display mode">
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'annotated'}
                className={`view-toggle-btn ${viewMode === 'annotated' ? 'active' : ''}`}
                onClick={() => setViewMode('annotated')}
              >
                <Layers size={13} />
                <span>Annotated Output</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'original'}
                className={`view-toggle-btn ${viewMode === 'original' ? 'active' : ''}`}
                onClick={() => setViewMode('original')}
                disabled={!originalPreviewUrl}
              >
                <Eye size={13} />
                <span>Original Frame</span>
              </button>
            </div>
          )}

          <span className={`phase-pill ${hasAnalysis ? 'phase-pill-emerald' : ''}`}>
            {hasAnalysis ? 'Active Stream' : 'Awaiting Analysis'}
          </span>
        </div>
      </div>

      {/* Main Interactive Workstation Grid */}
      <div className="viewer-workstation-grid">
        {/* Left / Main Area: Large Parking Viewer */}
        <div className="viewer-canvas-column">
          <div className="viewer-viewport-box">
            {/* Overlay Grid */}
            <div className="viewport-grid-overlay" />

            {/* Corner Targeting Reticles */}
            <div className="viewport-corner viewport-corner-tl" />
            <div className="viewport-corner viewport-corner-tr" />
            <div className="viewport-corner viewport-corner-bl" />
            <div className="viewport-corner viewport-corner-br" />

            {/* Viewport Top Floating Toolbar: Channel Tag + Resolution + Zoom / Fullscreen Controls */}
            <div className="viewport-floating-toolbar">
              <div className="viewport-lot-tag">
                <span className={`viewport-lot-tag-dot ${hasAnalysis ? 'dot-active' : ''}`} />
                <span>{lotDisplayName} (CAM-01)</span>
              </div>

              {hasAnalysis && width && height && (
                <div className="viewport-lot-tag font-mono">
                  <Camera size={11} />
                  <span>{width} × {height} PX</span>
                </div>
              )}

              {/* Image Controls: Zoom In, Zoom Out, Reset, Fullscreen */}
              {hasAnalysis && (
                <div className="viewer-controls-group" aria-label="Viewer zoom and display controls">
                  <button
                    type="button"
                    className="viewer-ctrl-btn"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3.0}
                    title="Zoom in (+0.25x)"
                    aria-label="Zoom in"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <span className="viewer-zoom-indicator font-mono">
                    {zoomLevel.toFixed(2)}×
                  </span>
                  <button
                    type="button"
                    className="viewer-ctrl-btn"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 1.0}
                    title="Zoom out (-0.25x)"
                    aria-label="Zoom out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <button
                    type="button"
                    className="viewer-ctrl-btn"
                    onClick={handleResetZoom}
                    disabled={zoomLevel === 1.0}
                    title="Reset zoom to 1.0x"
                    aria-label="Reset zoom"
                  >
                    <RotateCcw size={13} />
                  </button>
                  <button
                    type="button"
                    className="viewer-ctrl-btn"
                    onClick={handleToggleFullscreen}
                    title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  </button>
                </div>
              )}
            </div>

            {/* Viewport Image Area */}
            {hasAnalysis ? (
              <div className="viewer-image-stage">
                <div 
                  className="viewer-scalable-wrapper"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <img
                    src={viewMode === 'annotated' ? fullAnnotatedUrl : (originalPreviewUrl || fullAnnotatedUrl)}
                    alt={viewMode === 'annotated' ? 'Real OpenCV annotated parking lot classification' : 'Original input camera frame'}
                    className="viewer-primary-image"
                  />
                </div>
              </div>
            ) : (
              /* Empty State (Before Analysis) */
              <div className="viewport-center-content">
                <div className="viewport-target-reticle">
                  <Scan size={26} />
                </div>
                <h3 className="viewport-msg-title">Parking visualization awaiting AI analysis</h3>
                <p className="viewport-msg-desc">
                  Upload a supported dataset camera frame (e.g., 5.png, 26.png) and click <strong>Analyze Parking</strong>. 
                  The real backend OpenCV polygon overlay showing active occupied and vacant slot states will render here.
                </p>
              </div>
            )}

            {/* Viewport Bottom Floating Bar: Legend & Backend Note */}
            <div className="viewport-bottom-legend-strip">
              <div className="legend-tag-label font-mono">
                <span>ANNOTATION LEGEND:</span>
              </div>
              <div className="legend-pills-row">
                <div className="legend-chip legend-chip-occupied">
                  <span className="legend-indicator-red" />
                  <span>RED = OCCUPIED</span>
                </div>
                <div className="legend-chip legend-chip-vacant">
                  <span className="legend-indicator-green" />
                  <span>GREEN = VACANT</span>
                </div>
              </div>
              <span className="legend-backend-note font-mono">
                Rendered directly by backend OpenCV pipeline
              </span>
            </div>
          </div>
        </div>

        {/* Right Area: Metadata, Visual Status Summary & Selected Slot Inspection */}
        <div className="viewer-sidebar-column">
          {/* 1. Visual Status Summary */}
          <div className="viewer-side-card">
            <h4 className="side-card-title">
              <Car size={14} />
              <span>Visual Status Summary</span>
            </h4>

            {hasAnalysis ? (
              <div className="status-summary-grid">
                <div className="status-summary-tile tile-occupied">
                  <span className="summary-tile-label text-occupied">OCCUPIED</span>
                  <span className="summary-tile-val text-occupied font-mono">{occupiedSlots}</span>
                  <span className="summary-tile-sub">slots</span>
                </div>
                <div className="status-summary-tile tile-vacant">
                  <span className="summary-tile-label text-vacant">VACANT</span>
                  <span className="summary-tile-val text-vacant font-mono">{vacantSlots}</span>
                  <span className="summary-tile-sub">slots</span>
                </div>
                <div className="status-summary-tile tile-total">
                  <span className="summary-tile-label">TOTAL</span>
                  <span className="summary-tile-val font-mono">{totalSlots}</span>
                  <span className="summary-tile-sub">slots</span>
                </div>
                <div className="status-summary-tile tile-load">
                  <span className="summary-tile-label">OCCUPANCY</span>
                  <span className="summary-tile-val font-mono">{occupancyPct}%</span>
                  <span className="summary-tile-sub">rate</span>
                </div>
              </div>
            ) : (
              <div className="side-card-empty-msg">
                <span>Analysis pending. Summary values will display after model execution.</span>
              </div>
            )}
          </div>

          {/* 2. Selected Slot Information Panel */}
          <div className={`viewer-side-card ${selectedSlot ? 'side-card-active-slot' : ''}`}>
            <div className="side-card-header-between">
              <h4 className="side-card-title">
                <ShieldCheck size={14} color="#10b981" />
                <span>Selected Slot Inspection</span>
              </h4>
              {selectedSlot && onSelectSlot && (
                <button
                  type="button"
                  className="deselect-slot-btn"
                  onClick={() => onSelectSlot(null)}
                  title="Deselect slot"
                  aria-label="Clear slot selection"
                >
                  <X size={12} />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {selectedSlot ? (
              <div className="selected-slot-details">
                <div className="selected-slot-primary-row">
                  <div className="slot-id-badge font-mono">
                    {selectedSlot.slot_id}
                  </div>
                  <span 
                    className={`slot-status-pill ${
                      selectedSlot.status === 'OCCUPIED' ? 'pill-occupied' : 'pill-vacant'
                    }`}
                  >
                    {selectedSlot.status}
                  </span>
                </div>

                <div className="selected-slot-meta-table">
                  <div className="slot-meta-row">
                    <span className="meta-key">AI Prediction Confidence</span>
                    <span className="meta-val font-mono text-cyan">
                      {(selectedSlot.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="slot-meta-row">
                    <span className="meta-key">Classifier Output</span>
                    <span className="meta-val font-mono">
                      {selectedSlot.confidence.toFixed(4)} (Sigmoid)
                    </span>
                  </div>
                  <div className="slot-meta-row">
                    <span className="meta-key">Spatial Coordinates</span>
                    <span className="meta-val font-mono">
                      Configured Polygon
                    </span>
                  </div>
                </div>

                <div className="slot-inspection-tip font-mono">
                  Active slot highlighted from Slot Analytics table
                </div>
              </div>
            ) : (
              <div className="side-card-empty-msg">
                <Info size={14} className="info-icon" />
                <span>Select a parking slot to inspect its prediction.</span>
              </div>
            )}
          </div>

          {/* 3. Image Metadata */}
          <div className="viewer-side-card">
            <h4 className="side-card-title">
              <Camera size={14} />
              <span>Image Metadata</span>
            </h4>

            {hasAnalysis ? (
              <div className="image-metadata-list font-mono">
                <div className="meta-list-item">
                  <span className="meta-list-key">Parking Lot:</span>
                  <span className="meta-list-val">{lotRaw}</span>
                </div>
                <div className="meta-list-item">
                  <span className="meta-list-key">Resolution:</span>
                  <span className="meta-list-val">{width} × {height}</span>
                </div>
                <div className="meta-list-item">
                  <span className="meta-list-key">Total Slots:</span>
                  <span className="meta-list-val">{totalSlots}</span>
                </div>
                <div className="meta-list-item">
                  <span className="meta-list-key">Occupied:</span>
                  <span className="meta-list-val text-occupied">{occupiedSlots}</span>
                </div>
                <div className="meta-list-item">
                  <span className="meta-list-key">Vacant:</span>
                  <span className="meta-list-val text-vacant">{vacantSlots}</span>
                </div>
                <div className="meta-list-item">
                  <span className="meta-list-key">Occupancy:</span>
                  <span className="meta-list-val">{occupancyPct}%</span>
                </div>
              </div>
            ) : (
              <div className="side-card-empty-msg">
                <span>Resolution and slot counts await image input.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
