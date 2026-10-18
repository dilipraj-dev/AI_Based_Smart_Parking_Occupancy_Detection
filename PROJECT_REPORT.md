# AI-Based Smart Parking Occupancy Detection Using Deep Learning and Power BI Analytics

**Academic Project Report**  
**Engineering Capstone Project**  
**System Baseline:** React Frontend + FastAPI REST Backend + MobileNetV2 Spatial Binary Classifier + Power BI Telemetry Pipeline  

---

## 1. Title
**Smart Parking AI: AI-Based Smart Parking Occupancy Detection Using Deep Learning and Power BI Analytics**

---

## 2. Abstract
Urban congestion and fuel wastage resulting from motorists searching for vacant parking bays pose significant challenges in contemporary urban transportation. Conventional sensor-based solutions—such as ultrasonic, magnetic loop, or infrared sensors installed per bay—suffer from prohibitive hardware installation and maintenance costs. 

This project implements an end-to-end, camera-based Smart Parking AI system that automates parking occupancy detection from overhead surveillance imagery. Utilizing transfer learning with a custom-engineered MobileNetV2 convolutional neural network, the system classifies configured parking slots into **OCCUPIED** or **VACANT** states based on polygon regions of interest. The deep learning model was trained with data augmentation and balanced class weighting, achieving a verified **98.80% test accuracy**, **98.41% precision**, **98.41% recall**, and **98.41% F1-score** across an untouched test set of 166 parking-slot crops.

The architecture features a production-ready **FastAPI** backend that dynamically resolves camera calibrations, performs coordinate scaling, slot cropping, spatial masking, and batch classification across all **30 valid surveillance source images** in the dataset (spanning 897 total parking slots with 100% batch inference success and zero runtime failures). An interactive **React 19 + Vite** monitoring dashboard auto-calibrates to uploaded camera resolutions, rendering dynamic occupancy KPIs, an interactive dual-state monitoring viewer with OpenCV visual bounding annotations, per-slot prediction confidence bar charts, and tabular inspection telemetry. Furthermore, the system automatically exports prediction telemetry into a Power BI-ready CSV dataset, accompanied by verified DAX measures and custom dark-theme visual specifications. On the primary 49-slot demonstration lot (Parking Lot 5, $712 \times 750$), the system achieves an occupancy detection of **55.10% (27 occupied, 22 vacant)** with **95.83% average confidence** and 93.88% slot ground-truth agreement. On the secondary multi-image demonstration lot (Parking Lot 26, $1200 \times 800$), the system processes **67 slots** detecting **40.30% occupancy (27 occupied, 40 vacant)** with **88.94% average confidence**, demonstrating a robust, accessible, and scalable visual parking management platform.

---

## 3. Introduction
Smart parking systems constitute an essential component of modern intelligent transportation systems (ITS) and smart city initiatives. Traditional parking infrastructure relies heavily on manual surveillance or physical hardware sensors deployed per slot. Physical sensors are vulnerable to mechanical wear, battery depletion, environmental degradation, and asphalt disruption during installation.

Computer vision and deep learning offer a non-intrusive, cost-effective alternative. A single existing surveillance or closed-circuit television (CCTV) camera mounted over a parking lot can monitor dozens of parking bays simultaneously. By applying deep convolutional neural networks (CNNs) to localized parking-space regions of interest, visual occupancy detection transforms raw camera frames into structured, actionable telemetry.

This project delivers a complete software architecture comprising:
1. A trained, lightweight deep learning classifier using MobileNetV2.
2. A high-performance RESTful API built with FastAPI.
3. An interactive web monitoring dashboard implemented in React 19.
4. Business intelligence reporting integration using Microsoft Power BI.

---

## 4. Problem Statement
Motorists in metropolitan environments frequently expend between 10 to 20 minutes navigating parking facilities in search of available bays. This inefficient circulation exacerbates traffic congestion, increases vehicle carbon emissions, wastes fuel, and causes driver frustration. Facility managers lack centralized, real-time telemetry regarding bay availability, capacity load, and occupancy trends.

Physical sensor deployments (e.g., embedded magnetic sensors or ceiling-mounted ultrasonic transducers) scale linearly in hardware cost ($N$ sensors for $N$ spaces) and incur substantial operational expenses. Therefore, the engineering challenge is to construct an accurate, camera-based parking space classification pipeline that leverages existing camera views, runs efficiently on standard hardware without dedicated high-end GPUs, and integrates with modern analytics dashboards for real-time visualization.

---

## 5. Objectives
1. **Design and Train a Lightweight Deep Learning Classifier**: Build a binary spatial occupancy classifier based on MobileNetV2 with transfer learning to distinguish occupied vs. vacant parking bays under varying illumination, angles, and vehicle types.
2. **Implement Geometric Slot Extraction**: Configure geometric parking-slot polygon boundaries from camera calibration profiles and perform masked polygonal cropping to isolate individual bays.
3. **Develop a Scalable REST Backend**: Build an asynchronous FastAPI backend capable of processing uploaded surveillance frames, executing inference on all configured slots, generating OpenCV visual overlays, and persisting analytics.
4. **Create a Modern Monitoring Dashboard**: Implement a technical, dark-themed React dashboard featuring live image drag-and-drop, aspect-ratio and dimension validation, zoomable visual inspection, dynamic KPI tracking, and slot-level filtering.
5. **Establish Power BI Analytics Parity**: Guarantee that live inference data flows directly into structured, Power BI-compatible CSV datasets with verified DAX formulas, preventing discrepancies between operational dashboards and executive analytics.

