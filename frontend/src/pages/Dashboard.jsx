import { useState } from 'react';
import { CheckCircle2, Clock, Camera } from 'lucide-react';
import Hero from '../components/Hero';
import ParkingVisualization from '../components/ParkingVisualization';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import ImageUpload from '../components/ImageUpload';
import SlotAnalytics from '../components/SlotAnalytics';

export default function Dashboard() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const handleAnalysisSuccess = (data, previewUrl, timestamp) => {
    setAnalysisResult(data);
    setOriginalPreviewUrl(previewUrl);
    setLastAnalysisTime(timestamp);
    setSelectedSlotId(null); // Reset selection on fresh inference
  };

  const handleClear = () => {
    setAnalysisResult(null);
    setOriginalPreviewUrl(null);
    setLastAnalysisTime(null);
    setSelectedSlotId(null);
  };

  const lotName = analysisResult?.parking_lot
    ? analysisResult.parking_lot.replace(/_/g, ' ')
    : 'Parking Lot 5';

  const resWidth = analysisResult?.image_size?.width;
  const resHeight = analysisResult?.image_size?.height;

  return (
    <div className="dashboard-page-container">
      {/* Hero / Welcome Section */}
      <Hero />

      {/* Image Upload & Inference Trigger Area (Phase 2 & 3) */}
      <ImageUpload 
        onAnalysisSuccess={handleAnalysisSuccess}
        onClear={handleClear}
      />

      {/* Parking Lot Analysis Status Banner (Visible when real analysisResult is returned) */}
      {analysisResult && (
        <div className="parking-lot-status-header" role="region" aria-label="Parking Lot Analysis Status">
          <div className="status-header-main">
            <div className="status-header-title-row">
              <h2 className="status-lot-title">{lotName}</h2>
              <span className="analysis-complete-badge">
                <CheckCircle2 size={14} />
                <span>AI Analysis Complete</span>
              </span>
            </div>
            <p className="status-header-sub">
              Live convolutional inference executed via MobileNetV2 spatial classifier
            </p>
          </div>

          <div className="status-header-meta">
            {resWidth && resHeight && (
              <div className="status-meta-block">
                <div className="meta-label-wrap">
                  <Camera size={12} />
                  <span>IMAGE RESOLUTION</span>
                </div>
                <span className="status-meta-value font-mono">
                  {resWidth} × {resHeight}
                </span>
              </div>
            )}

            {lastAnalysisTime && (
              <div className="status-meta-block">
                <div className="meta-label-wrap">
                  <Clock size={12} />
                  <span>LAST ANALYSIS</span>
                </div>
                <span className="status-meta-value font-mono text-cyan">
                  {lastAnalysisTime}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Primary Interactive Parking Monitoring Viewer (Phase 5) */}
      <div className="dashboard-full-width">
        <ParkingVisualization 
          analysisResult={analysisResult} 
          originalPreviewUrl={originalPreviewUrl}
          selectedSlotId={selectedSlotId}
          onSelectSlot={setSelectedSlotId}
        />
      </div>

      {/* Analytics Dashboard & KPI Overview (Phase 6B) */}
      <div className="dashboard-full-width">
        <AnalyticsDashboard 
          analysisResult={analysisResult} 
          lastAnalysisTime={lastAnalysisTime}
          selectedSlotId={selectedSlotId}
          onSelectSlot={setSelectedSlotId}
        />
      </div>

      {/* Slot Analytics & Telemetry Table (Phase 4 & 5 Interactive Selection) */}
      <div className="dashboard-full-width">
        <SlotAnalytics 
          analysisResult={analysisResult}
          selectedSlotId={selectedSlotId}
          onSelectSlot={setSelectedSlotId}
        />
      </div>
    </div>
  );
}
