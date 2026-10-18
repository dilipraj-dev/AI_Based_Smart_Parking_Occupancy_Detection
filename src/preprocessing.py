import tensorflow as tf
from pathlib import Path

from src.config import (
    TRAIN_DIR,
    VAL_DIR,
    TEST_DIR,
    IMG_SIZE,
    BATCH_SIZE,
    SEED,
)


def load_dataset(directory: Path, shuffle: bool):
    return tf.keras.utils.image_dataset_from_directory(
        directory,
        labels="inferred",
        label_mode="binary",
        class_names=["occupied", "vacant"],
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        shuffle=shuffle,
        seed=SEED,
    )


def prepare_datasets():
    train_ds = load_dataset(TRAIN_DIR, shuffle=True)
    val_ds = load_dataset(VAL_DIR, shuffle=False)
    test_ds = load_dataset(TEST_DIR, shuffle=False)

    autotune = tf.data.AUTOTUNE

    train_ds = train_ds.prefetch(autotune)
    val_ds = val_ds.prefetch(autotune)
    test_ds = test_ds.prefetch(autotune)

    return train_ds, val_ds, test_ds
