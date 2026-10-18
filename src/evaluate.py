import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay,
    f1_score,
    precision_score,
    recall_score,
)

from src.config import MODEL_PATH, OUTPUTS_DIR
from src.preprocessing import prepare_datasets


def main():
    print("Loading datasets and best model...")

    _, _, test_ds = prepare_datasets()
    model = tf.keras.models.load_model(MODEL_PATH)

    print("\nEvaluating on untouched test set...")
    results = model.evaluate(test_ds, verbose=1, return_dict=True)

    y_true = []
    y_prob = []

    for images, labels in test_ds:
        probabilities = model.predict(images, verbose=0).ravel()
        y_prob.extend(probabilities)
        y_true.extend(labels.numpy().astype(int).ravel())

    y_true = np.array(y_true)
    y_prob = np.array(y_prob)

    # Sigmoid probability >= 0.5 means class 1 = vacant.
    y_pred = (y_prob >= 0.5).astype(int)

    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)

    print("\n================ TEST RESULTS ================")
    print(f"Test loss:       {results['loss']:.4f}")
    print(f"Accuracy:        {accuracy:.4f} ({accuracy * 100:.2f}%)")
    print(f"Precision:       {precision:.4f}")
    print(f"Recall:          {recall:.4f}")
    print(f"F1-score:        {f1:.4f}")

    print("\n================ CLASSIFICATION REPORT ================")
    print(
        classification_report(
            y_true,
            y_pred,
            target_names=["occupied", "vacant"],
            digits=4,
            zero_division=0,
        )
    )

    cm = confusion_matrix(y_true, y_pred)

    print("================ CONFUSION MATRIX ================")
    print("Rows = actual, columns = predicted")
    print("             occupied  vacant")
    print(f"occupied     {cm[0,0]:8d}  {cm[0,1]:6d}")
    print(f"vacant       {cm[1,0]:8d}  {cm[1,1]:6d}")

    OUTPUTS_DIR.mkdir(exist_ok=True)

    metrics = {
        "test_loss": float(results["loss"]),
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "test_samples": int(len(y_true)),
        "confusion_matrix": cm.tolist(),
    }

    metrics_path = OUTPUTS_DIR / "test_metrics.json"
    metrics_path.write_text(
        json.dumps(metrics, indent=2),
        encoding="utf-8",
    )

    # Confusion matrix figure.
    fig, ax = plt.subplots(figsize=(6, 6))
    display = ConfusionMatrixDisplay(
        confusion_matrix=cm,
        display_labels=["Occupied", "Vacant"],
    )
    display.plot(ax=ax, values_format="d")
    ax.set_title("Parking Occupancy - Test Confusion Matrix")
    fig.tight_layout()
    fig.savefig(
        OUTPUTS_DIR / "confusion_matrix.png",
        dpi=200,
        bbox_inches="tight",
    )
    plt.close(fig)

    # Training curves, if the training history exists.
    history_path = MODEL_PATH.with_name("training_history.json")

    if history_path.exists():
        history = json.loads(history_path.read_text(encoding="utf-8"))

        if "accuracy" in history and "val_accuracy" in history:
            fig, ax = plt.subplots(figsize=(8, 5))
            ax.plot(history["accuracy"], label="Training Accuracy")
            ax.plot(history["val_accuracy"], label="Validation Accuracy")
            ax.set_title("Training vs Validation Accuracy")
            ax.set_xlabel("Epoch")
            ax.set_ylabel("Accuracy")
            ax.legend()
            ax.grid(True, alpha=0.3)
            fig.tight_layout()
            fig.savefig(
                OUTPUTS_DIR / "accuracy_curve.png",
                dpi=200,
                bbox_inches="tight",
            )
            plt.close(fig)

        if "loss" in history and "val_loss" in history:
            fig, ax = plt.subplots(figsize=(8, 5))
            ax.plot(history["loss"], label="Training Loss")
            ax.plot(history["val_loss"], label="Validation Loss")
            ax.set_title("Training vs Validation Loss")
            ax.set_xlabel("Epoch")
            ax.set_ylabel("Loss")
            ax.legend()
            ax.grid(True, alpha=0.3)
            fig.tight_layout()
            fig.savefig(
                OUTPUTS_DIR / "loss_curve.png",
                dpi=200,
                bbox_inches="tight",
            )
            plt.close(fig)

    print("\nSaved:")
    print(f"  Metrics:           {metrics_path}")
    print(f"  Confusion matrix:  {OUTPUTS_DIR / 'confusion_matrix.png'}")
    print(f"  Accuracy curve:    {OUTPUTS_DIR / 'accuracy_curve.png'}")
    print(f"  Loss curve:        {OUTPUTS_DIR / 'loss_curve.png'}")


if __name__ == "__main__":
    main()