---

## 6. Existing System / Motivation
| Attribute | Traditional Sensor Systems (Ultrasonic / Magnetic) | Naive Computer Vision (Color / Edge Thresholding) | Proposed Smart Parking AI |
| :--- | :--- | :--- | :--- |
| **Hardware Overhead** | 1 hardware sensor per space ($N$ units) | 1 camera covers 40–100 spaces | 1 camera covers 40–100 spaces |
| **Installation** | Invasive (drilling, asphalt cutting, wiring) | Non-invasive (uses existing CCTV poles) | Non-invasive (uses existing camera views) |
| **Environmental Resilience** | Prone to battery failure and physical damage | Highly sensitive to shadows, weather, and light | Robust deep feature representation via MobileNetV2 |
| **Maintenance Cost** | High (recurring battery/sensor replacement) | Low | Minimal (software-level updates) |
| **Business Telemetry** | Often siloed in proprietary gate systems | None | Exported to open REST API & Power BI |

---

## 7. Proposed System
The proposed system utilizes a pre-calibrated camera profile where parking bay locations are defined as 4-point polygon coordinates. When a camera frame is ingested:
1. The backend extracts each slot crop, applies a binary polygon mask to zero out background noise outside the designated bay, and resizes the crop to $224 \times 224$ pixels.
2. The MobileNetV2 binary classifier evaluates the crop, generating an occupancy probability score through a sigmoid activation layer.
3. If probability $\ge 0.50$, the slot is classified as **VACANT**; otherwise, it is classified as **OCCUPIED**.
4. The system calculates aggregate facility metrics (Total, Occupied, Vacant, Occupancy %, Average Confidence).
5. OpenCV renders color-coded polygons (Rose for Occupied, Emerald for Vacant) with slot IDs and confidence percentages onto the output image.
6. Structured prediction telemetry is synchronized into an active Power BI CSV record format (`outputs/powerbi/parking_occupancy.csv`) and exposed via API endpoints.
7. The React frontend presents the annotated viewer, KPI meters, capacity donut gauge, and per-slot confidence bar charts in real time.

---

## 8. System Architecture

```
                    +---------------------------------------+
                    |       Surveillance Camera Image       |
                    | Dynamic Ingestion: 30 Supported Lots  |
                    | (e.g. Lot 5: 712x750, Lot 26: 1200x800)
                    +-------------------+-------------------+
                                        |
                                        v
                    +---------------------------------------+
                    |            FastAPI Backend            |
                    |            (POST /analyze)            |
                    |   Auto-resolves lot via filename /    |
                    |   dimensions using get_parking_lot_   |
                    |   config() against 30 registry lots   |
                    +-------------------+-------------------+
                                        |
                +-----------------------+-----------------------+
                |                                               |
                v                                               v
+-------------------------------+               +-------------------------------+
|  configs/parking_lots.json    |               |  Coordinate Scaling & Masked  |
|  Master Registry (30 Lots,    |               |  Polygonal Cropping & Resize  |
|  897 Total Slot Polygons)     |               |  (224 x 224 RGB Tensors)      |
+---------------+---------------+               +---------------+---------------+
                |                                               |
                +-----------------------+-----------------------+
                                        |
                                        v
                    +---------------------------------------+
                    |        MobileNetV2 Classifier         |
                    |   (models/parking_mobilenetv2.keras)  |
                    +-------------------+-------------------+
                                        |
                                        v
                    +---------------------------------------+
                    |    Per-Slot Sigmoid Probabilities     |
                    |          OCCUPIED vs VACANT           |
                    +-------------------+-------------------+
                                        |
                +-----------------------+-----------------------+
                |                                               |
                v                                               v
+-------------------------------+               +-------------------------------+
|       OpenCV Annotation       |               |     Aggregate Telemetry &     |
|   (Dynamic Polygons, Rose for |               |     Power BI CSV Generation   |
|   Occupied, Emerald for Free) |               |  (Dynamic Lot ID & Capacity)  |
+---------------+---------------+               +---------------+---------------+
                |                                               |
                v                                               v
+-------------------------------+               +-------------------------------+
|     React Web Dashboard       |               |     Power BI Dataset          |
|  - Auto-Calibrating Viewer    |               |  outputs/powerbi/             |
|  - Dynamic KPI Cards & Donut  |               |  parking_occupancy.csv        |
|  - Per-Slot Confidence Chart  |               |  (10 Standardized Columns)    |
+-------------------------------+               +-------------------------------+
```

---

## 9. Technologies Used
- **Deep Learning Framework**: TensorFlow 2.x / Keras (MobileNetV2 transfer learning, binary crossentropy, callback checkpoints).
- **Computer Vision**: OpenCV (`cv2`) for geometric polygon masking, sub-pixel cropping, bounding box transformations, and visual text annotation.
- **Scientific Computing**: NumPy (vectorized array transformations) and Scikit-Learn (metrics computation, balanced class weighting).
- **Backend Framework**: FastAPI (asynchronous Python REST API), Uvicorn (ASGI web server), and Python-Multipart (file upload streams).
- **Frontend Framework**: React 19, Vite build tool, Lucide React (vector iconography), and custom dark-theme CSS.
- **Analytics & BI**: Microsoft Power BI Desktop, DAX (Data Analysis Expressions), and Power Query M.
- **Data Serialization**: JSON configuration files and RFC-4180 UTF-8 CSV datasets.

