import { useId, type ReactNode } from "react";
import styles from "./ConfirmationModal.module.css";

type ConfirmationModalProps = {
  icon: ReactNode;
  title: string;
  description: string;
  cancelLabel?: string;
  confirmLabel: string;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmationModal({
  icon,
  title,
  description,
  cancelLabel = "Cancelar",
  confirmLabel,
  isConfirming = false,
  onCancel,
  onConfirm,
}: ConfirmationModalProps) {
  const titleId = useId();

  function handleOverlayClick() {
    if (!isConfirming) {
      onCancel();
    }
  }

  return (
    <div
      className={styles.modalOverlay}
      role="presentation"
      onClick={handleOverlayClick}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <span className={styles.modalIcon} aria-hidden="true">
          {icon}
        </span>
        <h2 id={titleId}>{title}</h2>
        <p>{description}</p>

        <div className={styles.modalActions}>
          <button
            className={styles.modalCancel}
            type="button"
            disabled={isConfirming}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={styles.modalConfirm}
            type="button"
            disabled={isConfirming}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
