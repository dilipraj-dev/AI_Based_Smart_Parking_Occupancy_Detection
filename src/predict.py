"""
Single parking-space occupancy prediction.

Usage:
    python -m src.predict <image_path>

Example:
    python -m src.predict dataset/test/occupied/some_image.jpg
"""

import sys
from pathlib import Path

import numpy as np
import tensorflow as tf

from src.config import IMG_SIZE, MODEL_PATH, CLASS_NAMES


def load_model():
    """Load the trained MobileNetV2 parking occupancy model."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found: {MODEL_PATH}\n"
            "Train the model first."
        )

    return tf.keras.models.load_model(MODEL_PATH)


def predict_image(image_path: str, model=None):
    """
    Predict parking-space occupancy for a single image.

    Returns:
        dict containing status, confidence and probabilities.
    """

    image_path = Path(image_path)

    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    if model is None:
        model = load_model()

    # Load and resize image
    image = tf.keras.utils.load_img(
        image_path,
        target_size=IMG_SIZE
    )

    image_array = tf.keras.utils.img_to_array(image)

    # Add batch dimension
    image_array = np.expand_dims(image_array, axis=0)

    # The trained model already contains MobileNetV2 preprocessing.
    # Do not preprocess the image a second time.

    # Model prediction
    prediction = model.predict(image_array, verbose=0)[0][0]

    # Class order:
    # 0 = occupied
    # 1 = vacant
    #
    # Sigmoid output represents probability of class 1 = vacant.
    vacant_probability = float(prediction)
    occupied_probability = 1.0 - vacant_probability

    if vacant_probability >= 0.5:
        status = "VACANT"
        confidence = vacant_probability
    else:
        status = "OCCUPIED"
        confidence = occupied_probability

    return {
        "status": status,
        "confidence": confidence,
        "occupied_probability": occupied_probability,
        "vacant_probability": vacant_probability,
    }


def main():
    if len(sys.argv) != 2:
        print("Usage:")
        print("  python -m src.predict <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]

    print(f"\nAnalyzing: {image_path}")

    result = predict_image(image_path)

    print("\n================ PREDICTION ================")
    print(f"Status:              {result['status']}")
    print(f"Confidence:          {result['confidence'] * 100:.2f}%")
    print(
        f"Occupied probability: "
        f"{result['occupied_probability'] * 100:.2f}%"
    )
    print(
        f"Vacant probability:   "
        f"{result['vacant_probability'] * 100:.2f}%"
    )
    print("=============================================\n")


if __name__ == "__main__":
    main()
