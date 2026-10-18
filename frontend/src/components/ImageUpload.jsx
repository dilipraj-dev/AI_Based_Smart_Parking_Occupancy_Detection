import { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertOctagon, 
  Trash2, 
  Play, 
  FileImage, 
  Cpu, 
  Layers,
  ArrowRight,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageUpload({ onAnalysisSuccess, onClear, onFileSelect }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [validation, setValidation] = useState({
    status: 'idle',
    message: '',
    isValid: false,
  });
  const [isDragging, setIsDragging] = useState(false);

  // Live API Integration State
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [hasCompletedAnalysis, setHasCompletedAnalysis] = useState(false);

  const fileInputRef = useRef(null);

  // Clean up object URL on unmount or before new preview creation
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const processFile = (file) => {
    if (!file) return;

    // Reset previous errors and analysis state
    setApiError(null);
    setHasCompletedAnalysis(false);

    const fileName = file.name || '';
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    const isMimeValid = VALID_TYPES.includes(file.type);
    const isExtValid = VALID_EXTENSIONS.includes(fileExtension);

    // Format validation
    if (!isMimeValid && !isExtValid) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setSelectedFile(null);
      setFileMeta(null);
      setDimensions(null);
      setValidation({
        status: 'invalid_format',
        message: 'Unsupported format. Please upload a JPG, JPEG, or PNG image file.',
        isValid: false,
      });
      if (onFileSelect) onFileSelect(null);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setFileMeta({
      name: file.name,
      size: file.size,
      formattedSize: formatFileSize(file.size),
      type: file.type || fileExtension.replace('.', '').toUpperCase(),
    });

    if (onFileSelect) {
      onFileSelect(file);
    }

    // Inspect actual dimensions
    const img = new Image();
    img.onload = () => {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      setDimensions({
        width: naturalWidth,
        height: naturalHeight,
      });

      if (naturalWidth > 0 && naturalHeight > 0) {
        setValidation({
          status: 'valid',
          message: 'Image ready for analysis.',
          isValid: true,
        });
      } else {
        setValidation({
          status: 'invalid_dim',
          message: 'Invalid image dimensions detected.',
          isValid: false,
        });
      }
    };

    img.onerror = () => {
      setValidation({
        status: 'load_error',
        message: 'Could not read image file. Please verify file integrity.',
        isValid: false,
      });
    };

    img.src = objectUrl;
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isLoading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDropzoneKeyDown = (e) => {
    if (isLoading) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileMeta(null);
    setDimensions(null);
    setValidation({
      status: 'idle',
      message: '',
      isValid: false,
    });
    setApiError(null);
    setHasCompletedAnalysis(false);
    setIsLoading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (onFileSelect) {
      onFileSelect(null);
    }

    if (onClear) {
      onClear();
    }
  };

  // Perform REAL HTTP POST request to FastAPI /analyze
  const handleAnalyzeClick = async () => {
    if (!validation.isValid || !selectedFile || isLoading) return;

    setIsLoading(true);
    setApiError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(API_ENDPOINTS.ANALYZE, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorJson = await response.json();
          errorDetail = errorJson.detail || '';
        } catch {
          errorDetail = await response.text().catch(() => '');
        }

        if (response.status === 400) {
          throw new Error(errorDetail || 'Invalid image submitted. Please upload a supported dataset camera image.');
        } else if (response.status === 503) {
          throw new Error(errorDetail || 'AI model or parking configuration is not loaded on the server.');
        } else if (response.status === 500) {
          throw new Error(errorDetail || 'Server error occurred during computer vision analysis.');
        } else {
          throw new Error(errorDetail || `Backend returned error HTTP ${response.status}`);
        }
      }

      const data = await response.json();

      if (!data || !data.slots || !Array.isArray(data.slots)) {
        throw new Error('Invalid response structure received from the AI backend.');
      }

      setHasCompletedAnalysis(true);
      const timestamp = new Date().toLocaleTimeString();

      if (onAnalysisSuccess) {
        onAnalysisSuccess(data, previewUrl, timestamp);
      }
    } catch (err) {
      if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
        setApiError('Unable to analyze the parking image. Please make sure the Smart Parking AI backend is running at http://localhost:8000.');
      } else {
        setApiError(err.message || 'Unable to analyze the parking image. Please make sure the Smart Parking AI backend is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="panel-card dashboard-full-width" id="inference" aria-labelledby="image-analysis-heading">
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-icon-wrap">
            <Cpu size={18} />
          </div>
          <div>
            <h2 className="panel-title" id="image-analysis-heading">Camera Frame Ingestion &amp; Inference</h2>
            <span className="panel-subtitle-inline">Upload a parking lot capture to trigger live MobileNetV2 classification</span>
          </div>
        </div>
        <span className={`phase-pill ${hasCompletedAnalysis ? 'phase-pill-emerald' : validation.isValid ? 'phase-pill-cyan' : ''}`}>
          {hasCompletedAnalysis ? 'Inference Dispatched' : validation.isValid ? 'Ready for Analysis' : 'Upload Active'}
        </span>
      </div>

      {/* Hidden native accessible file input */}
      <input
        ref={fileInputRef}
        type="file"
        id="parking-lot-file-input"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        aria-label="Upload parking lot camera image"
        disabled={isLoading}
      />

      {/* EMPTY / INITIAL STATE */}
      {!previewUrl && (
        <div
          role="button"
          tabIndex={0}
          className={`upload-dropzone-interactive ${isDragging ? 'is-drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={handleDropzoneKeyDown}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          aria-describedby="upload-requirements-meta"
        >
          <div className="upload-icon-circle">
            <UploadCloud size={30} />
          </div>

          <h3 className="upload-heading">
            Drop parking lot capture frame here, or click to browse
          </h3>

          <p className="upload-subtext">
            Upload high-resolution camera capture frames for spatial slot classification.
            Supported formats: <strong>JPG, JPEG, PNG</strong>.
          </p>

          <button
            type="button"
            className="btn-select-file"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <FileImage size={15} />
            <span>Select Image File</span>
          </button>

          <div className="upload-meta-pills" id="upload-requirements-meta">
            <span className="meta-pill">FORMATS: JPG, JPEG, PNG</span>
            <span className="meta-pill meta-pill-highlight">AUTO-CALIBRATION: ACTIVE</span>
            <span className="meta-pill">SUPPORT: MULTI-IMAGE DATASET</span>
            <span className="meta-pill">ENDPOINT: POST /analyze</span>
          </div>

          {validation.status === 'invalid_format' && (
            <div className="validation-banner banner-error" role="alert">
              <AlertOctagon size={18} className="banner-icon" />
              <div className="banner-text">
                <strong>Format Error:</strong> {validation.message}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ACTIVE PREVIEW & VALIDATION STATE */}
      {previewUrl && (
        <div className="upload-preview-layout">
          {/* Left Column: Preview Canvas */}
          <div className="preview-image-canvas">
            <div className="preview-frame-header">
              <span className="preview-source-tag">INPUT CAPTURE</span>
              {dimensions && (
                <span
                  className={`preview-dimension-tag ${
                    validation.isValid ? 'tag-valid' : 'tag-invalid'
                  }`}
                >
                  {dimensions.width} × {dimensions.height} PX
                </span>
              )}
            </div>

            <div className="preview-image-wrap">
              <img
                src={previewUrl}
                alt={fileMeta?.name || 'Selected parking lot capture'}
                className="preview-image-element"
              />
              {/* Corner targeting reticles */}
              <div className="viewport-corner viewport-corner-tl" />
              <div className="viewport-corner viewport-corner-tr" />
              <div className="viewport-corner viewport-corner-bl" />
              <div className="viewport-corner viewport-corner-br" />
            </div>

            <div className="preview-frame-footer">
              <span>TARGET CAMERA: AUTO-RESOLVED</span>
              <span>CALIBRATION: DYNAMIC GEOMETRY</span>
            </div>
          </div>

          {/* Right Column: File Telemetry, Validation & Action Controls */}
          <div className="preview-telemetry-col">
            {/* Metadata Card */}
            <div className="file-telemetry-card">
              <h4 className="telemetry-card-title">
                <Layers size={15} />
                <span>Captured File Specifications</span>
              </h4>

              <div className="telemetry-grid">
                <div className="telemetry-item">
                  <span className="telemetry-label">File Name</span>
                  <span className="telemetry-val" title={fileMeta?.name}>
                    {fileMeta?.name}
                  </span>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-label">File Size</span>
                  <span className="telemetry-val">{fileMeta?.formattedSize}</span>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-label">Detected Dimensions</span>
                  <span
                    className={`telemetry-val font-mono ${
                      validation.isValid ? 'text-valid' : 'text-invalid'
                    }`}
                  >
                    {dimensions
                      ? `${dimensions.width} × ${dimensions.height} px`
                      : 'Measuring...'}
                  </span>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-label">Geometry Calibration</span>
                  <span className="telemetry-val font-mono text-valid">Auto-Calibrated</span>
                </div>
              </div>
            </div>

            {/* Validation State Banner */}
            {validation.isValid ? (
              <div className="validation-banner banner-success" role="status">
                <CheckCircle2 size={20} className="banner-icon-emerald" />
                <div className="banner-text">
                  <div className="banner-title">Image ready for analysis.</div>
                  <div className="banner-subtext">
                    Resolution detected. The AI backend will dynamically load the corresponding parking-slot layout.
                  </div>
                </div>
              </div>
            ) : (
              <div className="validation-banner banner-error" role="alert">
                <AlertOctagon size={20} className="banner-icon-rose" />
                <div className="banner-text">
                  <div className="banner-title">
                    {validation.message || 'Invalid image dimensions.'}
                  </div>
                  <div className="banner-subtext">
                    Detected {dimensions ? `${dimensions.width} × ${dimensions.height} px` : 'unverified resolution'}.
                    Slot polygon coordinates require exactly 712 × 750 pixels.
                  </div>
                </div>
              </div>
            )}

            {/* API Error Banner */}
            {apiError && (
              <div className="validation-banner banner-error" role="alert">
                <AlertTriangle size={20} className="banner-icon-rose" />
                <div className="banner-text">
                  <div className="banner-title">API Analysis Error</div>
                  <div className="banner-subtext">{apiError}</div>
                </div>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="action-control-group">
              <button
                type="button"
                className="btn-clear-image"
                onClick={handleClear}
                disabled={isLoading}
                aria-label="Remove and clear selected image"
              >
                <Trash2 size={15} />
                <span>Remove Image</span>
              </button>

              <button
                type="button"
                className={`btn-analyze-parking ${
                  validation.isValid && !isLoading ? 'btn-enabled' : 'btn-disabled'
                }`}
                disabled={!validation.isValid || isLoading}
                onClick={handleAnalyzeClick}
                aria-disabled={!validation.isValid || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Analyzing parking lot...</span>
                  </>
                ) : (
                  <>
                    <Play size={15} />
                    <span>{hasCompletedAnalysis ? 'Re-Analyze Parking' : 'Analyze Parking'}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
