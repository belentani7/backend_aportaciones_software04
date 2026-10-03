import { storagePut } from "./storage";

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createAudioPreviewWav(seed: string) {
  const sampleRate = 22_050;
  const seconds = 4;
  const frameCount = sampleRate * seconds;
  const buffer = Buffer.alloc(44 + frameCount * 2);
  const hash = hashSeed(seed);
  const firstFrequency = 140 + (hash % 220);
  const secondFrequency = 220 + ((hash >>> 8) % 360);
  const thirdFrequency = 330 + ((hash >>> 16) % 420);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + frameCount * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(frameCount * 2, 40);

  for (let frame = 0; frame < frameCount; frame += 1) {
    const time = frame / sampleRate;
    const attack = Math.min(1, time * 8);
    const release = Math.min(1, (seconds - time) * 2.5);
    const envelope = Math.max(0, attack * release);
    const pulse = Math.sin(2 * Math.PI * (firstFrequency + Math.sin(time * 1.7) * 8) * time);
    const harmonic = Math.sin(2 * Math.PI * secondFrequency * time) * 0.42;
    const shimmer = Math.sin(2 * Math.PI * thirdFrequency * time) * 0.18;
    const sample = Math.max(-1, Math.min(1, (pulse * 0.46 + harmonic + shimmer) * envelope * 0.72));
    buffer.writeInt16LE(Math.round(sample * 32_000), 44 + frame * 2);
  }

  return buffer;
}

export async function createStoredAudioPreview(category: "songs" | "instrumentals", id: number, seed: string) {
  const preview = await storagePut(`audio-previews/${category}/${id}.wav`, createAudioPreviewWav(seed), "audio/wav");
  return preview;
}
