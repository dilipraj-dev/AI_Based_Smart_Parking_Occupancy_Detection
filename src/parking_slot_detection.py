"""
Full parking-lot occupancy detection.

Reads parking-space polygons from annotations.xml,
extracts each slot from the corresponding source image,
classifies each slot using the trained MobileNetV2 model,
and generates an annotated image.

Usage:
    python -m src.parking_slot_detection <image_id>

Example:
    python -m src.parking_slot_detection 5
"""

import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

import cv2
import numpy as np

from src.predict import load_model, predict_image


PROJECT_ROOT = Path(__file__).resolve().parent.parent

ARCHIVE_PATH = PROJECT_ROOT / "archive.zip"
DATASET_ROOT = PROJECT_ROOT / "dataset" / "original"

ANNOTATIONS_PATH = DATASET_ROOT / "annotations.xml"
CONFIG_PATH = PROJECT_ROOT / "configs" / "parking_lots.json"
IMAGES_DIR = DATASET_ROOT / "images"

OUTPUT_DIR = PROJECT_ROOT / "outputs" / "parking_detection"
CROPS_DIR = OUTPUT_DIR / "crops"


LABEL_MAPPING = {
    "free_parking_space": "VACANT",
    "not_free_parking_space": "OCCUPIED",
    "partially_free_parking_space": "OCCUPIED",
}


def ensure_dataset_extracted():
    """Extract the original dataset if necessary."""

    if ANNOTATIONS_PATH.exists() and IMAGES_DIR.exists():
        return

    if not ARCHIVE_PATH.exists():
        raise FileNotFoundError(
            f"Dataset archive not found: {ARCHIVE_PATH}"
        )

    print("Extracting original dataset...")

    DATASET_ROOT.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(ARCHIVE_PATH, "r") as z:
        z.extractall(DATASET_ROOT)

    print("Dataset extracted.")


def parse_points(points_string):
    """Convert CVAT polygon points into NumPy coordinates."""

    points = []

    for point in points_string.split(";"):
        x, y = point.split(",")
        points.append([float(x), float(y)])

    return np.array(points, dtype=np.float32)


def get_parking_lot_config(image_identifier, image_dimensions=None):
    """
    Resolve parking lot configuration for a given image identifier or dimensions.

    Parameters:
        image_identifier: Can be a filename (e.g., "5.png", "26.png"),
                          a stem/id (e.g., "5", 5, "26", 26),
                          or a lot id (e.g., "Parking_Lot_5", "Parking_Lot_26").
        image_dimensions: Optional tuple of (width, height) to disambiguate or fallback.

    Returns:
        dict: The parking lot configuration containing 'lot_id', 'name',
              'source_image', 'source_width', 'source_height', and 'slots'.
    """
    if not CONFIG_PATH.exists():
        return None

    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        config_data = json.load(f)

    parking_lots = config_data.get("parking_lots", {})
    images_mapping = config_data.get("images", {})

    ident_str = str(image_identifier).strip()
    ident_name = Path(ident_str).name.lower()
    ident_stem = Path(ident_str).stem.lower()

    # 1. Direct match in images_mapping (e.g. "5.png", "26.png")
    for img_name, lot_key in images_mapping.items():
        if img_name.lower() == ident_name:
            lot = parking_lots[lot_key].copy()
            lot["lot_id"] = lot_key
            return lot

    # 2. Match lot key directly (e.g. "Parking_Lot_5", "parking_lot_5")
    for lot_key, lot_val in parking_lots.items():
        if lot_key.lower() == ident_str.lower() or lot_key.lower() == f"parking_lot_{ident_stem}":
            lot = lot_val.copy()
            lot["lot_id"] = lot_key
            return lot

    # 3. Match digits in identifier (e.g. "lot_26.jpg", "image_5.png")
    digits = re.findall(r"\d+", ident_name)
    for d in digits:
        candidate_key = f"Parking_Lot_{d}"
        if candidate_key in parking_lots:
            lot = parking_lots[candidate_key].copy()
            lot["lot_id"] = candidate_key
            if image_dimensions is None or (lot["source_width"], lot["source_height"]) == tuple(image_dimensions):
                return lot

    # 4. Fallback: match by exact image dimensions if provided
    if image_dimensions:
        w, h = image_dimensions
        matching_lots = [
            (k, v) for k, v in parking_lots.items()
            if v.get("source_width") == w and v.get("source_height") == h
        ]
        if len(matching_lots) == 1:
            lot = matching_lots[0][1].copy()
            lot["lot_id"] = matching_lots[0][0]
            return lot

    return None