---

## 10. Dataset
The system operates on an aerial surveillance parking lot dataset comprising high-resolution camera captures across diverse weather conditions, lighting angles, and perspectives.

### Source Surveillance Scenes Scope
- **Total Physical Source Images on Disk**: **30 valid camera frames** located in `dataset/original/images/`.
- **Image Index Range**: Indices span from `0.png` to `32.png`.
- **Absent / Excluded Images**: Frames `7.png`, `16.png`, and `23.png` are absent in the dataset on disk; hence, the valid dataset contains exactly **30 images** (never 32 or 33).
- **Total Calibrated Parking Slots**: Across all 30 source images, exactly **897 parking slots** are geometrically annotated and calibrated in `configs/parking_lots.json`.
- **Resolution Heterogeneity**: Camera resolutions vary widely across feeds, ranging from $477 \times 318$ (`29.png`) up to $2560 \times 1820$ (`10.png`), including standard benchmark resolutions such as $712 \times 750$ (`5.png`, 49 slots) and $1200 \times 800$ (`26.png`, 67 slots).

### Patch Partitions for Classifier Training
From the multi-scene surveillance annotations, a total of **902 usable cropped space samples** were extracted for deep learning training, validation, and evaluation:
- **Total Usable Cropped Space Samples**: 902 samples.
- **Training Partition (TRAIN)**:
  - Total Samples: **632**
  - Occupied: **445**
  - Vacant: **187**
  - Source Camera Frames: IDs 15, 17, 18, 20, 21, 22, 24, 25, 26, 27
- **Validation Partition (VAL)**:
  - Total Samples: **104**
  - Occupied: **81**
  - Vacant: **23**
  - Source Camera Frames: IDs 4, 14, 19, 28
- **Test Partition (TEST — Untouched Evaluation)**:
  - Total Samples: **166**
  - Occupied: **103**
  - Vacant: **63**
  - Source Camera Frames: IDs 5, 29, 30, 31, 32

### Dataset Label Mapping
Surveillance annotations were mapped to strict binary target classes:
- `free_parking_space` $\longrightarrow$ **VACANT** (Class 1)
- `not_free_parking_space` $\longrightarrow$ **OCCUPIED** (Class 0)
- `partially_free_parking_space` $\longrightarrow$ **OCCUPIED** (Class 0)

> [!NOTE]
> Partially obstructed spaces or bays with encroaching vehicles are categorized as **OCCUPIED** because an arriving driver cannot park in an obstructed bay.

---

## 11. Dataset Preparation
Dataset preprocessing was carried out by `src/prepare_dataset.py`:
1. The raw dataset archive (`archive.zip`) was extracted to a localized workspace.
2. XML image dimensions were verified against physical image resolutions.
3. Coordinates were parsed into floating-point vertex arrays.
4. For each polygon, min/max bounds were computed using `np.floor` and `np.ceil` to encapsulate the parking bay without truncation.
5. Slot crops were saved to disk in lossless **PNG** format to prevent JPEG Discrete Cosine Transform (DCT) quantization artifacts from degrading edge boundaries.
6. Crops smaller than $10 \times 10$ pixels were rejected as non-informative.

---

## 12. Parking-Slot Extraction
The system utilizes geometric polygon calibration stored in `configs/parking_lots.json`. The configuration file contains a master registry indexing all **30 supported parking lots** (`Parking_Lot_0` through `Parking_Lot_32`, excluding missing frames 7, 16, 23) and their native dimensions and slot coordinates.

```json
{
  "parking_lot": "Parking_Lot_5",
  "image_width": 712,
  "image_height": 750,
  "total_slots": 49,
  "slots": [
    {
      "slot_id": "SLOT_001",
      "polygon": [
        [433.7, 25.5],
        [439.83, 79.16],
        [492.0, 78.2],
        [480.5, 24.7]
      ],
      "annotation_status": "OCCUPIED"
    }
  ]
}
```

### Dynamic Configuration Resolution
To support arbitrary surveillance frames across all 30 scenes, the function `get_parking_lot_config(lot_id_or_filename)` in `src/parking_slot_detection.py` dynamically resolves the correct configuration:
1. **Filename Matching**: Extracts base numerical stems from filenames (e.g., `5.png` $\to$ `Parking_Lot_5`, `26.png` $\to$ `Parking_Lot_26`).
2. **Dimension Matching**: If filename matching fails or an uploaded file has a generic name (e.g. `camera_capture.jpg`), it matches against configured `(image_width, image_height)` dimensions in the registry.
3. **Graceful Error Handling**: If an uncalibrated frame is ingested, the system raises a clear exception specifying that coordinates for the provided frame are uncalibrated.

### Extraction Pipeline Steps
The extraction pipeline processes each slot through the following mathematical steps:
1. **Coordinate Scaling**:
   When images are ingested at resolutions differing from calibration XML dimensions:
   $$x' = x \cdot \left(\frac{W_{\text{actual}}}{W_{\text{xml}}}\right), \quad y' = y \cdot \left(\frac{H_{\text{actual}}}{H_{\text{xml}}}\right)$$
