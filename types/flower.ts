export type FlowerRoleId = "primary" | "companion" | "filler" | "accent";

export type FlowerSeasonalityId =
  | "year-round"
  | "spring"
  | "summer"
  | "autumn"
  | "winter";

export type FlowerRole = {
  id: FlowerRoleId;
  name: string;
  description: string;
};

export type FlowerSeasonality = {
  id: FlowerSeasonalityId;
  name: string;
  description: string;
};

export type Flower = {
  /** Stable unique key. Do not change it after answers have been collected. */
  id: string;
  /** Russian display name, for example "Пион". */
  name: string;
  /** Botanical name, preferably a genus for generic flower cards. */
  latinName: string;
  /** One or two short sentences shown below the flower name. */
  description: string;
  /** Main function of the flower in a floral arrangement. */
  role: FlowerRoleId;
  /** Season when the flower is most characteristic or commonly available. */
  seasonality: FlowerSeasonalityId;
  /** Public path such as "/images/flowers/peony.webp". */
  image?: string;
  /** Short, meaningful description of the photo. */
  imageAlt?: string;
  /** Optional attribution fields for licensed photographs. */
  photoAuthor?: string;
  photoSourceUrl?: string;
};
