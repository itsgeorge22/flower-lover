"use client";

import Image from "next/image";
import { Check, RefreshCw, Share2, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Flower } from "../types/flower";
import styles from "./FlowerRatingScreen.module.css";

type Rating = "dislike" | "neutral" | "like";
type Answer = Rating | "skipped";
type SavedAnswers = Record<string, Answer>;
type PageExit = "survey" | "results";

const STORAGE_KEY = "flower-lover-answers";
const COMPLETION_LOADER_DURATION = 3300;
const PAGE_EXIT_DURATION = 420;
const flowerLoaderEmojis = ["🌸", "🌻", "🌷"];
const unknownIcon = "/images/thinking-face.png";
const unknownReaction = {
  value: "skipped" as const,
  icon: unknownIcon,
  filterColor: "rgba(85, 76, 83, 0.32)",
};

const answerLabels: Record<Answer, string> = {
  dislike: "Не хочу",
  neutral: "Иногда",
  like: "Хочу",
  skipped: "Не знаю",
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
    icon: "/images/frowning-face.png",
    filterColor: "rgba(90, 64, 157, 0.32)",
  },
  {
    value: "neutral",
    label: "Иногда",
    icon: "/images/neutral-face.png",
    filterColor: "rgba(211, 105, 0, 0.32)",
  },
  {
    value: "like",
    label: "Хочу",
    icon: "/images/heart-eyes.png",
    filterColor: "rgba(255, 64, 128, 0.32)",
  },
];

function Progress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const progress = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;

  return (
    <header className={styles.progressSection}>
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
    </header>
  );
}

function FlowerCard({
  flower,
  selected,
  reactionKey,
  onReactionComplete,
  motionClassName = "",
  hidden = false,
}: {
  flower: Flower;
  selected: Answer | null;
  reactionKey: number;
  onReactionComplete?: () => void;
  motionClassName?: string;
  hidden?: boolean;
}) {
  const reaction =
    selected === "skipped"
      ? unknownReaction
      : ratingOptions.find((option) => option.value === selected);

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
            priority
          />
        ) : (
          <span className={styles.imageFallback} aria-hidden="true">
            💐
          </span>
        )}
        {reaction && (
          <div
            key={`${reaction.value}-${reactionKey}`}
            className={styles.imageReaction}
            style={{ "--reaction-color": reaction.filterColor } as CSSProperties}
            aria-hidden="true"
          >
            <Image
              className={styles.reactionIcon}
              src={reaction.icon}
              width={64}
              height={64}
              alt=""
              priority
              onAnimationEnd={onReactionComplete}
            />
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
      <Image className={styles.emoji} src={option.icon} width={40} height={40} alt="" />
      <span>{option.label}</span>
    </button>
  );
}

function RatingActions({
  selected,
  onSelect,
  onSkip,
  disabled,
  finishing,
}: {
  selected: Answer | null;
  onSelect: (value: Rating) => void;
  onSkip: () => void;
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
      <button
        type="button"
        className={`${styles.skipButton} ${styles.unknownButton}`}
        disabled={disabled}
        onClick={onSkip}
      >
        <Image className={styles.unknownEmoji} src={unknownIcon} width={20} height={20} alt="" />
        <span>Не знаю</span>
      </button>
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
                {answer === "skipped" ? (
                  <Image src={unknownIcon} width={24} height={24} alt="" />
                ) : (
                  option && <Image src={option.icon} width={24} height={24} alt="" />
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
            className={`${styles.skipButton} ${styles.restartButton}`}
            onClick={onRestart}
          >
            <span>Пройти заново</span>
            <RefreshCw className={styles.skipButtonIcon} size={16} aria-hidden="true" />
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
  const [selectedRating, setSelectedRating] = useState<Answer | null>(null);
  const [reactionKey, setReactionKey] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [answers, setAnswers] = useState<SavedAnswers>({});
  const [storageReady, setStorageReady] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [pageExit, setPageExit] = useState<PageExit | null>(null);

  const currentFlower = flowers[currentFlowerIndex];
  const hasNextFlower = currentFlowerIndex < flowers.length - 1;
  const nextFlowerIndex = hasNextFlower ? currentFlowerIndex + 1 : currentFlowerIndex;
  const nextFlower = hasNextFlower ? flowers[nextFlowerIndex] : undefined;
  const progressIndex = isTransitioning && nextFlower ? nextFlowerIndex : currentFlowerIndex;

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
      if (hasNextFlower) {
        selectionLockedRef.current = false;
        setSelectedRating(null);
        setIsTransitioning(false);
        setCurrentFlowerIndex(nextFlowerIndex);
      } else {
        setPageExit("survey");
      }
    }, hasNextFlower ? 780 : COMPLETION_LOADER_DURATION);

    return () => window.clearTimeout(transitionTimer);
  }, [hasNextFlower, isTransitioning, nextFlowerIndex]);

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
    if (selectionLockedRef.current || selectedRating !== null || isTransitioning) {
      return;
    }

    selectionLockedRef.current = true;
    saveAnswer(rating);
    setSelectedRating(rating);
    setReactionKey((currentKey) => currentKey + 1);
  };

  const handleSkip = () => {
    if (selectionLockedRef.current || selectedRating !== null || isTransitioning) {
      return;
    }

    selectionLockedRef.current = true;
    saveAnswer("skipped");
    setSelectedRating("skipped");
    setReactionKey((currentKey) => currentKey + 1);
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
        />
        <div className={styles.surveyBody}>
          <div className={styles.cardStage} aria-live="polite">
            <FlowerCard
              flower={currentFlower}
              selected={selectedRating}
              reactionKey={reactionKey}
              onReactionComplete={handleReactionComplete}
              motionClassName={isTransitioning ? styles.cardLeaving : ""}
            />
            {isTransitioning && nextFlower && (
              <FlowerCard
                flower={nextFlower}
                selected={null}
                reactionKey={reactionKey}
                motionClassName={styles.cardEntering}
                hidden
              />
            )}
          </div>
          <RatingActions
            selected={selectedRating}
            onSelect={handleRatingSelect}
            onSkip={handleSkip}
            disabled={selectedRating !== null || isTransitioning}
            finishing={isTransitioning && !nextFlower}
          />
          {isTransitioning && !nextFlower && (
            <div className={styles.completionLayer} aria-live="polite">
              <CompletionCard />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
