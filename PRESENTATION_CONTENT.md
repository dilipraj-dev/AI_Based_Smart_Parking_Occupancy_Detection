# Smart Parking AI: Presentation Content & Speaker Notes

**Project Title:** AI-Based Smart Parking Occupancy Detection using Deep Learning and Power BI Analytics  
**Architecture:** MobileNetV2 (CNN) + OpenCV + FastAPI + React + Microsoft Power BI  
**Target:** Final Academic Presentation / Project Defense (~15 Slides)

---

## Slide 1: Title Slide

### Slide Content
* **Title:** AI-Based Smart Parking Occupancy Detection Using Deep Learning and Power BI Analytics
* **Subtitle:** An End-to-End Vision-Based Parking Monitoring and Business Intelligence System
* **Domain:** Computer Vision, Deep Learning, Full-Stack Web Development, Business Intelligence
* **Presenter / Student Name:** [Your Name / Candidate Name]
* **Supervisor / Guide:** [Supervisor / Department Name]
* **Academic Year:** 2025–2026

### What to Explain Verbally
> "Good morning, respected professors and evaluation committee members. Today, I am presenting our project: **AI-Based Smart Parking Occupancy Detection using Deep Learning and Power BI Analytics**.  
> This project addresses urban parking congestion by designing a non-intrusive, vision-based parking monitoring platform. We combine transfer learning with a lightweight MobileNetV2 convolutional neural network, a robust OpenCV slot-extraction pipeline, an asynchronous FastAPI backend, an interactive React frontend dashboard, and an integrated Microsoft Power BI analytics suite."

### Suggested Visual / Diagram
* High-level banner showing the 4 technology pillars: Deep Learning (MobileNetV2), Backend API (FastAPI), User Interface (React), and Analytics (Power BI).
* Split visual showing an outdoor parking lot camera view on the left and the resulting annotated detection map on the right.

---

## Slide 2: Introduction & Motivation

### Slide Content
* **Urban Congestion Challenge:** In major cities, up to 30% of downtown traffic congestion is caused by drivers cruising in search of vacant parking spaces.
* **Environmental & Economic Toll:** Cruising wastes millions of hours, increases fuel consumption, and contributes significantly to vehicular carbon emissions.
* **Sensor-Based Limitations:** Traditional ultrasonic, geomagnetic, and infrared hardware sensors embedded in individual parking bays require high installation costs, constant battery maintenance, and vulnerability to asphalt damage.
* **Computer Vision Opportunity:** Existing overhead CCTV and surveillance cameras can monitor dozens of parking slots simultaneously using a single optical feed, eliminating per-bay sensor hardware.

### What to Explain Verbally
> "Urban mobility studies reveal that up to 30% of city center congestion stems directly from vehicles circling for an open parking space. While IoT sensors installed in individual bays can detect occupancy, retrofitting an entire parking garage or municipal lot with thousands of magnetic or ultrasonic sensors incurs prohibitive installation and maintenance costs.  
> Our project leverages existing surveillance infrastructure. By treating the camera as a multi-slot sensor, we extract and classify individual parking spots concurrently using deep learning, turning passive CCTV footage into actionable, real-time spatial intelligence."

### Suggested Visual / Diagram
* Infographic comparing:
  * **Traditional approach:** 50 hardware sensors for 50 parking slots (high cost, high maintenance).
  * **Our vision approach:** 1 camera feed + AI pipeline monitoring 50 parking slots (low cost, scalable).

---

## Slide 3: Problem Statement

### Slide Content
* **Core Problem:** The lack of real-time parking availability information leads to driver frustration, roadway congestion, and inefficient parking facility utilization.
* **Technical Challenges in Vision-Based Detection:**
  * **Inter-slot perspective distortion:** Distant parking slots appear skewed, foreshortened, and compressed compared to foreground slots.
  * **Vehicle occlusion & boundaries:** Vehicles cast shadows and occlude adjacent marking lines.
  * **Environmental variations:** Dynamic lighting, overcast conditions, glare, and changing weather conditions.
  * **Latency & Edge Feasibility:** Heavy architectures (e.g., full-frame object detectors) require expensive GPU infrastructure, making edge deployment difficult.
  * **Fragmented Tooling:** Most academic projects stop at model accuracy and lack end-to-end integration with web dashboards and enterprise BI reporting.

