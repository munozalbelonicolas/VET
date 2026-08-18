// ============================================================
// Veterinaria La Plata — CouponsScreen (admin)
// Gestión de cupones de descuento
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../config/theme';
import { Card, Badge, Button, Input } from '../../components/ui';
import { Coupon } from '../../types';
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  generateCouponCode,
  formatDiscount,
} from '../../services/couponService';
import { useAuthStore } from '../../store/authStore';
import { logAdminAction } from '../../services/adminService';

const emptyForm = {
  code: '',
  discountType: 'percentage' as 'percentage' | 'fixed',
  discountValue: '',
  minPurchase: '',
  usageLimit: '',
  validFrom: new Date(),
  validTo: new Date(Date.now() + 30 * 86400000),
};

export const CouponsScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const list = await getCoupons();
      setCoupons(list);
    } catch (error) {
      console.log('loadCoupons error:', error);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, code: generateCouponCode() });
    setModalVisible(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minPurchase: c.minPurchase ? String(c.minPurchase) : '',
      usageLimit: String(c.usageLimit),
      validFrom: c.validFrom,
      validTo: c.validTo,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      Alert.alert('Error', 'Ingresá el código del cupón');
      return;
    }
    const value = parseFloat(form.discountValue);
    if (!value || value <= 0) {
      Alert.alert('Error', 'Ingresá un valor de descuento válido');
      return;
    }
    const usageLimit = parseInt(form.usageLimit, 10) || 1;
    if (usageLimit < 1) {
      Alert.alert('Error', 'El límite de usos debe ser al menos 1');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code,
        discountType: form.discountType,
        discountValue: value,
        minPurchase: form.minPurchase ? parseFloat(form.minPurchase) : undefined,
        usageLimit,
        validFrom: form.validFrom,
        validTo: form.validTo,
      };

      if (editing) {
        await updateCoupon(editing.id, payload);
        await logAdminAction({ id: user?.id || '', name: user?.name }, 'coupon_update', editing.code);
      } else {
        await createCoupon(payload);
        await logAdminAction({ id: user?.id || '', name: user?.name }, 'coupon_create', payload.code);
      }
      setModalVisible(false);
      loadCoupons();
    } catch (error) {
      console.log('save coupon error:', error);
      Alert.alert('Error', 'No se pudo guardar el cupón.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c: Coupon) => {
    try {
      await updateCoupon(c.id, { active: !c.active });
      await logAdminAction({ id: user?.id || '', name: user?.name }, 'coupon_toggle', c.code, `active=${!c.active}`);
      loadCoupons();
    } catch (error) {
      console.log('toggle coupon error:', error);
    }
  };

  const handleDelete = (c: Coupon) => {
    Alert.alert('Eliminar cupón', `¿Eliminar el cupón ${c.code}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCoupon(c.id);
            await logAdminAction({ id: user?.id || '', name: user?.name }, 'coupon_delete', c.code);
            loadCoupons();
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar el cupón.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cupones de Descuento</Text>
        <Button title="+ Nuevo cupón" size="sm" variant="primary" onPress={openCreate} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {coupons.length === 0 ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <MaterialCommunityIcons name="ticket-percent-outline" size={40} color={colors.textLight} />
            <Text style={styles.emptyText}>No hay cupones creados.</Text>
          </Card>
        ) : (
          coupons.map((c) => (
            <Card key={c.id} variant="elevated" style={styles.couponCard}>
              <View style={styles.couponHeader}>
                <Badge
                  label={c.active ? 'Activo' : 'Inactivo'}
                  variant={c.active ? 'success' : 'muted'}
                  size="sm"
                />
                <Badge label={formatDiscount(c)} variant="accent" size="sm" />
              </View>
              <Text style={styles.couponCode}>{c.code}</Text>
              <Text style={styles.couponMeta}>
                Usos: {c.usedCount} / {c.usageLimit} • Vence {new Date(c.validTo).toLocaleDateString('es-AR')}
              </Text>
              {c.minPurchase ? (
                <Text style={styles.couponMeta}>Compra mínima: ${c.minPurchase.toLocaleString('es-AR')}</Text>
              ) : null}

              <View style={styles.actions}>
                <View style={styles.toggleWrap}>
                  <Text style={styles.toggleLabel}>Habilitado</Text>
                  <Switch
                    value={c.active}
                    onValueChange={() => handleToggle(c)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={c.active ? colors.primaryDark : '#f4f3f4'}
                  />
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(c)}>
                    <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(c)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Modal crear/editar */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? 'Editar Cupón' : 'Nuevo Cupón'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Input label="Código" placeholder="Ej: VET20" value={form.code} onChangeText={(v) => setForm({ ...form, code: v })} />

            <Text style={styles.label}>Tipo de descuento</Text>
            <View style={styles.typeRow}>
              {(['percentage', 'fixed'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typePill, form.discountType === t && styles.typePillActive]}
                  onPress={() => setForm({ ...form, discountType: t })}
                >
                  <Text style={[styles.typePillText, form.discountType === t && styles.typePillTextActive]}>
                    {t === 'percentage' ? '% Porcentaje' : '$ Monto fijo'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Input
                  label={form.discountType === 'percentage' ? 'Descuento (%)' : 'Descuento ($)'}
                  placeholder="Ej: 20"
                  value={form.discountValue}
                  onChangeText={(v) => setForm({ ...form, discountValue: v })}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Compra mínima ($, opcional)"
                  placeholder="Ej: 20000"
                  value={form.minPurchase}
                  onChangeText={(v) => setForm({ ...form, minPurchase: v })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Input
              label="Límite de usos"
              placeholder="Ej: 100"
              value={form.usageLimit}
              onChangeText={(v) => setForm({ ...form, usageLimit: v })}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Vigencia</Text>
            <View style={styles.dateRange}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateLabel}>Desde</Text>
                <Text style={styles.dateValue}>{form.validFrom.toLocaleDateString('es-AR')}</Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={18} color={colors.textMuted} />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.dateLabel}>Hasta</Text>
                <Text style={styles.dateValue}>{form.validTo.toLocaleDateString('es-AR')}</Text>
              </View>
            </View>

            <Button
              title={editing ? 'Guardar cambios' : 'Crear cupón'}
              onPress={handleSave}
              loading={saving}
              variant="accent"
              size="lg"
              fullWidth
              style={{ marginTop: spacing.lg }}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  emptyCard: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted },
  couponCard: { padding: spacing.lg, marginBottom: spacing.md },
  couponHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  couponCode: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark, letterSpacing: 1 },
  couponMeta: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.hairline },
  toggleWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggleLabel: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.xs, color: colors.textMuted },
  actionButtons: { flexDirection: 'row', gap: spacing.md },
  iconBtn: { padding: spacing.xs },
  modalContainer: { flex: 1, backgroundColor: colors.bgMain, paddingTop: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  modalContent: { padding: spacing.xl },
  label: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark, marginBottom: spacing.xs },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  typePill: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  typePillActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  typePillText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textMuted },
  typePillTextActive: { color: colors.primaryDark },
  row: { flexDirection: 'row' },
  dateRange: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  dateLabel: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  dateValue: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark, marginTop: 2 },
});

export default CouponsScreen;
