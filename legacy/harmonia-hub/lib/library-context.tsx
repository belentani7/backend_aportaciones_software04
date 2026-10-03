import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import type { Playlist, Track } from "@/shared/types";

const STORAGE_KEY = "belentani.library.v1";
const RECENT_LIMIT = 24;

type LibrarySnapshot = {
  savedPlaylists: Playlist[];
  likedTracks: Record<string, Track>;
  recentTracks: Track[];
};

const emptySnapshot: LibrarySnapshot = { savedPlaylists: [], likedTracks: {}, recentTracks: [] };

type LibraryContextValue = LibrarySnapshot & {
  hydrated: boolean;
  savePlaylist: (playlist: Playlist) => void;
  removePlaylist: (playlistId: string) => void;
  toggleLike: (track: Track) => void;
  isLiked: (trackId: string) => boolean;
  recordRecent: (track: Track) => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

function isSnapshot(value: unknown): value is LibrarySnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LibrarySnapshot>;
  return Array.isArray(candidate.savedPlaylists) && Array.isArray(candidate.recentTracks) && Boolean(candidate.likedTracks);
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<LibrarySnapshot>(emptySnapshot);
  const [hydrated, setHydrated] = useState(false);
  const { isAuthenticated } = useAuth();
  const remotePlaylists = trpc.library.listPlaylists.useQuery(undefined, { enabled: isAuthenticated });
  const remoteTrackStates = trpc.library.listTrackStates.useQuery(undefined, { enabled: isAuthenticated });
  const savePlaylistRemote = trpc.library.savePlaylist.useMutation();
  const removePlaylistRemote = trpc.library.removePlaylist.useMutation();
  const setTrackStateRemote = trpc.library.setTrackState.useMutation();

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw || !mounted) return;
        const parsed: unknown = JSON.parse(raw);
        if (isSnapshot(parsed)) setSnapshot(parsed);
      })
      .catch(() => undefined)
      .finally(() => { if (mounted) setHydrated(true); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!remotePlaylists.data) return;
    const savedPlaylists = remotePlaylists.data.map((playlist) => ({
      id: playlist.clientPlaylistId,
      title: playlist.title,
      description: playlist.description,
      coverUrl: playlist.coverUrl,
      tracks: playlist.tracks as Track[],
      mood: playlist.mood as Playlist["mood"],
      context: playlist.context as Playlist["context"],
      genres: playlist.genres as Playlist["genres"],
      createdAt: playlist.createdAt.toISOString(),
      isAIGenerated: playlist.source === "ai",
      playCount: 0,
    } satisfies Playlist));
    setSnapshot((current) => ({ ...current, savedPlaylists }));
  }, [remotePlaylists.data]);

  useEffect(() => {
    if (!remoteTrackStates.data) return;
    const likedTracks: Record<string, Track> = {};
    const recentTracks: Track[] = [];
    remoteTrackStates.data.forEach((item) => {
      const track = item.track as Track;
      if (item.state === "liked") likedTracks[track.id] = track;
      if (item.state === "recent") recentTracks.push(track);
    });
    setSnapshot((current) => ({ ...current, likedTracks, recentTracks: recentTracks.slice(0, RECENT_LIMIT) }));
  }, [remoteTrackStates.data]);

  const updateSnapshot = useCallback((updater: (current: LibrarySnapshot) => LibrarySnapshot) => {
    setSnapshot((current) => {
      const next = updater(current);
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const savePlaylist = useCallback((playlist: Playlist) => {
    updateSnapshot((current) => ({ ...current, savedPlaylists: [playlist, ...current.savedPlaylists.filter((item) => item.id !== playlist.id)] }));
    if (isAuthenticated) savePlaylistRemote.mutate(playlist);
  }, [isAuthenticated, savePlaylistRemote, updateSnapshot]);

  const removePlaylist = useCallback((playlistId: string) => {
    updateSnapshot((current) => ({ ...current, savedPlaylists: current.savedPlaylists.filter((playlist) => playlist.id !== playlistId) }));
    if (isAuthenticated) removePlaylistRemote.mutate({ playlistId });
  }, [isAuthenticated, removePlaylistRemote, updateSnapshot]);

  const toggleLike = useCallback((track: Track) => {
    updateSnapshot((current) => {
      const likedTracks = { ...current.likedTracks };
      if (likedTracks[track.id]) delete likedTracks[track.id];
      else likedTracks[track.id] = track;
      return { ...current, likedTracks };
    });
    if (isAuthenticated) setTrackStateRemote.mutate({ state: 'liked', track });
  }, [isAuthenticated, setTrackStateRemote, updateSnapshot]);

  const recordRecent = useCallback((track: Track) => {
    updateSnapshot((current) => ({ ...current, recentTracks: [track, ...current.recentTracks.filter((item) => item.id !== track.id)].slice(0, RECENT_LIMIT) }));
    if (isAuthenticated) setTrackStateRemote.mutate({ state: 'recent', track });
  }, [isAuthenticated, setTrackStateRemote, updateSnapshot]);

  const value = useMemo<LibraryContextValue>(() => ({
    ...snapshot,
    hydrated,
    savePlaylist,
    removePlaylist,
    toggleLike,
    isLiked: (trackId) => Boolean(snapshot.likedTracks[trackId]),
    recordRecent,
  }), [hydrated, recordRecent, removePlaylist, savePlaylist, snapshot, toggleLike]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary must be used within LibraryProvider");
  return context;
}
