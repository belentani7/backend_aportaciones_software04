import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Playlist } from '@/shared/types';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatNumber } from '@/lib/formatters';

const MOOD_COLORS: Record<string, string> = {
  focus: '#4A90E2',
  chill: '#50C878',
  energy: '#FF6B35',
  sad: '#9B59B6',
  party: '#F39C12',
  sleep: '#2C3E50',
  romantic: '#E91E63',
  workout: '#F44336',
};

interface PlaylistCardProps {
  playlist: Playlist;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function PlaylistCard({ playlist, onPress, size = 'medium' }: PlaylistCardProps) {
  const isSmall = size === 'small';
  const cardSize = isSmall ? 140 : size === 'large' ? 200 : 160;
  const moodColor = playlist.mood ? MOOD_COLORS[playlist.mood] : '#1DB954';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, { width: cardSize }, pressed && { opacity: 0.8 }]}
    >
      <View style={[styles.imageContainer, { width: cardSize, height: cardSize }]}>
        <Image
          source={{ uri: playlist.coverUrl }}
          style={[styles.image, { width: cardSize, height: cardSize }]}
        />
        {playlist.isAIGenerated && (
          <View style={styles.aiBadge}>
            <IconSymbol name="sparkles" size={10} color="#121212" />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        )}
        <View style={[styles.moodDot, { backgroundColor: moodColor }]} />
      </View>
      <Text style={styles.title} numberOfLines={2}>{playlist.title}</Text>
      <Text style={styles.meta}>{formatNumber(playlist.playCount)} plays</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  imageContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#2A2A2A',
  },
  image: {
    borderRadius: 10,
  },
  aiBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#1DB954',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  aiBadgeText: {
    color: '#121212',
    fontSize: 9,
    fontWeight: '700',
  },
  moodDot: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  meta: {
    color: '#B3B3B3',
    fontSize: 11,
  },
});
