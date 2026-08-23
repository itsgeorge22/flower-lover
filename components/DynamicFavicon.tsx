"use client";

import { useEffect } from "react";
import { flowerLoaderEmojis } from "../data/flower-loader";

function createEmojiFavicon(emoji: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <text
        x="32"
        y="34"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif"
        font-size="52"
      >${emoji}</text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function DynamicFavicon() {
  useEffect(() => {
    const favicon = document.createElement("link");
    let emojiIndex = 0;

    favicon.rel = "icon";
    favicon.type = "image/svg+xml";
    favicon.sizes = "any";
    favicon.dataset.dynamicFavicon = "true";
    document.head.append(favicon);

    const updateFavicon = () => {
      favicon.href = createEmojiFavicon(flowerLoaderEmojis[emojiIndex]);
      emojiIndex = (emojiIndex + 1) % flowerLoaderEmojis.length;
    };

    updateFavicon();
    const faviconTimer = window.setInterval(updateFavicon, 2000);

    return () => {
      window.clearInterval(faviconTimer);
      favicon.remove();
    };
  }, []);

  return null;
}
