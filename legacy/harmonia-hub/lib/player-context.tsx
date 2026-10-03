import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { useLibrary } from "@/lib/library-context";
import type { Playlist, Track } from "@/shared/types";

export type PlaybackStatus = "idle" | "unavailable" | "loading" | "playing" | "paused" | "buffering" | "ended" | "error";

interface PlayerState {
  currentTrack: Track | null;
  currentPlaylist: Playlist | null;
  queue: Track[];
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: "none" | "one" | "all";
  isPlayerVisible: boolean;
  playbackStatus: PlaybackStatus;
}

interface PlayerContextType extends PlayerState {
  playTrack: (track: Track, playlist?: Playlist) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (progress: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  openPlayer: () => void;
  closePlayer: () => void;
  toggleLike: (track: Track) => void;
  likedTrackIds: Set<string>;
  canPlayCurrentTrack: boolean;
}

const PlayerContext = createContext<PlayerContextType | null>(null);
const initialState: PlayerState = { currentTrack: null, currentPlaylist: null, queue: [], isPlaying: false, progress: 0, currentTime: 0, volume: 0.8, isShuffle: false, repeatMode: "none", isPlayerVisible: false, playbackStatus: "idle" };

/** No timer is used: without a licensed `audioUrl`, the UI reports audio as unavailable. */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlayerState>(initialState);
  const library = useLibrary();

  const selectTrack = useCallback((track: Track, playlist?: Playlist, queue?: Track[]) => {
    library.recordRecent(track);
    setState((previous) => ({ ...previous, currentTrack: track, currentPlaylist: playlist ?? previous.currentPlaylist, queue: queue ?? previous.queue, isPlaying: false, progress: 0, currentTime: 0, isPlayerVisible: true, playbackStatus: track.audioUrl ? "loading" : "unavailable" }));
  }, [library]);

  const playTrack = useCallback((track: Track, playlist?: Playlist) => selectTrack(track, playlist, playlist?.tracks ?? []), [selectTrack]);
  const pauseTrack = useCallback(() => setState((previous) => previous.playbackStatus === "playing" ? { ...previous, isPlaying: false, playbackStatus: "paused" } : previous), []);
  const resumeTrack = useCallback(() => setState((previous) => previous.currentTrack ? { ...previous, isPlaying: false, playbackStatus: previous.currentTrack.audioUrl ? "error" : "unavailable" } : previous), []);

  const moveQueue = useCallback((direction: 1 | -1) => {
    setState((previous) => {
      if (!previous.currentTrack || previous.queue.length === 0) return previous;
      const currentIndex = previous.queue.findIndex((track) => track.id === previous.currentTrack?.id);
      const baseIndex = currentIndex < 0 ? 0 : currentIndex;
      const nextIndex = previous.isShuffle ? (baseIndex + 1) % previous.queue.length : (baseIndex + direction + previous.queue.length) % previous.queue.length;
      const track = previous.queue[nextIndex];
      library.recordRecent(track);
      return { ...previous, currentTrack: track, isPlaying: false, progress: 0, currentTime: 0, playbackStatus: track.audioUrl ? "loading" : "unavailable" };
    });
  }, [library]);

  const nextTrack = useCallback(() => moveQueue(1), [moveQueue]);
  const prevTrack = useCallback(() => moveQueue(-1), [moveQueue]);
  const seekTo = useCallback((_progress: number) => undefined, []);
  const setVolume = useCallback((volume: number) => setState((previous) => ({ ...previous, volume: Math.max(0, Math.min(1, volume)) })), []);
  const toggleShuffle = useCallback(() => setState((previous) => ({ ...previous, isShuffle: !previous.isShuffle })), []);
  const toggleRepeat = useCallback(() => setState((previous) => { const modes: PlayerState["repeatMode"][] = ["none", "all", "one"]; return { ...previous, repeatMode: modes[(modes.indexOf(previous.repeatMode) + 1) % modes.length] }; }), []);
  const openPlayer = useCallback(() => setState((previous) => ({ ...previous, isPlayerVisible: true })), []);
  const closePlayer = useCallback(() => setState((previous) => ({ ...previous, isPlayerVisible: false })), []);

  const value = useMemo<PlayerContextType>(() => ({ ...state, playTrack, pauseTrack, resumeTrack, nextTrack, prevTrack, seekTo, setVolume, toggleShuffle, toggleRepeat, openPlayer, closePlayer, toggleLike: library.toggleLike, likedTrackIds: new Set(Object.keys(library.likedTracks)), canPlayCurrentTrack: false }), [closePlayer, library.likedTracks, library.toggleLike, nextTrack, openPlayer, pauseTrack, playTrack, prevTrack, resumeTrack, seekTo, setVolume, state, toggleRepeat, toggleShuffle]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
}
