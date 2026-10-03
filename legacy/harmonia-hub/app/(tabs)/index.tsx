import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const [vibe, setVibe] = useState('');
  const [playlistCount, setPlaylistCount] = useState(3);
  const [showCountOptions, setShowCountOptions] = useState(false);
  const platforms = ['Spotify', 'iTunes', 'Apple Music', 'Deezer', 'Tidal', 'Amazon Music'];
  const [selectedPlatform, setSelectedPlatform] = useState('Spotify');

  return (
    <ScreenContainer className="px-4 py-6">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Top Minimal AI Input */}
        <View className="mb-6">
          <View style={{ backgroundColor: 'rgba(18, 18, 24, 0.45)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.37, shadowRadius: 32 }} className="p-4 flex-row items-center">
            <IconSymbol name="sparkles" size={20} color="#c084fc" style={{ marginRight: 12 }} />
            <TextInput
              placeholder="Describe el momento que quieres escuchar…"
              placeholderTextColor="#687076"
              value={vibe}
              onChangeText={setVibe}
              accessibilityLabel="Describe tu intención musical"
              className="flex-1 text-foreground text-base py-1"
              returnKeyType="done"
            />
            <TouchableOpacity
              accessibilityLabel="Abrir generador de playlists"
              onPress={() => {
                if (vibe.trim()) {
                  router.push({ pathname: '/(tabs)/discover', params: { prompt: vibe, platform: selectedPlatform, count: playlistCount.toString() } });
                }
              }}
              style={{ backgroundColor: '#c084fc', padding: 8, borderRadius: 16 }}
            >
              <IconSymbol name="arrow.right" size={16} color="#151718" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Platforms Bar (Discrete Under Tab) */}
        <View className="mb-6">
          <Text className="text-xs text-muted mb-2 uppercase tracking-widest font-semibold">Preferencia de destino</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {platforms.map((p) => {
              const active = selectedPlatform === p;
              return (
                <TouchableOpacity
                  key={p}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => setSelectedPlatform(p)}
                  style={{
                    backgroundColor: active ? 'rgba(192, 132, 252, 0.15)' : 'rgba(18, 18, 24, 0.3)',
                    borderColor: active ? 'rgba(192, 132, 252, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: active ? '#c084fc' : '#9BA1A6', fontSize: 13, fontWeight: active ? '600' : '400' }}>
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text className="text-xs text-muted mt-2 leading-5">La conexión y exportación a plataformas se habilitará cuando cada proveedor esté verificado. Esta selección solo conserva tu preferencia.</Text>
        </View>

        {/* Playlist Count Expandable */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs text-muted uppercase tracking-widest font-semibold">Playlists per generation</Text>
            <TouchableOpacity onPress={() => setShowCountOptions(!showCountOptions)}>
              <Text className="text-xs text-primary font-bold">{playlistCount} ▾</Text>
            </TouchableOpacity>
          </View>
          {showCountOptions && (
            <View style={{ backgroundColor: 'rgba(18, 18, 24, 0.6)', borderColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderRadius: 16 }} className="p-3 flex-row justify-around">
              {[1, 3, 5, 10].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => {
                    setPlaylistCount(num);
                    setShowCountOptions(false);
                  }}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: playlistCount === num ? '#c084fc' : 'transparent' }}
                >
                  <Text style={{ color: playlistCount === num ? '#151718' : '#ECEDEE', fontWeight: 'bold' }}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Executive Council Quick Access */}
        <View className="mt-4">
          <TouchableOpacity
            onPress={() => router.push('/ceo-dashboard')}
            style={{ backgroundColor: 'rgba(18, 18, 24, 0.45)', borderColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderRadius: 24 }}
            className="p-5 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <View style={{ backgroundColor: 'rgba(192, 132, 252, 0.2)', padding: 10, borderRadius: 16 }}>
                <IconSymbol name="shield.fill" size={20} color="#c084fc" />
              </View>
              <View>
                <Text className="text-foreground font-bold text-base">Gobierno HARMONÍA</Text>
                <Text className="text-muted text-xs">Análisis, permisos y ledger PVC-U con control de owner</Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#9BA1A6" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
