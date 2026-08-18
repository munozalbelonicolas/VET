// ============================================================
// Veterinaria La Plata — Waiting Room TV / Web Screen Display 📺
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../config/theme';
import { Card, Badge, Button } from '../../components/ui';
import { QueueItem, subscribeToQueue } from '../../services/waitingRoomService';

interface WaitingRoomTVDisplayProps {
  onClose?: () => void;
}

export const WaitingRoomTVDisplay: React.FC<WaitingRoomTVDisplayProps> = ({ onClose }) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Tiempo en vivo
    const clock = setInterval(() => setCurrentTime(new Date()), 1000);
    // Cola en tiempo real (Firestore onSnapshot)
    const unsubscribe = subscribeToQueue((items) => setQueue(items));

    return () => {
      clearInterval(clock);
      unsubscribe();
    };
  }, []);

  const activePatient = queue.find(q => q.status === 'calling' || q.status === 'in_consultation');
  const waitingQueue = queue.filter(q => q.status === 'waiting');

  return (
    <SafeAreaView style={styles.tvContainer} edges={['top', 'left', 'right']}>
      {/* TV Header */}
      <View style={styles.tvHeader}>
        <View style={styles.brandRow}>
          <MaterialCommunityIcons name="hospital-building" size={32} color="#009EE3" />
          <View>
            <Text style={styles.tvBrandTitle}>VETERINARIA LA PLATA</Text>
            <Text style={styles.tvBrandSub}>Turnero de Sala de Espera</Text>
          </View>
        </View>

        <View style={styles.clockBox}>
          <Text style={styles.clockText}>
            {currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
          <Text style={styles.dateText}>
            {currentTime.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </Text>
        </View>

        {onClose && (
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.tvContent}>
        {/* BIG CALLOUT BOX: CURRENTLY CALLED PATIENT */}
        {activePatient ? (
          <View style={styles.callingBox}>
            <View style={styles.callingBadgeHeader}>
              <MaterialCommunityIcons name="bullhorn-outline" size={24} color="#FFF" />
              <Text style={styles.callingBadgeText}>
                {activePatient.status === 'calling' ? '🔔 ¡PACIENTE LLAMADO!' : '🩺 EN ATENCIÓN'}
              </Text>
            </View>

            <View style={styles.callingMainRow}>
              <View style={styles.ticketPill}>
                <Text style={styles.ticketText}>{activePatient.ticketNumber}</Text>
              </View>

              <View style={styles.patientInfo}>
                <Text style={styles.petNameLarge}>
                  {activePatient.petName} 🐾
                </Text>
                <Text style={styles.ownerTextLarge}>
                  Dueño/a: <Text style={{ color: colors.textWhite }}>{activePatient.ownerName}</Text>
                </Text>
                <Text style={styles.reasonTextLarge}>
                  Motivo: {activePatient.reason}
                </Text>
              </View>

              <View style={styles.roomBox}>
                <Text style={styles.roomLabel}>PASAR A:</Text>
                <Text style={styles.roomText}>{activePatient.doctorOrRoom || 'Consultorio 1'}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCallingBox}>
            <Text style={styles.emptyCallingText}>No hay pacientes llamados en este momento.</Text>
          </View>
        )}

        {/* WAITING QUEUE LIST */}
        <Text style={styles.queueTitle}>⏳ PRÓXIMOS EN ESPERA ({waitingQueue.length})</Text>

        <View style={styles.queueGrid}>
          {waitingQueue.length === 0 ? (
            <Card variant="outlined" style={styles.emptyQueueCard}>
              <Text style={styles.emptyQueueText}>Sala de espera despejada</Text>
            </Card>
          ) : (
            waitingQueue.map((item, idx) => (
              <View key={item.id} style={styles.queueItemCard}>
                <View style={styles.qNumBox}>
                  <Text style={styles.qNumText}>{item.ticketNumber}</Text>
                </View>
                <View style={styles.qDetails}>
                  <Text style={styles.qPetName}>{item.petName}</Text>
                  <Text style={styles.qOwnerName}>Dueño: {item.ownerName}</Text>
                </View>
                <Badge label={item.reason} variant="primary" size="sm" />
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom-Right Back Button (Smart TV / Mobile / Web friendly) */}
      {onClose && (
        <TouchableOpacity
          style={styles.floatingBackBtn}
          onPress={onClose}
          activeOpacity={0.8}
          accessibilityLabel="Volver al panel"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          <Text style={styles.floatingBackText}>Volver</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tvContainer: { flex: 1, backgroundColor: '#0B132B' },
  tvHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: '#1C2541',
    borderBottomWidth: 2,
    borderBottomColor: '#3A506B',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tvBrandTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: '#FFF', letterSpacing: 1 },
  tvBrandSub: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.xs, color: '#6FFFE9' },
  clockBox: { alignItems: 'flex-end' },
  clockText: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: '#6FFFE9' },
  dateText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: '#A5C4D4', textTransform: 'capitalize' },
  closeBtn: { padding: spacing.xs, backgroundColor: '#3A506B', borderRadius: borderRadius.sm, marginLeft: spacing.md },
  tvContent: { padding: spacing.xl, paddingBottom: 100 },
  floatingBackBtn: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#3A506B',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: '#6FFFE9',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 999,
  },
  floatingBackText: {
    fontFamily: fonts.nunito.bold,
    fontSize: fontSizes.md,
    color: '#FFF',
  },
  callingBox: {
    backgroundColor: '#1C2541',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 3,
    borderColor: '#6FFFE9',
    ...shadows.lg,
    marginBottom: spacing.xl,
  },
  callingBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#009EE3',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  callingBadgeText: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: '#FFF', letterSpacing: 1 },
  callingMainRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.md },
  ticketPill: { backgroundColor: '#6FFFE9', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.lg },
  ticketText: { fontFamily: fonts.quicksand.bold, fontSize: 36, color: '#0B132B' },
  patientInfo: { flex: 1, minWidth: 200 },
  petNameLarge: { fontFamily: fonts.quicksand.bold, fontSize: 32, color: '#6FFFE9' },
  ownerTextLarge: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.lg, color: '#A5C4D4', marginTop: 4 },
  reasonTextLarge: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: '#A5C4D4', marginTop: 2 },
  roomBox: { backgroundColor: '#3A506B', padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', minWidth: 140 },
  roomLabel: { fontFamily: fonts.nunito.bold, fontSize: 10, color: '#A5C4D4', letterSpacing: 1 },
  roomText: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: '#FFF', marginTop: 2 },
  emptyCallingBox: { padding: spacing.xl, backgroundColor: '#1C2541', borderRadius: borderRadius.xl, alignItems: 'center', marginBottom: spacing.xl },
  emptyCallingText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: '#A5C4D4' },
  queueTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: '#6FFFE9', marginBottom: spacing.md },
  queueGrid: { gap: spacing.sm },
  emptyQueueCard: { padding: spacing.xl, alignItems: 'center', backgroundColor: '#1C2541' },
  emptyQueueText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: '#A5C4D4' },
  queueItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C2541',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#3A506B',
    gap: spacing.md,
  },
  qNumBox: { backgroundColor: '#3A506B', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  qNumText: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: '#6FFFE9' },
  qDetails: { flex: 1 },
  qPetName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: '#FFF' },
  qOwnerName: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: '#A5C4D4' },
});

export default WaitingRoomTVDisplay;
