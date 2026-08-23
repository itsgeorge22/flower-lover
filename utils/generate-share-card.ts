import type { Flower } from "../types/flower";

export type ShareCardAnswer = "dislike" | "neutral" | "like" | "skipped";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;
const PAGE_PADDING = 72;

const answerMeta: Record<
  Exclude<ShareCardAnswer, "skipped">,
  { label: string; emoji: string; color: string; background: string }
> = {
  like: {
    label: "Хочу",
    emoji: "😍",
    color: "#ff3978",
    background: "#fff0f5",
  },
  neutral: {
    label: "Иногда",
    emoji: "😐",
    color: "#c65b11",
    background: "#fff5ed",
  },
  dislike: {
    label: "Не хочу",
    emoji: "☹️",
    color: "#5a409d",
    background: "#f1edf9",
  },
};

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawTextWithLimit(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  if (context.measureText(text).width <= maxWidth) {
    context.fillText(text, x, y);
    return;
  }

  let result = text;

  while (result.length > 1 && context.measureText(`${result}…`).width > maxWidth) {
    result = result.slice(0, -1);
  }

  context.fillText(`${result}…`, x, y);
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;

  if (imageRatio > targetRatio) {
    sourceWidth = image.naturalHeight * targetRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / targetRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new window.Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

function drawFlowerFallback(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const fallbackGradient = context.createLinearGradient(x, y, x + width, y + height);
  fallbackGradient.addColorStop(0, "#f9edf3");
  fallbackGradient.addColorStop(1, "#eee7ec");
  context.fillStyle = fallbackGradient;
  context.fillRect(x, y, width, height);
  context.font = '68px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("💐", x + width / 2, y + height / 2 + 2);
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
}

function drawSummaryPill(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  label: string,
  count: number,
  color: string,
  background: string,
) {
  roundedRect(context, x, y, width, 82, 26);
  context.fillStyle = background;
  context.fill();

  context.fillStyle = color;
  context.font = '500 24px Rubik, sans-serif';
  context.fillText(label, x + 24, y + 51);
  context.textAlign = "right";
  context.font = '500 30px Rubik, sans-serif';
  context.fillText(String(count), x + width - 24, y + 53);
  context.textAlign = "left";
}

function drawFlowerCard(
  context: CanvasRenderingContext2D,
  flower: Flower,
  image: HTMLImageElement | null,
  answer: ShareCardAnswer,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const imageHeight = 224;
  const meta = answer === "skipped" ? null : answerMeta[answer];

  context.save();
  context.shadowColor = "rgba(64, 37, 54, 0.10)";
  context.shadowBlur = 28;
  context.shadowOffsetY = 10;
  roundedRect(context, x, y, width, height, 30);
  context.fillStyle = "#ffffff";
  context.fill();
  context.restore();

  context.save();
  roundedRect(context, x, y, width, imageHeight, 30);
  context.clip();
  if (image) {
    drawCoverImage(context, image, x, y, width, imageHeight);
  } else {
    drawFlowerFallback(context, x, y, width, imageHeight);
  }
  context.restore();

  context.fillStyle = "#9e929c";
  context.font = '400 18px Rubik, sans-serif';
  drawTextWithLimit(context, flower.latinName, x + 22, y + 262, width - 44);

  context.fillStyle = "#171216";
  context.font = '500 25px Rubik, sans-serif';
  drawTextWithLimit(context, flower.name, x + 22, y + 296, width - 44);

  if (meta) {
    context.font = '500 18px Rubik, sans-serif';
    const labelWidth = context.measureText(meta.label).width;
    const badgeWidth = Math.ceil(labelWidth + 62);
    roundedRect(context, x + 20, y + height - 50, badgeWidth, 34, 17);
    context.fillStyle = meta.background;
    context.fill();
    context.font = '18px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    context.fillStyle = meta.color;
    context.fillText(meta.emoji, x + 31, y + height - 27);
    context.font = '500 18px Rubik, sans-serif';
    context.fillText(meta.label, x + 55, y + height - 26);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Не удалось создать изображение результата"));
      }
    }, "image/png");
  });
}

