// ============================================================
// Veterinaria La Plata — Grooming Hub Screen (Fase 4)
// ============================================================
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../config/theme';
import { Card, Badge, Button, Input } from '../../components/ui';

const MOCK_GROOMING_APPS = [
  { id: 'g-1', petName: 'Michi', species: 'cat', owner: 'María González', time: '10:00 AM', service: 'Baño y Deslanado', status: 'pending' },
  { id: 'g-2', petName: 'Firulais', species: 'dog', owner: 'Juan Lopez', time: '11:30 AM', service: 'Corte de Raza', status: 'in-progress' },
  { id: 'g-3', petName: 'Coco', species: 'dog', owner: 'Ana Silva', time: '14:00 PM', service: 'Baño y Corte de uñas', status: 'completed' },
];

export const GroomingHubScreen: React.FC = () => {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Estética & Peluquería ✂️</Text>
        <Text style={styles.subtitle}>Mascotas del día</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {MOCK_GROOMING_APPS.map((app) => (
          <Card key={app.id} variant="elevated" style={styles.appCard}>
            <View style={styles.appHeader}>
              <View style={styles.timeBlock}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={colors.primary} />
                <Text style={styles.timeText}>{app.time}</Text>
              </View>
              <Badge 
                label={app.status === 'pending' ? 'Pendiente' : app.status === 'in-progress' ? 'En proceso' : 'Terminado'} 
                variant={app.status === 'pending' ? 'warning' : app.status === 'in-progress' ? 'primary' : 'success'} 
              />
            </View>
            
            <View style={styles.petInfo}>
              <MaterialCommunityIcons 
                name={app.species === 'dog' ? 'dog' : 'cat'} 
                size={24} 
                color={app.species === 'dog' ? colors.primary : colors.accent} 
              />
              <View style={{ marginLeft: spacing.sm }}>
                <Text style={styles.petName}>{app.petName}</Text>
                <Text style={styles.ownerName}>{app.owner}</Text>
              </View>
            </View>

            <Text style={styles.serviceText}>Servicio: {app.service}</Text>

            {selectedApp === app.id ? (
              <View style={styles.notesSection}>
                <Input
                  label="Observaciones del servicio"
                  placeholder="Ej: Se usó shampoo hipoalergénico..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
                <View style={styles.actions}>
                  <Button title="Guardar & Completar" size="sm" variant="success" style={{ flex: 1, marginRight: spacing.sm }} onPress={() => setSelectedApp(null)} />
                  <Button title="Cancelar" size="sm" variant="ghost" style={{ flex: 1 }} onPress={() => setSelectedApp(null)} />
                </View>
              </View>
            ) : (
              <Button 
                title={app.status === 'completed' ? "Ver Observaciones" : "Registrar Servicio"} 
                size="sm" 
                variant="outline" 
                style={{ marginTop: spacing.md }} 
                onPress={() => setSelectedApp(app.id)} 
              />
            )}
          </Card>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { padding: spacing.xl, paddingBottom: spacing.md },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  subtitle: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: colors.textMuted, marginTop: spacing.xs },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  appCard: { padding: spacing.lg, marginBottom: spacing.md },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  timeBlock: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark, marginLeft: 4 },
  petInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  petName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark },
  ownerName: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted },
  serviceText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.primaryDark, backgroundColor: colors.primarySoft, padding: spacing.sm, borderRadius: borderRadius.md, overflow: 'hidden' },
  notesSection: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  actions: { flexDirection: 'row', marginTop: spacing.sm },
});

export default GroomingHubScreen;
