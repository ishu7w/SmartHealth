import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto("http://localhost:5173/");
await page.waitForFunction(
  () => document.querySelector(".ambient-artwork")?.naturalWidth > 0,
);
const result = await page.evaluate(async () => {
  const artwork = document.querySelector(".ambient-artwork");
  const times = [];
  let last = performance.now();
  await new Promise((resolve) => {
    const stop = last + 4000;
    const tick = (now) => {
      times.push(now - last);
      last = now;
      if (now < stop) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });

  return {
    background: {
      width: artwork.naturalWidth,
      height: artwork.naturalHeight,
      videoElements: document.querySelectorAll("video").length,
      transform: getComputedStyle(artwork).transform,
    },
    raf: {
      samples: times.length,
      over33ms: times.filter((t) => t > 33.4).length,
    },
    blurredElements: [...document.querySelectorAll("*")].filter(
      (e) => getComputedStyle(e).backdropFilter !== "none",
    ).length,
    smallText: [...document.querySelectorAll("p,label,button,small")].filter(
      (e) => parseFloat(getComputedStyle(e).fontSize) < 13,
    ).length,
  };
});
await fs.writeFile(
  "../.impeccable/" + (process.argv[2] || "performance-steady") + ".json",
  JSON.stringify(result, null, 2),
);
console.log(result);
await browser.close();