### What to Explain Verbally
> "The primary problem is that motorists lack real-time visibility into parking availability, while parking operators lack structured analytics to optimize pricing and space utilization.  
> Solving this visually introduces non-trivial technical challenges: camera perspective causes slots to appear as arbitrary quadrilaterals rather than simple rectangles. Lighting conditions shift throughout the day, and adjacent vehicles cast shadows. Furthermore, academic research frequently stops at a standalone Python script. Our objective was to resolve both the algorithmic challenge of robust slot classification and the architectural challenge of building a unified, production-grade system."

### Suggested Visual / Diagram
* Annotated camera frame showing perspective warping (trapezoidal slots) alongside contrasting lighting/shadow challenges.

---

## Slide 4: Project Objectives

### Slide Content
1. **Develop an Accurate & Lightweight Classifier:** Train a deep convolutional neural network using MobileNetV2 to classify individual parking slots as Occupied or Vacant with >95% accuracy.
2. **Implement Polygon-Based Extraction:** Develop an OpenCV pipeline to crop arbitrary four-point quadrilateral parking slots without perspective distortion artifacts.
3. **Build High-Throughput REST API:** Develop an asynchronous FastAPI backend (`POST /analyze`, `GET /powerbi/data`) with full validation and structured JSON schemas.
4. **Deploy Real-Time User Interface:** Create a responsive React dashboard offering live image uploads, dynamic slot-level inspection, interactive overlays, and instantaneous KPI cards.
5. **Establish Power BI Business Intelligence:** Generate Power BI-compatible data records (`outputs/powerbi/parking_occupancy.csv`) and provide automated data transformation via Power Query M and DAX measures.

### What to Explain Verbally
> "We structured the project around five concrete, measurable engineering objectives:  
> First, train a lightweight, high-accuracy deep learning classifier tailored for embedded inference.  
> Second, build a coordinate-aware OpenCV slot extraction pipeline capable of handling precise polygon boundaries.  
> Third, construct a robust asynchronous backend using FastAPI to process image payloads and orchestrate inference.  
> Fourth, deliver an interactive React dashboard with SVG polygon overlays for operators and motorists.  
> And fifth, bridge real-time operational data into Microsoft Power BI for strategic decision-making."

### Suggested Visual / Diagram
* 5-stage milestone progression flowchart: Model Training &rarr; OpenCV Extraction &rarr; FastAPI Backend &rarr; React Dashboard &rarr; Power BI Analytics.

---

## Slide 5: Proposed Solution

### Slide Content
* **Dual-Stage Architecture:** Decouples slot localization (fixed calibrated coordinates) from slot occupancy classification (deep CNN).
* **Multi-Image Camera Support:** Dynamically handles all 30 surveillance scenes with valid annotations in the dataset (897 total slots).
* **Transfer Learning Backbone:** Pretrained MobileNetV2 on ImageNet, utilizing inverted residual blocks and depthwise separable convolutions for efficient spatial feature extraction.
* **Canonical Masking & Bounding-Box Normalization:** Uses polygon masks and bounding rects to isolate individual slots, resizing each slot patch to $224 \times 224$ pixels.
* **Unified REST & Analytical Pipeline:**
  * Live inference response delivered in ~80 ms to web clients.
  * Synchronized Power BI data generation writing standard CSV records with 0 schema discrepancies.

### What to Explain Verbally
> "Our proposed solution adopts a decoupled, dual-stage methodology. Rather than running a heavyweight object detector across an entire 4K or 1080p frame—which frequently misses empty slots without markings—we utilize calibrated parking layout polygons paired with an isolated crop-and-classify strategy.  
> Each defined slot polygon is isolated via an OpenCV bitwise mask, cropped via its bounding rectangle, and passed through a custom MobileNetV2 classifier. Importantly, our architecture dynamically auto-calibrates across all 30 source surveillance scenes in the dataset, accommodating diverse camera resolutions from $477 \times 318$ to $2560 \times 1820$ with sub-100ms execution on standard CPUs."

