import { access, mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import sharp from "sharp";
import { flowers } from "../data/flowers.ts";

const MODEL = "gpt-image-2";
const SIZE = "1024x1536";
const QUALITY = "medium";
const MAX_RETRIES = 3;
const WEBP_QUALITY = 88;

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(projectDirectory, "public", "images", "flowers");

const temporaryStatusCodes = new Set([408, 409, 429]);
const temporaryErrorCodes = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ETIMEDOUT",
]);

export function createPrompt(flower) {
  return `
Create a photorealistic premium botanical studio photograph of a living ${flower.name} (${flower.latinName}).

The flower must look vivid, fresh, beautiful, natural, and botanically recognizable. Make the flower the clear primary subject and let it occupy most of the frame. The most important part of the flower — its bud, flower head, or main inflorescence — must be precisely centered in the image. Show enough of its natural structure and defining botanical features for the species to be immediately recognizable. If this flower naturally grows as a cluster, spike, branch, or compound inflorescence rather than a single flower head, show that characteristic natural form instead of forcing it into a single bloom.

Use soft diffused daylight, a light warm neutral studio background, subtle depth of field, realistic petal texture, natural color variation, and a clean premium editorial aesthetic. Use a vertical composition with consistent close framing suitable for a mobile flower-rating card. A small amount of natural stem or leaves may be visible when it helps identification, but the centered flower head or primary inflorescence must remain dominant.

No vase, no bouquet, no wrapping, no hands, no people, no text, no labels, no decorative objects, no artificial props, no CGI, no illustration, no painting, and no synthetic-looking surfaces. The final result must look like a real professional botanical photograph.
  `.trim();
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function formatError(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isBillingError(error) {
  const code = String(error?.code ?? "").toLowerCase();
  const message = formatError(error).toLowerCase();

  return (
    code === "insufficient_quota" ||
    message.includes("no credits remaining") ||
    message.includes("insufficient_quota") ||
    message.includes("billing hard limit")
  );
}

function isTemporaryError(error) {
  if (isBillingError(error)) {
    return false;
  }

  const status = Number(error?.status);
  const code = error?.code ?? error?.cause?.code;

  return (
    temporaryStatusCodes.has(status) ||
    status >= 500 ||
    temporaryErrorCodes.has(code) ||
    error?.name === "APIConnectionError" ||
    error?.name === "RateLimitError"
  );
}

async function requestWithRetry(operation, flower) {
  for (let retry = 0; retry <= MAX_RETRIES; retry += 1) {
    try {
      return await operation();
    } catch (error) {
      const retriesExhausted = retry === MAX_RETRIES;

      if (!isTemporaryError(error) || retriesExhausted) {
        throw error;
      }

      const delay = 2 ** retry * 1500 + Math.floor(Math.random() * 500);
      console.warn(
        `  Temporary error for ${flower.id}: ${formatError(error)}. ` +
          `Retry ${retry + 1}/${MAX_RETRIES} in ${(delay / 1000).toFixed(1)}s...`,
      );
      await sleep(delay);
    }
  }

  throw new Error(`Retry loop ended unexpectedly for ${flower.id}.`);
}

function validateFlowers() {
  const ids = new Set();

  for (const flower of flowers) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(flower.id)) {
      throw new Error(
        `Invalid flower id "${flower.id}". Use lowercase Latin letters, numbers, and hyphens only.`,
      );
    }

    if (ids.has(flower.id)) {
      throw new Error(`Duplicate flower id "${flower.id}" in data/flowers.ts.`);
    }

    ids.add(flower.id);
  }
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function saveAsWebp(base64Image, outputPath) {
  const temporaryPath = path.join(
    outputDirectory,
    `.${path.basename(outputPath)}.${process.pid}.tmp.webp`,
  );

  try {
    await sharp(Buffer.from(base64Image, "base64"))
      .rotate()
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toFile(temporaryPath);
    await rename(temporaryPath, outputPath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

async function generateFlowerImage(client, flower) {
  const result = await requestWithRetry(
    () =>
      client.images.generate({
        model: MODEL,
        prompt: createPrompt(flower),
        size: SIZE,
        quality: QUALITY,
        output_format: "png",
      }),
    flower,
  );

  const base64Image = result.data?.[0]?.b64_json;

  if (!base64Image) {
    throw new Error(`OpenAI returned no image data for ${flower.id}.`);
  }

  return base64Image;
}

async function main() {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error(
      "OPENAI_API_KEY is missing. Add it to .env.local before running the generator.",
    );
  }

  validateFlowers();
  await mkdir(outputDirectory, { recursive: true });

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 0,
    timeout: 10 * 60 * 1000,
  });
  const summary = {
    generated: 0,
    skipped: 0,
    failed: 0,
  };
  const failures = [];

  console.log(`Generating ${flowers.length} flower images with ${MODEL}...`);
  console.log(`Output: ${outputDirectory}\n`);

  for (const [index, flower] of flowers.entries()) {
    const position = `[${index + 1}/${flowers.length}]`;
    const outputPath = path.join(outputDirectory, `${flower.id}.webp`);

    if (await fileExists(outputPath)) {
      summary.skipped += 1;
      console.log(`${position} SKIP ${flower.id} — file already exists.`);
      continue;
    }

    console.log(`${position} GENERATE ${flower.id} — ${flower.name} (${flower.latinName})...`);

    try {
      const base64Image = await generateFlowerImage(client, flower);
      await saveAsWebp(base64Image, outputPath);
      summary.generated += 1;
      console.log(`${position} SAVED ${path.relative(projectDirectory, outputPath)}`);
    } catch (error) {
      summary.failed += 1;
      failures.push({ id: flower.id, error: formatError(error) });
      console.error(`${position} FAILED ${flower.id}: ${formatError(error)}`);

      if (isBillingError(error)) {
        console.error("Stopping the batch because the OpenAI account has no available credits.");
        break;
      }
    }
  }

  console.log("\nGeneration summary");
  console.log(`  Generated: ${summary.generated}`);
  console.log(`  Skipped:   ${summary.skipped}`);
  console.log(`  Failed:    ${summary.failed}`);
  console.log(`  Total:     ${flowers.length}`);

  if (failures.length > 0) {
    console.log("\nFailed flowers:");
    for (const failure of failures) {
      console.log(`  - ${failure.id}: ${failure.error}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`\nGenerator stopped: ${formatError(error)}`);
  process.exitCode = 1;
});
