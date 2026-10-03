import { useEffect, useState } from "react";

const previewCache = new Map<string, string>();

export function isLegacyAmbientUrl(url?: string | null) {
  if (!url) return false;
  return url.includes("actions.google.com/sounds/v1/ambiences/coffee_shop.ogg")
    || url.includes("actions.google.com/sounds/v1/science_fiction/deep_space_ambience.ogg")
    || url.includes("simulated_song_audio")
    || url.includes("simulated_instrumental");
}

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createUniquePreview(seed: string) {
  const sampleRate = 22_050;
  const seconds = 4;
  const frameCount = sampleRate * seconds;
  const buffer = new ArrayBuffer(44 + frameCount * 2);
  const view = new DataView(buffer);
  const hash = hashSeed(seed);
  const firstFrequency = 140 + (hash % 220);
  const secondFrequency = 220 + ((hash >>> 8) % 360);
  const thirdFrequency = 330 + ((hash >>> 16) % 420);

  const writeText = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + frameCount * 2, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, frameCount * 2, true);

  for (let frame = 0; frame < frameCount; frame += 1) {
    const time = frame / sampleRate;
    const attack = Math.min(1, time * 8);
    const release = Math.min(1, (seconds - time) * 2.5);
    const envelope = Math.max(0, attack * release);
    const pulse = Math.sin(2 * Math.PI * (firstFrequency + Math.sin(time * 1.7) * 8) * time);
    const harmonic = Math.sin(2 * Math.PI * secondFrequency * time) * 0.42;
    const shimmer = Math.sin(2 * Math.PI * thirdFrequency * time) * 0.18;
    const sample = Math.max(-1, Math.min(1, (pulse * 0.46 + harmonic + shimmer) * envelope * 0.72));
    view.setInt16(44 + frame * 2, sample * 32_000, true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

export function useAudioPreview(seed: string, sourceUrl?: string | null, enabled = true) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const usesSourceUrl = Boolean(sourceUrl) && !isLegacyAmbientUrl(sourceUrl);

  useEffect(() => {
    if (!enabled || usesSourceUrl) {
      setPreviewUrl(null);
      return;
    }

    const cacheKey = `sonix-preview:${seed}`;
    const existingUrl = previewCache.get(cacheKey);
    if (existingUrl) {
      setPreviewUrl(existingUrl);
      return;
    }

    const generatedUrl = createUniquePreview(seed);
    previewCache.set(cacheKey, generatedUrl);
    setPreviewUrl(generatedUrl);
  }, [enabled, seed, usesSourceUrl]);

  return usesSourceUrl ? sourceUrl ?? null : previewUrl;
}
