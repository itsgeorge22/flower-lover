import type { Flower } from "../types/flower";

/**
 * The array order is the order in which cards appear in the questionnaire.
 * Add new flowers by copying one object and replacing all of its values.
 */
export const flowers = [
  {
    id: "peony",
    name: "Пион",
    latinName: "Paeonia",
    description:
      "Пышный и нежный цветок с приятным ароматом. Символ романтики и благополучия",
    image: "/images/flowers/peony.jpg",
    imageAlt: "Нежный розовый пион крупным планом",
  },
  {
    id: "rose",
    name: "Роза",
    latinName: "Rosa",
    description:
      "Элегантный цветок с тонким ароматом. Символ любви, красоты и нежности",
  },
  {
    id: "tulip",
    name: "Тюльпан",
    latinName: "Tulipa",
    description:
      "Лёгкий весенний цветок с яркими лепестками. Символ тепла и новых начинаний",
  },
] satisfies readonly Flower[];