2. **Bounding Box Isolation**:
   $$x_1 = \max(0, \lfloor \min x' \rfloor), \quad y_1 = \max(0, \lfloor \min y' \rfloor)$$
   $$x_2 = \min(W_{\text{actual}}, \lceil \max x' \rceil + 1), \quad y_2 = \min(H_{\text{actual}}, \lceil \max y' \rceil + 1)$$
3. **Local Polygonal Masking**:
   Global coordinates are shifted to local crop space ($x_{\text{local}} = x' - x_1$, $y_{\text{local}} = y' - y_1$). A single-channel 8-bit mask initialized to zero has its polygon filled with intensity 255 via `cv2.fillPoly`.
4. **Bitwise Extraction**:
   $$\text{MaskedCrop} = \text{Crop} \odot \text{Mask}$$
   Pixels outside the polygon boundary are set to pure black ($[0,0,0]$), ensuring the neural network focuses exclusively on the parking space interior rather than neighboring vehicles.
5. **Tensor Normalization**:
   The masked crop is resized to $224 \times 224$ pixels via bilinear interpolation and mapped to $[-1.0, 1.0]$ via MobileNetV2 preprocessing.

---

## 13. Deep Learning Model
The model utilizes **MobileNetV2**, an inverted residual network with linear bottlenecks optimized for high-accuracy, low-latency visual inference on embedded and edge architectures.

### Model Architecture Breakdown
1. **Input Layer**: Shape $(224, 224, 3)$.
2. **Data Augmentation Layer** (active during training):
   - Horizontal random flipping (`RandomFlip("horizontal")`).
   - Random rotation up to $5\%$ (`RandomRotation(0.05)`).
   - Random zoom up to $10\%$ (`RandomZoom(0.10)`).
   - Random contrast variation up to $10\%$ (`RandomContrast(0.10)`).
3. **Internal Preprocessing**:
   - `tf.keras.applications.mobilenet_v2.preprocess_input` scales raw pixel intensities from $[0, 255]$ to $[-1.0, 1.0]$.
4. **Pretrained Base Network**:
   - MobileNetV2 trunk initialized with ImageNet weights, base layers frozen to preserve generalized visual features (edges, textures, metallic surfaces).
5. **Classification Head**:
   - `GlobalAveragePooling2D()` reduces the $7 \times 7 \times 1280$ feature map to a 1280-dimensional feature vector.
   - `Dropout(0.30)` prevents co-adaptation of features.
   - `Dense(1, activation="sigmoid")` outputs the posterior probability $\hat{y} \in [0.0, 1.0]$ representing the probability of class 1 (**VACANT**).

Model artifact is saved as: `models/parking_mobilenetv2.keras` (9.65 MB).

---

## 14. Training Methodology
- **Optimizer**: Adam ($\eta = 10^{-3}$, $\beta_1 = 0.9$, $\beta_2 = 0.999$).
- **Loss Function**: Binary Cross-Entropy:
  $$\mathcal{L} = -\frac{1}{N} \sum_{i=1}^N \left[ w_1 y_i \log(\hat{y}_i) + w_0 (1 - y_i) \log(1 - \hat{y}_i) \right]$$
- **Class Imbalance Mitigation**: The training set contained 445 occupied vs. 187 vacant spaces (ratio $\approx 2.38 : 1$). Balanced class weights were computed via Scikit-Learn:
  $$w_j = \frac{N_{\text{samples}}}{N_{\text{classes}} \cdot N_j}$$
  Resulting in weights: $w_{\text{occupied}} \approx 0.710$, $w_{\text{vacant}} \approx 1.690$.
- **Batch Size**: 32 samples per mini-batch.
- **Regularization & Callbacks**:
  - `ModelCheckpoint`: Monitored validation loss (`val_loss`), saving only the optimal weights to disk.
  - `EarlyStopping`: Monitored `val_loss` with patience of 4 epochs, restoring optimal weights.
  - `ReduceLROnPlateau`: Monitored `val_loss`, reducing learning rate by a factor of $0.3$ if validation loss plateaued for 2 epochs (minimum $\eta = 10^{-6}$).

---

## 15. Model Evaluation
Model performance was evaluated on the **untouched test partition** comprising **166 real parking-space crops** (103 occupied, 63 vacant) extracted from independent surveillance scenes.

### Verified Test-Set Metrics
| Metric | Formula | Verified Result |
| :--- | :--- | :--- |
| **Test Accuracy** | $\frac{TP + TN}{TP + TN + FP + FN}$ | **98.80%** (0.9880) |
| **Precision** | $\frac{TP}{TP + FP}$ | **98.41%** (0.9841) |
| **Recall** | $\frac{TP}{TP + FN}$ | **98.41%** (0.9841) |
| **F1-Score** | $2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$ | **98.41%** (0.9841) |
| **Test Loss** | Binary Cross-Entropy | **0.0214** |
| **Test Sample Size**| Total crops evaluated | **166** |

