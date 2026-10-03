import { useState } from 'react';
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenContainer } from '@/components/screen-container';
import { formatDuration } from '@/lib/formatters';
import { usePlayer } from '@/lib/player-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ALBUM_SIZE = SCREEN_WIDTH - 64;

export default function PlayerScreen() {
  const { currentTrack, playbackStatus, nextTrack, prevTrack, toggleLike, likedTrackIds, closePlayer } = usePlayer();
  const [activeTab, setActiveTab] = useState<'info' | 'insight'>('info');

  if (!currentTrack) return null;

  const isLiked = likedTrackIds.has(currentTrack.id);
  const audioUnavailable = playbackStatus === 'unavailable';

  return (
    <ScreenContainer containerClassName="bg-[#0A0A0E]" edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Cerrar reproductor" onPress={closePlayer} style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}>
            <IconSymbol name="chevron.down" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerLabel}>SELECCIÓN ACTUAL</Text>
          </View>
          <View style={styles.headerBtn} />
        </View>

        <View style={styles.albumContainer}>
          <Image source={{ uri: currentTrack.coverUrl }} style={[styles.albumArt, { width: ALBUM_SIZE, height: ALBUM_SIZE }]} />
          <View style={styles.albumGlow} />
        </View>

        <View style={styles.trackInfo}>
          <View style={styles.trackInfoLeft}>
            <Text style={styles.trackTitle} numberOfLines={2}>{currentTrack.title}</Text>
            <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>
          <Pressable accessibilityLabel={isLiked ? 'Quitar de favoritos' : 'Guardar en favoritos'} onPress={() => toggleLike(currentTrack)} style={({ pressed }) => [styles.likeBtn, pressed && { opacity: 0.6 }]}>
            <IconSymbol name={isLiked ? 'heart.fill' : 'heart'} size={26} color={isLiked ? '#8B5CF6' : '#B3B3B3'} />
          </Pressable>
        </View>

        <View style={[styles.audioState, audioUnavailable && styles.audioUnavailable]} accessibilityRole="text">
          <IconSymbol name={audioUnavailable ? 'exclamationmark.triangle.fill' : 'waveform'} size={17} color={audioUnavailable ? '#FCA5A5' : '#A78BFA'} />
          <View style={styles.audioCopy}>
            <Text style={styles.audioStateLabel}>{audioUnavailable ? 'Audio no conectado' : 'Fuente en preparación'}</Text>
            <Text style={styles.audioStateDescription}>
              {audioUnavailable
                ? 'Esta pista no incluye una fuente reproducible autorizada. No se simula progreso ni reproducción.'
                : 'La reproducción se habilitará cuando la fuente de audio sea validada.'}
            </Text>
          </View>
        </View>

        <View style={styles.durationRow} accessibilityRole="text">
          <Text style={styles.durationLabel}>Duración informativa</Text>
          <Text style={styles.durationValue}>{formatDuration(currentTrack.duration)}</Text>
        </View>

        <View style={styles.selectionControls}>
          <Pressable accessibilityLabel="Pista anterior" onPress={prevTrack} style={({ pressed }) => [styles.controlBtn, pressed && { opacity: 0.7 }]}>
            <IconSymbol name="backward.fill" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={styles.selectionMarker} accessibilityLabel="Reproducción no disponible">
            <IconSymbol name="waveform" size={30} color="#0A0A0E" />
          </View>
          <Pressable accessibilityLabel="Pista siguiente" onPress={nextTrack} style={({ pressed }) => [styles.controlBtn, pressed && { opacity: 0.7 }]}>
            <IconSymbol name="forward.fill" size={28} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {(['info', 'insight'] as const).map((tab) => (
            <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab }} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab === 'info' ? 'Detalles' : 'Criterio IA'}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'info' && (
            <View style={styles.infoGrid}>
              {currentTrack.bpm ? <InfoItem label="BPM" value={String(currentTrack.bpm)} /> : null}
              {currentTrack.mood ? <InfoItem label="MOOD" value={currentTrack.mood.toUpperCase()} /> : null}
              {currentTrack.genre ? <InfoItem label="GÉNERO" value={currentTrack.genre.toUpperCase()} /> : null}
              <InfoItem label="ÁLBUM" value={currentTrack.album} />
            </View>
          )}
          {activeTab === 'insight' && (
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <IconSymbol name="sparkles" size={18} color="#A78BFA" />
                <Text style={styles.insightTitle}>Por qué esta selección</Text>
              </View>
              <Text style={styles.insightText}>{currentTrack.aiInsight ?? 'No hay explicación de IA disponible para esta pista.'}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoItem}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '700', letterSpacing: 1.8 },
  albumContainer: { alignItems: 'center', paddingHorizontal: 32, marginTop: 12, position: 'relative' },
  albumArt: { borderRadius: 20, backgroundColor: '#1E1E1E' },
  albumGlow: { position: 'absolute', bottom: -20, width: SCREEN_WIDTH - 88, height: 40, backgroundColor: '#8B5CF6', opacity: 0.18, borderRadius: 50, transform: [{ scaleX: 0.9 }] },
  trackInfo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginTop: 32 },
  trackInfoLeft: { flex: 1 },
  trackTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', lineHeight: 28 },
  trackArtist: { color: '#D1D5DB', fontSize: 15, marginTop: 4 },
  likeBtn: { padding: 10 },
  audioState: { flexDirection: 'row', gap: 10, marginHorizontal: 24, marginTop: 18, borderRadius: 14, padding: 13, backgroundColor: 'rgba(139,92,246,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.22)' },
  audioUnavailable: { backgroundColor: 'rgba(127,29,29,0.22)', borderColor: 'rgba(248,113,113,0.35)' },
  audioCopy: { flex: 1 },
  audioStateLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  audioStateDescription: { color: '#D1D5DB', fontSize: 12, lineHeight: 18, marginTop: 4 },
  durationRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 24, marginTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  durationLabel: { color: '#9CA3AF', fontSize: 12 },
  durationValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  selectionControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30, marginTop: 20 },
  controlBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  selectionMarker: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#A78BFA', alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', marginHorizontal: 24, marginTop: 26, backgroundColor: '#18181D', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  activeTab: { backgroundColor: '#2A2635' },
  tabText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  activeTabText: { color: '#FFFFFF' },
  tabContent: { marginHorizontal: 24, marginTop: 16 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoItem: { minWidth: '45%', flex: 1, backgroundColor: '#18181D', borderRadius: 12, padding: 13 },
  infoLabel: { color: '#9CA3AF', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 5 },
  infoValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  insightCard: { backgroundColor: '#18181D', borderRadius: 14, padding: 16, borderLeftWidth: 3, borderLeftColor: '#8B5CF6' },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  insightTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  insightText: { color: '#D1D5DB', fontSize: 14, lineHeight: 22 },
});