### Suggested Visual / Diagram
* Flow diagram: Input Camera Frame (Dynamic Resolution) &rarr; Calibrated Polygon Registry (30 Lots) &rarr; Masked Image Patches ($224 \times 224$) &rarr; MobileNetV2 Batch Inference &rarr; Color-Coded Visualization (Rose = Occupied, Emerald = Vacant).

---

## Slide 6: End-to-End System Architecture

### Slide Content
* **Layer 1: Input & Preprocessing Layer**
  * Multi-image surveillance ingestion across 30 supported camera feeds (e.g., Lot 5: $712 \times 750$, Lot 26: $1200 \times 800$).
  * Dynamic layout lookup via `configs/parking_lots.json` and `get_parking_lot_config()`.
  * OpenCV polygon masking, bounding-box cropping, coordinate scaling, and tensor normalization.
* **Layer 2: AI Inference Engine**
  * TensorFlow / Keras MobileNetV2 binary classifier (~9.65 MB, ~2.26M parameters).
  * Batch prediction outputting occupancy status and probability confidence scores.
* **Layer 3: Application Server (FastAPI)**
  * Asynchronous REST endpoints (`POST /analyze`, `GET /health`, `GET /powerbi/data`).
  * In-memory image processing, dynamic dimension validation, and static file serving.
* **Layer 4: Presentation & Analytics**
  * **React Frontend:** Auto-calibrating viewer, interactive KPI metrics, SVG slot overlays, slot search/filter.
  * **Power BI Service / Desktop:** Interactive dashboards, DAX measures, dynamic lot utilization reports.

### What to Explain Verbally
> "This slide illustrates the full end-to-end system architecture.  
> It begins at the Input Layer, where an uploaded frame is dynamically matched against our configuration registry of 30 parking lots.  
> In the Inference Layer, OpenCV extracts individual slot polygons using coordinate scaling and bitwise masking, and our MobileNetV2 model classifies all slots in a single batched tensor operation.  
> In the Application Layer, FastAPI coordinates the entire transaction: it overlays colored polygons onto the source frame using OpenCV, formats the structured JSON response, and synchronizes the Power BI records.  
> Finally, in the Presentation Layer, both the auto-calibrating React UI and executive Power BI dashboards consume this verified output."

### Suggested Visual / Diagram
* Mermaid / Block architecture diagram showing:
  * Client Browser (React) &harr; HTTP/JSON &harr; FastAPI Server &harr; MobileNetV2 Model + OpenCV &rarr; Output CSV &rarr; Power BI Dashboard.

---

## Slide 7: Dataset Overview & Labeling

### Slide Content
* **Surveillance Scenes Scope:**
  * **30 Physical Source Images on Disk** in `dataset/original/images/` (indices 0 to 32; frames 7, 16, and 23 are absent on disk).
  * **897 Total Calibrated Parking Slots** geometrically annotated across all 30 scenes.
* **Total Image Patches for Training:** 902 labeled parking slot samples extracted across scenes.
* **Rigorous Split Distribution:**
  * **Train Set:** 632 samples (445 Occupied, 187 Vacant) &mdash; 70.0%
  * **Validation Set:** 104 samples (81 Occupied, 23 Vacant) &mdash; 11.5%
  * **Test Set:** 166 samples (103 Occupied, 63 Vacant) &mdash; 18.5%
* **Ground Truth Label Mapping:**
  * `free_parking_space` &rarr; **VACANT** (Class 1)
  * `not_free_parking_space` / `partially_free_parking_space` &rarr; **OCCUPIED** (Class 0)
* **Real-World Variations:** Contains vehicles of varying colors, sizes, orientations, lighting angles, and cast shadows.

### What to Explain Verbally
> "For training and evaluating the model, we utilized 902 labeled parking slot image patches extracted across multiple surveillance camera views.  
> The physical dataset contains exactly 30 source images on disk. While indices range from 0 to 32, images 7, 16, and 23 are absent. Across all 30 available images, exactly 897 parking bays are calibrated.  
> We partitioned the crops into 632 training samples, 104 validation samples, and 166 strictly held-out test samples. Notice that the dataset naturally reflects real-world operational distributions: parking lots generally experience higher occupancy, leading to an approximate 2.4:1 ratio of occupied to vacant spaces in training. Rather than artificially truncating real data, we retained this distribution and addressed the imbalance mathematically during model training."

