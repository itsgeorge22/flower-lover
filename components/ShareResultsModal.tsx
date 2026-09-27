"use client";

import { Download, LoaderCircle, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ShareResultsModal.module.css";

type ShareResultsModalProps = {
  pdfBlob: Blob;
  pdfUrl: string;
  imageUrl: string;
  shareText: string;
  onClose: () => void;
  onNotify: (type: "success" | "error", message: string) => void;
};

const CLOSE_DURATION = 220;
const FILE_NAME = "flower-lover-results.pdf";

export function ShareResultsModal({
  pdfBlob,
  pdfUrl,
  imageUrl,
  shareText,
  onClose,
  onNotify,
}: ShareResultsModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closingRef = useRef(false);

  const closeModal = useCallback(() => {
    if (closingRef.current) {
      return;
    }

    closingRef.current = true;
    setIsClosing(true);
    window.setTimeout(onClose, CLOSE_DURATION);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeModal]);

  const downloadPdf = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = FILE_NAME;
    document.body.append(link);
    link.click();
    link.remove();
  };

  const handleDownload = () => {
    downloadPdf();
    onNotify("success", "Скачивание PDF началось");
  };

  const handleShare = async () => {
    if (isSharing) {
      return;
    }

    setIsSharing(true);
    const file = new File([pdfBlob], FILE_NAME, { type: "application/pdf" });

    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Мои цветочные предпочтения",
          text: shareText,
          files: [file],
        });
        onNotify("success", "Результат отправлен");
        return;
      }

      downloadPdf();
      onNotify("success", "PDF скачивается — прикрепи его к сообщению");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      onNotify("error", "Не удалось отправить PDF — скачай файл и прикрепи к сообщению");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div
      className={`${styles.backdrop} ${isClosing ? styles.backdropClosing : ""}`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
    >
      <section
        className={`${styles.modal} ${isClosing ? styles.modalClosing : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-results-title"
      >
        <header className={styles.header}>
          <div>
            <h2 id="share-results-title" className={styles.title}>
              Поделись результатом
            </h2>
            <p className={styles.description}>PDF с полным списком цветов готов</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            aria-label="Закрыть"
            onClick={closeModal}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.preview}>
          {/* The original image remains the preview; the actions share the complete PDF. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.previewImage}
            src={imageUrl}
            alt="Карточка с результатами выбора цветов"
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.primaryButton}`}
            disabled={isSharing}
            onClick={handleShare}
          >
            <span>{isSharing ? "Открываем…" : "Отправить с любовью"}</span>
            {isSharing ? (
              <LoaderCircle className={styles.loadingIcon} size={18} aria-hidden="true" />
            ) : (
              <Send size={18} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.secondaryButton}`}
            onClick={handleDownload}
          >
            <span>Скачать PDF-файл</span>
            <Download size={18} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}
