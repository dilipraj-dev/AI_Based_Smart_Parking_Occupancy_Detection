"""
Smart Parking AI - FastAPI Backend

Accepts an image from the configured Parking Lot 5 camera,
classifies each configured parking slot using the trained
MobileNetV2 model, and returns structured occupancy results.
"""

import json
import shutil
import uuid
from pathlib import Path

import cv2
import csv
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.generate_powerbi_data import format_powerbi_records, save_powerbi_csv
from src.parking_slot_detection import crop_polygon, get_parking_lot_config
from src.predict import load_model, predict_image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = PROJECT_ROOT / "configs" / "parking_lots.json"
UPLOAD_DIR = PROJECT_ROOT / "outputs" / "api_uploads"
POWERBI_DIR = PROJECT_ROOT / "outputs" / "powerbi"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
POWERBI_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="Smart Parking AI",
    description="AI-based parking occupancy detection API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    "/api-files",
    StaticFiles(directory=str(UPLOAD_DIR)),
    name="api-files",
)

app.mount(
    "/powerbi-files",
    StaticFiles(directory=str(POWERBI_DIR)),
    name="powerbi-files",
)

MODEL = None
PARKING_CONFIG = None


@app.on_event("startup")
def startup_event():
    global MODEL, PARKING_CONFIG

    print("Loading parking configuration...")
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        PARKING_CONFIG = json.load(f)

    print("Loading parking occupancy model...")
    MODEL = load_model()
    print("Parking occupancy model loaded.")


@app.get("/")
def root():
    return {
        "name": "Smart Parking AI",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": MODEL is not None,
        "configuration_loaded": PARKING_CONFIG is not None,
    }


@app.get("/powerbi/data")
def get_powerbi_data():
    """Return the current Power BI occupancy records."""
    csv_path = POWERBI_DIR / "parking_occupancy.csv"
    if not csv_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Power BI dataset not generated yet. Run analysis first.",
        )
    records = []
    with csv_path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(row)
    current_lot = records[0]["Parking_Lot"] if records else "Parking_Lot_5"
    return {
        "status": "success",
        "parking_lot": current_lot,
        "records_count": len(records),
        "records": records,
    }


def polygon_crop(image, polygon):
    """
    Crop a parking-space polygon from the uploaded image.

    Pixels outside the polygon are masked to black.
    """
    points = np.array(polygon, dtype=np.int32)

    x, y, w, h = cv2.boundingRect(points)

    x2 = min(x + w, image.shape[1])
    y2 = min(y + h, image.shape[0])

    x = max(x, 0)
    y = max(y, 0)

    crop = image[y:y2, x:x2].copy()

    if crop.size == 0:
        return None

    local_points = points.copy()
    local_points[:, 0] -= x
    local_points[:, 1] -= y

    mask = np.zeros(crop.shape[:2], dtype=np.uint8)
    cv2.fillPoly(mask, [local_points], 255)

    result = np.zeros_like(crop)
    result[mask == 255] = crop[mask == 255]

    return result


def draw_slot(image, polygon, slot_id, status, confidence):
    points = np.array(polygon, dtype=np.int32)

    if status == "OCCUPIED":
        color = (0, 0, 255)
    else:
        color = (0, 200, 0)

    cv2.polylines(
        image,
        [points],
        isClosed=True,
        color=color,
        thickness=2,
    )

    x, y, _, _ = cv2.boundingRect(points)

    label = f"{slot_id} {status} {confidence:.1f}%"

    x2 = min(image.shape[1] - 1, x + 180)
    cv2.rectangle(
        image,
        (x, max(0, y - 22)),
        (x2, y),
        color,
        -1,
    )

    cv2.putText(
        image,
        label,
        (x + 3, max(15, y - 6)),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.38,
        (255, 255, 255),
        1,
        cv2.LINE_AA,
    )


