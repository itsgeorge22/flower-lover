import type { Flower } from "../types/flower";

export type ShareAnswer = "like" | "neutral" | "dislike" | "skipped";

const sections = [
  { answer: "like", label: "Хочу", description: "Цветы, которые особенно нравятся", color: "#ff3978", background: "#fff0f5" },
  { answer: "neutral", label: "Иногда", description: "Подойдут под настроение или повод", color: "#c65b11", background: "#fff5ed" },
  { answer: "dislike", label: "Не хочу", description: "Лучше выбрать что-нибудь другое", color: "#5a409d", background: "#f1edf9" },
  { answer: "skipped", label: "Пропущено", description: "Пока без оценки", color: "#70666e", background: "#f5f1f3" },
] as const;

export function groupShareResults(
  flowers: readonly Flower[],
  answers: Readonly<Record<string, ShareAnswer>>,
) {
  return sections.map((section) => ({
    ...section,
    flowers: flowers.filter((flower) => (answers[flower.id] ?? "skipped") === section.answer),
  }));
}

export type ShareResultsGroup = ReturnType<typeof groupShareResults>[number];