def get_image_annotations(source_image_id):
    """
    Get parking-space annotations for an actual source image.

    The source ID is based on the actual image filename.
    Example:
        source_image_id = 5 or "5.png"
        -> images/5.png

    The XML <image id> is NOT used because it does not
    necessarily match the actual image filename.
    """

    tree = ET.parse(ANNOTATIONS_PATH)
    root = tree.getroot()

    target_image = None
    source_stem = str(Path(str(source_image_id)).stem)

    for image in root.findall("image"):
        image_name = image.get("name")

        if not image_name:
            continue

        # Example: images/5.png -> 5
        filename_id = str(Path(image_name).stem)

        if filename_id == source_stem:
            target_image = image
            break

    if target_image is None:
        raise ValueError(
            f"No image with filename ID={source_image_id} "
            f"found in annotations.xml"
        )

    image_name = target_image.get("name")
    image_width = int(target_image.get("width"))
    image_height = int(target_image.get("height"))

    polygons = []

    for polygon in target_image.findall("polygon"):
        label = polygon.get("label")

        if label not in LABEL_MAPPING:
            continue

        points = parse_points(
            polygon.get("points")
        )

        polygons.append(
            {
                "label": label,
                "expected_status": LABEL_MAPPING[label],
                "points": points,
            }
        )

    return (
        image_name,
        image_width,
        image_height,
        polygons,
    )


def crop_polygon(image, points, xml_width, xml_height):
    """
    Create a parking-slot crop using the exact same preprocessing
    used by prepare_dataset.py.

    Steps:
    1. Scale XML coordinates to actual image dimensions.
    2. Extract the bounding rectangle.
    3. Apply a polygon mask.
    4. Return the masked crop and scaled polygon points.
    """

    actual_height, actual_width = image.shape[:2]

    scale_x = actual_width / float(xml_width)
    scale_y = actual_height / float(xml_height)

    scaled_points = points.copy()
    scaled_points[:, 0] *= scale_x
    scaled_points[:, 1] *= scale_y

    x1 = max(
        0,
        int(np.floor(scaled_points[:, 0].min()))
    )

    y1 = max(
        0,
        int(np.floor(scaled_points[:, 1].min()))
    )

    x2 = min(
        actual_width,
        int(np.ceil(scaled_points[:, 0].max())) + 1
    )

    y2 = min(
        actual_height,
        int(np.ceil(scaled_points[:, 1].max())) + 1
    )

    if x2 <= x1 or y2 <= y1:
        return None, None

    crop = image[y1:y2, x1:x2].copy()

    # Convert global polygon coordinates to crop-local coordinates.
    local_points = scaled_points.copy()
    local_points[:, 0] -= x1
    local_points[:, 1] -= y1

    # Apply exactly the same polygon mask used during training.
    mask = np.zeros(
        crop.shape[:2],
        dtype=np.uint8
    )

    cv2.fillPoly(
        mask,
        [np.round(local_points).astype(np.int32)],
        255
    )

    masked_crop = cv2.bitwise_and(
        crop,
        crop,
        mask=mask
    )

    return masked_crop, scaled_points


def save_crop(crop, path):
    """Save a crop to disk."""

    path.parent.mkdir(parents=True, exist_ok=True)

    cv2.imwrite(str(path), crop)


