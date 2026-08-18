// ============================================================
// Veterinaria La Plata — ClinicSettingsScreen (admin)
// Edición de datos de la clínica: contacto, servicios, horarios
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../config/theme';
import { Card, Button, Input } from '../../components/ui';
import { VeterinaryConfig, ServiceConfig, DaySchedule, AppointmentType } from '../../types';
import { getClinicConfig, saveClinicConfig } from '../../services/configService';
import { useAuthStore } from '../../store/authStore';
import { logAdminAction } from '../../services/adminService';

const DAY_KEYS: (keyof VeterinaryConfig['hours'])[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
};

const SERVICE_TYPES: { id: AppointmentType; label: string }[] = [
  { id: 'general', label: 'Consulta General' },
  { id: 'vaccination', label: 'Vacunación' },
  { id: 'grooming', label: 'Peluquería' },
  { id: 'emergency', label: 'Urgencia' },
  { id: 'castration', label: 'Castración' },
];

export const ClinicSettingsScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [config, setConfig] = useState<VeterinaryConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const cfg = await getClinicConfig();
      setConfig(cfg);
      setLoading(false);
    })();
  }, []);

  const updateService = (index: number, field: keyof ServiceConfig, value: any) => {
    if (!config) return;
    const services = [...config.services];
    services[index] = { ...services[index], [field]: value } as ServiceConfig;
    setConfig({ ...config, services });
  };

  const addService = () => {
    if (!config) return;
    const id = `svc-${Date.now()}`;
    setConfig({
      ...config,
      services: [
        ...config.services,
        { id, name: 'Nuevo servicio', type: 'general', price: 0, durationMinutes: 30, active: true },
      ],
    });
  };

  const removeService = (index: number) => {
    if (!config) return;
    setConfig({ ...config, services: config.services.filter((_, i) => i !== index) });
  };

  const updateDay = (day: keyof VeterinaryConfig['hours'], field: keyof DaySchedule, value: any) => {
    if (!config) return;
    const hours = { ...config.hours } as VeterinaryConfig['hours'];
    hours[day] = { ...hours[day], [field]: value } as DaySchedule;
    setConfig({ ...config, hours });
  };

  const handleSave = async () => {
    if (!config || !user) return;
    setSaving(true);
    try {
      await saveClinicConfig(config);
      await logAdminAction({ id: user.id, name: user.name }, 'clinic_settings_update');
      Alert.alert('Guardado ✓', 'La configuración de la clínica fue actualizada.');
    } catch (error) {
      console.log('save clinic config error:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Cargando configuración...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Contacto */}
      <Text style={styles.sectionTitle}>Datos de contacto</Text>
      <Card variant="elevated" style={styles.card}>
        <Input label="Nombre de la clínica" value={config?.name || ''} onChangeText={(v) => setConfig((c) => c && { ...c, name: v })} />
        <Input label="Teléfono" value={config?.phone || ''} onChangeText={(v) => setConfig((c) => c && { ...c, phone: v })} placeholder="Ej: 221 555 0123" />
        <Input label="Email" value={config?.email || ''} onChangeText={(v) => setConfig((c) => c && { ...c, email: v })} keyboardType="email-address" />
        <Input
          label="WhatsApp"
          value={config?.socialMedia?.whatsapp || ''}
          onChangeText={(v) => setConfig((c) => c && { ...c, socialMedia: { ...c.socialMedia, whatsapp: v } })}
          placeholder="Ej: 5492215550123"
        />
      </Card>

      {/* Servicios */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Servicios y precios</Text>
        <TouchableOpacity onPress={addService} style={styles.addBtn}>
          <MaterialCommunityIcons name="plus" size={18} color={colors.primaryDark} />
          <Text style={styles.addBtnText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      {config?.services.map((svc, index) => (
        <Card key={svc.id} variant="elevated" style={styles.card}>
          <View style={styles.serviceHeader}>
            <Text style={styles.serviceName}>{svc.name}</Text>
            <TouchableOpacity onPress={() => removeService(index)}>
              <MaterialCommunityIcons name="close-circle-outline" size={22} color={colors.danger} />
            </TouchableOpacity>
          </View>

          <Input
            label="Nombre del servicio"
            value={svc.name}
            onChangeText={(v) => updateService(index, 'name', v)}
            containerStyle={{ marginBottom: spacing.xs }}
          />
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Input
                label="Precio ($)"
                value={String(svc.price)}
                onChangeText={(v) => updateService(index, 'price', parseFloat(v) || 0)}
                keyboardType="numeric"
                containerStyle={{ marginBottom: spacing.xs }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Duración (min)"
                value={String(svc.durationMinutes)}
                onChangeText={(v) => updateService(index, 'durationMinutes', parseInt(v, 10) || 30)}
                keyboardType="numeric"
                containerStyle={{ marginBottom: spacing.xs }}
              />
            </View>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Activo</Text>
            <Switch
              value={svc.active}
              onValueChange={(v) => updateService(index, 'active', v)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={svc.active ? colors.primaryDark : '#f4f3f4'}
            />
          </View>
        </Card>
      ))}

      {/* Horarios */}
      <Text style={styles.sectionTitle}>Horarios de atención</Text>
      <Card variant="elevated" style={styles.card}>
        {DAY_KEYS.map((day) => {
          const d = config?.hours[day] as DaySchedule;
          return (
            <View key={day} style={styles.dayRow}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayLabel}>{DAY_LABELS[day]}</Text>
                <Switch
                  value={!!d?.enabled}
                  onValueChange={(v) => updateDay(day, 'enabled', v)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={d?.enabled ? colors.primaryDark : '#f4f3f4'}
                />
              </View>
              {d?.enabled ? (
                <View style={styles.dayTimes}>
                  <View style={{ flex: 1, marginRight: spacing.xs }}>
                    <Text style={styles.timeLabel}>Mañana</Text>
                    <Input
                      value={d.morningStart || ''}
                      onChangeText={(v) => updateDay(day, 'morningStart', v)}
                      placeholder="09:00"
                      containerStyle={{ marginBottom: spacing.xs }}
                    />
                    <Input
                      value={d.morningEnd || ''}
                      onChangeText={(v) => updateDay(day, 'morningEnd', v)}
                      placeholder="12:00"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.xs }}>
                    <Text style={styles.timeLabel}>Tarde</Text>
                    <Input
                      value={d.afternoonStart || ''}
                      onChangeText={(v) => updateDay(day, 'afternoonStart', v)}
                      placeholder="16:00"
                      containerStyle={{ marginBottom: spacing.xs }}
                    />
                    <Input
                      value={d.afternoonEnd || ''}
                      onChangeText={(v) => updateDay(day, 'afternoonEnd', v)}
                      placeholder="19:00"
                    />
                  </View>
                </View>
              ) : (
                <Text style={styles.closedText}>Cerrado</Text>
              )}
            </View>
          );
        })}
      </Card>

      <Button title="Guardar configuración" onPress={handleSave} loading={saving} variant="accent" size="lg" fullWidth style={{ marginTop: spacing.lg }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 40, paddingTop: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgMain },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  sectionTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, marginTop: spacing.lg, marginBottom: spacing.sm },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.lg },
  addBtnText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.primaryDark },
  card: { padding: spacing.lg, marginBottom: spacing.md },
  serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  serviceName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark },
  row: { flexDirection: 'row' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  toggleLabel: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark },
  dayRow: { borderBottomWidth: 1, borderBottomColor: colors.hairline, paddingVertical: spacing.md },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayLabel: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark },
  dayTimes: { flexDirection: 'row', marginTop: spacing.sm },
  timeLabel: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.xs, color: colors.textMuted, marginBottom: 4 },
  closedText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textLight, marginTop: spacing.xs },
  emptyText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted },
});

export default ClinicSettingsScreen;
