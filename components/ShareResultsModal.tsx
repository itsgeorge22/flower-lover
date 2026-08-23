"use client";

import { Copy, Download, LoaderCircle, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ShareResultsModal.module.css";

type ShareResultsModalProps = {
  imageUrl: string;
  shareText: string;
  onClose: () => void;
  onNotify: (type: "success" | "error", message: string) => void;
};

const CLOSE_DURATION = 220;
const FILE_NAME = "flower-lover-results.png";

export function ShareResultsModal({
  imageUrl,
  shareText,
  onClose,
  onNotify,
}: ShareResultsModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
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

  const downloadImage = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = FILE_NAME;
    document.body.append(link);
    link.click();
    link.remove();
  };

  const handleDownload = () => {
    downloadImage();
    onNotify("success", "Карточка сохранена");
  };

  const handleCopy = async () => {
    if (isCopying) {
      return;
    }

    setIsCopying(true);

    try {
      await navigator.clipboard.writeText(shareText);
      onNotify("success", "Список цветов скопирован");
    } catch {
      onNotify("error", "Не удалось скопировать список");
    } finally {
      setIsCopying(false);
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
            <p className={styles.description}>Красивая карточка уже готова</p>
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
          {/* Blob URLs are generated locally and do not benefit from Next Image optimization. */}
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
            disabled={isCopying}
            onClick={handleCopy}
          >
            <span>{isCopying ? "Копируем…" : "Скопировать список"}</span>
            {isCopying ? (
              <LoaderCircle className={styles.loadingIcon} size={18} aria-hidden="true" />
            ) : (
              <Copy size={18} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.secondaryButton}`}
            onClick={handleDownload}
          >
            <span>Скачать изображение</span>
            <Download size={18} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}