### Suggested Visual / Diagram
* Bar chart showing the sample count distribution:
  * Train: 445 Occupied / 187 Vacant
  * Val: 81 Occupied / 23 Vacant
  * Test: 103 Occupied / 63 Vacant
* Example image patches of Vacant slots vs. Occupied slots (cars, SUVs, partial occlusions).

---

## Slide 8: Data Preprocessing & Slot Extraction Pipeline

### Slide Content
* **Dynamic Configuration Lookup:** Matches uploaded frames by filename (e.g. `5.png` $\to$ `Parking_Lot_5`, `26.png` $\to$ `Parking_Lot_26`) or matching resolution against the 30 calibrated lots.
* **Polygon Representation:** Parking slots are defined as 4-point quadrilateral coordinates:
  $$\text{Polygon} = \{(x_1, y_1), (x_2, y_2), (x_3, y_3), (x_4, y_4)\}$$
* **OpenCV Extraction Steps:**
  1. Scale coordinates if image resolution differs from XML base geometry.
  2. Calculate bounding box: $(x, y, w, h) = \text{cv2.boundingRect}(\text{pts})$.
  3. Create localized binary mask of polygon coordinates via `cv2.fillPoly`.
  4. Apply bitwise-AND operation to black out irrelevant surrounding pixels.
  5. Crop bounding box region: $\text{cropped} = \text{image}[y:y+h, x:x+w]$.
* **Tensor Preparation:** Resize patch to $224 \times 224$ pixels, normalize pixel intensities to $[-1, 1]$ via MobileNetV2 preprocessing.

### What to Explain Verbally
> "Standard rectangular bounding boxes often capture parts of neighboring parking spots when camera angles are tilted. To prevent cross-slot contamination, our pipeline uses precise 4-point polygon definitions.  
> For each slot, OpenCV computes the minimum bounding rectangle and generates a localized binary mask. A bitwise-AND operation zeros out all pixels outside the polygon. The isolated slot is then cropped and bilinearly interpolated to the standard MobileNetV2 input size of $224 \times 224 \times 3$, ensuring the neural network only sees the exact parking bay."

### Suggested Visual / Diagram
* 4-step visual walkthrough:
  1. Full parking camera image &rarr; 2. Single slot polygon overlay &rarr; 3. Bitwise-masked cropped patch &rarr; 4. Resized $224 \times 224$ normalized tensor.

---

## Slide 9: Deep Learning Architecture (MobileNetV2)

### Slide Content
* **Base Network:** Pretrained MobileNetV2 (ImageNet weights, feature extraction).
* **Efficiency Mechanism:** **Depthwise Separable Convolutions**:
  * Splits standard convolution into $3 \times 3$ Depthwise Conv + $1 \times 1$ Pointwise Conv.
  * Drastically reduces parameters and computational complexity ($O(D_K^2 \cdot M \cdot N)$ vs standard).
* **Linear Inverted Residual Bottlenecks:** Preserves manifold information in low dimensions.
* **Custom Classification Head:**
  * `GlobalAveragePooling2D()`: Compresses $7 \times 7 \times 1280$ feature map to 1280-d vector.
  * `Dropout(rate=0.30)`: Prevents co-adaptation and reduces overfitting.
  * `Dense(1, activation='sigmoid')`: Outputs calibrated probability $P(\text{Occupied} \mid x) \in [0, 1]$.
* **Total Parameters:** ~2.26 Million (compact size: 9.65 MB `.keras` file).

### What to Explain Verbally
> "We selected MobileNetV2 specifically for its balance of high accuracy and computational efficiency. MobileNetV2 relies on depthwise separable convolutions and inverted residual bottlenecks, reducing the floating-point operations by up to 80% compared to traditional architectures like VGG-16 or ResNet-50.  
> We retained the pre-trained convolutional base as a frozen feature extractor and appended a lightweight classification head consisting of Global Average Pooling, a 30% Dropout layer for regularization, and a single sigmoid output unit. This produces a lightweight 9.65 MB model file capable of sub-10ms inference per slot."

