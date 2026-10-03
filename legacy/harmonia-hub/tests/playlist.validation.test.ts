import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test the input validation schema directly
const playlistInputSchema = z.object({
  mood: z.enum(['focus', 'chill', 'energy', 'sad', 'party', 'sleep', 'romantic', 'workout']),
  context: z.enum(['work', 'gym', 'sleep', 'drive', 'study', 'party', 'meditation']).optional(),
  genres: z.array(z.string()).optional(),
  trackCount: z.number().min(4).max(20).default(8),
});

describe('Playlist Input Validation', () => {
  it('should accept valid mood values', () => {
    const validMoods = ['focus', 'chill', 'energy', 'sad', 'party', 'sleep', 'romantic', 'workout'];
    
    validMoods.forEach(mood => {
      const result = playlistInputSchema.safeParse({
        mood,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid mood values', () => {
    const result = playlistInputSchema.safeParse({
      mood: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid context values', () => {
    const result = playlistInputSchema.safeParse({
      mood: 'focus',
      context: 'work',
    });
    expect(result.success).toBe(true);
  });

  it('should make context optional', () => {
    const result = playlistInputSchema.safeParse({
      mood: 'focus',
    });
    expect(result.success).toBe(true);
  });

  it('should enforce trackCount minimum of 4', () => {
    const result = playlistInputSchema.safeParse({
      mood: 'focus',
      trackCount: 3,
    });
    expect(result.success).toBe(false);
  });

  it('should enforce trackCount maximum of 20', () => {
    const result = playlistInputSchema.safeParse({
      mood: 'focus',
      trackCount: 21,
    });
    expect(result.success).toBe(false);
  });

  it('should use default trackCount of 8', () => {
    const result = playlistInputSchema.safeParse({
      mood: 'focus',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.trackCount).toBe(8);
    }
  });

  it('should accept array of genres', () => {
    const result = playlistInputSchema.safeParse({
      mood: 'focus',
      genres: ['electronic', 'indie', 'pop'],
    });
    expect(result.success).toBe(true);
  });

  it('should make genres optional', () => {
    const result = playlistInputSchema.safeParse({
      mood: 'focus',
    });
    expect(result.success).toBe(true);
  });
});