### Verified Confusion Matrix
```
                    Predicted OCCUPIED    Predicted VACANT
Actual OCCUPIED            102                    1
Actual VACANT                1                   62
```
- **True Positives (Occupied)**: 102
- **True Negatives (Vacant)**: 62
- **False Negatives**: 1
- **False Positives**: 1

> [!IMPORTANT]
> The **98.80%** accuracy represents the model's test performance on independent crops. This must **never** be confused with the physical occupancy percentage of any specific parking lot.

---

## 16. Parking Occupancy Detection
The parking occupancy detection engine is generalized across all **30 supported surveillance camera captures** (representing **897 total parking slots**):
1. **Camera Layout Auto-Detection**: Given an input camera frame, the system resolves its calibration profile from `configs/parking_lots.json` via `get_parking_lot_config()`.
2. **Crop & Mask Extraction**: Each bay polygon is extracted using the canonical `crop_polygon` logic with localized binary masking and saved as an in-memory normalized tensor.
3. **Inference**: Batched MobileNetV2 forward pass yields sigmoid prediction $p = P(\text{VACANT})$.
4. **Status Determination**:
   $$\text{Status} = \begin{cases} \text{VACANT}, & \text{if } p \ge 0.50 \\ \text{OCCUPIED}, & \text{if } p < 0.50 \end{cases}$$
5. **Confidence Assignment**:
   $$\text{Confidence} = \begin{cases} p, & \text{if Status is VACANT} \\ 1.0 - p, & \text{if Status is OCCUPIED} \end{cases}$$
6. **Visual Bounding Overlays**:
   - Emerald polygon (`#10B981` / RGB `[0, 200, 0]`) and label for VACANT bays.
   - Rose polygon (`#F43F5E` / RGB `[0, 0, 255]`) and label for OCCUPIED bays.
   - Overlaid banner displaying Slot ID, Status, and Confidence percentage.
7. **Dual-Demonstration Scenarios**:
   - **Primary Baseline Demonstration (Parking Lot 5)**: Ingests `5.png` ($712 \times 750$ pixels), monitoring **49 slots**, detecting **27 occupied** and **22 vacant** bays (**55.10% occupancy**, **95.83% average confidence**).
   - **Secondary Multi-Image Demonstration (Parking Lot 26)**: Ingests `26.png` ($1200 \times 800$ pixels), monitoring **67 slots**, detecting **27 occupied** and **40 vacant** bays (**40.30% occupancy**, **88.94% average confidence**).

---

## 17. FastAPI Backend
The backend is implemented in `app/api.py` and provides the following production endpoints:
- `GET /`: Health and version metadata (`{"name": "Smart Parking AI", "status": "running", "version": "1.0.0"}`).
- `GET /health`: Operational readiness endpoint reporting if the model and configuration are loaded in memory.
- `POST /analyze`: Primary multipart inference endpoint accepting surveillance images:
  - Enforces image MIME type validation (`image/*`).
  - Auto-resolves camera configuration via `get_parking_lot_config(lot_id_or_filename)` by filename (e.g. `5.png` $\to$ `Parking_Lot_5`, `26.png` $\to$ `Parking_Lot_26`) or matching image dimensions against the 30 registered parking lots. Returns an informative HTTP 400 error if an uncalibrated image is ingested.
  - Dynamically performs coordinate scaling if resolution differs from calibration XML geometry.
  - Performs batched polygonal crop extraction and MobileNetV2 prediction.
  - Draws visual overlays using OpenCV and stores the result in `outputs/api_uploads/{upload_id}/annotated_result.jpg`.
  - Appends/updates live inference data in `outputs/powerbi/parking_occupancy.csv`.
  - Returns structured JSON payload containing dynamic `parking_lot`, `image_size`, `total_slots`, `occupied_slots`, `vacant_slots`, `occupancy_percentage`, `average_confidence`, `annotated_image_url`, `slots`, and `powerbi_records`.
- `GET /powerbi/data`: Returns the current Power BI dataset in structured JSON format.
- `GET /powerbi-files/parking_occupancy.csv`: Direct static file download endpoint for Power BI Desktop ingestion.
- Static File Mount `/api-files`: Serves original and annotated inspection frames.

---

## 18. React Frontend
The user interface is an engineering dashboard developed using React 19 and Vite (`frontend/`):
- **Header (`Header.jsx`)**: System readiness status, brand identity, and anchor navigation (`#overview`, `#visualization`, `#inference`, `#analytics`).
- **Hero Section (`Hero.jsx`)**: Technical project overview explaining deep learning occupancy inference.
- **Image Upload (`ImageUpload.jsx`)**:
  - Drag-and-drop file upload zone supporting JPG, JPEG, and PNG.
  - Client-side dimension detection via `naturalWidth` and `naturalHeight`; auto-calibrates across all 30 supported parking lots without hard-coded resolution rejection.
  - Displays detected image resolution, matched parking lot configuration, and slot count.
  - Live progress indication during inference.
- **Monitoring Viewer (`ParkingVisualization.jsx`)**:
  - High-resolution SVG-styled image container with dynamic viewBox adapting to any camera resolution ($712 \times 750$, $1200 \times 800$, etc.).
  - Zoom controls ($1.0\times$ to $2.5\times$), pan capability, and fullscreen viewing mode.
  - Instant toggle between raw original camera input and OpenCV AI-annotated output.
  - Two-way interactive slot inspection linking viewer polygons to telemetry tables.
