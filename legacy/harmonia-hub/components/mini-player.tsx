import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { usePlayer } from '@/lib/player-context';

export function MiniPlayer({ onPress }: { onPress: () => void }) {
  const { currentTrack, nextTrack, playbackStatus } = usePlayer();
  if (!currentTrack) return null;

  const unavailable = playbackStatus === 'unavailable';
  return (
    <Pressable accessibilityLabel={`Abrir detalles de ${currentTrack.title}`} onPress={onPress} style={({ pressed }) => [styles.container, pressed && { opacity: 0.82 }]}>
      <View style={styles.content}>
        <Image source={{ uri: currentTrack.coverUrl }} style={styles.cover} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{unavailable ? 'Audio no conectado' : currentTrack.artist}</Text>
        </View>
        <Pressable accessibilityLabel="Seleccionar pista siguiente" onPress={nextTrack} hitSlop={8} style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.6 }]}>
          <IconSymbol name="forward.fill" size={21} color="#D1D5DB" />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#18181D', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, marginHorizontal: 8, marginBottom: 4, overflow: 'hidden' },
  content: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 12 },
  cover: { width: 44, height: 44, borderRadius: 9, backgroundColor: '#24242B' },
  info: { flex: 1 },
  title: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  artist: { color: '#A78BFA', fontSize: 12, marginTop: 3 },
  nextBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
});
