import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { MiniPlayer } from '@/components/mini-player';
import { ScreenContainer } from '@/components/screen-container';
import { useLibrary } from '@/lib/library-context';
import { usePlayer } from '@/lib/player-context';
import type { Playlist, Track } from '@/shared/types';

type LibraryTab = 'playlists' | 'liked' | 'recent';

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<LibraryTab>('playlists');
  const { hydrated, savedPlaylists, likedTracks, recentTracks, removePlaylist } = useLibrary();
  const { currentTrack, playTrack, openPlayer } = usePlayer();
  const liked = Object.values(likedTracks);

  const openPlaylist = (playlist: Playlist) => {
    const firstTrack = playlist.tracks[0];
    if (firstTrack) playTrack(firstTrack, playlist);
  };

  const selectTrack = (track: Track) => {
    playTrack(track);
    openPlayer();
  };

  return (
    <View style={styles.outerContainer}>
      <ScreenContainer containerClassName="bg-[#0A0A0E]" edges={['top', 'left', 'right']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>TU ESPACIO</Text>
              <Text style={styles.title}>Biblioteca</Text>
            </View>
            <Pressable accessibilityLabel="Crear una playlist" onPress={() => router.push('/(tabs)/discover')} style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}>
              <IconSymbol name="plus" size={22} color="#0A0A0E" />
            </Pressable>
          </View>

          <View style={styles.tabs} accessibilityRole="tablist">
            {(['playlists', 'liked', 'recent'] as LibraryTab[]).map((tab) => (
              <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab }} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab === 'playlists' ? 'Playlists' : tab === 'liked' ? 'Favoritas' : 'Recientes'}</Text>
              </Pressable>
            ))}
          </View>

          {!hydrated ? <LoadingState /> : null}
          {hydrated && activeTab === 'playlists' && (
            savedPlaylists.length > 0 ? (
              <View style={styles.playlistList}>
                {savedPlaylists.map((playlist) => (
                  <PlaylistItem key={playlist.id} playlist={playlist} onPress={() => openPlaylist(playlist)} onRemove={() => removePlaylist(playlist.id)} />
                ))}
              </View>
            ) : <EmptyState icon="sparkles" title="Aún no guardaste playlists" body="Genera una selección con IA y guárdala para tenerla siempre en tu biblioteca." action="Crear una playlist" onPress={() => router.push('/(tabs)/discover')} />
          )}
          {hydrated && activeTab === 'liked' && (
            liked.length > 0
              ? <TrackList tracks={liked} onSelect={selectTrack} />
              : <EmptyState icon="heart" title="Sin pistas favoritas" body="Añade una pista a favoritos desde cualquier selección generada." />
          )}
          {hydrated && activeTab === 'recent' && (
            recentTracks.length > 0
              ? <TrackList tracks={recentTracks} onSelect={selectTrack} />
              : <EmptyState icon="clock" title="Sin actividad reciente" body="Cuando revises una pista, aparecerá aquí. El historial no inventa reproducciones." />
          )}

          <View style={styles.creatorNotice}>
            <IconSymbol name="person.2.fill" size={20} color="#A78BFA" />
            <View style={styles.creatorCopy}>
              <Text style={styles.creatorTitle}>Espacio de artistas</Text>
              <Text style={styles.creatorBody}>La integración para creadores se activará cuando existan catálogo y acuerdos verificados.</Text>
            </View>
          </View>
          <View style={{ height: currentTrack ? 92 : 32 }} />
        </ScrollView>
      </ScreenContainer>
      {currentTrack ? <View style={styles.miniPlayerContainer}><MiniPlayer onPress={openPlayer} /></View> : null}
    </View>
  );
}

function PlaylistItem({ playlist, onPress, onRemove }: { playlist: Playlist; onPress: () => void; onRemove: () => void }) {
  return (
    <View style={styles.playlistItem}>
      <Pressable accessibilityLabel={`Abrir ${playlist.title}`} onPress={onPress} style={({ pressed }) => [styles.playlistMain, pressed && { opacity: 0.72 }]}>
        <Image source={{ uri: playlist.coverUrl }} style={styles.playlistCover} />
        <View style={styles.playlistCopy}>
          <Text style={styles.playlistTitle} numberOfLines={1}>{playlist.title}</Text>
          <Text style={styles.playlistDescription} numberOfLines={2}>{playlist.description}</Text>
          <Text style={styles.playlistMeta}>{playlist.tracks.length} pistas · {playlist.isAIGenerated ? 'Selección IA' : 'Selección manual'}</Text>
        </View>
      </Pressable>
      <Pressable accessibilityLabel={`Quitar ${playlist.title}`} onPress={onRemove} style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.6 }]}>
        <IconSymbol name="xmark" size={16} color="#9CA3AF" />
      </Pressable>
    </View>
  );
}

