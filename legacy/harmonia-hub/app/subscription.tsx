import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenContainer } from '@/components/screen-container';

export default function SubscriptionScreen() {
  return (
    <ScreenContainer containerClassName="bg-[#0A0A0E]" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Volver" onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}><IconSymbol name="arrow.left" size={22} color="#FFFFFF" /></Pressable>
          <Text style={styles.headerTitle}>Acceso y planes</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}><IconSymbol name="shield.fill" size={32} color="#A78BFA" /></View>
          <Text style={styles.title}>Sin pagos activos</Text>
          <Text style={styles.subtitle}>BELENTANI no procesa cobros ni promete beneficios de plan mientras no exista un proveedor de pagos y entitlements verificados.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estado actual</Text>
          <Feature icon="checkmark.circle.fill" text="Generación de playlists con IA, cuando el proveedor está disponible" positive />
          <Feature icon="checkmark.circle.fill" text="Biblioteca local de playlists, favoritos e historial" positive />
          <Feature icon="xmark.circle" text="Cobros, recibos y suscripciones" />
          <Feature icon="xmark.circle" text="Descargas, letras y catálogos con licencia" />
          <Feature icon="xmark.circle" text="Feature gates o derechos de plan" />
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Qué falta para activar planes</Text>
          <Text style={styles.noticeBody}>Un proveedor de pagos, tablas de entitlements, verificaciones del servidor y una política de privacidad y facturación revisadas. Hasta entonces, la aplicación no mostrará precios ni botones de compra.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Feature({ icon, text, positive = false }: { icon: 'checkmark.circle.fill' | 'xmark.circle'; text: string; positive?: boolean }) {
  return <View style={styles.feature}><IconSymbol name={icon} size={18} color={positive ? '#A78BFA' : '#6B7280'} /><Text style={[styles.featureText, !positive && styles.featurePending]}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#FFFFFF', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  hero: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 28, paddingBottom: 26 },
  heroIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(167,139,250,0.12)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.25)' },
  title: { color: '#FFFFFF', fontSize: 25, fontWeight: '800', marginTop: 16 },
  subtitle: { color: '#D1D5DB', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  card: { marginHorizontal: 20, borderRadius: 16, padding: 16, backgroundColor: '#18181D', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  cardTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginBottom: 12 },
  feature: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 7 },
  featureText: { flex: 1, color: '#FFFFFF', fontSize: 13, lineHeight: 19 },
  featurePending: { color: '#9CA3AF' },
  notice: { marginHorizontal: 20, marginTop: 16, padding: 15, borderRadius: 15, backgroundColor: 'rgba(109,40,217,0.12)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.22)' },
  noticeTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  noticeBody: { color: '#D1D5DB', fontSize: 12, lineHeight: 19, marginTop: 6 },
});
