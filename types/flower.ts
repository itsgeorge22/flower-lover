export type Flower = {
  /** Stable unique key. Do not change it after answers have been collected. */
  id: string;
  /** Russian display name, for example "Пион". */
  name: string;
  /** Botanical name, preferably a genus for generic flower cards. */
  latinName: string;
  /** One or two short sentences shown below the flower name. */
  description: string;
  /** Public path such as "/images/flowers/peony.webp". */
  image?: string;
  /** Short, meaningful description of the photo. */
  imageAlt?: string;
  /** Optional attribution fields for licensed photographs. */
  photoAuthor?: string;
  photoSourceUrl?: string;
};
