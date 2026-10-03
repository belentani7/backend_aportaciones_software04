import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, FlatList, Image, Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { GlassCard } from '@/components/glass-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TrackRow } from '@/components/track-row';
import { MiniPlayer } from '@/components/mini-player';
import { useLibrary } from '@/lib/library-context';
import { usePlayer } from '@/lib/player-context';
import { GLASS_COLORS } from '@/lib/glass-morphism';
import { Mood, Playlist, Track } from '@/shared/types';
import { trpc } from '@/lib/trpc';

const MOODS: { id: Mood; label: string; emoji: string }[] = [
  { id: 'focus', label: 'Focus', emoji: '🎯' },
  { id: 'chill', label: 'Chill', emoji: '🌊' },
  { id: 'energy', label: 'Energy', emoji: '⚡' },
  { id: 'sad', label: 'Sad', emoji: '🌧️' },
  { id: 'party', label: 'Party', emoji: '🎉' },
  { id: 'sleep', label: 'Sleep', emoji: '🌙' },
  { id: 'romantic', label: 'Romantic', emoji: '💕' },
  { id: 'workout', label: 'Workout', emoji: '💪' },
];

export default function DiscoverScreen() {
  const { playTrack, openPlayer } = usePlayer();
  const { savePlaylist } = useLibrary();
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<Playlist | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [creativity, setCreativity] = useState<'high' | 'low'>('high');
  const [strictMode, setStrictMode] = useState(false);
  const [trackCount, setTrackCount] = useState(8);

  const generateMutation = trpc.playlist.generate.useMutation({
    onSuccess: (data: any) => {
      setGeneratedPlaylist(data as Playlist);
    },
    onError: (error: any) => {
      console.error('Generation error:', error);
      Alert.alert('No se pudo generar', 'La IA no respondió con una playlist válida. Conservamos tus ajustes para que puedas reintentar.');
    },
  });

  const handleGenerate = async () => {
    if (!selectedMood) {
      Alert.alert('Select a Mood', 'Choose a mood to generate a playlist.');
      return;
    }
    setGeneratedPlaylist(null);

    try {
      await generateMutation.mutateAsync({
        mood: selectedMood,
        trackCount,
        creativity,
        strictMode,
      });
    } catch (error) {
      console.error('Mutation error:', error);
      // onError ya ofrece una salida recuperable sin sustituir el resultado por datos ficticios.
    }
  };

  const handleTrackPress = (track: Track) => {
    if (generatedPlaylist) {
      playTrack(track, generatedPlaylist);
      openPlayer();
    }
  };

  return (
    <View style={styles.outerContainer}>
      <ScreenContainer containerClassName="bg-[#0A0A0E]" edges={['top', 'left', 'right']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>AI Generator</Text>
          <Text style={styles.subtitle}>Define tu intención; la IA explicará cada selección.</Text>
          </View>

          {/* Mood Grid */}
          <View style={styles.moodSection}>
            <View style={styles.moodGrid}>
              {MOODS.map(mood => (
                <Pressable
                  key={mood.id}
                  onPress={() => setSelectedMood(selectedMood === mood.id ? null : mood.id)}
                  style={({ pressed }) => [
                    styles.moodBtn,
                    selectedMood === mood.id && styles.moodBtnActive,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[styles.moodLabel, selectedMood === mood.id && { color: GLASS_COLORS.purpleSoft }]}>
                    {mood.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Advanced Settings - Hidden by Default */}
          <Pressable
            onPress={() => setShowAdvanced(!showAdvanced)}
            style={({ pressed }) => [styles.advancedToggle, pressed && { opacity: 0.7 }]}
          >
            <IconSymbol
              name={showAdvanced ? 'chevron.up' : 'chevron.down'}
              size={16}
              color={GLASS_COLORS.textMuted}
            />
              <Text style={styles.advancedLabel}>Ajustes de generación</Text>
            <View style={styles.advancedBadge}>
              <Text style={styles.advancedBadgeText}>Pro</Text>
            </View>
          </Pressable>

          {/* Advanced Settings Panel */}
          {showAdvanced && (
            <GlassCard variant="subtle" style={styles.advancedPanel}>
              {/* Creativity Level */}
              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingLabel}>Creativity</Text>
                  <Text style={styles.settingValue}>{creativity === 'high' ? 'Experimental' : 'Conservative'}</Text>
                </View>
                <View style={styles.toggleGroup}>
                  <Pressable
                    onPress={() => setCreativity('low')}
                    style={[styles.toggleBtn, creativity === 'low' && styles.toggleBtnActive]}
                  >
                    <Text style={[styles.toggleText, creativity === 'low' && { color: GLASS_COLORS.black }]}>Low</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setCreativity('high')}
                    style={[styles.toggleBtn, creativity === 'high' && styles.toggleBtnActive]}
                  >
                    <Text style={[styles.toggleText, creativity === 'high' && { color: GLASS_COLORS.black }]}>High</Text>
                  </Pressable>
                </View>
              </View>

              {/* Strict Mode */}
              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingLabel}>Strict Mode</Text>
                  <Text style={styles.settingValue}>{strictMode ? 'Enabled' : 'Disabled'}</Text>
                </View>
                <Pressable
                  onPress={() => setStrictMode(!strictMode)}
                  style={[styles.toggleSwitch, strictMode && styles.toggleSwitchActive]}
                >
                  <View style={[styles.toggleDot, strictMode && styles.toggleDotActive]} />
                </Pressable>
              </View>

              {/* Track Count */}
              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingLabel}>Tracks</Text>
                  <Text style={styles.settingValue}>{trackCount}</Text>
                </View>
                <View style={styles.countControls}>
                  <Pressable
                    onPress={() => setTrackCount(Math.max(4, trackCount - 1))}
                    style={({ pressed }) => [styles.countBtn, pressed && { opacity: 0.7 }]}
                  >
                    <IconSymbol name="minus" size={14} color={GLASS_COLORS.textPrimary} />
                  </Pressable>
                  <Pressable
                    onPress={() => setTrackCount(Math.min(20, trackCount + 1))}
                    style={({ pressed }) => [styles.countBtn, pressed && { opacity: 0.7 }]}
                  >
                    <IconSymbol name="plus" size={14} color={GLASS_COLORS.textPrimary} />
                  </Pressable>
                </View>
              </View>
              <Text style={styles.advancedNote}>Estos ajustes se envían al proveedor de IA junto con el número de pistas.</Text>
            </GlassCard>
          )}

          {/* Generate Button */}
          <View style={styles.generateContainer}>
            <Pressable
              onPress={handleGenerate}
              disabled={generateMutation.isPending || !selectedMood}
              style={({ pressed }) => [
                styles.generateBtn,
                (generateMutation.isPending || !selectedMood) && styles.generateBtnDisabled,
                pressed && !generateMutation.isPending && { transform: [{ scale: 0.97 }] },
              ]}
            >
              {generateMutation.isPending ? (
                <View style={styles.generateBtnContent}>
                  <ActivityIndicator size="small" color={GLASS_COLORS.black} />
                  <Text style={styles.generateBtnText}>Generando con IA…</Text>
                </View>
              ) : (
                <View style={styles.generateBtnContent}>
                  <IconSymbol name="sparkles" size={18} color={GLASS_COLORS.black} />
                  <Text style={styles.generateBtnText}>Generar playlist</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Generated Playlist */}
          {generatedPlaylist && (
            <View style={styles.playlistContainer}>
              <View style={styles.playlistHeader}>
                <Image
                  source={{ uri: generatedPlaylist.coverUrl }}
                  style={styles.playlistCover}
                />
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistTitle}>{generatedPlaylist.title}</Text>
                  <Text style={styles.playlistDescription} numberOfLines={2}>
                    {generatedPlaylist.description}
                  </Text>
                  <Text style={styles.playlistCount}>{generatedPlaylist.tracks.length} tracks</Text>
                </View>
              </View>

              {/* Tracks */}
              <FlatList
                scrollEnabled={false}
                data={generatedPlaylist.tracks}
                keyExtractor={track => track.id}
                renderItem={({ item, index }) => (
                  <TrackRow
                    track={item}
                    index={index}
                    onPress={() => handleTrackPress(item)}
                    showIndex={true}
                  />
                )}
                ItemSeparatorComponent={() => <View style={styles.trackSeparator} />}
              />

              {/* Save Button */}
              <Pressable
                onPress={() => {
                  savePlaylist(generatedPlaylist);
                  Alert.alert('Guardada', 'La playlist ya forma parte de tu biblioteca local en este dispositivo.');
                }}
                style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
              >
                <IconSymbol name="heart.fill" size={16} color={GLASS_COLORS.purpleSoft} />
                <Text style={styles.saveBtnText}>Guardar en biblioteca</Text>
              </Pressable>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </ScreenContainer>

      {/* Mini Player */}
      <MiniPlayer onPress={openPlayer} />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: GLASS_COLORS.black },
  scrollContent: { paddingBottom: 20 },

  header: { paddingHorizontal: 16, paddingVertical: 16, gap: 4 },
  title: { color: GLASS_COLORS.textPrimary, fontSize: 24, fontWeight: '800' },
  subtitle: { color: GLASS_COLORS.textMuted, fontSize: 14 },

  moodSection: { paddingHorizontal: 16, marginTop: 12 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moodBtn: {
    width: '30%',
    backgroundColor: GLASS_COLORS.glassDark,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: GLASS_COLORS.borderGlass,
  },
  moodBtnActive: { backgroundColor: GLASS_COLORS.glassAccent, borderColor: GLASS_COLORS.purpleSoft },
  moodEmoji: { fontSize: 24 },
  moodLabel: { color: GLASS_COLORS.textMuted, fontSize: 11, fontWeight: '600', textAlign: 'center' },

  advancedToggle: {
    marginHorizontal: 16,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  advancedLabel: { color: GLASS_COLORS.textMuted, fontSize: 13, fontWeight: '600', flex: 1 },
  advancedBadge: { backgroundColor: GLASS_COLORS.purpleSoft, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  advancedBadgeText: { color: GLASS_COLORS.black, fontSize: 10, fontWeight: '700' },

  advancedPanel: { marginHorizontal: 16, marginTop: 12, padding: 16, gap: 16 },
  advancedNote: { color: GLASS_COLORS.textMuted, fontSize: 11, lineHeight: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLabel: { color: GLASS_COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  settingValue: { color: GLASS_COLORS.textMuted, fontSize: 11, marginTop: 4 },

  toggleGroup: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    backgroundColor: GLASS_COLORS.glassDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: GLASS_COLORS.borderGlass,
  },
  toggleBtnActive: { backgroundColor: GLASS_COLORS.purpleSoft, borderColor: GLASS_COLORS.purpleSoft },
  toggleText: { color: GLASS_COLORS.textMuted, fontSize: 11, fontWeight: '600' },

  toggleSwitch: {
    backgroundColor: GLASS_COLORS.glassDark,
    borderRadius: 12,
    width: 40,
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: { backgroundColor: GLASS_COLORS.purpleSoft },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GLASS_COLORS.textMuted,
  },
  toggleDotActive: { backgroundColor: GLASS_COLORS.black, alignSelf: 'flex-end' },

  countControls: { flexDirection: 'row', gap: 8 },
  countBtn: {
    backgroundColor: GLASS_COLORS.glassDark,
    borderRadius: 8,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS_COLORS.borderGlass,
  },

  generateContainer: { paddingHorizontal: 16, marginTop: 20 },
  generateBtn: {
    backgroundColor: GLASS_COLORS.purpleSoft,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  generateBtnDisabled: { backgroundColor: GLASS_COLORS.borderGlass },
  generateBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  generateBtnText: { color: GLASS_COLORS.black, fontSize: 15, fontWeight: '700' },

  playlistContainer: { marginHorizontal: 16, marginTop: 20, gap: 12 },
  playlistHeader: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: GLASS_COLORS.glassDark,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: GLASS_COLORS.borderGlass,
  },
  playlistCover: { width: 80, height: 80, borderRadius: 8 },
  playlistInfo: { flex: 1, justifyContent: 'space-between' },
  playlistTitle: { color: GLASS_COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  playlistDescription: { color: GLASS_COLORS.textMuted, fontSize: 12, lineHeight: 16 },
  playlistCount: { color: GLASS_COLORS.textMuted, fontSize: 11 },

  trackSeparator: { height: 1, backgroundColor: GLASS_COLORS.borderGlass, marginVertical: 8 },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: GLASS_COLORS.glassDark,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: GLASS_COLORS.borderPurple,
    justifyContent: 'center',
  },
  saveBtnText: { color: GLASS_COLORS.purpleSoft, fontSize: 14, fontWeight: '700' },
});