@app.post("/analyze")
async def analyze_parking(
    file: UploadFile = File(...)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload an image file.",
        )

    if MODEL is None or PARKING_CONFIG is None:
        raise HTTPException(
            status_code=503,
            detail="AI model or parking configuration is not loaded.",
        )

    upload_id = uuid.uuid4().hex
    upload_dir = UPLOAD_DIR / upload_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    original_path = upload_dir / file.filename
    annotated_path = upload_dir / "annotated_result.jpg"

    try:
        with original_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        image = cv2.imread(str(original_path))

        if image is None:
            raise HTTPException(
                status_code=400,
                detail="The uploaded image could not be read.",
            )

        height, width = image.shape[:2]

        lot = get_parking_lot_config(file.filename, (width, height))
        if lot is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unsupported parking lot image '{file.filename}' ({width}x{height} pixels). "
                    f"No matching parking-slot geometry configuration was found. "
                    f"Please upload a supported dataset camera image (e.g. 5.png, 26.png)."
                ),
            )

        lot_id = lot.get("lot_id", "Parking_Lot_5")
        lot_name = lot.get("name", lot_id)
        slots = lot["slots"]
        expected_width = lot["source_width"]
        expected_height = lot["source_height"]

        if width != expected_width or height != expected_height:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"The image '{file.filename}' was resolved as {lot_name}, which requires "
                    f"{expected_width}x{expected_height} pixels. Received {width}x{height} pixels."
                ),
            )

        annotated = image.copy()
        results = []

        for slot in slots:
            points = np.array(slot["polygon"], dtype=np.float32)
            crop, _ = crop_polygon(
                image,
                points,
                expected_width,
                expected_height,
            )

            if crop is None:
                continue

            crop_path = upload_dir / f"{slot['slot_id']}.png"
            cv2.imwrite(str(crop_path), crop)

            prediction = predict_image(
                str(crop_path),
                model=MODEL,
            )

            status = prediction["status"]
            confidence = float(prediction["confidence"])

            results.append(
                {
                    "slot_id": slot["slot_id"],
                    "status": status,
                    "confidence": round(confidence, 4),
                    "coordinates": slot["polygon"],
                    "annotation_status": slot.get("annotation_status"),
                }
            )

            draw_slot(
                annotated,
                slot["polygon"],
                slot["slot_id"],
                status,
                confidence,
            )

        total_slots = len(results)
        occupied_slots = sum(
            1 for result in results
            if result["status"] == "OCCUPIED"
        )
        vacant_slots = total_slots - occupied_slots

        occupancy_percentage = (
            (occupied_slots / total_slots) * 100
            if total_slots
            else 0
        )

        average_confidence = (
            sum(result["confidence"] for result in results)
            / total_slots
            if total_slots
            else 0
        )

        cv2.imwrite(str(annotated_path), annotated)

        # Generate real Power BI records and update outputs/powerbi/parking_occupancy.csv
        powerbi_records = format_powerbi_records(
            parking_lot=lot_id,
            total_slots=total_slots,
            occupied_slots=occupied_slots,
            vacant_slots=vacant_slots,
            occupancy_percentage=occupancy_percentage,
            slot_results=results,
        )
        save_powerbi_csv(powerbi_records)

        return {
            "parking_lot": lot_id,
            "parking_lot_name": lot_name,
            "image_size": {
                "width": width,
                "height": height,
            },
            "total_slots": total_slots,
            "occupied_slots": occupied_slots,
            "vacant_slots": vacant_slots,
            "occupancy_percentage": round(
                occupancy_percentage,
                2,
            ),
            "average_confidence": round(
                average_confidence,
                4,
            ),
            "annotated_image_url": (
                f"/api-files/{upload_id}/annotated_result.jpg"
            ),
            "slots": results,
            "powerbi_records": powerbi_records,
            "powerbi_csv_url": "/powerbi-files/parking_occupancy.csv",
        }

    finally:
        file.file.close()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
