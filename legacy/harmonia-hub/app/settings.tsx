import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenContainer } from '@/components/screen-container';

export default function SettingsScreen() {
  return (
    <ScreenContainer containerClassName="bg-[#0A0A0E]" edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Volver" onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
            <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.title}>Ajustes</Text>
          <View style={styles.backBtn} />
        </View>

        <Section title="PRIVACIDAD Y DATOS">
          <Capability icon="shield.fill" title="Biblioteca en este dispositivo" description="Tus playlists, favoritos e historial se guardan localmente hasta que conectes una sesión de sincronización." state="ACTIVO" />
          <Capability icon="lock.fill" title="Sesión y secretos" description="Las credenciales no se muestran en la app. Las acciones administrativas se verifican en el servidor." state="PROTEGIDO" />
        </Section>

        <Section title="CAPACIDADES">
          <Capability icon="waveform" title="Reproducción de audio" description="No hay fuente de audio conectada. La aplicación no simula progreso, descargas ni reproducción." state="PENDIENTE" warning />
          <Capability icon="bell.fill" title="Notificaciones" description="No se solicitan permisos ni se envían notificaciones hasta configurar un servicio de entrega y sus preferencias." state="PENDIENTE" warning />
          <Capability icon="dollarsign.circle.fill" title="Suscripciones" description="Los pagos y los entitlements no están habilitados mientras no exista un proveedor de cobro verificado." state="PENDIENTE" warning />
        </Section>

        <Section title="SOBRE BELENTANI">
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>Music × AI × Identity</Text>
            <Text style={styles.aboutBody}>BELENTANI genera selecciones explicables. HARMONÍA añade control humano, auditoría PVC-U y automatizaciones supervisadas.</Text>
            <Text style={styles.version}>Versión de producto: 1.0.0</Text>
          </View>
        </Section>
      </ScrollView>
    </ScreenContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.card}>{children}</View></View>;
}

function Capability({ icon, title, description, state, warning = false }: { icon: 'shield.fill' | 'lock.fill' | 'waveform' | 'bell.fill' | 'dollarsign.circle.fill'; title: string; description: string; state: string; warning?: boolean }) {
  return <View style={styles.capability}><View style={[styles.iconBox, warning && styles.iconBoxWarning]}><IconSymbol name={icon} size={18} color={warning ? '#FCA5A5' : '#A78BFA'} /></View><View style={styles.capabilityCopy}><Text style={styles.capabilityTitle}>{title}</Text><Text style={styles.capabilityBody}>{description}</Text><Text style={[styles.state, warning && styles.stateWarning]}>{state}</Text></View></View>;
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: '#FFFFFF', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { color: '#A78BFA', fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginBottom: 9 },
  card: { borderRadius: 15, overflow: 'hidden', backgroundColor: '#18181D', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  capability: { flexDirection: 'row', gap: 12, padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(167,139,250,0.12)' },
  iconBoxWarning: { backgroundColor: 'rgba(127,29,29,0.2)' },
  capabilityCopy: { flex: 1 },
  capabilityTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  capabilityBody: { color: '#9CA3AF', fontSize: 12, lineHeight: 18, marginTop: 3 },
  state: { color: '#D8B4FE', fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 8 },
  stateWarning: { color: '#FCA5A5' },
  aboutCard: { padding: 16, borderRadius: 15, backgroundColor: '#18181D', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  aboutTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  aboutBody: { color: '#D1D5DB', fontSize: 13, lineHeight: 20, marginTop: 8 },
  version: { color: '#9CA3AF', fontSize: 11, marginTop: 14 },
});
