import React from 'react';
import { Sparkles, Cpu, Layers, Camera, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-tag">
        <Sparkles size={13} />
        <span>Deep Learning &amp; Computer Vision Architecture</span>
      </div>

      <h1 className="hero-heading">
        Intelligent parking occupancy detection powered by deep learning and computer vision.
      </h1>

      <p className="hero-description">
        Real-time spatial monitoring engineered with custom polygon slot-mapping and 
        convolutional neural networks to classify multi-slot parking facilities with high precision.
      </p>

      <div className="hero-tech-badges">
        <div className="tech-badge-item">
          <Cpu size={14} color="#10b981" />
          <span>Architecture: <strong>MobileNetV2 Classifier</strong></span>
        </div>
        <div className="tech-badge-item">
          <Camera size={14} color="#10b981" />
          <span>Camera Profile: <strong>Multi-Image Auto-Calibrated</strong></span>
        </div>
        <div className="tech-badge-item">
          <Layers size={14} color="#10b981" />
          <span>Spatial Mapping: <strong>Polygon Coordinates</strong></span>
        </div>
        <div className="tech-badge-item">
          <CheckCircle2 size={14} color="#10b981" />
          <span>Current Lifecycle: <strong>Production Ready</strong></span>
        </div>
      </div>
    </section>
  );
}
