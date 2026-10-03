import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../server/routers';

describe('Playlist Generation', () => {
  let caller: any;

  beforeEach(() => {
    // Create mock context for public procedures
    const mockContext = {
      req: {} as any,
      res: {} as any,
      user: null,
    };
    caller = appRouter.createCaller(mockContext);
  });

  it('should generate a playlist with valid input', async () => {
    const result = await caller.playlist.generate({
      mood: 'focus',
      context: 'work',
      genres: ['electronic', 'indie'],
      trackCount: 8,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.title).toBeDefined();
    expect(result.description).toBeDefined();
    expect(result.coverUrl).toBeDefined();
    expect(result.mood).toBe('focus');
    expect(result.context).toBe('work');
    expect(result.isAIGenerated).toBe(true);
    expect(result.tracks).toBeInstanceOf(Array);
    expect(result.tracks.length).toBe(8);
  });

  it('should generate tracks with required fields', async () => {
    const result = await caller.playlist.generate({
      mood: 'energy',
      trackCount: 5,
    });

    expect(result.tracks.length).toBe(5);

    result.tracks.forEach((track: any) => {
      expect(track.id).toBeDefined();
      expect(track.title).toBeDefined();
      expect(track.artist).toBeDefined();
      expect(track.album).toBeDefined();
      expect(track.duration).toBeDefined();
      expect(track.duration).toBeGreaterThanOrEqual(120);
      expect(track.duration).toBeLessThanOrEqual(300);
      expect(track.coverUrl).toBeDefined();
      expect(track.mood).toBe('energy');
      expect(track.bpm).toBeDefined();
      expect(track.aiInsight).toBeDefined();
    });
  });

  it('should handle different moods with appropriate BPM', async () => {
    const moods = ['focus', 'chill', 'energy', 'sleep', 'workout'];

    for (const mood of moods) {
      const result = await caller.playlist.generate({
        mood: mood as any,
        trackCount: 4,
      });

      expect(result.mood).toBe(mood);
      expect(result.tracks.length).toBe(4);

      // Verify BPM is reasonable for the mood
      result.tracks.forEach((track: any) => {
        expect(track.bpm).toBeGreaterThan(40);
        expect(track.bpm).toBeLessThan(200);
      });
    }
  });

  it('should generate unique track IDs', async () => {
    const result = await caller.playlist.generate({
      mood: 'party',
      trackCount: 10,
    });

    const trackIds = result.tracks.map((t: any) => t.id);
    const uniqueIds = new Set(trackIds);

    expect(uniqueIds.size).toBe(trackIds.length);
  });

  it('should include genres in response', async () => {
    const result = await caller.playlist.generate({
      mood: 'chill',
      genres: ['jazz', 'indie'],
      trackCount: 4,
    });

    expect(result.genres).toBeInstanceOf(Array);
    expect(result.genres.length).toBeGreaterThan(0);
  });

  it('should set playCount to 0 for new playlists', async () => {
    const result = await caller.playlist.generate({
      mood: 'romantic',
      trackCount: 5,
    });

    expect(result.playCount).toBe(0);
  });

  it('should have valid ISO timestamp', async () => {
    const result = await caller.playlist.generate({
      mood: 'sad',
      trackCount: 4,
    });

    const date = new Date(result.createdAt);
    expect(date.toString()).not.toBe('Invalid Date');
  });

  it('should respect track count limits', async () => {
    // Test minimum
    const minResult = await caller.playlist.generate({
      mood: 'focus',
      trackCount: 4,
    });
    expect(minResult.tracks.length).toBe(4);

    // Test maximum
    const maxResult = await caller.playlist.generate({
      mood: 'focus',
      trackCount: 20,
    });
    expect(maxResult.tracks.length).toBe(20);
  });

  it('should use default track count when not specified', async () => {
    const result = await caller.playlist.generate({
      mood: 'chill',
    });

    expect(result.tracks.length).toBe(8); // default is 8
  });
});