### Suggested Visual / Diagram
* Neural network layer diagram:
  * Input ($224 \times 224 \times 3$) &rarr; Augmentation &rarr; Inverted Residual Blocks (MobileNetV2) &rarr; GlobalAvgPool2D &rarr; Dropout(0.3) &rarr; Dense(1, Sigmoid) &rarr; Output Probability.

---

## Slide 10: Training Methodology & Optimization

### Slide Content
* **Loss Function:** Binary Cross-Entropy:
  $$\mathcal{L}_{BCE} = - \frac{1}{N} \sum_{i=1}^N \left[ y_i \log(\hat{y}_i) + (1 - y_i) \log(1 - \hat{y}_i) \right]$$
* **Optimizer:** Adam ($\text{learning rate} = 10^{-3}$, $\beta_1 = 0.9$, $\beta_2 = 0.999$).
* **Handling Class Imbalance:** Computed balanced class weighting:
  * $w_0 (\text{Vacant}) = 1.690$
  * $w_1 (\text{Occupied}) = 0.710$
* **On-the-Fly Data Augmentation:** Random Horizontal Flip, Random Rotation ($\pm 5\%$), Random Zoom ($\pm 10\%$), Random Contrast ($\pm 10\%$).
* **Training Callbacks & Convergence:**
  * `EarlyStopping(monitor='val_loss', patience=4, restore_best_weights=True)`
  * `ReduceLROnPlateau(monitor='val_loss', factor=0.3, patience=2, min_lr=1e-6)`
  * `ModelCheckpoint(save_best_only=True)`

### What to Explain Verbally
> "To train the network robustly, we used the Binary Cross-Entropy loss function optimized with Adam.  
> Because the training set contained more occupied samples than vacant samples, unweighted training would bias the network toward predicting 'occupied'. To counteract this, we applied analytical class weights: vacant samples were weighted at 1.690 while occupied samples were weighted at 0.710, penalizing errors on minority vacant slots more heavily.  
> We also applied on-the-fly geometric and color augmentations, and used early stopping with learning rate decay to prevent overfitting and guarantee optimal weight restoration."

### Suggested Visual / Diagram
* Plots of Training Loss vs. Validation Loss and Training Accuracy vs. Validation Accuracy showing smooth convergence without overfitting.

---

## Slide 11: Quantitative Model Evaluation & Test Results

### Slide Content
* **Strict Evaluation Set:** 166 independent, held-out test patches (103 Occupied, 63 Vacant).
* **Verified Benchmark Metrics:**
  * **Test Accuracy:** **98.80%** (164 out of 166 correct)
  * **Test Loss:** **0.0214**
  * **Precision:** **98.41%** (0.9841)
  * **Recall:** **98.41%** (0.9841)
  * **F1-Score:** **98.41%** (0.9841)
* **Confusion Matrix:**
  * True Negatives (Vacant correctly identified): **62**
  * True Positives (Occupied correctly identified): **102**
  * False Positives (Vacant predicted as Occupied): **1**
  * False Negatives (Occupied predicted as Vacant): **1**

### What to Explain Verbally
> "Our model was evaluated on 166 strictly held-out test samples that were never seen during training or validation.  
> The model achieved an outstanding test accuracy of **98.80%** and an F1-score of **98.41%**, with a test loss of only 0.0214.  
> Looking at the confusion matrix, out of 166 test cases, the model had only 2 misclassifications: exactly one false positive and one false negative. This demonstrates that the feature representations learned by MobileNetV2 generalize exceptionally well to varying vehicle shapes, shadows, and open tarmac."

### Suggested Visual / Diagram
* $2 \times 2$ Confusion Matrix graphic:
  * $\text{Actual Vacant} \to \text{Predicted Vacant}: 62 \quad \text{Predicted Occupied}: 1$
  * $\text{Actual Occupied} \to \text{Predicted Vacant}: 1 \quad \text{Predicted Occupied}: 102$
* Summary table of Test Metrics (Accuracy, Precision, Recall, F1-Score).

---

## Slide 12: Real-World Demonstration & Multi-Image Verification

