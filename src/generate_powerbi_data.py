"""
Generate real parking occupancy data for Power BI.

Usage:
    python -m src.generate_powerbi_data <image_id>

Example:
    python -m src.generate_powerbi_data 5
"""

import csv
import sys
from datetime import datetime
from pathlib import Path

from src.parking_slot_detection import process_image


PROJECT_ROOT = Path(__file__).resolve().parent.parent

OUTPUT_DIR = PROJECT_ROOT / "outputs" / "powerbi"
CSV_PATH = OUTPUT_DIR / "parking_occupancy.csv"

FIELDNAMES = [
    "Date",
    "Time",
    "Parking_Lot",
    "Slot_ID",
    "Status",
    "Confidence",
    "Total_Slots",
    "Occupied_Slots",
    "Vacant_Slots",
    "Occupancy_Percentage",
]


def format_powerbi_records(
    parking_lot,
    total_slots,
    occupied_slots,
    vacant_slots,
    occupancy_percentage,
    slot_results,
    timestamp=None,
):
    """
    Format real AI detection results into Power BI-compatible records.
    """
    if timestamp is None:
        timestamp = datetime.now()

    date_value = timestamp.strftime("%Y-%m-%d")
    time_value = timestamp.strftime("%H:%M:%S")

    records = []
    for result in slot_results:
        raw_conf = result["confidence"]
        # Standardize confidence to percentage (0.00 - 100.00)
        conf_pct = (
            round(raw_conf * 100, 2)
            if raw_conf <= 1.0
            else round(raw_conf, 2)
        )

        records.append(
            {
                "Date": date_value,
                "Time": time_value,
                "Parking_Lot": str(parking_lot),
                "Slot_ID": result["slot_id"],
                "Status": result["status"],
                "Confidence": conf_pct,
                "Total_Slots": int(total_slots),
                "Occupied_Slots": int(occupied_slots),
                "Vacant_Slots": int(vacant_slots),
                "Occupancy_Percentage": round(float(occupancy_percentage), 2),
            }
        )

    return records


def save_powerbi_csv(records, output_path=CSV_PATH):
    """
    Write Power BI-compatible records to CSV.
    """
    target = Path(output_path)
    target.parent.mkdir(parents=True, exist_ok=True)

    with target.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(records)

    return target


def generate_powerbi_data(image_id):
    """Run the real AI detector and convert its results to CSV."""

    print("\nRunning parking occupancy detection...")

    detection = process_image(image_id)

    results = detection["results"]

    if not results:
        raise RuntimeError("No parking-slot predictions were generated.")

    parking_lot = f"Parking_Lot_{image_id}"

    total_slots = detection["total_slots"]
    occupied_slots = detection["occupied_slots"]
    vacant_slots = detection["vacant_slots"]
    occupancy_percentage = detection["occupancy_percentage"]

    records = format_powerbi_records(
        parking_lot=parking_lot,
        total_slots=total_slots,
        occupied_slots=occupied_slots,
        vacant_slots=vacant_slots,
        occupancy_percentage=occupancy_percentage,
        slot_results=results,
    )

    save_powerbi_csv(records, CSV_PATH)

    print("\n==============================================")
    print("POWER BI DATA GENERATED")
    print("==============================================")
    print(f"CSV file:             {CSV_PATH}")
    print(f"Rows generated:       {len(records)}")
    print(f"Total slots:          {total_slots}")
    print(f"Occupied slots:       {occupied_slots}")
    print(f"Vacant slots:         {vacant_slots}")
    print(
        f"Occupancy:            "
        f"{occupancy_percentage:.2f}%"
    )
    print("==============================================\n")

    return CSV_PATH


def main():

    if len(sys.argv) != 2:
        print("Usage:")
        print(
            "  python -m src.generate_powerbi_data <image_id>"
        )
        print()
        print("Example:")
        print(
            "  python -m src.generate_powerbi_data 5"
        )
        sys.exit(1)

    image_id = sys.argv[1]

    generate_powerbi_data(image_id)


if __name__ == "__main__":
    main()
