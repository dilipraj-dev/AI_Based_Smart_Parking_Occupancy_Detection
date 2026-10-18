# Smart Parking AI: Deep Learning & Power BI Analytics

[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.16%2B-FF6F00.svg)](https://www.tensorflow.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.2%2B-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.1%2B-646CFF.svg)](https://vitejs.dev/)
[![Power BI](https://img.shields.io/badge/Microsoft-Power%20BI-F2C811.svg)](https://powerbi.microsoft.com/)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.10%2B-5C3EE8.svg)](https://opencv.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An end-to-end, non-intrusive smart parking occupancy detection and business intelligence platform. The system leverages transfer learning with **MobileNetV2** and **OpenCV** coordinate-based polygon extraction to monitor parking spaces from overhead surveillance cameras in real time. It features a high-throughput **FastAPI** REST backend, a modern interactive **React 18** web dashboard, and synchronized analytical pipelines for **Microsoft Power BI**.

---

## Table of Contents
- [1. System Architecture](#1-system-architecture)
- [2. Key Features](#2-key-features)
- [3. Verified Benchmark Results](#3-verified-benchmark-results)
- [4. Tech Stack](#4-tech-stack)
- [5. Project Directory Structure](#5-project-directory-structure)
- [6. Installation & Prerequisites](#6-installation--prerequisites)
- [7. Step-by-Step Setup](#7-step-by-step-setup)
- [8. Model Training & Evaluation](#8-model-training--evaluation)
- [9. Running the Application](#9-running-the-application)
- [10. Microsoft Power BI Integration](#10-microsoft-power-bi-integration)
- [11. API Specification](#11-api-specification)
- [12. Critical Performance Distinctions](#12-critical-performance-distinctions)
- [13. Troubleshooting & FAQ](#13-troubleshooting--faq)
- [14. References & Citation](#14-references--citation)

---

## 1. System Architecture

The application adopts a decoupled, dual-stage architecture separating slot localization (fixed quadrilateral polygon mapping) from slot classification (deep convolutional neural network):

```
+-----------------------------------------------------------------------------------+
|                            SURVEILLANCE CAMERA (CCTV)                             |
|          Multi-Image Ingestion (e.g. 5.png 712x750, 26.png 1200x800)             |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                         OPENCV PREPROCESSING PIPELINE                             |
|  - Auto-Resolve Geometry from configs/parking_lots.json (30 Supported Images)    |
|  - cv2.boundingRect(pts) -> Compute Bounding Rectangle                           |
|  - cv2.fillPoly(mask) -> Bitwise-AND Masking (Isolates exact slot bay)            |
|  - cv2.resize(patch, (224, 224)) -> Normalize & Prepare Tensors                  |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                            DEEP LEARNING CLASSIFIER                               |
|                  MobileNetV2 (ImageNet Pretrained Feature Base)                   |
|       GlobalAveragePooling2D -> Dropout(0.30) -> Dense(1, Sigmoid Activation)     |
|                      Model Size: 9.65 MB (~2.26M Parameters)                      |
|                  Batch Inference: 49 Slot Probabilities in ~15 ms                 |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                             FASTAPI REST APPLICATION                              |
|           Uvicorn ASGI Engine | Non-Blocking Asynchronous Processing              |
|  - POST /analyze: Multipart file upload, dimension verification, inference        |
|  - OpenCV Annotation: Draws green (Vacant) / red (Occupied) alpha-blended overlays|
|  - Outputs Structured JSON, annotated image, and synchronized Power BI CSV records|
+--------------------+--------------------------------------+-----------------------+
                     |                                      |
                     v                                      v
+------------------------------------+    +-----------------------------------------+
|        REACT WEB DASHBOARD         |    |           MICROSOFT POWER BI            |
|  - Drag-and-drop image upload      |    |  - Automated CSV ingestion              |
|  - Real-time KPI summaries         |    |  - DAX measures (Occupancy, Confidence) |
|  - Interactive SVG polygon overlays|    |  - Capacity & dynamic pricing dashboards|
|  - Slot-by-slot detail drawer      |    |  - Historical trends & peak load alerts |
+------------------------------------+    +-----------------------------------------+
```

---

## 2. Key Features

* **Non-Intrusive & Cost-Effective:** Replaces expensive per-bay ultrasonic/magnetic IoT sensors with existing overhead surveillance cameras. A single camera monitors 49+ slots concurrently.
* **Perspective-Aware Polygon Masking:** Arbitrary 4-point quadrilateral slot geometries are extracted cleanly using OpenCV bitwise masks, eliminating perspective distortion and cross-slot vehicle bleed.
* **Lightweight Edge-Ready Neural Network:** Uses MobileNetV2 depthwise separable convolutions, achieving sub-10ms per-slot inference on commodity CPUs with a compact 9.65 MB `.keras` weight file.
* **Asynchronous High-Throughput REST API:** Built on FastAPI and Starlette with Pydantic validation, CORS middleware, static file serving, and automated OpenAPI documentation.
* **Interactive Frontend Dashboard:** Built with React 18, Vite, and Tailwind CSS. Provides real-time drag-and-drop uploads, dynamic image dimension detection, auto-calibrated geometry resolution across all 30 dataset source images, SVG polygon overlays, status filtering, and slot inspection.
* **Enterprise Business Intelligence:** Direct integration with Microsoft Power BI through synchronized 10-field CSV exports (`outputs/powerbi/parking_occupancy.csv`), Power Query M scripts, and production DAX measures.

---

## 3. Verified Benchmark Results

### A. Independent Test Set Performance
Evaluated on **166 strictly held-out test patches** (103 Occupied, 63 Vacant) derived from unobserved surveillance frames:

| Metric | Score | Details / Formula |
| :--- | :---: | :--- |
| **Test Accuracy** | **98.80%** | $\frac{164}{166}$ correct classifications |
| **Test Loss** | **0.0214** | Binary Cross-Entropy loss |
| **Precision** | **98.41%** | $\frac{TP}{TP + FP} = \frac{102}{102 + 1}$ |
| **Recall (Sensitivity)** | **98.41%** | $\frac{TP}{TP + FN} = \frac{102}{102 + 1}$ |
| **F1-Score** | **98.41%** | $2 \cdot \frac{P \cdot R}{P + R}$ |
| **Model Size** | **9.65 MB** | 2,260,000 parameters |

#### Confusion Matrix Breakdown (166 Samples)
```
                  Predicted Vacant    Predicted Occupied
Actual Vacant           62 (TN)              1 (FP)
Actual Occupied          1 (FN)            102 (TP)
```
* **Total misclassifications:** Exactly 2 out of 166 test samples.

---

### B. Parking Lot 5 Full-Frame Demonstration (`5.png`)
Evaluated across all 49 calibrated slots in the full surveillance camera view ($712 \times 750$ pixels):

| Demonstration Metric | Value | Interpretation |
| :--- | :---: | :--- |
| **Total Monitored Slots** | **49** | `SLOT_001` to `SLOT_049` |
| **Occupied Slots** | **27** | Detected vehicles |
| **Vacant Slots** | **22** | Available spaces |
| **Parking Occupancy Rate** | **55.10%** | $\frac{27}{49} \times 100$ (*Facility utilization, NOT model accuracy*) |
| **Average Prediction Confidence** | **95.83%** | Mean sigmoid confidence across all 49 slots |
| **Slot-Level Ground Truth Agreement** | **93.88%** | **46 / 49 slots** match human ground truth on frame `5.png` |
| **API & CSV Discrepancies** | **0** | Perfect 49/49 synchronization between REST response and CSV |

---

## 4. Tech Stack

| Domain | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Deep Learning** | TensorFlow 2.16+, Keras | MobileNetV2 transfer learning, binary classification head |
| **Computer Vision** | OpenCV 4.10+ (`cv2`) | Polygon masking, bounding rects, alpha blending, visualization |
| **Backend API** | FastAPI, Uvicorn, Starlette | Asynchronous REST service, multipart uploads, static file mounts |
| **Frontend UI** | React 19, Vite 6, Tailwind CSS | Single-page application, interactive SVG canvas, KPI cards |
| **Icons & UI** | Lucide React | Modern iconography for parking metrics and dashboard actions |
| **Analytics & BI** | Microsoft Power BI, Power Query, DAX | Operational dashboards, utilization reports, DAX KPI modeling |
| **Data Science** | NumPy, Scikit-learn, Matplotlib | Confusion matrices, classification reports, class weighting |

---

## 5. Project Directory Structure

```
Smart-Parking-AI/
├── app/
│   └── api.py                    # FastAPI application, REST endpoints, static mounts
├── configs/
│   └── parking_lots.json         # Master registry & polygon geometries for 30 parking lots
├── dataset/
│   ├── original/                 # Extracted images and XML annotations from archive.zip
│   ├── train/                    # 632 slot patches (445 occupied, 187 vacant)
│   ├── val/                      # 104 slot patches (81 occupied, 23 vacant)
│   └── test/                     # 166 slot patches (103 occupied, 63 vacant)
├── frontend/
│   ├── public/                   # Static icons and assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx             # Master dashboard layout
│   │   │   ├── Header.jsx                # Navigation bar and system status indicator
│   │   │   ├── Hero.jsx                  # Hero banner with facility overview
│   │   │   ├── ImageUpload.jsx           # Drag-and-drop upload & dynamic dimension validator
│   │   │   ├── ParkingOverview.jsx       # Real-time KPI summary cards
│   │   │   ├── ParkingVisualization.jsx  # Interactive SVG overlay and slot viewer
│   │   │   └── SlotAnalytics.jsx         # Status breakdown and Power BI export
│   │   ├── services/
│   │   │   └── parkingService.js         # Axios / Fetch client connecting to FastAPI
│   │   ├── App.jsx                       # Root application component
│   │   └── main.jsx                      # React entry point
│   ├── package.json              # Frontend scripts and NPM dependencies
│   └── vite.config.js            # Vite bundler configuration
├── models/
│   └── parking_mobilenetv2.keras # Trained MobileNetV2 weights (9.65 MB)
├── outputs/
│   ├── api_uploads/              # Uploaded source images and annotated result frames
│   ├── parking_detection/        # Offline CLI inference outputs and cropped patches
│   ├── powerbi/
│   │   └── parking_occupancy.csv # 10-field standardized CSV for Power BI (e.g. 49 rows for Lot 5, 67 for Lot 26)
│   ├── multi_image_inference_results.csv # Batch inference audit across all 30 source images
│   ├── confusion_matrix.png      # Verified evaluation confusion matrix plot
│   └── test_metrics.json         # Serialized benchmark test metrics (Accuracy, F1, Loss)
├── powerbi/
│   ├── measures.dax              # Formal DAX formulas for Power BI modeling
│   ├── powerbi_query.m           # Power Query M ingestion script (Web API & File)
│   ├── powerbi_theme.json        # Custom theme palette for Power BI dashboard
│   └── README.md                 # Power BI setup and import walkthrough
├── src/
│   ├── config.py                 # Central hyperparameter and path constants
│   ├── data_preprocessing.py     # High-level dataset preparation wrapper
│   ├── evaluate.py               # Test-set evaluation and metric serialization
│   ├── generate_powerbi_data.py  # Power BI CSV formatting and batch generation
│   ├── parking_slot_detection.py # Full-frame OpenCV polygon detection engine
│   ├── predict.py                # Standalone inference helper functions
│   ├── prepare_dataset.py        # Raw XML parsing, image-level splitting, and patch extraction
│   ├── preprocessing.py          # tf.data pipeline builders with on-the-fly augmentation
│   ├── train.py                  # MobileNetV2 transfer learning training pipeline
│   └── utils.py                  # Helper utilities for metrics and file operations
├── archive.zip                   # Original Kaggle parking dataset archive
├── PRESENTATION_CONTENT.md       # 15-slide academic defense presentation guide
├── PROJECT_REPORT.md             # 24-section comprehensive academic project report
├── requirements.txt              # Pinned Python package dependencies
├── VIVA_QUESTIONS.md             # 45 technical viva questions and complete answers
└── README.md                     # Master project documentation (this file)
```

---

## 6. Installation & Prerequisites

### Prerequisites
* **Operating System:** Windows 10/11, macOS, or Linux (Ubuntu 20.04+)
* **Python:** Version `3.10.x` or `3.11.x` recommended
* **Node.js:** Version `18.x` or `20.x` LTS
* **Power BI:** Microsoft Power BI Desktop (Windows only, optional for BI analytics)

---

## 7. Step-by-Step Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/dilipraj-dev/AI-Based-Smart-Parking-Occupancy-Detection.git
cd AI-Based-Smart-Parking-Occupancy-Detection
```

### Step 2: Configure Python Virtual Environment
On Windows (PowerShell):
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```
On Linux / macOS:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3: Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## 8. Model Training & Evaluation

> **Note:** The pre-trained production model `models/parking_mobilenetv2.keras` is already included in the repository. Retraining is not required to run the demo.

### A. Dataset Preparation (Optional)
If rebuilding the dataset from `archive.zip`:
```bash
python -m src.prepare_dataset
```
This extracts 902 slot crops split by source image into `dataset/train/` (632), `dataset/val/` (104), and `dataset/test/` (166).

### B. Train MobileNetV2
```bash
python -m src.train
```
* Applies data augmentation and computes balanced class weights ($w_0 = 1.690$, $w_1 = 0.710$).
* Uses early stopping and learning rate reduction on plateau.
* Saves the optimal model checkpoint to `models/parking_mobilenetv2.keras`.

### C. Evaluate on Test Set
```bash
python -m src.evaluate
```
Evaluates the model against the 166 held-out test patches and generates:
* `outputs/test_metrics.json`
* `outputs/confusion_matrix.png`

---

## 9. Running the Application

### 1. Launch FastAPI Backend
From the project root:
```bash
uvicorn app.api:app --reload --host 0.0.0.0 --port 8000
```
* **API Server:** [http://localhost:8000](http://localhost:8000)
* **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

### 2. Launch React Frontend
Open a new terminal window:
```bash
cd frontend
npm run dev
```
* **Web Application:** [http://localhost:5173](http://localhost:5173)

### 3. Test with Supported Surveillance Images
1. Open [http://localhost:5173](http://localhost:5173) in your web browser.
2. **Primary Benchmark Test (Parking Lot 5):** Drag and drop `dataset/original/images/5.png` ($712 \times 750$ pixels).
   - Click **Analyze Parking Lot**.
   - Displays 49 slots, 27 occupied, 22 vacant, 55.10% occupancy, 95.83% average confidence.
3. **Multi-Image Verification Test (Parking Lot 26):** Click **Clear**, then drag and drop `dataset/original/images/26.png` ($1200 \times 800$ pixels).
   - Click **Analyze Parking Lot**.
   - System auto-calibrates to 67 slots, 27 occupied, 40 vacant, 40.30% occupancy, 88.94% confidence.
4. The system dynamically auto-calibrates to **all 30 supported images** in `dataset/original/images/` without manual configuration switching.

### 4. Run CLI Detection (Offline Mode)
To run parking occupancy detection directly in the terminal without starting the web servers:
```bash
# Analyze Parking Lot 5 (49 slots)
python -m src.parking_slot_detection 5

# Analyze Parking Lot 26 (67 slots)
python -m src.parking_slot_detection 26
```
Output annotated images are written to `outputs/parking_detection/{lot_id}_annotated.png`.

---

## 10. Microsoft Power BI Integration

### A. Generate Power BI Data
To generate or refresh the Power BI dataset from the terminal:
```bash
python -m src.generate_powerbi_data 5
```
This writes the 49 slot analysis records to `outputs/powerbi/parking_occupancy.csv`.

### B. CSV Data Schema (10 Standardized Columns)
| Column | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `Date` | Date | `2026-10-02` | Analysis capture date |
| `Time` | Time | `11:45:00` | Analysis capture time |
| `Parking_Lot` | Text | `Parking_Lot_5` | Facility identifier |
| `Slot_ID` | Text | `SLOT_001` | Unique parking bay ID |
| `Status` | Text | `OCCUPIED` | AI status (`OCCUPIED` or `VACANT`) |
| `Confidence` | Decimal | `0.9842` | Prediction probability score |
| `Total_Slots` | Integer | `49` | Total monitored slots in facility |
| `Occupied_Slots`| Integer | `27` | Total occupied slots in facility |
| `Vacant_Slots` | Integer | `22` | Total vacant slots in facility |
| `Occupancy_Percentage` | Decimal | `55.10` | Facility occupancy rate |

### C. Connect Power BI Desktop
1. Open **Microsoft Power BI Desktop**.
2. Select **Get Data &rarr; Text/CSV** and select `outputs/powerbi/parking_occupancy.csv` (or use the Power Query Web API script in `powerbi/powerbi_query.m`).
3. Under **Model View**, copy and paste the DAX measures from `powerbi/measures.dax`:
   * `Total Slots = COUNTROWS(parking_occupancy)`
   * `Occupied Slots = CALCULATE(COUNTROWS(parking_occupancy), parking_occupancy[Status] = "OCCUPIED")`
   * `Vacant Slots = CALCULATE(COUNTROWS(parking_occupancy), parking_occupancy[Status] = "VACANT")`
   * `Occupancy Rate = DIVIDE([Occupied Slots], [Total Slots], 0)`
   * `Average Confidence = AVERAGE(parking_occupancy[Confidence])`
4. Apply the custom color theme from `powerbi/powerbi_theme.json` for consistent styling.

---

## 11. API Specification

### `POST /analyze`
Accepts a multipart file upload and performs full parking lot classification.

* **Content-Type:** `multipart/form-data`
* **Form Field:** `file` (Image binary: JPG, JPEG, PNG; auto-matches any of the 30 calibrated parking lot geometries, e.g., $712 \times 750$, $1200 \times 800$)
* **Response Status:** `200 OK`

#### Example Response Body:
```json
{
  "parking_lot": "Parking_Lot_5",
  "image_size": {
    "width": 712,
    "height": 750
  },
  "total_slots": 49,
  "occupied_slots": 27,
  "vacant_slots": 22,
  "occupancy_percentage": 55.1,
  "average_confidence": 0.9583,
  "annotated_image_url": "http://localhost:8000/api-files/annotated_5.png",
  "slots": [
    {
      "slot_id": "SLOT_001",
      "status": "OCCUPIED",
      "confidence": 0.9842,
      "coordinates": [[42, 615], [89, 618], [76, 680], [28, 676]]
    }
  ],
  "powerbi_records": [ ... ]
}
```

### Additional Endpoints
* `GET /`: Service metadata and active configuration.
* `GET /health`: Model status and configuration readiness.
* `GET /powerbi/data`: JSON array of current Power BI records.
* `GET /powerbi-files/parking_occupancy.csv`: Direct CSV file download.
* `GET /api-files/{filename}`: Static image download (annotated frames and uploads).

---

## 12. Critical Performance Distinctions

To ensure academic and technical rigor, maintain clear distinctions between the following three metrics:

1. **Model Test-Set Accuracy (98.80%):**  
   Evaluated strictly on **166 held-out test slot patches** (`outputs/test_metrics.json`). Measures how accurately the MobileNetV2 neural network distinguishes an occupied patch from a vacant patch ($164 / 166$).
2. **Parking Occupancy Rate (55.10%):**  
   Represents **facility utilization** on Parking Lot 5 ($27 \text{ occupied} / 49 \text{ total slots} = 55.10\%$). **This is NOT model accuracy.**
3. **Slot-Level Demonstration Agreement (93.88%):**  
   Measures the agreement between model predictions and human ground truth on the single full-frame Parking Lot 5 test image (`5.png`). Out of 49 configured slots, **46 matched human ground truth**. The 3 discrepancies occur on extreme peripheral slots subject to severe lens distortion and tree foliage shadows.

---

## 13. Troubleshooting & FAQ

**Q: Which images are supported for analysis?**  
A: The platform dynamically supports all 30 source images from the dataset in `dataset/original/images/` (e.g., `5.png`, `26.png`, `0.png`, etc.). The backend automatically detects the image and resolves its corresponding parking-slot geometry from `configs/parking_lots.json` and annotations.

**Q: Can I add new custom parking lots?**  
A: Yes. You can define new quadrilateral polygon coordinates in `configs/parking_lots.json` specifying the camera resolution and slot boundaries, and the system will automatically support the new camera profile.

**Q: Why was Streamlit omitted?**  
A: Streamlit re-executes Python scripts on every user interaction, making it unsuitable for fine-grained interactive SVG polygon overlays and stateless microservice integration. The React + FastAPI architecture provides clean separation of concerns, higher throughput, and industry-standard REST contracts.

---

## 14. References & Citation

1. **MobileNetV2 Architecture:**  
   Sandler, M., Howard, A., Zhu, M., Zhmoginov, A., & Chen, L. C. (2018). *MobileNetV2: Inverted Residuals and Linear Bottlenecks*. IEEE Conference on Computer Vision and Pattern Recognition (CVPR), pp. 4510–4520. [arXiv:1801.04381](https://arxiv.org/abs/1801.04381).
2. **ImageNet Large Scale Visual Recognition Challenge:**  
   Russakovsky, O., et al. (2015). *ImageNet Large Scale Visual Recognition Challenge*. International Journal of Computer Vision (IJCV), 115(3), pp. 211–252.
3. **OpenCV Library:**  
   Bradski, G. (2000). *The OpenCV Library*. Dr. Dobb's Journal of Software Tools.
4. **FastAPI Framework:**  
   Ramírez, S. (2018). *FastAPI: High performance, easy to learn, fast to code, ready for production*. [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/).
5. **Adam Optimization Algorithm:**  
   Kingma, D. P., & Ba, J. (2014). *Adam: A Method for Stochastic Optimization*. International Conference on Learning Representations (ICLR). [arXiv:1412.6980](https://arxiv.org/abs/1412.6980).
6. **Parking Space Dataset Source:**  
   Kaggle Parking Space Detection & Classification Dataset (derived from aerial/overhead parking camera benchmark archives). See `archive.zip` and `dataset/original/annotations.xml`.

---
*Developed for Academic Project Defense & Smart City Research (2025–2026).*
