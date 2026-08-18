// ============================================================
// Veterinaria La Plata — Updated Client Home Screen (Fase 2)
// ============================================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, shadows, borderRadius, letterSpacing } from '../../config/theme';
import { Card, Button, Logo, Badge } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { Pet } from '../../types';
import { getPetsByOwner } from '../../services/dataService';
import AddPetModal from './AddPetModal';
import PetDetailScreen from './PetDetailScreen';
import { ChatbotScreen } from './ChatbotScreen';

const ClientHomeScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const [pets, setPets] = useState<Pet[]>([]);
  const [addPetVisible, setAddPetVisible] = useState(false);
  const [chatbotVisible, setChatbotVisible] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    if (!user?.id) return;
    const userPets = await getPetsByOwner(user.id);
    setPets(userPets);
  };

  const quickActions = [
    { icon: 'calendar-month' as const, label: 'Mi Agenda & Salud', color: colors.primary, action: () => navigation?.navigate('Appointments') },
    { icon: 'shopping' as const, label: 'Comprar', color: colors.accent, action: () => navigation?.navigate('Shop') },
    { icon: 'paw' as const, label: 'Agregar Mascota', color: colors.success, action: () => setAddPetVisible(true) },
    { icon: 'bell-outline' as const, label: 'Avisos', color: colors.warning, action: () => navigation?.navigate('Notifications') },
  ];

  if (selectedPet) {
    return (
      <PetDetailScreen
        pet={selectedPet}
        onBack={() => setSelectedPet(null)}
        onBookAppointment={() => {
          setSelectedPet(null);
          navigation?.navigate('Appointments');
        }}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgMain }}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero header premium */}
      <LinearGradient
        colors={colors.gradientHero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroEyebrow}>VETERINARIA LA PLATA</Text>
            <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0]}! 🐾</Text>
            <Text style={styles.subGreeting}>¿Cómo están tus mascotas hoy?</Text>
          </View>
          <TouchableOpacity style={styles.avatarPlaceholder} onPress={() => navigation?.navigate('Profile')}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: colors.bgCard }} />
            ) : (
              <MaterialCommunityIcons name="account-circle" size={52} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Pets List Carousel/Cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mis Mascotas ({pets.length})</Text>
        <TouchableOpacity onPress={() => setAddPetVisible(true)}>
          <Text style={styles.addText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {pets.length === 0 ? (
        <Card variant="elevated" style={styles.emptyState}>
          <Logo size={70} showText={false} />
          <Text style={styles.emptyTitle}>¡Registrá tu primera mascota!</Text>
          <Text style={styles.emptyDesc}>
            Llevá su historial clínico, control de peso y recordatorios de vacunas.
          </Text>
          <Button
            title="Agregar mascota"
            onPress={() => setAddPetVisible(true)}
            variant="accent"
            size="md"
            icon={<MaterialCommunityIcons name="plus" size={18} color="#FFF" />}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petsScroll}>
          {pets.map((pet) => (
            <Card
              key={pet.id}
              variant="elevated"
              style={styles.petCard}
              onPress={() => setSelectedPet(pet)}
            >
              <View style={styles.petAvatar}>
                {pet.avatarUrl ? (
                  <View style={{ width: 60, height: 60, borderRadius: 30, overflow: 'hidden' }}>
                    <Image source={{ uri: pet.avatarUrl }} style={{ width: '100%', height: '100%' }} />
                  </View>
                ) : (
                  <MaterialCommunityIcons
                    name={pet.species === 'dog' ? 'dog' : 'cat'}
                    size={36}
                    color={pet.species === 'dog' ? colors.primary : colors.accent}
                  />
                )}
              </View>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petBreed}>{pet.breed}</Text>
              <View style={{ marginTop: spacing.xs }}>
                <Badge
                  label={`${pet.currentWeight} kg`}
                  variant="primary"
                  size="sm"
                />
              </View>
              </Card>
            ))}
          </ScrollView>
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.xl, marginBottom: spacing.md }]}>Accesos Rápido</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <Card key={index} variant="elevated" style={styles.quickActionCard} onPress={action.action}>
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                <MaterialCommunityIcons name={action.icon} size={28} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </Card>
          ))}
        </View>

      {/* Promo Banner */}
      <LinearGradient
        colors={colors.gradientAccent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.promoBanner}
      >
        <View style={styles.promoContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTag}>🎉 PROMO EXCLUSIVA</Text>
            <Text style={styles.promoTitle}>20% OFF en Alimentos</Text>
            <Text style={styles.promoDesc}>En marcas seleccionadas comprando desde la app.</Text>
          </View>
          <MaterialCommunityIcons name="tag-heart" size={44} color="rgba(255,255,255,0.9)" />
        </View>
      </LinearGradient>
      </ScrollView>

      {/* Add Pet Modal */}
      <Modal visible={addPetVisible} animationType="slide" presentationStyle="pageSheet">
        <AddPetModal
          onClose={() => setAddPetVisible(false)}
          onPetAdded={(newPet) => {
            setPets([...pets, newPet]);
          }}
        />
      </Modal>
      <Modal visible={chatbotVisible} animationType="slide" presentationStyle="pageSheet">
        <ChatbotScreen onClose={() => setChatbotVisible(false)} />
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={() => setChatbotVisible(true)}>
        <MaterialCommunityIcons name="robot" size={28} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 120 },
  hero: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadows.md,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroEyebrow: {
    fontFamily: fonts.nunito.bold,
    fontSize: fontSizes.xs,
    color: colors.primaryDark,
    letterSpacing: letterSpacing.caption,
    marginBottom: spacing.xs,
  },
  greeting: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes['2xl'], color: colors.textDark, letterSpacing: letterSpacing.tight },
  subGreeting: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: colors.textMuted, marginTop: spacing.xs },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, letterSpacing: letterSpacing.display },
  addText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.primaryDark },
  petsScroll: { flexGrow: 0, marginBottom: spacing.md },
  petCard: { width: 140, padding: spacing.md, alignItems: 'center', marginRight: spacing.md },
  petAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  petName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark },
  petBreed: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl, marginBottom: spacing.lg },
  emptyTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, marginTop: spacing.md, marginBottom: spacing.xs },
  emptyDesc: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.md },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.lg },
  quickActionCard: { width: '48%', alignItems: 'center', paddingVertical: spacing.lg, marginBottom: spacing.md },
  quickActionIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  quickActionLabel: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark },
  promoBanner: { marginBottom: spacing.lg, borderRadius: borderRadius.xl, padding: spacing.xl, ...shadows.md },
  promoContent: { flexDirection: 'row', alignItems: 'center' },
  promoTag: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.9)', letterSpacing: letterSpacing.caption, marginBottom: spacing.xs },
  promoTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: '#FFFFFF' },
  promoDesc: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.95)', marginTop: spacing.xs },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
});

export default ClientHomeScreen;
