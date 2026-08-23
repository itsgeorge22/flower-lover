"use client";

import Image from "next/image";
import { Check, ChevronLeft, ChevronRight, RefreshCw, Share2, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { flowerRoles, flowerSeasonalities } from "../data/flower-taxonomy";
import type { Flower, FlowerRoleId, FlowerSeasonalityId } from "../types/flower";
import styles from "./FlowerRatingScreen.module.css";

type Rating = "dislike" | "neutral" | "like";
type Answer = Rating | "skipped";
type SavedAnswers = Record<string, Answer>;
type PageExit = "survey" | "results";
type TransitionDirection = "forward" | "backward";
type FlowerInfoModalDetails = {
  category: "Роль цветка" | "Сезонность";
  emoji: string;
  name: string;
  description: string;
};
type FlowerImageModalDetails = {
  src: string;
  alt: string;
  flowerName: string;
  origin: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
};

const STORAGE_KEY = "flower-lover-answers";
const COMPLETION_LOADER_DURATION = 3300;
const PAGE_EXIT_DURATION = 420;
const flowerLoaderEmojis = ["🌸", "🌻", "🌷"];

const roleEmojis: Record<FlowerRoleId, string> = {
  primary: "👑",
  companion: "🤝",
  filler: "☁️",
  accent: "✨",
};

const seasonalityEmojis: Record<FlowerSeasonalityId, string> = {
  "year-round": "♾️",
  spring: "🌱",
  summer: "☀️",
  autumn: "🍂",
  winter: "❄️",
};

const answerLabels: Record<Answer, string> = {
  dislike: "Не хочу",
  neutral: "Иногда",
  like: "Хочу",
  skipped: "Пропущено",
};

type FlowerRatingScreenProps = {
  flowers: readonly Flower[];
};

const ratingOptions: Array<{
  value: Rating;
  label: string;
  icon: string;
  filterColor: string;
}> = [
  {
    value: "dislike",
    label: "Не хочу",
    icon: "☹️",
    filterColor: "rgba(90, 64, 157, 0.32)",
  },
  {
    value: "neutral",
    label: "Иногда",
    icon: "😐",
    filterColor: "rgba(211, 105, 0, 0.32)",
  },
  {
    value: "like",
    label: "Хочу",
    icon: "😍",
    filterColor: "rgba(255, 64, 128, 0.32)",
  },
];

function Progress({
  current,
  total,
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
}: {
  current: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled: boolean;
  nextDisabled: boolean;
}) {
  const progress = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;

  return (
    <header className={styles.progressSection}>
      <button
        type="button"
        className={styles.progressButton}
        aria-label="Предыдущий цветок"
        disabled={previousDisabled}
        onClick={onPrevious}
      >
        <ChevronLeft size={24} strokeWidth={2} aria-hidden="true" />
      </button>
      <div className={styles.progressContent}>
        <span className={styles.progressLabel}>
          {current} из {total}
        </span>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={current}
          aria-label={`Прогресс: ${current} из ${total}`}
        >
          <span className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </div>
      <button
        type="button"
        className={styles.progressButton}
        aria-label="Следующий цветок"
        disabled={nextDisabled}
        onClick={onNext}
      >
        <ChevronRight size={24} strokeWidth={2} aria-hidden="true" />
      </button>
    </header>
  );
}

function FlowerInfoModal({
  details,
  onClose,
}: {
  details: FlowerInfoModalDetails;
  onClose: () => void;
}) {
  const actionButtonRef = useRef<HTMLButtonElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const requestClose = useCallback(() => setIsClosing(true), []);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    actionButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
      }

      if (event.key === "Tab") {
        event.preventDefault();
        actionButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocused?.focus();
    };
  }, [requestClose]);

  return (
    <div
      className={`${styles.infoModalBackdrop} ${
        isClosing ? styles.infoModalBackdropClosing : ""
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          requestClose();
        }
      }}
    >
      <section
        className={`${styles.infoModal} ${isClosing ? styles.infoModalClosing : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="flower-info-modal-title"
        aria-describedby="flower-info-modal-description"
        onAnimationEnd={(event) => {
          if (isClosing && event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <span className={styles.infoModalEmoji} aria-hidden="true">
          {details.emoji}
        </span>
        <div className={styles.infoModalCopy}>
          <p className={styles.infoModalCategory}>{details.category}</p>
          <h2 className={styles.infoModalTitle} id="flower-info-modal-title">
            {details.name}
          </h2>
          <p className={styles.infoModalDescription} id="flower-info-modal-description">
            {details.description}
          </p>
        </div>
        <button
          ref={actionButtonRef}
          type="button"
          className={styles.infoModalButton}
          disabled={isClosing}
          onClick={requestClose}
        >
          Понятно
        </button>
      </section>
    </div>
  );
}

function FlowerImageModal({
  details,
  onClose,
}: {
  details: FlowerImageModalDetails;
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [motionReady, setMotionReady] = useState(false);
  const [motionStyle, setMotionStyle] = useState<CSSProperties>();
  const requestClose = useCallback(() => setIsClosing(true), []);

  useLayoutEffect(() => {
    const modal = modalRef.current;

    if (!modal) {
      return;
    }

    const target = modal.getBoundingClientRect();
    const originCenterX = details.origin.left + details.origin.width / 2;
    const originCenterY = details.origin.top + details.origin.height / 2;
    const targetCenterX = target.left + target.width / 2;
    const targetCenterY = target.top + target.height / 2;

    setMotionStyle({
      "--image-modal-from-x": `${originCenterX - targetCenterX}px`,
      "--image-modal-from-y": `${originCenterY - targetCenterY}px`,
      "--image-modal-from-scale-x": details.origin.width / target.width,
      "--image-modal-from-scale-y": details.origin.height / target.height,
    } as CSSProperties);
    setMotionReady(true);
  }, [details.origin]);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
      }

      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocused?.focus();
    };
  }, [requestClose]);

  return (
    <div
      className={`${styles.infoModalBackdrop} ${
        isClosing ? styles.infoModalBackdropClosing : ""
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          requestClose();
        }
      }}
    >
      <section
        ref={modalRef}
        style={motionStyle}
        className={`${styles.flowerImageModal} ${
          motionReady ? styles.flowerImageModalReady : ""
        } ${
          isClosing ? styles.flowerImageModalClosing : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={`Фотография цветка ${details.flowerName}`}
        onAnimationEnd={(event) => {
          if (isClosing && event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <Image
          className={styles.flowerImageModalPhoto}
          src={details.src}
          alt={details.alt}
          fill
          sizes="(max-width: 1280px) calc(100vw - 32px), 1280px"
          priority
        />
        <button
          ref={closeButtonRef}
          type="button"
          className={styles.flowerImageModalClose}
          aria-label="Закрыть фотографию"
          disabled={isClosing}
          onClick={requestClose}
        >
          <X size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}

function FlowerCard({
  flower,
  selected,
  reactionKey,
  onReactionComplete,
  onBadgeOpen,
  onImageOpen,
  motionClassName = "",
  hidden = false,
}: {
  flower: Flower;
  selected: Rating | null;
  reactionKey: number;
  onReactionComplete?: () => void;
  onBadgeOpen?: (details: FlowerInfoModalDetails) => void;
  onImageOpen?: (details: FlowerImageModalDetails) => void;
  motionClassName?: string;
  hidden?: boolean;
}) {
  const reaction = ratingOptions.find((option) => option.value === selected);
  const role = flowerRoles.find((item) => item.id === flower.role);
  const seasonality = flowerSeasonalities.find(
    (item) => item.id === flower.seasonality,
  );

  return (
    <article
      className={`${styles.card} ${motionClassName}`}
      aria-hidden={hidden || undefined}
    >
      <div className={styles.imagePlaceholder} aria-label="Здесь будет фотография цветка">
        {flower.image ? (
          <Image
            className={`${styles.flowerImage} ${reaction ? styles.flowerImageBlurred : ""}`}
            src={flower.image}
            alt={flower.imageAlt ?? flower.name}
            fill
            sizes="(max-width: 440px) calc(100vw - 48px), 392px"
            loading="eager"
            decoding="sync"
          />
        ) : (
          <span className={styles.imageFallback} aria-hidden="true">
            💐
          </span>
        )}
        <button
          type="button"
          className={styles.imageOpenButton}
          aria-label={`Открыть фотографию цветка ${flower.name}`}
          disabled={hidden || Boolean(reaction) || !flower.image || !onImageOpen}
          onClick={(event) => {
            if (flower.image) {
              const origin = event.currentTarget.getBoundingClientRect();

              onImageOpen?.({
                src: flower.image,
                alt: flower.imageAlt ?? flower.name,
                flowerName: flower.name,
                origin: {
                  top: origin.top,
                  left: origin.left,
                  width: origin.width,
                  height: origin.height,
                },
              });
            }
          }}
        />
        <div className={styles.flowerBadges} aria-label="Характеристики цветка">
          <button
            type="button"
            className={styles.flowerBadge}
            disabled={hidden || Boolean(reaction) || !role || !onBadgeOpen}
            onClick={() => {
              if (role) {
                onBadgeOpen?.({
                  category: "Роль цветка",
                  emoji: roleEmojis[flower.role],
                  name: role.name,
                  description: role.description,
                });
              }
            }}
          >
            <span className={styles.flowerBadgeEmoji} aria-hidden="true">
              {roleEmojis[flower.role]}
            </span>
            {role?.name ?? flower.role}
            <ChevronRight
              className={styles.flowerBadgeActionIcon}
              size={14}
              strokeWidth={2.25}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            className={styles.flowerBadge}
            disabled={hidden || Boolean(reaction) || !seasonality || !onBadgeOpen}
            onClick={() => {
              if (seasonality) {
                onBadgeOpen?.({
                  category: "Сезонность",
                  emoji: seasonalityEmojis[flower.seasonality],
                  name: seasonality.name,
                  description: seasonality.description,
                });
              }
            }}
          >
            <span className={styles.flowerBadgeEmoji} aria-hidden="true">
              {seasonalityEmojis[flower.seasonality]}
            </span>
            {seasonality?.name ?? flower.seasonality}
            <ChevronRight
              className={styles.flowerBadgeActionIcon}
              size={14}
              strokeWidth={2.25}
              aria-hidden="true"
            />
          </button>
        </div>
        {reaction && (
          <div
            key={`${reaction.value}-${reactionKey}`}
            className={styles.imageReaction}
            style={{ "--reaction-color": reaction.filterColor } as CSSProperties}
            aria-hidden="true"
          >
            <span
              className={styles.reactionIcon}
              aria-hidden="true"
              onAnimationEnd={onReactionComplete}
            >
              {reaction.icon}
            </span>
          </div>
        )}
      </div>
      <div className={styles.flowerInfo}>
        <div className={styles.names}>
          <p className={styles.latinName}>{flower.latinName}</p>
          <h1 className={styles.flowerName}>{flower.name}</h1>
        </div>
        <p className={styles.description}>{flower.description}</p>
      </div>
    </article>
  );
}

function RatingButton({
  option,
  selected,
  onSelect,
  disabled,
}: {
  option: (typeof ratingOptions)[number];
  selected: boolean;
  onSelect: (value: Rating) => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      className={`${styles.ratingButton} ${styles[option.value]} ${selected ? styles.selected : ""}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(option.value)}
    >
      <span className={styles.emoji} aria-hidden="true">
        {option.icon}
      </span>
      <span>{option.label}</span>
    </button>
  );
}

function RatingActions({
  selected,
  onSelect,
  disabled,
  finishing,
}: {
  selected: Rating | null;
  onSelect: (value: Rating) => void;
  disabled: boolean;
  finishing: boolean;
}) {
  return (
    <footer className={`${styles.actions} ${finishing ? styles.actionsLeaving : ""}`}>
      <div className={styles.ratingGroup} aria-label="Оценить цветок">
        {ratingOptions.map((option) => (
          <RatingButton
            key={option.value}
            option={option}
            selected={selected === option.value}
            onSelect={onSelect}
            disabled={disabled}
          />
        ))}
      </div>
    </footer>
  );
}

function CompletionCard() {
  return (
    <article className={`${styles.card} ${styles.completionCard} ${styles.cardEntering}`}>
      <div className={styles.flowerEmojiStage} aria-hidden="true">
        {flowerLoaderEmojis.map((emoji, index) => (
          <span
            className={styles.flowerLoaderEmoji}
            style={{ animationDelay: `${500 + index * 900}ms` }}
            key={emoji}
          >
            {emoji}
          </span>
        ))}
      </div>
      <div className={styles.completionCopy}>
        <h1 className={styles.completionTitle}>Все цветы оценены</h1>
        <p className={styles.completionDescription}>Собираем твои ответы в один список</p>
      </div>
    </article>
  );
}

function ResultsView({
  flowers,
  answers,
  onRestart,
}: {
  flowers: readonly Flower[];
  answers: SavedAnswers;
  onRestart: () => void;
}) {
  const [toast, setToast] = useState<{
    id: number;
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const toastTimer = window.setTimeout(() => setToast(null), 1500);

    return () => window.clearTimeout(toastTimer);
  }, [toast]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ id: Date.now(), type, message });
  };

  const shareText = [
    "Мои цветочные предпочтения:",
    ...flowers.map((flower) => `• ${flower.name} — ${answerLabels[answers[flower.id]]}`),
  ].join("\n");

  const copyResults = async () => {
    await navigator.clipboard.writeText(shareText);
    showToast("success", "Результат скопирован");
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Мои любимые цветы",
          text: shareText,
        });
        showToast("success", "Результат отправлен");
        return;
      }

      await copyResults();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      try {
        await copyResults();
      } catch {
        showToast("error", "Не удалось поделиться результатом");
      }
    }
  };

  return (
    <section className={styles.results}>
      <header className={styles.resultsHeader}>
        <h1 className={styles.resultsTitle}>Твои результаты</h1>
        <p className={styles.resultsDescription}>
          Сохрани этот список или поделись им с близкими
        </p>
      </header>

      <div className={styles.resultsList}>
        {flowers.map((flower) => {
          const answer = answers[flower.id];
          const option = ratingOptions.find((item) => item.value === answer);

          return (
            <article className={styles.resultCard} key={flower.id}>
              <div className={styles.resultThumbnail}>
                {flower.image ? (
                  <Image
                    src={flower.image}
                    alt=""
                    fill
                    sizes="56px"
                    className={styles.resultThumbnailImage}
                  />
                ) : (
                  <span className={styles.resultImageFallback} aria-hidden="true">
                    💐
                  </span>
                )}
              </div>
              <div className={styles.resultFlower}>
                <span className={styles.resultLatinName}>{flower.latinName}</span>
                <strong>{flower.name}</strong>
              </div>
              <span
                className={`${styles.resultAnswer} ${
                  answer === "skipped" ? styles.skipped : styles[answer]
                }`}
              >
                {option && (
                  <span className={styles.resultAnswerEmoji} aria-hidden="true">
                    {option.icon}
                  </span>
                )}
                {answerLabels[answer]}
              </span>
            </article>
          );
        })}
      </div>

      <div className={styles.resultsFooter}>
        <div className={styles.resultsActions}>
          <button type="button" className={styles.shareButton} onClick={handleShare}>
            <span>Поделиться</span>
            <Share2 className={styles.shareButtonIcon} size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${styles.shareButton} ${styles.restartButton}`}
            onClick={onRestart}
          >
            <span>Пройти заново</span>
            <RefreshCw className={styles.shareButtonIcon} size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {toast && (
        <div
          key={toast.id}
          className={`${styles.toast} ${
            toast.type === "success" ? styles.toastSuccess : styles.toastError
          }`}
          role={toast.type === "success" ? "status" : "alert"}
        >
          {toast.type === "success" ? (
            <Check className={styles.toastIcon} size={24} strokeWidth={2.25} aria-hidden="true" />
          ) : (
            <X className={styles.toastIcon} size={24} strokeWidth={2.25} aria-hidden="true" />
          )}
          <span className={styles.toastMessage}>{toast.message}</span>
          <span className={styles.toastTimer} aria-hidden="true" />
        </div>
      )}
    </section>
  );
}

export function FlowerRatingScreen({ flowers }: FlowerRatingScreenProps) {
  const selectionLockedRef = useRef(false);
  const [currentFlowerIndex, setCurrentFlowerIndex] = useState(0);
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  const [reactionKey, setReactionKey] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] =
    useState<TransitionDirection>("forward");
  const [answers, setAnswers] = useState<SavedAnswers>({});
  const [storageReady, setStorageReady] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [pageExit, setPageExit] = useState<PageExit | null>(null);
  const [flowerInfoModal, setFlowerInfoModal] =
    useState<FlowerInfoModalDetails | null>(null);
  const [flowerImageModal, setFlowerImageModal] =
    useState<FlowerImageModalDetails | null>(null);

  const currentFlower = flowers[currentFlowerIndex];
  const hasNextFlower = currentFlowerIndex < flowers.length - 1;
  const nextFlowerIndex = hasNextFlower ? currentFlowerIndex + 1 : currentFlowerIndex;
  const nextFlower = hasNextFlower ? flowers[nextFlowerIndex] : undefined;
  const hasPreviousFlower = currentFlowerIndex > 0;
  const previousFlowerIndex = hasPreviousFlower
    ? currentFlowerIndex - 1
    : currentFlowerIndex;
  const previousFlower = hasPreviousFlower ? flowers[previousFlowerIndex] : undefined;
  const transitionFlower =
    transitionDirection === "backward" ? previousFlower : nextFlower;
  const transitionFlowerIndex =
    transitionDirection === "backward" ? previousFlowerIndex : nextFlowerIndex;
  const stagedFlower = isTransitioning ? transitionFlower : nextFlower;
  const progressIndex =
    isTransitioning && transitionFlower
      ? transitionFlowerIndex
      : currentFlowerIndex;
  const savedCurrentAnswer = currentFlower ? answers[currentFlower.id] : undefined;
  const savedCurrentRating =
    savedCurrentAnswer && savedCurrentAnswer !== "skipped"
      ? savedCurrentAnswer
      : null;
  const displayedRating = selectedRating ?? savedCurrentRating;
  const navigationDisabled = selectedRating !== null || isTransitioning;
  const closeFlowerInfoModal = useCallback(() => setFlowerInfoModal(null), []);
  const closeFlowerImageModal = useCallback(() => setFlowerImageModal(null), []);

  useEffect(() => {
    try {
      const storedAnswers = window.localStorage.getItem(STORAGE_KEY);

      if (storedAnswers) {
        const parsedAnswers = JSON.parse(storedAnswers) as SavedAnswers;
        const validAnswers = Object.fromEntries(
          Object.entries(parsedAnswers).filter(
            ([flowerId, answer]) =>
              flowers.some((flower) => flower.id === flowerId) &&
              ["dislike", "neutral", "like", "skipped"].includes(answer),
          ),
        ) as SavedAnswers;
        const firstUnansweredIndex = flowers.findIndex(
          (flower) => !validAnswers[flower.id],
        );

        setAnswers(validAnswers);

        if (firstUnansweredIndex === -1 && flowers.length > 0) {
          setShowResults(true);
        } else if (firstUnansweredIndex > 0) {
          setCurrentFlowerIndex(firstUnansweredIndex);
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setStorageReady(true);
    }
  }, [flowers]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  }, [answers, storageReady]);

  useEffect(() => {
    if (!isTransitioning) {
      return;
    }

    const transitionTimer = window.setTimeout(() => {
      if (transitionFlower) {
        selectionLockedRef.current = false;
        setSelectedRating(null);
        setIsTransitioning(false);
        setCurrentFlowerIndex(transitionFlowerIndex);
      } else if (transitionDirection === "forward") {
        setPageExit("survey");
      } else {
        selectionLockedRef.current = false;
        setIsTransitioning(false);
      }
    }, transitionFlower ? 780 : COMPLETION_LOADER_DURATION);

    return () => window.clearTimeout(transitionTimer);
  }, [isTransitioning, transitionDirection, transitionFlower, transitionFlowerIndex]);

  useEffect(() => {
    if (!pageExit) {
      return;
    }

    const pageExitTimer = window.setTimeout(() => {
      if (pageExit === "survey") {
        setSelectedRating(null);
        setIsTransitioning(false);
        setShowResults(true);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
        selectionLockedRef.current = false;
        setAnswers({});
        setCurrentFlowerIndex(0);
        setSelectedRating(null);
        setReactionKey(0);
        setIsTransitioning(false);
        setTransitionDirection("forward");
        setShowResults(false);
      }

      setPageExit(null);
    }, PAGE_EXIT_DURATION);

    return () => window.clearTimeout(pageExitTimer);
  }, [pageExit]);

  const saveAnswer = (answer: Answer) => {
    if (!currentFlower) {
      return;
    }

    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [currentFlower.id]: answer,
    }));
  };

  const handleRatingSelect = (rating: Rating) => {
    if (
      selectionLockedRef.current ||
      selectedRating !== null ||
      isTransitioning ||
      savedCurrentRating === rating
    ) {
      return;
    }

    selectionLockedRef.current = true;
    setTransitionDirection("forward");
    saveAnswer(rating);
    setSelectedRating(rating);
    setReactionKey((currentKey) => currentKey + 1);
  };

  const handleNavigate = (direction: TransitionDirection) => {
    if (selectionLockedRef.current || selectedRating !== null || isTransitioning) {
      return;
    }

    if (direction === "backward" && !hasPreviousFlower) {
      return;
    }

    selectionLockedRef.current = true;
    setTransitionDirection(direction);

    if (!savedCurrentAnswer) {
      saveAnswer("skipped");
    }

    setIsTransitioning(true);
  };

  const handleReactionComplete = () => {
    if (selectedRating !== null && !isTransitioning) {
      setIsTransitioning(true);
    }
  };

  const handleRestart = () => {
    if (!pageExit) {
      setPageExit("results");
    }
  };

  if (flowers.length === 0 || !currentFlower) {
    return null;
  }

  if (showResults) {
    return (
      <main className={styles.viewport}>
        <div
          className={`${styles.screen} ${
            pageExit === "results" ? styles.resultsPageLeaving : ""
          }`}
        >
          <ResultsView flowers={flowers} answers={answers} onRestart={handleRestart} />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.viewport}>
      <div
        className={`${styles.screen} ${styles.surveyPage} ${
          pageExit === "survey" ? styles.surveyPageLeaving : ""
        }`}
      >
        <Progress
          current={progressIndex + 1}
          total={flowers.length}
          onPrevious={() => handleNavigate("backward")}
          onNext={() => handleNavigate("forward")}
          previousDisabled={!hasPreviousFlower || navigationDisabled}
          nextDisabled={navigationDisabled}
        />
        <div className={styles.surveyBody}>
          <div className={styles.cardStage} aria-live="polite">
            <FlowerCard
              key={currentFlower.id}
              flower={currentFlower}
              selected={selectedRating}
              reactionKey={reactionKey}
              onReactionComplete={handleReactionComplete}
              onBadgeOpen={isTransitioning ? undefined : setFlowerInfoModal}
              onImageOpen={isTransitioning ? undefined : setFlowerImageModal}
              motionClassName={
                isTransitioning
                  ? transitionDirection === "backward"
                    ? styles.cardLeavingRight
                    : styles.cardLeaving
                  : ""
              }
            />
            {stagedFlower && (
              <FlowerCard
                key={stagedFlower.id}
                flower={stagedFlower}
                selected={null}
                reactionKey={reactionKey}
                motionClassName={
                  isTransitioning
                    ? transitionDirection === "backward"
                      ? styles.cardEnteringLeft
                      : styles.cardEntering
                    : styles.cardPreloading
                }
                hidden
              />
            )}
          </div>
          <RatingActions
            selected={displayedRating}
            onSelect={handleRatingSelect}
            disabled={navigationDisabled}
            finishing={
              isTransitioning &&
              transitionDirection === "forward" &&
              !nextFlower
            }
          />
          {isTransitioning && transitionDirection === "forward" && !nextFlower && (
            <div className={styles.completionLayer} aria-live="polite">
              <CompletionCard />
            </div>
          )}
        </div>
      </div>
      {flowerInfoModal && (
        <FlowerInfoModal details={flowerInfoModal} onClose={closeFlowerInfoModal} />
      )}
      {flowerImageModal && (
        <FlowerImageModal details={flowerImageModal} onClose={closeFlowerImageModal} />
      )}
    </main>
  );
}