### Slide Content
* **Primary Baseline Demonstration: Parking Lot 5 (`5.png`):**
  * Resolution: $712 \times 750$ pixels | Monitored Slots: **49 Slots** (`SLOT_001` to `SLOT_049`).
  * Occupied: **27** | Vacant: **22** | Occupancy Rate: **55.10%** (*Facility load, NOT model accuracy*).
  * Average Confidence: **95.83%** | Slot Ground Truth Agreement: **46 / 49** (**93.88%**).
* **Secondary Multi-Image Demonstration: Parking Lot 26 (`26.png`):**
  * Resolution: $1200 \times 800$ pixels | Monitored Slots: **67 Slots**.
  * Occupied: **27** | Vacant: **40** | Occupancy Rate: **40.30%** | Average Confidence: **88.94%**.
* **Full Dataset Batch Inference Audit:**
  * **30 / 30 Valid Images Successfully Verified** on disk (897 total slots, 0 failures, 100% success rate).

### What to Explain Verbally
> "We deployed and verified our system across two full-frame demonstrations and a comprehensive 30-image batch audit.  
> In our primary demonstration on Parking Lot 5, monitoring 49 slots, the system detected **27 occupied slots** and **22 vacant slots**, yielding an **occupancy rate of 55.10%** with a mean confidence of **95.83%**. Ground-truth agreement was **93.88%** (46 of 49 slots).  
> To demonstrate that our system is not restricted to a single image or resolution, we evaluated Parking Lot 26 at $1200 \times 800$ resolution. The system auto-calibrated to 67 slots, detecting **40.30% occupancy** with **88.94% confidence**. Across the entire dataset of 30 physical images and 897 calibrated slots, the batch inference completed with a 100% success rate and zero errors."

### Suggested Visual / Diagram
* Side-by-side comparison:
  * Left: Parking Lot 5 ($712 \times 750$, 49 slots, 55.10% occupancy).
  * Right: Parking Lot 26 ($1200 \times 800$, 67 slots, 40.30% occupancy).
  * Summary callout: 30 Source Scenes | 897 Total Slots | 100% Processing Success.

---

## Slide 13: FastAPI Backend & React Frontend Integration

### Slide Content
* **FastAPI Backend (`app/api.py`):**
  * High-performance asynchronous execution on Uvicorn ASGI server.
  * `POST /analyze`: Auto-resolves camera lot via `get_parking_lot_config()`, validates image format, runs coordinate scaling and OpenCV slot extraction, executes batched MobileNetV2 inference, renders annotated image, and returns structured JSON in <100 ms.
  * Static file server for instant image access via `/api-files/`.
* **React 19 Dashboard (`frontend/src/`):**
  * Drag-and-drop file upload with dynamic natural dimension detection (`naturalWidth`, `naturalHeight`).
  * Auto-calibrates across all 30 supported parking lots without rigid resolution rejection.
  * Real-time KPI summary cards (Total, Occupied, Vacant, Occupancy %, Confidence).
  * Interactive SVG polygon overlay layer toggleable over source frame.
  * Search, filter, and slot-level detail drawer.
  * Direct one-click download of Power BI CSV data.

### What to Explain Verbally
> "To deliver a usable product, we built a modern full-stack web application.  
> The backend is built using FastAPI on top of Starlette and Uvicorn. When an operator uploads an image, FastAPI dynamically resolves the camera geometry, coordinates the MobileNetV2 inference, saves the annotated image, and responds with a comprehensive JSON payload in under 100 milliseconds.  
> The React frontend features client-side dimension detection that auto-calibrates to whichever camera scene was uploaded. Operators can zoom, pan, toggle between raw footage and OpenCV polygon overlays, inspect per-slot confidence scores, and filter bays by occupancy status."

### Suggested Visual / Diagram
* Screenshots of:
  * React Upload & Analysis Dashboard with auto-calibrated KPI cards.
  * Interactive slot inspection modal showing slot status, confidence bar, and coordinates.

---

## Slide 14: Microsoft Power BI Business Intelligence

