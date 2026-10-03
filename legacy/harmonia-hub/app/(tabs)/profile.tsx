import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { MiniPlayer } from '@/components/mini-player';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/hooks/use-auth';
import { useLibrary } from '@/lib/library-context';
import { usePlayer } from '@/lib/player-context';

export default function ProfileScreen() {
  const { currentTrack, openPlayer } = usePlayer();
  const { user, isAuthenticated, logout } = useAuth();
  const { savedPlaylists, likedTracks, recentTracks, hydrated } = useLibrary();
  const displayName = isAuthenticated && user?.name ? user.name : 'Modo local';
  const displayEmail = isAuthenticated && user?.email ? user.email : 'Sin sesión sincronizada';
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <View style={styles.outerContainer}>
      <ScreenContainer containerClassName="bg-[#0A0A0E]" edges={['top', 'left', 'right']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View><Text style={styles.eyebrow}>CUENTA</Text><Text style={styles.title}>Perfil</Text></View>
            <Pressable accessibilityLabel="Abrir ajustes" onPress={() => router.push('/settings' as never)} style={({ pressed }) => [styles.settingsBtn, pressed && { opacity: 0.65 }]}>
              <IconSymbol name="gear" size={21} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.userCard}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{displayEmail}</Text>
              <View style={styles.stateBadge}><Text style={styles.stateBadgeText}>{isAuthenticated ? 'SESÍON CONECTADA' : 'BIBLIOTECA EN DISPOSITIVO'}</Text></View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <Stat label="Guardadas" value={hydrated ? String(savedPlaylists.length) : '—'} icon="sparkles" />
            <Stat label="Favoritas" value={hydrated ? String(Object.keys(likedTracks).length) : '—'} icon="heart" />
            <Stat label="Recientes" value={hydrated ? String(recentTracks.length) : '—'} icon="clock" />
          </View>

          <View style={styles.notice}>
            <IconSymbol name="info.circle" size={20} color="#A78BFA" />
            <View style={styles.noticeCopy}>
              <Text style={styles.noticeTitle}>Suscripciones sin activar</Text>
              <Text style={styles.noticeBody}>No hay pagos, descargas ni beneficios de plan activos hasta conectar un proveedor y sus permisos.</Text>
            </View>
          </View>

          <View style={styles.actionGroup}>
            <Pressable onPress={() => router.push('/ceo-dashboard' as never)} style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.72 }]}>
              <View style={styles.actionIcon}><IconSymbol name="shield.fill" size={19} color="#A78BFA" /></View>
              <View style={styles.actionCopy}><Text style={styles.actionTitle}>Gobierno HARMONÍA</Text><Text style={styles.actionBody}>El acceso y las acciones se verifican en el servidor.</Text></View>
              <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
            </Pressable>
            <Pressable onPress={() => router.push('/settings' as never)} style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.72 }]}>
              <View style={styles.actionIcon}><IconSymbol name="gear" size={19} color="#A78BFA" /></View>
              <View style={styles.actionCopy}><Text style={styles.actionTitle}>Preferencias</Text><Text style={styles.actionBody}>Controla ajustes locales de esta instalación.</Text></View>
              <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
            </Pressable>
          </View>

          {isAuthenticated ? <Pressable onPress={logout} style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.72 }]}><Text style={styles.signOutText}>Cerrar sesión</Text></Pressable> : null}
          <Text style={styles.version}>BELENTANI · Music × AI × Identity</Text>
          <View style={{ height: currentTrack ? 92 : 32 }} />
        </ScrollView>
      </ScreenContainer>
      {currentTrack ? <View style={styles.miniPlayerContainer}><MiniPlayer onPress={openPlayer} /></View> : null}
    </View>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: 'sparkles' | 'heart' | 'clock' }) {
  return <View style={styles.statCard}><IconSymbol name={icon} size={18} color="#A78BFA" /><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#0A0A0E' },
  scrollContent: { paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14 },
  eyebrow: { color: '#A78BFA', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginTop: 2 },
  settingsBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#18181D' },
  userCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, gap: 14 },
  avatar: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: '#A78BFA' },
  avatarText: { color: '#0A0A0E', fontSize: 26, fontWeight: '900' },
  userInfo: { flex: 1 },
  userName: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  userEmail: { color: '#9CA3AF', fontSize: 13, marginTop: 4 },
  stateBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 8, backgroundColor: 'rgba(167,139,250,0.12)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.25)' },
  stateBadgeText: { color: '#D8B4FE', fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: 4 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: '#18181D', gap: 5 },
  statValue: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  statLabel: { color: '#9CA3AF', fontSize: 11 },
  notice: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginTop: 20, padding: 14, borderRadius: 14, backgroundColor: 'rgba(109,40,217,0.12)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  noticeCopy: { flex: 1 },
  noticeTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  noticeBody: { color: '#D1D5DB', fontSize: 12, lineHeight: 18, marginTop: 3 },
  actionGroup: { marginHorizontal: 20, marginTop: 20, borderRadius: 14, overflow: 'hidden', backgroundColor: '#18181D' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  actionIcon: { width: 35, height: 35, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(167,139,250,0.12)' },
  actionCopy: { flex: 1 },
  actionTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  actionBody: { color: '#9CA3AF', fontSize: 11, marginTop: 3 },
  signOutBtn: { marginHorizontal: 20, marginTop: 20, alignItems: 'center', borderRadius: 12, paddingVertical: 13, borderWidth: 1, borderColor: 'rgba(248,113,113,0.55)' },
  signOutText: { color: '#FCA5A5', fontSize: 13, fontWeight: '800' },
  version: { color: '#6B7280', fontSize: 11, textAlign: 'center', marginTop: 24 },
  miniPlayerContainer: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
