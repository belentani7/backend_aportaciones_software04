import React, { useState, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Dimensions, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    icon: 'sparkles' as const,
    color: '#A78BFA',
    title: 'Tu intención, una selección',
    subtitle: 'Describe un momento, elige un mood y genera una playlist explicable con IA.',
  },
  {
    id: 2,
    icon: 'brain' as const,
    color: '#A78BFA',
    title: 'Control humano por diseño',
    subtitle: 'HARMONÍA registra análisis y automatizaciones con permisos explícitos, kill switch y auditoría PVC-U.',
  },
  {
    id: 3,
    icon: 'waveform' as const,
    color: '#A78BFA',
    title: 'Criterio que puedes revisar',
    subtitle: 'Cada pista puede incluir el motivo de su selección. Si la IA falla, verás un estado recuperable, no contenido inventado.',
  },
  {
    id: 4,
    icon: 'heart' as const,
    color: '#A78BFA',
    title: 'Tu biblioteca, sin ruido',
    subtitle: 'Guarda playlists, favoritos e historial en este dispositivo. El audio y los pagos solo aparecerán cuando estén conectados de verdad.',
  },
];

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollRef.current?.scrollTo({ x: nextSlide * SCREEN_WIDTH, animated: true });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/');
  };

  const handleScroll = (event: any) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentSlide(page);
  };

  return (
    <View style={styles.container}>
      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.slidesContainer}
      >
        {SLIDES.map((s, index) => (
          <View key={s.id} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: s.color + '20' }]}>
              <IconSymbol name={s.icon} size={64} color={s.color} />
            </View>

            {/* Brand */}
            <Text style={styles.brandName}>BELENTANI</Text>

            {/* Content */}
            <Text style={styles.slideTitle}>{s.title}</Text>
            <Text style={styles.slideSubtitle}>{s.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => {
                setCurrentSlide(i);
                scrollRef.current?.scrollTo({ x: i * SCREEN_WIDTH, animated: true });
              }}
              style={[
                styles.dot,
                  i === currentSlide && { width: 24, backgroundColor: '#A78BFA' },
              ]}
            />
          ))}
        </View>

        {/* Next / Get Started Button */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.nextBtn, pressed && { transform: [{ scale: 0.97 }] }]}
        >
          <Text style={styles.nextBtnText}>
            {currentSlide === SLIDES.length - 1 ? 'Empezar' : 'Continuar'}
          </Text>
          <IconSymbol
            name={currentSlide === SLIDES.length - 1 ? 'sparkles' : 'chevron.right'}
            size={18}
            color="#121212"
          />
        </Pressable>

        {/* Skip */}
        {currentSlide < SLIDES.length - 1 && (
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.skipText}>Saltar</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
    gap: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brandName: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 4,
  },
  slideTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 36,
  },
  slideSubtitle: {
    color: '#B3B3B3',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomControls: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 24,
    alignItems: 'center',
    gap: 16,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333333',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#A78BFA',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '700',
  },
  skipBtn: {
    paddingVertical: 8,
  },
  skipText: {
    color: '#B3B3B3',
    fontSize: 14,
  },
});
