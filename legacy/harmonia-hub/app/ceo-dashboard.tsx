import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenContainer } from '@/components/screen-container';
import { timeAgo } from '@/lib/formatters';
import { trpc } from '@/lib/trpc';

type CouncilAnalysis = {
  summary: string;
  keyDecisions: string[];
  autonomousActions: { id: string; action: string; agent: string; status: string; timestamp: string }[];
  nextSteps: string[];
  risks: string[];
};

function isCouncilAnalysis(value: unknown): value is CouncilAnalysis {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CouncilAnalysis>;
  return typeof candidate.summary === 'string' && Array.isArray(candidate.keyDecisions) && Array.isArray(candidate.autonomousActions) && Array.isArray(candidate.nextSteps) && Array.isArray(candidate.risks);
}

export default function CEODashboard() {
  const stateQuery = trpc.council.state.useQuery();
  const analyzeMutation = trpc.council.analyze.useMutation();
  const killSwitchMutation = trpc.council.setKillSwitch.useMutation();
  const utils = trpc.useUtils();
  const [analysis, setAnalysis] = useState<CouncilAnalysis | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [reason, setReason] = useState('Owner confirmation');

  useEffect(() => {
    const auditAnalysis = stateQuery.data?.auditLogs.find((entry) => entry.eventType === 'council.analysis.generated');
    if (auditAnalysis && isCouncilAnalysis(auditAnalysis.details)) setAnalysis(auditAnalysis.details);
  }, [stateQuery.data]);

  const isPaused = stateQuery.data?.killSwitchActive ?? false;
  const latestEvents = useMemo(() => stateQuery.data?.auditLogs.slice(0, 8) ?? [], [stateQuery.data?.auditLogs]);

  const triggerAnalysis = async () => {
    try {
      const result = await analyzeMutation.mutateAsync({});
      if (isCouncilAnalysis(result)) setAnalysis(result);
      await utils.council.state.invalidate();
    } catch (error) {
      Alert.alert('Análisis no disponible', error instanceof Error ? error.message : 'Reintenta cuando el proveedor de IA esté disponible.');
    }
  };

  const confirmKillSwitch = async () => {
    if (reason.trim().length < 3) {
      Alert.alert('Motivo requerido', 'Escribe al menos tres caracteres para dejar un registro de owner override.');
      return;
    }
    try {
      await killSwitchMutation.mutateAsync({ active: !isPaused, reason: reason.trim() });
      setModalVisible(false);
      await utils.council.state.invalidate();
    } catch (error) {
      Alert.alert('No se pudo actualizar el control', error instanceof Error ? error.message : 'Reintenta más tarde.');
    }
  };

  if (stateQuery.isLoading) {
    return <ScreenContainer containerClassName="bg-[#0A0A0E]" edges={['top', 'left', 'right', 'bottom']}><View style={styles.center}><ActivityIndicator color="#A78BFA" /><Text style={styles.loadingText}>Verificando permisos y estado del Consejo…</Text></View></ScreenContainer>;
  }

  if (stateQuery.isError) {
    return (
      <ScreenContainer containerClassName="bg-[#0A0A0E]" edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.center}><IconSymbol name="lock.fill" size={32} color="#FCA5A5" /><Text style={styles.deniedTitle}>Acceso administrativo requerido</Text><Text style={styles.deniedBody}>El Consejo solo se abre con una sesión autorizada por el servidor. No se muestran métricas ni agentes simulados.</Text><Pressable onPress={() => router.back()} style={styles.backAction}><Text style={styles.backActionText}>Volver</Text></Pressable></View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-[#0A0A0E]" edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}><Pressable accessibilityLabel="Volver" onPress={() => router.back()} style={styles.headerButton}><IconSymbol name="arrow.left" size={22} color="#FFFFFF" /></Pressable><View style={styles.headerCopy}><Text style={styles.eyebrow}>HARMONÍA / OWNER CONSOLE</Text><Text style={styles.title}>Consejo Ejecutivo</Text></View><View style={[styles.status, isPaused ? styles.statusPaused : styles.statusLive]}><Text style={styles.statusText}>{isPaused ? 'PAUSADO' : 'ACTIVO'}</Text></View></View>

        <View style={[styles.controlCard, isPaused && styles.controlCardPaused]}>
          <View style={styles.controlTop}><View><Text style={styles.controlTitle}>{isPaused ? 'Kill switch activado' : 'Operaciones supervisadas'}</Text><Text style={styles.controlBody}>{isPaused ? 'Los workers bloquean cualquier commit nuevo antes de PVC-U.' : 'Cada worker pasa Prepare → Confirm → Commit y registra un hash PVC-U.'}</Text></View><IconSymbol name={isPaused ? 'power' : 'shield.fill'} size={24} color={isPaused ? '#FCA5A5' : '#A78BFA'} /></View>
          <Pressable onPress={() => setModalVisible(true)} style={[styles.killButton, isPaused && styles.resumeButton]}><Text style={styles.killButtonText}>{isPaused ? 'Reanudar con motivo' : 'Activar kill switch'}</Text></Pressable>
        </View>

        <Text style={styles.sectionTitle}>FUNCIONES Y LÍMITES</Text>
        <View style={styles.agentGrid}>{stateQuery.data?.agents.map((agent) => <View key={agent.role} style={styles.agentCard}><Text style={styles.agentRole}>{agent.role}</Text><Text style={styles.agentObjective}>{agent.objective}</Text><Text style={styles.agentAutonomy}>{agent.autonomy === 'prepare_only' ? 'PREPARA, NO COMMIT' : 'SOLO RECOMIENDA'}</Text></View>)}</View>

        <View style={styles.analysisCard}>
          <View style={styles.analysisHeader}><View><Text style={styles.sectionTitle}>ANÁLISIS DE CONSEJO</Text><Text style={styles.analysisHint}>Las recomendaciones no ejecutan acciones externas.</Text></View><Pressable disabled={isPaused || analyzeMutation.isPending} onPress={triggerAnalysis} style={[styles.analyzeButton, (isPaused || analyzeMutation.isPending) && styles.analyzeDisabled]}>{analyzeMutation.isPending ? <ActivityIndicator size="small" color="#0A0A0E" /> : <><IconSymbol name="sparkles" size={16} color="#0A0A0E" /><Text style={styles.analyzeText}>Analizar</Text></>}</Pressable></View>
          {analysis ? <AnalysisContent analysis={analysis} /> : <Text style={styles.emptyAnalysis}>Aún no hay análisis persistidos. Solicita uno para crear una recomendación auditable.</Text>}
        </View>

        <Text style={styles.sectionTitle}>AUDITORÍA RECIENTE</Text>
        <View style={styles.auditCard}>{latestEvents.length > 0 ? latestEvents.map((event) => <View key={event.id} style={styles.auditRow}><View style={styles.auditDot} /><View style={styles.auditCopy}><Text style={styles.auditEvent}>{event.eventType}</Text><Text style={styles.auditTime}>{timeAgo(event.createdAt.toISOString())}</Text></View></View>) : <Text style={styles.emptyAudit}>No hay eventos de Consejo registrados para esta cuenta.</Text>}</View>
      </ScrollView>

      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={() => setModalVisible(false)}><View style={styles.modalOverlay}><View style={styles.modalCard}><IconSymbol name="exclamationmark.triangle.fill" size={28} color={isPaused ? '#A78BFA' : '#FCA5A5'} /><Text style={styles.modalTitle}>{isPaused ? '¿Reanudar operaciones?' : '¿Activar kill switch?'}</Text><Text style={styles.modalBody}>{isPaused ? 'El worker volverá a poder alcanzar la fase de commit después de validación PVC-U.' : 'Las ejecuciones nuevas quedarán bloqueadas antes de confirmar y el evento se registrará en auditoría.'}</Text><TextInput value={reason} onChangeText={setReason} placeholder="Motivo de owner override" placeholderTextColor="#6B7280" style={styles.reasonInput} maxLength={500} /><View style={styles.modalActions}><Pressable onPress={() => setModalVisible(false)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar</Text></Pressable><Pressable onPress={confirmKillSwitch} disabled={killSwitchMutation.isPending} style={styles.confirmButton}><Text style={styles.confirmText}>{killSwitchMutation.isPending ? 'Guardando…' : 'Confirmar'}</Text></Pressable></View></View></View></Modal>
    </ScreenContainer>
  );
}

function AnalysisContent({ analysis }: { analysis: CouncilAnalysis }) {
  return <View style={styles.analysisContent}><Text style={styles.analysisSummary}>{analysis.summary}</Text><Text style={styles.subheading}>Propuestas</Text>{analysis.autonomousActions.map((action) => <View key={action.id} style={styles.proposal}><Text style={styles.proposalRole}>{action.agent}</Text><Text style={styles.proposalText}>{action.action}</Text><Text style={styles.pending}>PENDIENTE DE OWNER</Text></View>)}<Text style={styles.subheading}>Riesgos</Text>{analysis.risks.map((risk) => <Text key={risk} style={styles.risk}>• {risk}</Text>)}</View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14, backgroundColor: '#0A0A0E' }, loadingText: { color: '#D1D5DB', textAlign: 'center' }, deniedTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', textAlign: 'center' }, deniedBody: { color: '#D1D5DB', fontSize: 13, lineHeight: 20, textAlign: 'center' }, backAction: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 20, backgroundColor: '#A78BFA' }, backActionText: { color: '#0A0A0E', fontWeight: '800' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }, headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1 }, eyebrow: { color: '#A78BFA', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 }, title: { color: '#FFFFFF', fontSize: 21, fontWeight: '800', marginTop: 2 }, status: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 }, statusLive: { backgroundColor: 'rgba(167,139,250,0.17)' }, statusPaused: { backgroundColor: 'rgba(127,29,29,0.32)' }, statusText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  controlCard: { marginHorizontal: 20, padding: 16, borderRadius: 16, backgroundColor: '#18181D', borderWidth: 1, borderColor: 'rgba(167,139,250,0.24)' }, controlCardPaused: { borderColor: 'rgba(248,113,113,0.42)' }, controlTop: { flexDirection: 'row', gap: 12 }, controlTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' }, controlBody: { color: '#D1D5DB', fontSize: 12, lineHeight: 18, marginTop: 4, maxWidth: 270 }, killButton: { alignItems: 'center', paddingVertical: 12, borderRadius: 11, marginTop: 16, borderWidth: 1, borderColor: 'rgba(248,113,113,0.58)' }, resumeButton: { borderColor: 'rgba(167,139,250,0.58)' }, killButtonText: { color: '#FCA5A5', fontSize: 13, fontWeight: '800' },
  sectionTitle: { color: '#A78BFA', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginTop: 24, marginHorizontal: 20 }, agentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginTop: 10 }, agentCard: { width: '47%', padding: 12, borderRadius: 14, backgroundColor: '#18181D', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }, agentRole: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' }, agentObjective: { color: '#D1D5DB', fontSize: 11, lineHeight: 16, marginTop: 5 }, agentAutonomy: { color: '#A78BFA', fontSize: 8, fontWeight: '800', letterSpacing: 0.6, marginTop: 9 },
  analysisCard: { marginHorizontal: 20, marginTop: 10, borderRadius: 16, padding: 15, backgroundColor: '#18181D', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }, analysisHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, analysisHint: { color: '#9CA3AF', fontSize: 11, marginTop: 3 }, analyzeButton: { minWidth: 96, height: 38, borderRadius: 19, backgroundColor: '#A78BFA', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }, analyzeDisabled: { backgroundColor: '#4B5563' }, analyzeText: { color: '#0A0A0E', fontSize: 12, fontWeight: '800' }, emptyAnalysis: { color: '#9CA3AF', fontSize: 12, lineHeight: 18, marginTop: 16 }, analysisContent: { marginTop: 16 }, analysisSummary: { color: '#FFFFFF', fontSize: 13, lineHeight: 20 }, subheading: { color: '#A78BFA', fontSize: 11, fontWeight: '800', marginTop: 16, marginBottom: 7 }, proposal: { padding: 10, borderRadius: 11, backgroundColor: '#222129', marginTop: 7 }, proposalRole: { color: '#D8B4FE', fontSize: 10, fontWeight: '900' }, proposalText: { color: '#FFFFFF', fontSize: 12, lineHeight: 18, marginTop: 4 }, pending: { color: '#FCD34D', fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginTop: 7 }, risk: { color: '#D1D5DB', fontSize: 12, lineHeight: 19, marginTop: 3 },
  auditCard: { marginHorizontal: 20, marginTop: 10, borderRadius: 16, padding: 8, backgroundColor: '#18181D' }, auditRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 }, auditDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#A78BFA' }, auditCopy: { flex: 1 }, auditEvent: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' }, auditTime: { color: '#9CA3AF', fontSize: 11, marginTop: 3 }, emptyAudit: { color: '#9CA3AF', fontSize: 12, padding: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', alignItems: 'center', justifyContent: 'center', padding: 24 }, modalCard: { width: '100%', maxWidth: 390, borderRadius: 20, padding: 22, alignItems: 'center', backgroundColor: '#18181D' }, modalTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', marginTop: 12 }, modalBody: { color: '#D1D5DB', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 }, reasonInput: { width: '100%', color: '#FFFFFF', backgroundColor: '#101015', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 11, marginTop: 16 }, modalActions: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 14 }, cancelButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#2A2A32' }, cancelText: { color: '#FFFFFF', fontWeight: '700' }, confirmButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#A78BFA' }, confirmText: { color: '#0A0A0E', fontWeight: '800' },
});