export async function generateFlowerShareCard(
  flowers: readonly Flower[],
  answers: Readonly<Record<string, ShareCardAnswer>>,
) {
  await document.fonts.ready;

  const counts = {
    like: flowers.filter((flower) => answers[flower.id] === "like").length,
    neutral: flowers.filter((flower) => answers[flower.id] === "neutral").length,
    dislike: flowers.filter((flower) => answers[flower.id] === "dislike").length,
  };
  const ratedFlowers = flowers.filter((flower) => answers[flower.id] !== "skipped");
  const likedFlowers = flowers.filter((flower) => answers[flower.id] === "like");
  const featuredSource = likedFlowers.length > 0 ? likedFlowers : ratedFlowers.length > 0 ? ratedFlowers : flowers;
  const featuredFlowers = featuredSource.slice(0, 6);
  const loadedImages = await Promise.all(
    featuredFlowers.map((flower) => (flower.image ? loadImage(flower.image) : Promise.resolve(null))),
  );

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Браузер не поддерживает создание изображения");
  }

  const background = context.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  background.addColorStop(0, "#fff9fb");
  background.addColorStop(0.55, "#faf6f8");
  background.addColorStop(1, "#f6f0f4");
  context.fillStyle = background;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const glowTop = context.createRadialGradient(920, 40, 0, 920, 40, 360);
  glowTop.addColorStop(0, "rgba(255, 64, 128, 0.13)");
  glowTop.addColorStop(1, "rgba(255, 64, 128, 0)");
  context.fillStyle = glowTop;
  context.fillRect(560, 0, 520, 410);

  const glowBottom = context.createRadialGradient(80, 1290, 0, 80, 1290, 330);
  glowBottom.addColorStop(0, "rgba(132, 98, 201, 0.10)");
  glowBottom.addColorStop(1, "rgba(132, 98, 201, 0)");
  context.fillStyle = glowBottom;
  context.fillRect(0, 920, 440, 430);

  context.fillStyle = "#ff4080";
  context.font = '24px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  context.fillText("🌸", PAGE_PADDING, 78);
  const logoEmojiWidth = context.measureText("🌸").width;
  context.font = '500 24px Rubik, sans-serif';
  context.fillText("FlowerLover", PAGE_PADDING + logoEmojiWidth + 4, 78);

  context.fillStyle = "#171216";
  context.font = '500 50px Rubik, sans-serif';
  context.fillText(
    likedFlowers.length > 0 ? "Мои любимые цветы" : "Мои цветочные предпочтения",
    PAGE_PADDING,
    148,
  );

  context.fillStyle = "#70666e";
  context.font = '400 23px Rubik, sans-serif';
  context.fillText("Маленькая карта моих цветочных симпатий", PAGE_PADDING, 190);

  const pillGap = 18;
  const pillWidth = (CARD_WIDTH - PAGE_PADDING * 2 - pillGap * 2) / 3;
  drawSummaryPill(
    context,
    PAGE_PADDING,
    224,
    pillWidth,
    "Хочу",
    counts.like,
    answerMeta.like.color,
    answerMeta.like.background,
  );
  drawSummaryPill(
    context,
    PAGE_PADDING + pillWidth + pillGap,
    224,
    pillWidth,
    "Иногда",
    counts.neutral,
    answerMeta.neutral.color,
    answerMeta.neutral.background,
  );
  drawSummaryPill(
    context,
    PAGE_PADDING + (pillWidth + pillGap) * 2,
    224,
    pillWidth,
    "Не хочу",
    counts.dislike,
    answerMeta.dislike.color,
    answerMeta.dislike.background,
  );

  const gridTop = 344;
  const gridGap = 24;
  const cardWidth = (CARD_WIDTH - PAGE_PADDING * 2 - gridGap * 2) / 3;
  const cardHeight = 376;

  featuredFlowers.forEach((flower, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    drawFlowerCard(
      context,
      flower,
      loadedImages[index],
      answers[flower.id] ?? "skipped",
      PAGE_PADDING + column * (cardWidth + gridGap),
      gridTop + row * (cardHeight + gridGap),
      cardWidth,
      cardHeight,
    );
  });

  if (featuredFlowers.length === 0) {
    context.textAlign = "center";
    context.font = '88px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    context.fillText("💐", CARD_WIDTH / 2, 630);
    context.fillStyle = "#171216";
    context.font = '500 30px Rubik, sans-serif';
    context.fillText("Цветы ждут твоей оценки", CARD_WIDTH / 2, 700);
    context.textAlign = "left";
  }

  const hiddenCount = Math.max(0, featuredSource.length - featuredFlowers.length);
  context.textAlign = "center";
  if (hiddenCount > 0) {
    context.fillStyle = "#554c53";
    context.font = '500 22px Rubik, sans-serif';
    context.fillText(`+ ещё ${hiddenCount} ${likedFlowers.length > 0 ? "любимых цветов" : "цветов"}`, CARD_WIDTH / 2, 1197);
  }

  context.fillStyle = "#9e929c";
  context.font = '400 19px Rubik, sans-serif';
  context.fillText("Создано в FlowerLover", CARD_WIDTH / 2, 1274);
  context.textAlign = "left";

  return canvasToBlob(canvas);
}
