#!/usr/bin/env python3
"""
Prepare the Kaggle Parking Space Detection & Classification dataset.

IMPORTANT:
- The XML annotation `id` is NOT the image filename.
- The real image filename is stored in XML as `name`, e.g. id="2" -> images/10.png.
- We therefore always use the XML `name` field.
- Train/validation/test are split by SOURCE IMAGE to avoid leakage.
- free_parking_space -> vacant
- not_free_parking_space -> occupied
- partially_free_parking_space -> occupied
"""

import argparse
import csv
import shutil
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

import cv2
import numpy as np


# Source-image split. These are the ACTUAL image filenames, not XML annotation IDs.
TRAIN_IDS = {
    0, 1, 2, 3, 6, 8, 9, 10, 11, 12, 13,
    15, 17, 18, 20, 21, 22, 24, 25, 26, 27
}
VAL_IDS = {4, 14, 19, 28}
TEST_IDS = {5, 29, 30, 31, 32}

LABEL_MAP = {
    "free_parking_space": "vacant",
    "not_free_parking_space": "occupied",
    "partially_free_parking_space": "occupied",
}


def parse_points(points_text):
    points = []
    for pair in points_text.split(";"):
        x, y = pair.split(",")
        points.append((float(x), float(y)))
    return np.array(points, dtype=np.float32)


