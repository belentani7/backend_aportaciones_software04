export type Mood = 'focus' | 'chill' | 'energy' | 'sad' | 'party' | 'sleep' | 'romantic' | 'workout';
export type Context = 'work' | 'gym' | 'sleep' | 'drive' | 'study' | 'party' | 'meditation';
export type Genre = 'pop' | 'rock' | 'hiphop' | 'electronic' | 'jazz' | 'classical' | 'rnb' | 'indie' | 'latin' | 'metal';
export type SubscriptionTier = 'free' | 'premium' | 'creator';
export type AgentRole = 'CEO' | 'COO' | 'CMO' | 'CPO' | 'CTO';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  coverUrl: string;
  audioUrl?: string;
  mood?: Mood;
  genre?: Genre;
  bpm?: number;
  aiInsight?: string;
  isLiked?: boolean;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
  mood?: Mood;
  context?: Context;
  genres?: Genre[];
  createdAt: string;
  isAIGenerated: boolean;
  playCount: number;
  isLiked?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  subscription: SubscriptionTier;
  isAdmin: boolean;
  stats: {
    playlistsCreated: number;
    hoursListened: number;
    moodStreak: number;
    favoriteGenre?: Genre;
  };
  preferences: {
    favoriteMoods: Mood[];
    favoriteGenres: Genre[];
    defaultContext?: Context;
  };
}

export interface Agent {
  role: AgentRole;
  name: string;
  description: string;
  status: 'active' | 'analyzing' | 'idle';
  lastAction?: string;
  lastActionTime?: string;
}

export interface CEOStrategy {
  id: string;
  generatedAt: string;
  summary: string;
  keyDecisions: string[];
  metrics: {
    users: number;
    revenue: number;
    churn: number;
    engagement: number;
  };
  autonomousActions: {
    id: string;
    action: string;
    agent: AgentRole;
    status: 'executed' | 'pending' | 'rejected';
    timestamp: string;
  }[];
  nextSteps: string[];
  risks: string[];
}

export interface PlaylistGeneratorInput {
  mood: Mood;
  context?: Context;
  genres: Genre[];
  bpmRange: { min: number; max: number };
  trackCount: number;
}