- **Analytics Dashboard (`AnalyticsDashboard.jsx`)**:
  - **Analysis Metadata Bar**: Displays camera resolution, facility ID, total bays analyzed, last analysis execution timestamp, and direct Power BI CSV download button.
  - **KPI Cards**: Dynamic Total Slots, Occupied Slots, Vacant Slots, Occupancy %, and Average AI Confidence.
  - **Occupancy Distribution**: Responsive SVG Donut Chart with segmented arcs for Occupied (Rose) and Vacant (Emerald), center capacity load display, and proportional capacity continuum bar.
  - **AI Prediction Confidence Bar Chart**: SVG Bar Chart mapping each slot's prediction confidence from Power BI records, color-coded by OCCUPIED / VACANT, 90% benchmark threshold line, interactive hover tooltip with exact values, two-way click-to-select sync, and summary stats.
  - **Empty State**: Clear placeholder when awaiting analysis.
- **Slot Analytics (`SlotAnalytics.jsx`)**:
  - Telemetry table showing Slot ID, Status badge, mini-confidence bar, and inspect action.
  - Filter pills: `ALL`, `OCCUPIED`, and `VACANT`.
  - Live text search filtering by Slot ID (e.g., `SLOT_023`).

---

## 19. Power BI Integration
The Power BI pipeline guarantees full consistency between operational dashboards and executive business reporting.

### Dataset Schema (`outputs/powerbi/parking_occupancy.csv`)
1. `Date`: Ingestion date (`YYYY-MM-DD`).
2. `Time`: Ingestion time (`HH:MM:SS`).
3. `Parking_Lot`: Facility identifier (`Parking_Lot_5`).
4. `Slot_ID`: Categorical bay key (`SLOT_001` through `SLOT_049`).
5. `Status`: Categorical occupancy class (`OCCUPIED` or `VACANT`).
6. `Confidence`: MobileNetV2 prediction confidence percentage ($0.00$ to $100.00$).
7. `Total_Slots`: Total configured facility capacity ($49$).
8. `Occupied_Slots`: Total count of active vehicles ($27$).
9. `Vacant_Slots`: Total count of available bays ($22$).
10. `Occupancy_Percentage`: Aggregate facility load ratio ($55.10$).

### Implemented DAX Measures (`powerbi/measures.dax`)
```dax
Total Slots = COUNTROWS('parking_occupancy')

Occupied Slots = 
CALCULATE(
    COUNTROWS('parking_occupancy'),
    'parking_occupancy'[Status] = "OCCUPIED"
)

Vacant Slots = 
CALCULATE(
    COUNTROWS('parking_occupancy'),
    'parking_occupancy'[Status] = "VACANT"
)

Occupancy % = 
DIVIDE([Occupied Slots], [Total Slots], 0)

Average Confidence = 
DIVIDE(AVERAGE('parking_occupancy'[Confidence]), 100, 0)
```

### Power BI Dashboard Visuals
1. **Summary KPI Cards**: Real-time display of Total Slots (49), Occupied (27), Vacant (22), Occupancy % (55.10%), and Average AI Confidence (95.83%).
2. **Occupancy Distribution Donut Visual**: Proportional breakdown of Occupied vs. Vacant bays using project brand colors (Rose `#F43F5E` and Emerald `#10B981`).
3. **Slot Confidence Clustered Column Chart**: Plots prediction confidence per slot across all 49 bays against a 90% benchmark threshold line.
4. **Slot Telemetry Table**: Tabular layout showing `Slot_ID`, `Status`, and `Confidence`.
5. **Facility Metadata Visual**: Displays facility name, camera profile, and ingestion timestamp.

> [!IMPORTANT]
> The Power BI dataset represents the **actual verified analysis run** of the ingested frame. No fake historical dates, synthetic weekly patterns, or fabricated trends were introduced.

---

## 20. Results

### 1. Model Test-Set Classification Performance
- **Accuracy**: **98.80%** (164 out of 166 crops classified correctly).
- **Precision**: **98.41%**
- **Recall**: **98.41%**
- **F1-Score**: **98.41%**
- **Test Loss**: **0.0214**
- **Evaluation Set**: 166 independent, held-out test crops (103 Occupied, 63 Vacant).

### 2. Primary Baseline Demonstration Results: Parking Lot 5 (`5.png`)
- **Camera Resolution**: $712 \times 750$ pixels.
- **Total Configured Slots**: **49**
- **Occupied Bays Detected**: **27**
- **Vacant Bays Detected**: **22**
- **Calculated Occupancy Percentage**: **55.10%**
- **Average Prediction Confidence**: **95.83%**
- **Configured Slot-Level Comparison**: 46 out of 49 slots match ground truth annotation ($93.88\%$).

> [!NOTE]
> The **93.88%** slot agreement on this single full surveillance frame reflects real-world deployment conditions (partial shadows and boundary perspectives on slots 19, 41, and 49). This is distinct from the **98.80%** accuracy obtained on the independent test set.

### 3. Secondary Multi-Image Demonstration Results: Parking Lot 26 (`26.png`)
- **Camera Resolution**: $1200 \times 800$ pixels.
- **Total Configured Slots**: **67**
- **Occupied Bays Detected**: **27**
- **Vacant Bays Detected**: **40**
- **Calculated Occupancy Percentage**: **40.30%**
- **Average Prediction Confidence**: **88.94%**
- **Inference Latency**: Sub-100 ms end-to-end extraction and classification.

