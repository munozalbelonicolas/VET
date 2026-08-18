// ============================================================
// Veterinaria La Plata — FollowUpsAdminScreen
// Seguimientos clínicos globales (todos los veterinarios)
// ============================================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing } from '../../config/theme';
import { Card, Badge, Button } from '../../components/ui';
import { FollowUp } from '../../types';
import { getAllFollowUps } from '../../services/adminService';
import { completeFollowUp } from '../../services/staffService';
import { useAuthStore } from '../../store/authStore';
import { logAdminAction } from '../../services/adminService';

const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  overdue: 'Vencido',
  done: 'Completado',
};

export const FollowUpsAdminScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'done'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const list = await getAllFollowUps(true);
    setFollowUps(list);
  };

  const handleComplete = async (f: FollowUp) => {
    try {
      await completeFollowUp(f.id);
      await logAdminAction({ id: user?.id || '', name: user?.name }, 'followup_complete', f.title);
      loadData();
    } catch (error) {
      console.log('complete followup error:', error);
      Alert.alert('Error', 'No se pudo completar el seguimiento.');
    }
  };

  const filtered = filter === 'all' ? followUps : followUps.filter((f) => f.status === filter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Seguimientos Clínicos 🩺</Text>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'pending', 'overdue', 'done'] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.pill, filter === f && styles.pillActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>
              {f === 'all' ? 'Todos' : f === 'done' ? 'Completados' : f === 'overdue' ? 'Vencidos' : 'Pendientes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.length === 0 ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <MaterialCommunityIcons name="calendar-check-outline" size={40} color={colors.textLight} />
            <Text style={styles.emptyText}>No hay seguimientos en esta categoría.</Text>
          </Card>
        ) : (
          filtered.map((f) => (
            <Card key={f.id} variant={f.status === 'overdue' ? 'highlight' : 'elevated'} style={styles.followUpCard}>
              <View style={styles.cardHeader}>
                <Badge
                  label={statusLabel[f.status]}
                  variant={f.status === 'overdue' ? 'danger' : f.status === 'done' ? 'success' : 'warning'}
                  size="sm"
                />
                <Text style={styles.dueDate}>
                  {f.status === 'overdue' ? 'Vencido: ' : 'Vence: '}
                  {new Date(f.dueDate).toLocaleDateString('es-AR')}
                </Text>
              </View>
              <Text style={styles.followUpTitle}>{f.title}</Text>
              <Text style={styles.petName}>🐾 {f.petName}</Text>
              {f.description ? <Text style={styles.desc}>{f.description}</Text> : null}

              {f.status !== 'done' && (
                <Button
                  title="✓ Marcar completado"
                  size="sm"
                  variant="primary"
                  style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
                  onPress={() => handleComplete(f)}
                />
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing['2xl'], paddingBottom: spacing.sm },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  pill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  pillText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.xs, color: colors.textMuted },
  pillTextActive: { color: colors.primaryDark, fontFamily: fonts.nunito.bold },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  emptyCard: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted },
  followUpCard: { padding: spacing.lg, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  dueDate: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  followUpTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark, marginTop: spacing.xs },
  petName: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.primaryDark, marginTop: 2 },
  desc: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
});

export default FollowUpsAdminScreen;
