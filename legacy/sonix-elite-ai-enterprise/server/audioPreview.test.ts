import { describe, expect, it } from "vitest";
import { createAudioPreviewWav } from "./audioPreview";

describe("audio preview generation", () => {
  it("creates distinct valid WAV bytes for different assets", () => {
    const songPreview = createAudioPreviewWav("song:42:midnight-signal:electronic");
    const instrumentalPreview = createAudioPreviewWav("instrumental:43:aurora-bloom:cinematic");

    expect(songPreview.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(songPreview.subarray(8, 12).toString("ascii")).toBe("WAVE");
    expect(songPreview.byteLength).toBe(instrumentalPreview.byteLength);
    expect(songPreview.equals(instrumentalPreview)).toBe(false);
  });
});