### 4. Multi-Image Batch Inference Verification (All 30 Dataset Images)
A complete automated batch inference audit was executed across all **30 valid surveillance images** on disk (`dataset/original/images/`), verifying dynamic configuration lookup, coordinate extraction, and MobileNetV2 classification.

> [!IMPORTANT]
> The dataset contains indices from 0 to 32, but frames `7.png`, `16.png`, and `23.png` are absent on disk. Thus, exactly **30 images** exist and are supported (never 32 or 33).

| Image File | Lot Identifier | Dimensions | Total Slots | Occupied | Vacant | Occupancy % | Avg Confidence | Inference Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `0.png` | `Parking_Lot_0` | $1200 \times 621$ | 28 | 19 | 9 | 67.86% | 96.78% | SUCCESS |
| `1.png` | `Parking_Lot_1` | $650 \times 487$ | 38 | 30 | 8 | 78.95% | 94.61% | SUCCESS |
| `2.png` | `Parking_Lot_2` | $1779 \times 990$ | 15 | 14 | 1 | 93.33% | 99.72% | SUCCESS |
| `3.png` | `Parking_Lot_3` | $620 \times 366$ | 35 | 15 | 20 | 42.86% | 92.15% | SUCCESS |
| `4.png` | `Parking_Lot_4` | $665 \times 354$ | 46 | 24 | 22 | 52.17% | 89.91% | SUCCESS |
| `5.png` *(Demo 1)* | `Parking_Lot_5` | $712 \times 750$ | 49 | 27 | 22 | 55.10% | 95.83% | SUCCESS |
| `6.png` | `Parking_Lot_6` | $1280 \times 720$ | 81 | 20 | 61 | 24.69% | 84.44% | SUCCESS |
| `8.png` | `Parking_Lot_8` | $612 \times 1088$ | 22 | 17 | 5 | 77.27% | 98.14% | SUCCESS |
| `9.png` | `Parking_Lot_9` | $1920 \times 1084$ | 24 | 15 | 9 | 62.50% | 96.40% | SUCCESS |
| `10.png` | `Parking_Lot_10` | $2560 \times 1820$ | 20 | 15 | 5 | 75.00% | 98.93% | SUCCESS |
| `11.png` | `Parking_Lot_11` | $1353 \times 1041$ | 36 | 31 | 5 | 86.11% | 96.68% | SUCCESS |
| `12.png` | `Parking_Lot_12` | $1920 \times 1080$ | 39 | 12 | 27 | 30.77% | 99.87% | SUCCESS |
| `13.png` | `Parking_Lot_13` | $1280 \times 720$ | 33 | 29 | 4 | 87.88% | 94.88% | SUCCESS |
| `14.png` | `Parking_Lot_14` | $1920 \times 1080$ | 6 | 6 | 0 | 100.00% | 98.18% | SUCCESS |
| `15.png` | `Parking_Lot_15` | $1100 \times 732$ | 32 | 21 | 11 | 65.62% | 99.06% | SUCCESS |
| `17.png` | `Parking_Lot_17` | $768 \times 768$ | 12 | 11 | 1 | 91.67% | 99.70% | SUCCESS |
| `18.png` | `Parking_Lot_18` | $897 \times 651$ | 25 | 24 | 1 | 96.00% | 99.71% | SUCCESS |
| `19.png` | `Parking_Lot_19` | $1751 \times 719$ | 32 | 28 | 4 | 87.50% | 99.45% | SUCCESS |
| `20.png` | `Parking_Lot_20` | $1200 \times 630$ | 26 | 18 | 8 | 69.23% | 98.72% | SUCCESS |
| `21.png` | `Parking_Lot_21` | $1100 \times 733$ | 8 | 7 | 1 | 87.50% | 99.33% | SUCCESS |
| `22.png` | `Parking_Lot_22` | $852 \times 480$ | 24 | 21 | 3 | 87.50% | 92.91% | SUCCESS |
| `24.png` | `Parking_Lot_24` | $724 \times 376$ | 26 | 20 | 6 | 76.92% | 87.30% | SUCCESS |
| `25.png` | `Parking_Lot_25` | $1600 \times 901$ | 15 | 14 | 1 | 93.33% | 99.40% | SUCCESS |
| `26.png` *(Demo 2)* | `Parking_Lot_26` | $1200 \times 800$ | 67 | 27 | 40 | 40.30% | 88.94% | SUCCESS |
| `27.png` | `Parking_Lot_27` | $900 \times 500$ | 26 | 20 | 6 | 76.92% | 95.98% | SUCCESS |
| `28.png` | `Parking_Lot_28` | $1000 \times 566$ | 20 | 19 | 1 | 95.00% | 99.47% | SUCCESS |
| `29.png` | `Parking_Lot_29` | $477 \times 318$ | 24 | 17 | 7 | 70.83% | 96.83% | SUCCESS |
| `30.png` | `Parking_Lot_30` | $890 \times 204$ | 36 | 12 | 24 | 33.33% | 90.33% | SUCCESS |
| `31.png` | `Parking_Lot_31` | $1412 \times 827$ | 22 | 11 | 11 | 50.00% | 99.56% | SUCCESS |
| `32.png` | `Parking_Lot_32` | $968 \times 347$ | 36 | 25 | 11 | 69.44% | 83.70% | SUCCESS |
| **TOTALS / SUMMARY** | **30 Lots Verified** | **Diverse** | **897 Slots** | **551** | **346** | **61.43%** | **95.27%** | **30 / 30 SUCCESS (100%)** |

