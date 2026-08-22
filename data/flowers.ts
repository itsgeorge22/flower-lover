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
    description: "Классический цветок с плотными лепестками и выразительной формой бутона.",
  },
  {
    id: "tulip",
    name: "Тюльпан",
    latinName: "Tulipa",
    description: "Лаконичный весенний цветок с гладкими лепестками и чашевидной формой.",
  },
  {
    id: "ranunculus",
    name: "Ранункулюс",
    latinName: "Ranunculus",
    description: "Пышный округлый цветок с множеством тонких плотно уложенных лепестков.",
  },
  // {
  //   id: "lisianthus",
  //   name: "Эустома",
  //   latinName: "Eustoma",
  //   description: "Воздушный цветок с нежными волнистыми лепестками и тонкими стеблями.",
  // },
  // {
  //   id: "hydrangea",
  //   name: "Гортензия",
  //   latinName: "Hydrangea",
  //   description: "Воздушные соцветия с мягкими переходами оттенков.",
  // },
  // {
  //   id: "chrysanthemum",
  //   name: "Хризантема",
  //   latinName: "Chrysanthemum",
  //   description: "Пышный цветок с множеством лепестков и большим разнообразием форм.",
  // },
  // {
  //   id: "gerbera",
  //   name: "Гербера",
  //   latinName: "Gerbera",
  //   description: "Яркий открытый цветок с крупной серединой и ровными длинными лепестками.",
  // },
  // {
  //   id: "alstroemeria",
  //   name: "Альстромерия",
  //   latinName: "Alstroemeria",
  //   description: "Нежный цветок с лёгкими лепестками и характерным контрастным рисунком.",
  // },
  // {
  //   id: "lily",
  //   name: "Лилия",
  //   latinName: "Lilium",
  //   description: "Крупный выразительный цветок с длинными лепестками и заметными тычинками.",
  // },
  // {
  //   id: "calla",
  //   name: "Калла",
  //   latinName: "Zantedeschia",
  //   description: "Элегантный цветок с гладкой воронкообразной формой и чистым силуэтом.",
  // },
  // {
  //   id: "iris",
  //   name: "Ирис",
  //   latinName: "Iris",
  //   description: "Графичный цветок с необычной формой и выразительно изогнутыми лепестками.",
  // },
  // {
  //   id: "carnation",
  //   name: "Гвоздика",
  //   latinName: "Dianthus",
  //   description: "Пышный цветок с множеством тонких лепестков и характерными волнистыми краями.",
  // },
  // {
  //   id: "freesia",
  //   name: "Фрезия",
  //   latinName: "Freesia",
  //   description: "Изящный цветок с небольшими раскрывающимися бутонами на тонком стебле.",
  // },
  // {
  //   id: "anemone",
  //   name: "Анемон",
  //   latinName: "Anemone",
  //   description: "Нежный цветок с тонкими лепестками и яркой контрастной серединой.",
  // },
  // {
  //   id: "delphinium",
  //   name: "Дельфиниум",
  //   latinName: "Delphinium",
  //   description: "Высокий воздушный цветок с множеством небольших соцветий вдоль стебля.",
  // },
  // {
  //   id: "sunflower",
  //   name: "Подсолнух",
  //   latinName: "Helianthus",
  //   description: "Яркий крупный цветок с золотистыми лепестками и тёмной выразительной серединой.",
  // },
  // {
  //   id: "gypsophila",
  //   name: "Гипсофила",
  //   latinName: "Gypsophila",
  //   description: "Воздушные веточки с множеством крошечных нежных цветков.",
  // },
  // {
  //   id: "orchid",
  //   name: "Орхидея",
  //   latinName: "Orchidaceae",
  //   description: "Изящный экзотический цветок с необычной симметричной формой лепестков.",
  // },
  // {
  //   id: "daffodil",
  //   name: "Нарцисс",
  //   latinName: "Narcissus",
  //   description: "Нежный весенний цветок с шестью лепестками и выразительной трубчатой серединой.",
  // },
  // {
  //   id: "lilac",
  //   name: "Сирень",
  //   latinName: "Syringa",
  //   description: "Пышные кисти из множества маленьких цветков с мягкой воздушной фактурой.",
  // },
  // {
  //   id: "matthiola",
  //   name: "Маттиола",
  //   latinName: "Matthiola",
  //   description: "Воздушный цветок с мягкими соцветиями, расположенными вдоль высокого стебля.",
  // },
  // {
  //   id: "stock",
  //   name: "Левкой",
  //   latinName: "Matthiola incana",
  //   description: "Пышный цветок с плотными соцветиями и мягкими бархатистыми лепестками.",
  // },
  // {
  //   id: "aster",
  //   name: "Астра",
  //   latinName: "Aster",
  //   description: "Яркий цветок с множеством тонких лепестков вокруг компактной середины.",
  // },
  // {
  //   id: "dahlia",
  //   name: "Георгин",
  //   latinName: "Dahlia",
  //   description: "Пышный цветок с геометрично расположенными лепестками и выразительной формой.",
  // },
  // {
  //   id: "amaryllis",
  //   name: "Амариллис",
  //   latinName: "Hippeastrum",
  //   description: "Крупный эффектный цветок с широкими лепестками на высоком плотном стебле.",
  // },
  // {
  //   id: "hyacinth",
  //   name: "Гиацинт",
  //   latinName: "Hyacinthus",
  //   description: "Плотное ароматное соцветие из множества небольших звёздчатых цветков.",
  // },
  // {
  //   id: "campanula",
  //   name: "Кампанула",
  //   latinName: "Campanula",
  //   description: "Нежный цветок с множеством небольших соцветий в форме колокольчиков.",
  // },
  // {
  //   id: "celosia",
  //   name: "Целозия",
  //   latinName: "Celosia",
  //   description: "Необычный яркий цветок с плотной бархатистой и рельефной фактурой.",
  // },
  // {
  //   id: "statice",
  //   name: "Статица",
  //   latinName: "Limonium",
  //   description: "Воздушные веточки с множеством мелких соцветий и лёгкой суховатой фактурой.",
  // },
  // {
  //   id: "veronica",
  //   name: "Вероника",
  //   latinName: "Veronica",
  //   description: "Изящный цветок с вытянутыми пушистыми соцветиями на тонких стеблях.",
  // },
  // {
  //   id: "scabiosa",
  //   name: "Скабиоза",
  //   latinName: "Scabiosa",
  //   description: "Воздушный округлый цветок с фактурной серединой и мягкими волнистыми лепестками.",
  // },
  // {
  //   id: "protea",
  //   name: "Протея",
  //   latinName: "Protea",
  //   description: "Крупный необычный цветок с плотной сердцевиной и жёсткими фактурными лепестками.",
  // },
  // {
  //   id: "lotus-chrysanthemum",
  //   name: "Лотосовидная хризантема",
  //   latinName: "Chrysanthemum",
  //   description: "Пышная хризантема с длинными изогнутыми лепестками и необычным силуэтом.",
  // },
  // {
  //   id: "spray-rose",
  //   name: "Кустовая роза",
  //   latinName: "Rosa",
  //   description: "Небольшие нежные розы, собранные по несколько бутонов на одном стебле.",
  // },
  // {
  //   id: "garden-rose",
  //   name: "Пионовидная роза",
  //   latinName: "Rosa",
  //   description: "Пышная роза с множеством мягких лепестков и формой, напоминающей пион.",
  // },
] satisfies readonly Flower[];
