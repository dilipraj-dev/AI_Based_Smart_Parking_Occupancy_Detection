import json
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.utils.class_weight import compute_class_weight

from src.config import TRAIN_DIR, VAL_DIR, IMG_SIZE, MODEL_PATH, INITIAL_EPOCHS
from src.preprocessing import prepare_datasets


def count_images():
    occupied = len(list((TRAIN_DIR / "occupied").glob("*.png")))
    vacant = len(list((TRAIN_DIR / "vacant").glob("*.png")))
    return {"occupied": occupied, "vacant": vacant}


def get_class_weights():
    counts = count_images()
    y = np.array([0] * counts["occupied"] + [1] * counts["vacant"])

    weights = compute_class_weight(
        class_weight="balanced",
        classes=np.array([0, 1]),
        y=y,
    )

    return {0: float(weights[0]), 1: float(weights[1])}


def build_model():
    data_augmentation = tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.05),
            tf.keras.layers.RandomZoom(0.10),
            tf.keras.layers.RandomContrast(0.10),
        ],
        name="data_augmentation",
    )

    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(*IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )

    base_model.trainable = False

    inputs = tf.keras.Input(
        shape=(*IMG_SIZE, 3),
        name="parking_space_image",
    )

    x = data_augmentation(inputs)
    x = tf.keras.applications.mobilenet_v2.preprocess_input(x)
    x = base_model(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.30)(x)

    outputs = tf.keras.layers.Dense(
        1,
        activation="sigmoid",
        name="occupancy_probability",
    )(x)

    model = tf.keras.Model(
        inputs,
        outputs,
        name="ParkingMobileNetV2",
    )

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="binary_crossentropy",
        metrics=[
            tf.keras.metrics.BinaryAccuracy(name="accuracy"),
            tf.keras.metrics.Precision(name="precision"),
            tf.keras.metrics.Recall(name="recall"),
        ],
    )

    return model


def main():
    print("TensorFlow:", tf.__version__)
    print("GPUs:", tf.config.list_physical_devices("GPU"))

    train_ds, val_ds, _ = prepare_datasets()

    print("\nClass order:")
    print("  0 = occupied")
    print("  1 = vacant")

    counts = count_images()
    class_weights = get_class_weights()

    print("\nTraining image counts:")
    print("  occupied:", counts["occupied"])
    print("  vacant:  ", counts["vacant"])

    print("\nClass weights:")
    print("  occupied:", class_weights[0])
    print("  vacant:  ", class_weights[1])

    model = build_model()
    model.summary()

    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            filepath=MODEL_PATH,
            monitor="val_loss",
            save_best_only=True,
            verbose=1,
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=4,
            restore_best_weights=True,
            verbose=1,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.3,
            patience=2,
            min_lr=1e-6,
            verbose=1,
        ),
    ]

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=INITIAL_EPOCHS,
        class_weight=class_weights,
        callbacks=callbacks,
    )

    history_path = Path(MODEL_PATH).with_name("training_history.json")
    history_path.write_text(
        json.dumps(
            {
                k: [float(v) for v in values]
                for k, values in history.history.items()
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print("\nTraining complete.")
    print("Best model:", MODEL_PATH)
    print("History:", history_path)


if __name__ == "__main__":
    main()