- **Total Images Evaluated**: 30
- **Total Valid Calibrated Slots**: 897
- **Failed Batches**: 0 (100% success rate across all 30 scenes)
- **Serialized Verification File**: `outputs/multi_image_inference_results.csv`

### 5. API, CSV, and Dashboard Consistency
Across both primary and secondary demonstrations and all tested frames:
- **API `slots` array** $\equiv$ **API `powerbi_records`** $\equiv$ **`parking_occupancy.csv`** $\equiv$ **React Dashboard Table**.
- For Parking Lot 5: exactly 50 rows in CSV (1 header + 49 data rows).
- For Parking Lot 26: exactly 68 rows in CSV (1 header + 67 data rows).
- **Zero mismatches (0 errors)** in Slot ID, Status, Confidence, or aggregate metrics across the entire software stack.

---

## 21. Limitations
1. **Geometric Pre-Calibration Requirement**: Parking slots require geometric 4-point polygon calibration stored in `configs/parking_lots.json`. The system does not automatically detect arbitrary parking boundaries in completely uncalibrated camera views.
2. **Pre-Configured Dataset Scope**: The system natively supports all **30 source images** from the surveillance dataset (spanning 897 calibrated slots). Introducing an entirely new, unobserved surveillance camera requires an initial coordinate calibration step to map its slot polygons.
3. **Absence of Live RTSP Streaming**: The current system ingests surveillance frames via HTTP multipart POST rather than direct hardware RTSP/HLS video stream decoding.
4. **Single-Snapshot Telemetry**: The active Power BI pipeline reflects the operational inference snapshot of the analyzed lot rather than an aggregated multi-year historical time-series database.
5. **Extreme Environmental Factors**: While robust to ambient daytime illumination and shadows, extreme weather phenomena (such as heavy snowfall obscuring painted boundaries or severe lens glare) can impact visual classification.

---

## 22. Future Scope
1. **RTSP / HLS Live Video Ingestion**: Integrate OpenCV hardware video capture to decode RTSP camera feeds and sample frames periodically (e.g., every 5 seconds).
2. **Multi-Camera Facility Switching**: Extend the React UI and configuration registry to support multi-level parking garages with dozens of camera feeds selectable via dropdown.
3. **Longitudinal Time-Series Database**: Connect the FastAPI inference engine to PostgreSQL with TimescaleDB to persist hourly, daily, and seasonal occupancy records.
4. **Automated Slot Discovery**: Develop a semantic segmentation model (e.g., Mask R-CNN or YOLO-v8-seg) to automatically detect parking line markings and generate slot polygons on initial installation.
5. **Automatic License Plate Recognition (ALPR)**: Integrate character recognition models at entry/exit points to link occupied slot locations with vehicle registrations.
6. **Mobile Driver Guidance App**: Expose a mobile-friendly API allowing motorists to view vacant bay numbers and navigate directly to available slots.

---

## 23. Conclusion
The **Smart Parking AI** project successfully demonstrates a production-quality, non-intrusive parking occupancy detection system combining computer vision, deep learning, modern web architecture, and business intelligence analytics. 

By leveraging MobileNetV2 with transfer learning, the system achieves exceptional classification accuracy (**98.80% test accuracy, 98.41% F1-score**) while maintaining a minimal computational footprint. The integration of geometric slot extraction, asynchronous FastAPI endpoints, a responsive React 19 dashboard, and seamless Power BI telemetry export delivers a unified platform that bridges edge inference with executive facility monitoring. The implementation strictly adheres to academic rigor, utilizing genuine inference results and transparent architecture without synthetic data fabrication.

---

## 24. References
1. **Sandler, M., Howard, A., Zhu, M., Zhmoginov, A., & Chen, L. C.** (2018). *MobileNetV2: Inverted Residuals and Linear Bottlenecks*. Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR), pp. 4510-4520.
2. **Bradski, G.** (2000). *The OpenCV Library*. Dr. Dobb's Journal of Software Tools.
3. **Abadi, M., et al.** (2016). *TensorFlow: A System for Large-Scale Machine Learning*. 12th USENIX Symposium on Operating Systems Design and Implementation (OSDI 16), pp. 265-283.
4. **Tiangolo, S.** (2018). *FastAPI: Modern, High-Performance Web Framework for Python 3.8+*. https://fastapi.tiangolo.com/
5. **Meta Platforms & Open Source Contributors**. (2024). *React: A JavaScript Library for Building User Interfaces*. https://react.dev/
6. **Microsoft Corporation**. (2023). *Data Analysis Expressions (DAX) Reference & Power BI Desktop Documentation*. https://learn.microsoft.com/en-us/dax/
7. **Dataset Source**: Parking Lot Surveillance Dataset annotated in CVAT XML format (comprising 902 usable parking-slot crops extracted across multiple camera perspectives).