function TrackList({ tracks, onSelect }: { tracks: Track[]; onSelect: (track: Track) => void }) {
  return <View style={styles.trackList}>{tracks.map((track) => <TrackItem key={track.id} track={track} onPress={() => onSelect(track)} />)}</View>;
}

function TrackItem({ track, onPress }: { track: Track; onPress: () => void }) {
  return <Pressable accessibilityLabel={`Seleccionar ${track.title}`} onPress={onPress} style={({ pressed }) => [styles.trackItem, pressed && { opacity: 0.72 }]}>
    <Image source={{ uri: track.coverUrl }} style={styles.trackCover} />
    <View style={styles.trackCopy}><Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text><Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text></View>
    <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
  </Pressable>;
}

function LoadingState() {
  return <View style={styles.emptyState}><Text style={styles.emptyTitle}>Cargando tu biblioteca</Text><Text style={styles.emptyBody}>Recuperando únicamente contenido guardado en este dispositivo.</Text></View>;
}

function EmptyState({ icon, title, body, action, onPress }: { icon: 'sparkles' | 'heart' | 'clock'; title: string; body: string; action?: string; onPress?: () => void }) {
  return <View style={styles.emptyState}><IconSymbol name={icon} size={40} color="#6D28D9" /><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text>{action && onPress ? <Pressable onPress={onPress} style={styles.emptyAction}><Text style={styles.emptyActionText}>{action}</Text></Pressable> : null}</View>;
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#0A0A0E' },
  scrollContent: { paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16 },
  eyebrow: { color: '#A78BFA', fontSize: 10, letterSpacing: 1.4, fontWeight: '800' },
  title: { color: '#FFFFFF', fontSize: 28, lineHeight: 34, fontWeight: '800', marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#A78BFA' },
  tabs: { flexDirection: 'row', marginHorizontal: 20, gap: 8, marginBottom: 18 },
  tab: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#18181D' },
  activeTab: { backgroundColor: '#2A2635', borderWidth: 1, borderColor: 'rgba(167,139,250,0.4)' },
  tabText: { color: '#9CA3AF', fontSize: 13, fontWeight: '700' },
  activeTabText: { color: '#FFFFFF' },
  playlistList: { paddingHorizontal: 20, gap: 12 },
  playlistItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 10, backgroundColor: '#18181D', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  playlistMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  playlistCover: { width: 64, height: 64, borderRadius: 11, backgroundColor: '#24242B' },
  playlistCopy: { flex: 1 },
  playlistTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  playlistDescription: { color: '#D1D5DB', fontSize: 12, lineHeight: 17, marginTop: 3 },
  playlistMeta: { color: '#9CA3AF', fontSize: 11, marginTop: 5 },
  removeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  trackList: { gap: 2 },
  trackItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 10 },
  trackCover: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#24242B' },
  trackCopy: { flex: 1 },
  trackTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  trackArtist: { color: '#9CA3AF', fontSize: 12, marginTop: 3 },
  emptyState: { alignItems: 'center', paddingHorizontal: 36, paddingVertical: 56, gap: 11 },
  emptyTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyBody: { color: '#9CA3AF', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  emptyAction: { marginTop: 5, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#A78BFA' },
  emptyActionText: { color: '#0A0A0E', fontSize: 12, fontWeight: '800' },
  creatorNotice: { flexDirection: 'row', gap: 11, marginHorizontal: 20, marginTop: 22, padding: 14, borderRadius: 14, backgroundColor: 'rgba(109,40,217,0.12)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  creatorCopy: { flex: 1 },
  creatorTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  creatorBody: { color: '#D1D5DB', fontSize: 12, lineHeight: 18, marginTop: 3 },
  miniPlayerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
