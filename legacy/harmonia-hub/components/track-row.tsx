import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Track } from '@/shared/types';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatDuration } from '@/lib/formatters';
import { usePlayer } from '@/lib/player-context';

interface TrackRowProps {
  track: Track;
  index?: number;
  onPress: () => void;
  showIndex?: boolean;
}

export function TrackRow({ track, index, onPress, showIndex = false }: TrackRowProps) {
  const { currentTrack, isPlaying, toggleLike, likedTrackIds } = usePlayer();
  const isCurrentTrack = currentTrack?.id === track.id;
  const isLiked = likedTrackIds.has(track.id);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.7 }]}
    >
      {showIndex && (
        <View style={styles.indexContainer}>
          {isCurrentTrack && isPlaying ? (
            <IconSymbol name="waveform" size={16} color="#1DB954" />
          ) : (
            <Text style={[styles.index, isCurrentTrack && styles.activeText]}>
              {index !== undefined ? index + 1 : ''}
            </Text>
          )}
        </View>
      )}

      <Image source={{ uri: track.coverUrl }} style={styles.cover} />

      <View style={styles.info}>
        <Text style={[styles.title, isCurrentTrack && styles.activeText]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
      </View>

      <Pressable
        onPress={() => toggleLike(track)}
        style={({ pressed }) => [styles.likeBtn, pressed && { opacity: 0.6 }]}
        hitSlop={8}
      >
        <IconSymbol
          name={isLiked ? 'heart.fill' : 'heart'}
          size={18}
          color={isLiked ? '#1DB954' : '#B3B3B3'}
        />
      </Pressable>

      <Text style={styles.duration}>{formatDuration(track.duration)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  indexContainer: {
    width: 20,
    alignItems: 'center',
  },
  index: {
    color: '#B3B3B3',
    fontSize: 14,
  },
  cover: {
    width: 46,
    height: 46,
    borderRadius: 6,
    backgroundColor: '#2A2A2A',
  },
  info: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  artist: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 2,
  },
  activeText: {
    color: '#1DB954',
  },
  likeBtn: {
    padding: 4,
  },
  duration: {
    color: '#B3B3B3',
    fontSize: 12,
    minWidth: 36,
    textAlign: 'right',
  },
});