### Slide Content
* **Enterprise Analytical Integration:**
  * Power BI data export pipeline (`src/generate_powerbi_data.py`).
  * Automated generation of standardized CSV (`outputs/powerbi/parking_occupancy.csv`).
  * Seamlessly persists telemetry for whichever parking lot was analyzed (e.g., Lot 5 with 49 rows, Lot 26 with 67 rows).
* **Relational Schema (10 Fields):**
  `Date, Time, Parking_Lot, Slot_ID, Status, Confidence, Total_Slots, Occupied_Slots, Vacant_Slots, Occupancy_Percentage`
* **Custom DAX Measures Implemented:**
  * `Total Slots = COUNTROWS(parking_occupancy)`
  * `Occupied Slots = CALCULATE(COUNTROWS(), Status = "OCCUPIED")`
  * `Vacant Slots = CALCULATE(COUNTROWS(), Status = "VACANT")`
  * `Occupancy Rate = DIVIDE([Occupied Slots], [Total Slots], 0)`
  * `Avg Confidence = AVERAGE(parking_occupancy[Confidence])`
* **Executive Visualizations:** Donut utilization charts, slot confidence distributions, peak load KPI indicators.

### What to Explain Verbally
> "Beyond real-time web monitoring, parking management organizations require historical business intelligence for capacity planning and dynamic pricing.  
> We established a direct pipeline into Microsoft Power BI. The FastAPI backend and batch generator produce synchronized 10-field CSV records that dynamically capture the analyzed lot.  
> In Power BI, we authored formal DAX measures to compute occupancy rates and confidence metrics dynamically. This powers an executive dashboard displaying facility utilization, confidence distributions, and slot-by-slot status, bridging raw computer vision into actionable business intelligence."

### Suggested Visual / Diagram
* Screenshot / Mockup of the Power BI executive dashboard:
  * Utilization Donut Chart (e.g., 55.1% Occupied vs 44.9% Vacant).
  * Card visuals for Occupied (27) and Vacant (22).
  * Slot confidence histogram and tabular status breakdown.

---

## Slide 15: Conclusion & Future Scope

### Slide Content
* **Project Summary & Achievements:**
  * Successfully built a complete, non-intrusive smart parking system eliminating hardware sensor costs.
  * Achieved **98.80% test accuracy** with lightweight MobileNetV2 (~9.65 MB).
  * Verified end-to-end multi-image capability across all **30 dataset scenes** (**897 total slots**, 100% batch success).
  * Demonstrated **93.88% slot agreement** on Parking Lot 5 and verified dynamic scaling on Parking Lot 26.
  * Fully integrated FastAPI REST API, React web dashboard, and Microsoft Power BI reporting.
* **Limitations:**
  * System requires fixed camera geometry with pre-calibrated slot coordinates in `configs/parking_lots.json`.
  * Uncalibrated external cameras require an initial boundary definition step.
  * Single-camera perspective can suffer from distant slot occlusion and extreme weather glare.
* **Future Scope:**
  * **Dynamic Slot Localization:** Auto-detect parking slot markings via Hough line transforms or segmentation models.
  * **Multi-Camera Edge Fusion:** Deploy onto NVIDIA Jetson / Raspberry Pi with multi-angle RTSP stream stitching.
  * **Predictive Analytics:** Time-series forecasting (LSTM / Prophet) to predict parking availability hours in advance.

### What to Explain Verbally
> "In conclusion, we have designed, implemented, and verified an end-to-end Smart Parking AI solution. By combining lightweight deep learning with standard CCTV infrastructure, our system delivers 98.80% classification accuracy while eliminating the expensive hardware overhead of per-slot physical sensors. Our architecture natively supports all 30 surveillance scenes with 897 calibrated slots across diverse camera perspectives.  
> As next steps, we plan to incorporate automatic parking line detection to eliminate manual coordinate calibration, implement multi-camera edge inference on embedded devices like NVIDIA Jetson, and add time-series forecasting to predict parking vacancy before drivers even depart.  
> Thank you for your time. I am now open to your questions."

### Suggested Visual / Diagram
* Concluding summary graphic highlighting the 3 pillars: Accuracy (98.80%), Multi-Scene Generalization (30 Lots / 897 Slots), and Low Hardware Cost (Vision-Only).
* "Thank You & Q&A" closing banner.

---
*End of Presentation Content*