def draw_slot(image, points, slot_id, status, confidence):
    """Draw polygon and prediction information."""

    points_int = points.astype(np.int32)

    if status == "OCCUPIED":
        color = (0, 0, 255)
    else:
        color = (0, 255, 0)

    cv2.polylines(
        image,
        [points_int],
        isClosed=True,
        color=color,
        thickness=3,
    )

    center = np.mean(points_int, axis=0).astype(int)

    text = f"{slot_id}: {status} {confidence * 100:.1f}%"

    cv2.putText(
        image,
        text,
        tuple(center),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.45,
        color,
        1,
        cv2.LINE_AA,
    )


def process_image(image_id):
    """Process one complete parking-lot image."""

    ensure_dataset_extracted()

    (
        image_name,
        image_width,
        image_height,
        polygons,
    ) = get_image_annotations(image_id)

    image_path = DATASET_ROOT / image_name

    if not image_path.exists():
        raise FileNotFoundError(
            f"Source image not found: {image_path}"
        )

    print("\n==============================================")
    print("SMART PARKING OCCUPANCY DETECTION")
    print("==============================================")

    print(f"Image ID:       {image_id}")
    print(f"Image:          {image_name}")
    print(f"Dimensions:     {image_width} x {image_height}")
    print(f"Parking slots:  {len(polygons)}")

    image = cv2.imread(str(image_path))

    if image is None:
        raise RuntimeError(
            f"Could not read image: {image_path}"
        )

    model = load_model()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    source_name = Path(image_name).stem

    annotated_image = image.copy()

    results = []

    occupied_count = 0
    vacant_count = 0
    confidence_sum = 0.0

    for index, polygon in enumerate(polygons):

        slot_id = f"SLOT_{index + 1:03d}"

        crop, scaled_points = crop_polygon(
            image,
            polygon["points"],
            image_width,
            image_height,
        )

        if crop is None:
            print(f"{slot_id}: invalid crop")
            continue

        crop_path = (
            CROPS_DIR
            / source_name
            / f"{slot_id}.png"
        )

        save_crop(crop, crop_path)

        prediction = predict_image(
            str(crop_path),
            model=model,
        )

        status = prediction["status"]
        confidence = prediction["confidence"]

        if status == "OCCUPIED":
            occupied_count += 1
        else:
            vacant_count += 1

        confidence_sum += confidence

        draw_slot(
            annotated_image,
            scaled_points,
            slot_id,
            status,
            confidence,
        )

        results.append(
            {
                "slot_id": slot_id,
                "status": status,
                "confidence": confidence,
                "expected_status": polygon["expected_status"],
            }
        )

        print(
            f"{slot_id}: "
            f"{status:<8} "
            f"{confidence * 100:6.2f}% "
            f"(annotation: {polygon['expected_status']})"
        )

    total_slots = len(results)

    occupancy_percentage = (
        occupied_count / total_slots * 100
        if total_slots > 0
        else 0
    )

    average_confidence = (
        confidence_sum / total_slots
        if total_slots > 0
        else 0
    )

    output_image = (
        OUTPUT_DIR
        / f"{source_name}_annotated.png"
    )

    cv2.imwrite(
        str(output_image),
        annotated_image,
    )

    print("\n==============================================")
    print("PARKING SUMMARY")
    print("==============================================")

    print(f"Total slots:          {total_slots}")
    print(f"Occupied slots:       {occupied_count}")
    print(f"Vacant slots:         {vacant_count}")
    print(f"Occupancy:            {occupancy_percentage:.2f}%")
    print(
        f"Average confidence:   "
        f"{average_confidence * 100:.2f}%"
    )

    print("\nAnnotated image:")
    print(output_image)

    print("==============================================\n")



    return {
        "image_id": str(image_id),
        "image_name": image_name,
        "total_slots": total_slots,
        "occupied_slots": occupied_count,
        "vacant_slots": vacant_count,
        "occupancy_percentage": occupancy_percentage,
        "average_confidence": average_confidence,
        "output_image": str(output_image),
        "results": results,
    }

def main():

    if len(sys.argv) != 2:
        print("Usage:")
        print("  python -m src.parking_slot_detection <image_id>")
        print()
        print("Example:")
        print("  python -m src.parking_slot_detection 5")
        sys.exit(1)

    image_id = sys.argv[1]

    process_image(image_id)


if __name__ == "__main__":
    main()