def crop_polygon(image, points, xml_width, xml_height):
    """Scale annotation coordinates to the actual image dimensions."""
    actual_height, actual_width = image.shape[:2]

    scale_x = actual_width / float(xml_width)
    scale_y = actual_height / float(xml_height)

    points = points.copy()
    points[:, 0] *= scale_x
    points[:, 1] *= scale_y

    x1 = max(0, int(np.floor(points[:, 0].min())))
    y1 = max(0, int(np.floor(points[:, 1].min())))
    x2 = min(actual_width, int(np.ceil(points[:, 0].max())) + 1)
    y2 = min(actual_height, int(np.ceil(points[:, 1].max())) + 1)

    if x2 <= x1 or y2 <= y1:
        return None, None

    crop = image[y1:y2, x1:x2].copy()

    local_points = points.copy()
    local_points[:, 0] -= x1
    local_points[:, 1] -= y1

    mask = np.zeros(crop.shape[:2], dtype=np.uint8)
    cv2.fillPoly(mask, [np.round(local_points).astype(np.int32)], 255)

    return cv2.bitwise_and(crop, crop, mask=mask), (x1, y1, x2, y2)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--zip", default="archive.zip")
    parser.add_argument("--output", default="dataset")
    args = parser.parse_args()

    zip_path = Path(args.zip).resolve()
    output_dir = Path(args.output).resolve()

    if not zip_path.exists():
        raise FileNotFoundError(f"ZIP not found: {zip_path}")

    if TRAIN_IDS & VAL_IDS or TRAIN_IDS & TEST_IDS or VAL_IDS & TEST_IDS:
        raise RuntimeError("Source-image split overlap detected.")

    for split in ("train", "validation", "test"):
        for cls in ("occupied", "vacant"):
            folder = output_dir / split / cls
            folder.mkdir(parents=True, exist_ok=True)
            for old_file in folder.glob("*.png"):
                old_file.unlink()

    temp_dir = output_dir.parent / "_parking_dataset_extracted"
    if temp_dir.exists():
        shutil.rmtree(temp_dir)

    temp_dir.mkdir(parents=True)

    print(f"Extracting: {zip_path}")
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(temp_dir)

    annotations_path = temp_dir / "annotations.xml"
    images_dir = temp_dir / "images"

    if not annotations_path.exists():
        raise FileNotFoundError("annotations.xml not found in archive.")
    if not images_dir.exists():
        raise FileNotFoundError("images/ not found in archive.")

    root = ET.parse(annotations_path).getroot()

    metadata_rows = []
    missing_images = []
    invalid_crops = []
    counts = {
        "train": Counter(),
        "validation": Counter(),
        "test": Counter(),
    }

    source_counts = {
        "train": set(),
        "validation": set(),
        "test": set(),
    }

    for image_node in root.findall("image"):
        # CRITICAL: use `name`, not XML annotation `id`.
        image_name = image_node.attrib["name"]
        image_id = int(Path(image_name).stem)

        if image_id in TRAIN_IDS:
            split = "train"
        elif image_id in VAL_IDS:
            split = "validation"
        elif image_id in TEST_IDS:
            split = "test"
        else:
            continue

        image_path = temp_dir / image_name

        if not image_path.exists():
            missing_images.append(image_id)
            continue

        image = cv2.imread(str(image_path))
        if image is None:
            missing_images.append(image_id)
            continue

        source_counts[split].add(image_id)

        xml_width = int(image_node.attrib["width"])
        xml_height = int(image_node.attrib["height"])

        slot_index = 0

        for polygon in image_node.findall("polygon"):
            source_label = polygon.attrib["label"]

            if source_label not in LABEL_MAP:
                continue

            status = LABEL_MAP[source_label]

            try:
                points = parse_points(polygon.attrib["points"])
                crop, bbox = crop_polygon(
                    image, points, xml_width, xml_height
                )
            except Exception as exc:
                invalid_crops.append((image_id, slot_index, str(exc)))
                slot_index += 1
                continue

            if crop is None or crop.size == 0:
                invalid_crops.append((image_id, slot_index, "empty crop"))
                slot_index += 1
                continue

            if crop.shape[0] < 10 or crop.shape[1] < 10:
                invalid_crops.append(
                    (image_id, slot_index, "crop smaller than 10 pixels")
                )
                slot_index += 1
                continue

            filename = f"source_{image_id:02d}_slot_{slot_index:03d}.png"
            destination = output_dir / split / status / filename

            if not cv2.imwrite(str(destination), crop):
                raise RuntimeError(f"Could not write {destination}")

            x1, y1, x2, y2 = bbox

            metadata_rows.append({
                "split": split,
                "source_image_id": image_id,
                "slot_id": f"{image_id}_{slot_index}",
                "source_label": source_label,
                "status": status,
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2,
                "crop_width": int(crop.shape[1]),
                "crop_height": int(crop.shape[0]),
                "filename": str(
                    destination.relative_to(output_dir)
                ).replace("\\", "/"),
            })

            counts[split][status] += 1
            slot_index += 1

    with (output_dir / "metadata.csv").open(
        "w", newline="", encoding="utf-8"
    ) as f:
        fields = [
            "split", "source_image_id", "slot_id", "source_label",
            "status", "x1", "y1", "x2", "y2",
            "crop_width", "crop_height", "filename"
        ]
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(metadata_rows)

    with (output_dir / "split_summary.csv").open(
        "w", newline="", encoding="utf-8"
    ) as f:
        writer = csv.writer(f)
        writer.writerow(["split", "vacant", "occupied", "total"])
        for split in ("train", "validation", "test"):
            v = counts[split]["vacant"]
            o = counts[split]["occupied"]
            writer.writerow([split, v, o, v + o])

    shutil.rmtree(temp_dir)

    print("\nDataset preparation complete.")
    print("\nSource images:")
    for split in ("train", "validation", "test"):
        print(
            f"  {split:10s}: {len(source_counts[split])} source images "
            f"{sorted(source_counts[split])}"
        )

    print("\nClass counts:")
    for split in ("train", "validation", "test"):
        v = counts[split]["vacant"]
        o = counts[split]["occupied"]
        print(
            f"  {split:10s}: vacant={v:3d}, "
            f"occupied={o:3d}, total={v + o:3d}"
        )

    print(f"\nMetadata: {output_dir / 'metadata.csv'}")
    print(f"Summary:  {output_dir / 'split_summary.csv'}")

    if missing_images:
        print("\nMissing source images:", sorted(set(missing_images)))

    if invalid_crops:
        print(f"Invalid/empty crops skipped: {len(invalid_crops)}")

    print("\nLabel mapping:")
    print("  free_parking_space        -> vacant")
    print("  not_free_parking_space   -> occupied")
    print("  partially_free_parking_space -> occupied")


if __name__ == "__main__":
    main()
