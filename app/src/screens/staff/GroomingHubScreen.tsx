// ============================================================
// Veterinaria La Plata — Grooming Hub Screen (Peluquería)
// Sistema completo de gestión de turnos de peluquería, agendamiento
// de nuevos turnos, buscador de historias clínicas de pacientes (idéntico al del veterinario)
// y registro estructurado de servicios.
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../config/theme';
import { Card, Badge, Button, Input } from '../../components/ui';
import {
  Appointment,
  GroomingServiceType,
  GroomingRecord,
  MedicalRecord,
  Pet,
} from '../../types';
import {
  getAllAppointments,
  updateAppointment,
  getAllPets,
  createAppointment,
} from '../../services/dataService';
import {
  addGroomingRecord,
  getGroomingRecordsByPet,
  getMedicalRecordsByPet,
  searchPets,
} from '../../services/staffService';
import { uploadImage } from '../../services/storageService';
import { useAuthStore } from '../../store/authStore';

const SERVICE_TYPE_OPTIONS: { id: GroomingServiceType; label: string; icon: string }[] = [
  { id: 'bath_and_haircut', label: 'Baño + Corte', icon: 'content-cut' },
  { id: 'bath', label: 'Baño Completo', icon: 'shower' },
  { id: 'haircut', label: 'Corte Completo', icon: 'scissors-cutting' },
  { id: 'hygienic_cut', label: 'Corte Higiénico', icon: 'content-cut' },
  { id: 'detangling', label: 'Deslanado / Nudos', icon: 'comb' },
  { id: 'skin_treatment', label: 'Tratamiento Piel', icon: 'bottle-tonic-clean' },
  { id: 'nail_trim', label: 'Corte de Uñas', icon: 'hand-wash' },
  { id: 'ear_cleaning', label: 'Limpieza Oídos', icon: 'ear-hearing' },
];

const QUICK_HAIRCUT_STYLES = [
  'Corte Comercial a Tijera',
  'Corte Higiénico',
  'Corte de Raza Standard',
  'Desmotado / Rapado',
  'Rebajado de Manto',
  'Perfilado de Carita y Patas',
];

const QUICK_PRODUCTS = [
  'Shampoo Neutro',
  'Shampoo Hipoalergénico',
  'Shampoo Sanitario',
  'Bálsamo Desenredante',
  'Perfume Frutal',
  'Enjuague Pulguicida',
  'Jabón de Glicerina',
];

const formatTime = (date: Date): string =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const isSameDay = (d1: Date, d2: Date): boolean =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

export const GroomingHubScreen: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'turnero' | 'patients'>('turnero');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [petsMap, setPetsMap] = useState<Record<string, Pet>>({});
  const [allPetsList, setAllPetsList] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Buscador de Pacientes (Pestaña Fichas Clínicas)
  const [patientSearchQuery, setPatientSearchQuery] = useState('');

  // Modal Historial de Mascota
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [petGroomingRecords, setPetGroomingRecords] = useState<GroomingRecord[]>([]);
  const [petMedicalRecords, setPetMedicalRecords] = useState<MedicalRecord[]>([]);
  const [historyTab, setHistoryTab] = useState<'grooming' | 'medical'>('grooming');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Modal Registro de Servicio
  const [activeApp, setActiveApp] = useState<Appointment | null>(null);
  const [serviceType, setServiceType] = useState<GroomingServiceType>('bath_and_haircut');
  const [haircutStyle, setHaircutStyle] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [customProduct, setCustomProduct] = useState('');
  const [observations, setObservations] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);

  // Modal Agendar Nuevo Turno de Peluquería
  const [newAppModalVisible, setNewAppModalVisible] = useState(false);
  const [newPetSearch, setNewPetSearch] = useState('');
  const [newSelectedPet, setNewSelectedPet] = useState<Pet | null>(null);
  const [newAppDateStr, setNewAppDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [newAppTimeStr, setNewAppTimeStr] = useState('10:00');
  const [newAppService, setNewAppService] = useState<GroomingServiceType>('bath_and_haircut');
  const [newAppNotes, setNewAppNotes] = useState('');
  const [creatingApp, setCreatingApp] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apps, pets] = await Promise.all([getAllAppointments(), getAllPets()]);
      const groomingApps = apps.filter((a) => a.type === 'grooming' && a.status !== 'cancelled');
      setAllAppointments(groomingApps);
      setAllPetsList(pets);

      const map: Record<string, Pet> = {};
      pets.forEach((p) => {
        map[p.id] = p;
      });
      setPetsMap(map);
    } catch (error) {
      console.log('loadData grooming error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar turnos del día seleccionado y búsqueda global
  const qClean = searchQuery.trim().toLowerCase();
  const dayAppointments = allAppointments
    .filter((a) => {
      const matchesDay = qClean ? true : isSameDay(new Date(a.date), selectedDate);
      const matchesQuery =
        !qClean ||
        a.petName.toLowerCase().includes(qClean) ||
        a.ownerName.toLowerCase().includes(qClean) ||
        (petsMap[a.petId]?.breed || '').toLowerCase().includes(qClean);
      return matchesDay && matchesQuery;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filteredAppointments = dayAppointments.filter((a) => {
    if (filterStatus === 'pending') return a.status === 'pending' || a.status === 'confirmed';
    if (filterStatus === 'completed') return a.status === 'completed';
    return true;
  });

  const totalToday = dayAppointments.length;
  const pendingToday = dayAppointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length;
  const completedToday = dayAppointments.filter((a) => a.status === 'completed').length;

  const changeDay = (days: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  };

  const openPetHistory = async (petId: string, petName: string) => {
    const petObj = petsMap[petId] || ({
      id: petId,
      name: petName,
      species: 'dog',
      breed: 'Desconocida',
      ownerId: '',
      birthDate: new Date(),
      sex: 'male',
      currentWeight: 0,
      healthStatus: 'green',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Pet);

    setSelectedPet(petObj);
    setHistorySearchQuery('');
    setHistoryLoading(true);
    setHistoryTab('grooming');

    try {
      const [groomingRecs, medicalRes] = await Promise.all([
        getGroomingRecordsByPet(petId),
        getMedicalRecordsByPet(petId),
      ]);
      setPetGroomingRecords(groomingRecs);
      setPetMedicalRecords(medicalRes.records);
    } catch (error) {
      console.log('openPetHistory error:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openServiceForm = (app: Appointment) => {
    setActiveApp(app);
    setServiceType('bath_and_haircut');
    setHaircutStyle('');
    setSelectedProducts(['Shampoo Neutro', 'Bálsamo Desenredante']);
    setCustomProduct('');
    setObservations(app.notes || '');
    setPhotos([]);
  };

  const toggleProduct = (prod: string) => {
    if (selectedProducts.includes(prod)) {
      setSelectedProducts(selectedProducts.filter((p) => p !== prod));
    } else {
      setSelectedProducts([...selectedProducts, prod]);
    }
  };

  const addCustomProd = () => {
    const trimmed = customProduct.trim();
    if (trimmed && !selectedProducts.includes(trimmed)) {
      setSelectedProducts([...selectedProducts, trimmed]);
      setCustomProduct('');
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para adjuntar fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setUploadingPhoto(true);
        const uploadedUrl = await uploadImage(
          result.assets[0].uri,
          `grooming/${Date.now()}.jpg`
        );
        if (uploadedUrl) {
          setPhotos((current) => [...current, uploadedUrl]);
        } else {
          Alert.alert('Aviso', 'No se pudo subir la imagen.');
        }
      }
    } catch (error) {
      console.log('pickImage grooming error:', error);
      Alert.alert('Error', 'No se pudo cargar la foto.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveGroomingRecord = async () => {
    if (!activeApp) return;
    if (!user?.id) {
      Alert.alert('Error', 'Sesión inválida.');
      return;
    }

    setSavingRecord(true);
    try {
      await addGroomingRecord({
        petId: activeApp.petId,
        petName: activeApp.petName,
        groomerId: user.id,
        groomerName: user.name,
        date: new Date(),
        serviceType,
        haircutStyle: haircutStyle.trim() || undefined,
        productsUsed: selectedProducts,
        photos,
        observations: observations.trim() || undefined,
      });

      await updateAppointment(activeApp.id, { status: 'completed' });

      setActiveApp(null);
      await loadData();
      Alert.alert('¡Servicio Completado! ✂️', `Se registró la sesión de peluquería para ${activeApp.petName}.`);
    } catch (error) {
      console.log('Save grooming record error:', error);
      Alert.alert('Error', 'No se pudo registrar el servicio.');
    } finally {
      setSavingRecord(false);
    }
  };

  // Crear nuevo turno de peluquería
  const handleCreateNewAppointment = async () => {
    if (!newSelectedPet) {
      Alert.alert('Atención', 'Seleccioná la mascota para el turno.');
      return;
    }

    setCreatingApp(true);
    try {
      const [year, month, day] = newAppDateStr.split('-').map(Number);
      const [hours, minutes] = newAppTimeStr.split(':').map(Number);
      const appDate = new Date(year, month - 1, day, hours || 10, minutes || 0);

      await createAppointment({
        petId: newSelectedPet.id,
        petName: newSelectedPet.name,
        ownerId: newSelectedPet.ownerId,
        ownerName: newSelectedPet.ownerName || 'Cliente',
        type: 'grooming',
        date: appDate,
        timeSlot: hours < 13 ? 'morning' : 'afternoon',
        status: 'confirmed',
        notes: newAppNotes.trim() ? `${SERVICE_TYPE_OPTIONS.find(s=>s.id===newAppService)?.label}: ${newAppNotes.trim()}` : SERVICE_TYPE_OPTIONS.find(s=>s.id===newAppService)?.label,
      });

      setNewAppModalVisible(false);
      setNewSelectedPet(null);
      setNewPetSearch('');
      setNewAppNotes('');
      await loadData();
      Alert.alert('¡Turno Agendado! 📅', `Turno de peluquería creado para ${newSelectedPet.name}.`);
    } catch (error) {
      console.log('handleCreateNewAppointment error:', error);
      Alert.alert('Error', 'No se pudo agendar el turno.');
    } finally {
      setCreatingApp(false);
    }
  };

  // Buscador de Historias Clínicas (Pestaña Fichas & Pacientes)
  const pClean = patientSearchQuery.trim().toLowerCase();
  const filteredPatientsList = allPetsList.filter((p) => {
    if (!pClean) return true;
    return (
      p.name.toLowerCase().includes(pClean) ||
      (p.breed || '').toLowerCase().includes(pClean) ||
      (p.ownerName || '').toLowerCase().includes(pClean)
    );
  });

  // Filtrar historial de la mascota por búsqueda interna
  const hClean = historySearchQuery.trim().toLowerCase();
  const filteredGroomingRecords = petGroomingRecords.filter((r) => {
    if (!hClean) return true;
    return (
      r.serviceType.toLowerCase().includes(hClean) ||
      (r.haircutStyle || '').toLowerCase().includes(hClean) ||
      (r.observations || '').toLowerCase().includes(hClean) ||
      r.productsUsed.some((p) => p.toLowerCase().includes(hClean))
    );
  });

  const filteredMedicalRecords = petMedicalRecords.filter((m) => {
    if (!hClean) return true;
    return (
      m.type.toLowerCase().includes(hClean) ||
      (m.diagnosis || '').toLowerCase().includes(hClean) ||
      (m.treatment || '').toLowerCase().includes(hClean) ||
      (m.observations || '').toLowerCase().includes(hClean)
    );
  });

  // Mascotas filtradas para el modal de nuevo turno
  const filteredPetsForBooking = allPetsList.filter((p) => {
    if (!newPetSearch.trim()) return true;
    const q = newPetSearch.trim().toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.breed || '').toLowerCase().includes(q);
  });

  return (
    <View style={styles.container}>
      {/* Header Peluquería (Título limpio y botón Agendar a la derecha con espacio) */}
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: spacing.md }}>
          <Text style={styles.title} numberOfLines={1}>Estética & Peluquería</Text>
          <Text style={styles.subtitle}>Hola, {user?.name?.split(' ')[0] || 'Peluquero'}</Text>
        </View>
        <Button
          title="+ Agendar Turno"
          size="sm"
          variant="accent"
          onPress={() => setNewAppModalVisible(true)}
        />
      </View>

      {/* Tabs Principales de Peluquería */}
      <View style={styles.workspaceTabRow}>
        <TouchableOpacity
          style={[styles.workspaceTab, activeWorkspaceTab === 'turnero' && styles.workspaceTabActive]}
          onPress={() => setActiveWorkspaceTab('turnero')}
        >
          <MaterialCommunityIcons
            name="calendar-clock"
            size={18}
            color={activeWorkspaceTab === 'turnero' ? colors.primaryDark : colors.textMuted}
          />
          <Text style={[styles.workspaceTabText, activeWorkspaceTab === 'turnero' && styles.workspaceTabTextActive]}>
            Turnero del Día
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.workspaceTab, activeWorkspaceTab === 'patients' && styles.workspaceTabActive]}
          onPress={() => setActiveWorkspaceTab('patients')}
        >
          <MaterialCommunityIcons
            name="folder-account-outline"
            size={18}
            color={activeWorkspaceTab === 'patients' ? colors.primaryDark : colors.textMuted}
          />
          <Text style={[styles.workspaceTabText, activeWorkspaceTab === 'patients' && styles.workspaceTabTextActive]}>
            Fichas & Pacientes
          </Text>
        </TouchableOpacity>
      </View>

      {/* PESTAÑA 1: TURNERO DEL DÍA */}
      {activeWorkspaceTab === 'turnero' ? (
        <ScrollView contentContainerStyle={styles.list}>
          {/* Buscador de Turnos */}
          <View style={{ marginBottom: spacing.sm }}>
            <Input
              placeholder="🔍 Buscar por mascota, raza o dueño..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              containerStyle={{ marginBottom: 0 }}
            />
          </View>

          {/* Date Selector */}
          <View style={styles.dateBar}>
            <TouchableOpacity style={styles.dateNavBtn} onPress={() => changeDay(-1)}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textDark} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.dateCenter} onPress={() => setSelectedDate(new Date())}>
              <MaterialCommunityIcons name="calendar-month" size={20} color={colors.primary} />
              <Text style={styles.dateText}>
                {isSameDay(selectedDate, new Date())
                  ? 'Hoy'
                  : selectedDate.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dateNavBtn} onPress={() => changeDay(1)}>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          {/* KPI Cards */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderColor: colors.primarySoft }]}>
              <Text style={styles.kpiValue}>{totalToday}</Text>
              <Text style={styles.kpiLabel}>Turnos Día</Text>
            </View>
            <View style={[styles.kpiCard, { borderColor: colors.warning }]}>
              <Text style={[styles.kpiValue, { color: colors.warning }]}>{pendingToday}</Text>
              <Text style={styles.kpiLabel}>Pendientes</Text>
            </View>
            <View style={[styles.kpiCard, { borderColor: colors.success }]}>
              <Text style={[styles.kpiValue, { color: colors.success }]}>{completedToday}</Text>
              <Text style={styles.kpiLabel}>Completados</Text>
            </View>
          </View>

          {/* Filter Status Row */}
          <View style={styles.filterRow}>
            {(['all', 'pending', 'completed'] as const).map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.filterPill, filterStatus === st && styles.filterPillActive]}
                onPress={() => setFilterStatus(st)}
              >
                <Text style={[styles.filterPillText, filterStatus === st && styles.filterPillTextActive]}>
                  {st === 'all' ? 'Todos' : st === 'pending' ? 'Pendientes' : 'Completados'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filteredAppointments.length === 0 ? (
            <Card variant="outlined" style={styles.emptyCard}>
              <MaterialCommunityIcons name="content-cut" size={40} color={colors.textLight} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No se encontraron turnos con esa búsqueda.' : 'No hay turnos de peluquería para esta fecha.'}
              </Text>
            </Card>
          ) : (
            filteredAppointments.map((app) => {
              const petData = petsMap[app.petId];
              return (
                <Card key={app.id} variant="elevated" style={styles.appCard}>
                  {/* Top row: Time & Status */}
                  <View style={styles.appHeader}>
                    <View style={styles.timeBlock}>
                      <MaterialCommunityIcons name="clock-outline" size={16} color={colors.primary} />
                      <Text style={styles.timeText}>{formatTime(new Date(app.date))}</Text>
                    </View>
                    <Badge
                      label={app.status === 'pending' ? 'Pendiente' : app.status === 'confirmed' ? 'Confirmado' : 'Completado'}
                      variant={app.status === 'pending' ? 'warning' : app.status === 'confirmed' ? 'primary' : 'success'}
                    />
                  </View>

                  {/* Pet & Owner Info Block */}
                  <TouchableOpacity
                    style={styles.petInfoRow}
                    onPress={() => openPetHistory(app.petId, app.petName)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.petAvatar}>
                      <MaterialCommunityIcons name="paw" size={24} color={colors.primaryDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <Text style={styles.petName}>{app.petName}</Text>
                        {petData?.breed ? <Text style={styles.petBreed}>• {petData.breed}</Text> : null}
                      </View>
                      <Text style={styles.ownerName}>Dueño/a: {app.ownerName}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
                  </TouchableOpacity>

                  {app.notes ? <Text style={styles.serviceNote}>Nota: {app.notes}</Text> : null}

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    <Button
                      title="📋 Historial"
                      size="sm"
                      variant="outline"
                      style={{ flex: 1 }}
                      onPress={() => openPetHistory(app.petId, app.petName)}
                    />
                    <Button
                      title={app.status === 'completed' ? '✓ Completado' : '✂️ Registrar Servicio'}
                      size="sm"
                      variant={app.status === 'completed' ? 'ghost' : 'primary'}
                      style={{ flex: 1.3 }}
                      onPress={() => openServiceForm(app)}
                      disabled={app.status === 'completed'}
                    />
                  </View>
                </Card>
              );
            })
          )}

          {/* Botón de Cerrar Sesión en la Parte Inferior */}
          <Button
            title="Cerrar sesión"
            onPress={logout}
            variant="ghost"
            style={styles.bottomLogoutBtn}
          />
        </ScrollView>
      ) : (
        /* PESTAÑA 2: FICHAS & HISTORIAS CLÍNICAS (Buscador idéntico al veterinario) */
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionTitle}>Buscador de Historias Clínicas & Expedientes</Text>
          <Text style={styles.sectionSub}>Buscá pacientes de la clínica para ver su historial médico y de peluquería.</Text>

          <Input
            placeholder="🔍 Buscar paciente por nombre, raza o dueño..."
            value={patientSearchQuery}
            onChangeText={setPatientSearchQuery}
            containerStyle={{ marginBottom: spacing.md }}
          />

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filteredPatientsList.length === 0 ? (
            <Card variant="outlined" style={styles.emptyCard}>
              <MaterialCommunityIcons name="paw-off-outline" size={40} color={colors.textLight} />
              <Text style={styles.emptyText}>No se encontraron pacientes con esa búsqueda.</Text>
            </Card>
          ) : (
            filteredPatientsList.map((pet) => (
              <Card key={pet.id} variant="elevated" style={styles.patientDirectoryCard}>
                <View style={styles.patientRowHeader}>
                  <View style={styles.petAvatar}>
                    <MaterialCommunityIcons name="paw" size={24} color={colors.primaryDark} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.petName}>{pet.name}</Text>
                      <Badge
                        label={pet.healthStatus === 'green' ? 'Saludable ✓' : 'Atención ⚠️'}
                        variant={pet.healthStatus === 'green' ? 'success' : 'warning'}
                        size="sm"
                      />
                    </View>
                    <Text style={styles.petMeta}>
                      {pet.breed || 'Sin raza'} • {pet.sex === 'female' ? 'Hembra ♀' : 'Macho ♂'} • {pet.currentWeight || 0} kg
                    </Text>
                    {pet.ownerName ? <Text style={styles.ownerName}>Dueño/a: {pet.ownerName}</Text> : null}
                  </View>
                </View>

                <Button
                  title="📋 Abrir Expediente e Historial"
                  size="sm"
                  variant="outline"
                  style={{ marginTop: spacing.md }}
                  onPress={() => openPetHistory(pet.id, pet.name)}
                />
              </Card>
            ))
          )}

          {/* Botón de Cerrar Sesión en la Parte Inferior */}
          <Button
            title="Cerrar sesión"
            onPress={logout}
            variant="ghost"
            style={styles.bottomLogoutBtn}
          />
        </ScrollView>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: HISTORIAL DE LA MASCOTA Y BÚSQUEDA DENTRO */}
      {/* ============================================================ */}
      <Modal visible={!!selectedPet} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedPet?.name}</Text>
                <Text style={styles.modalSub}>
                  {selectedPet?.breed} • {selectedPet?.sex === 'female' ? 'Hembra' : 'Macho'} • {selectedPet?.currentWeight || 0} kg
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPet(null)} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* Buscador dentro del historial */}
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
              <Input
                placeholder="🔍 Buscar en el historial (ej: shampoo, nudos, raza)..."
                value={historySearchQuery}
                onChangeText={setHistorySearchQuery}
                containerStyle={{ marginBottom: 0 }}
              />
            </View>

            {/* History Tabs */}
            <View style={styles.historyTabRow}>
              <TouchableOpacity
                style={[styles.historyTab, historyTab === 'grooming' && styles.historyTabActive]}
                onPress={() => setHistoryTab('grooming')}
              >
                <Text style={[styles.historyTabText, historyTab === 'grooming' && styles.historyTabTextActive]}>
                  ✂️ Peluquería ({filteredGroomingRecords.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.historyTab, historyTab === 'medical' && styles.historyTabActive]}
                onPress={() => setHistoryTab('medical')}
              >
                <Text style={[styles.historyTabText, historyTab === 'medical' && styles.historyTabTextActive]}>
                  🩺 Historia Clínica ({filteredMedicalRecords.length})
                </Text>
              </TouchableOpacity>
            </View>

            {historyLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
                {historyTab === 'grooming' ? (
                  filteredGroomingRecords.length === 0 ? (
                    <Text style={styles.emptyText}>No hay registros de peluquería que coincidan.</Text>
                  ) : (
                    filteredGroomingRecords.map((r) => (
                      <Card key={r.id} variant="outlined" style={styles.recordCard}>
                        <View style={styles.recordHeader}>
                          <Text style={styles.recordDate}>
                            {new Date(r.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Text>
                          <Badge label={r.serviceType} variant="primary" size="sm" />
                        </View>
                        {r.haircutStyle ? <Text style={styles.recordDetail}>Estilo: {r.haircutStyle}</Text> : null}
                        {r.productsUsed && r.productsUsed.length > 0 ? (
                          <Text style={styles.recordDetail}>Productos: {r.productsUsed.join(', ')}</Text>
                        ) : null}
                        {r.observations ? <Text style={styles.recordObs}>Notas: {r.observations}</Text> : null}
                        {r.photos && r.photos.length > 0 ? (
                          <ScrollView horizontal style={{ marginTop: spacing.sm }}>
                            {r.photos.map((ph, idx) => (
                              <Image key={idx} source={{ uri: ph }} style={styles.recordPhotoThumb} />
                            ))}
                          </ScrollView>
                        ) : null}
                        <Text style={styles.recordGroomer}>Atendido por: {r.groomerName}</Text>
                      </Card>
                    ))
                  )
                ) : (
                  filteredMedicalRecords.length === 0 ? (
                    <Text style={styles.emptyText}>No hay consultas médicas que coincidan.</Text>
                  ) : (
                    filteredMedicalRecords.map((m) => (
                      <Card key={m.id} variant="outlined" style={styles.recordCard}>
                        <View style={styles.recordHeader}>
                          <Text style={styles.recordDate}>
                            {new Date(m.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Text>
                          <Badge label={m.type} variant="accent" size="sm" />
                        </View>
                        {m.diagnosis ? <Text style={styles.recordDetail}>Diagnóstico: {m.diagnosis}</Text> : null}
                        {m.treatment ? <Text style={styles.recordDetail}>Tratamiento: {m.treatment}</Text> : null}
                        {m.observations ? <Text style={styles.recordObs}>Observaciones: {m.observations}</Text> : null}
                      </Card>
                    ))
                  )
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 2: REGISTRO DETALLADO DE SERVICIO DE PELUQUERÍA */}
      {/* ============================================================ */}
      <Modal visible={!!activeApp} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Registrar Servicio</Text>
                <Text style={styles.modalSub}>Mascota: {activeApp?.petName} ({activeApp?.ownerName})</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveApp(null)} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing['3xl'] }}>
              {/* 1. Tipo de Servicio */}
              <Text style={styles.formSectionTitle}>1. Tipo de Servicio Realizado</Text>
              <View style={styles.serviceGrid}>
                {SERVICE_TYPE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.serviceOption, serviceType === opt.id && styles.serviceOptionActive]}
                    onPress={() => setServiceType(opt.id)}
                  >
                    <MaterialCommunityIcons
                      name={opt.icon as any}
                      size={20}
                      color={serviceType === opt.id ? colors.primaryDark : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.serviceOptionText,
                        serviceType === opt.id && styles.serviceOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 2. Estilo de Corte Específico */}
              <Text style={styles.formSectionTitle}>2. Estilo de Corte Específico</Text>
              <Input
                placeholder="Ej: Corte Comercial a tijera, rebajado en lomo..."
                value={haircutStyle}
                onChangeText={setHaircutStyle}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                {QUICK_HAIRCUT_STYLES.map((st) => (
                  <TouchableOpacity key={st} style={styles.chipPill} onPress={() => setHaircutStyle(st)}>
                    <Text style={styles.chipPillText}>+ {st}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* 3. Productos Utilizados */}
              <Text style={styles.formSectionTitle}>3. Productos Utilizados</Text>
              <View style={styles.productsWrap}>
                {QUICK_PRODUCTS.map((prod) => {
                  const active = selectedProducts.includes(prod);
                  return (
                    <TouchableOpacity
                      key={prod}
                      style={[styles.prodCheckChip, active && styles.prodCheckChipActive]}
                      onPress={() => toggleProduct(prod)}
                    >
                      <MaterialCommunityIcons
                        name={active ? 'checkbox-marked-circle' : 'circle-outline'}
                        size={18}
                        color={active ? colors.primaryDark : colors.textMuted}
                      />
                      <Text style={[styles.prodCheckText, active && styles.prodCheckTextActive]}>{prod}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs, marginBottom: spacing.md }}>
                <Input
                  placeholder="Agregar otro producto..."
                  value={customProduct}
                  onChangeText={setCustomProduct}
                  containerStyle={{ flex: 1, marginBottom: 0 }}
                />
                <Button title="Agregar" size="sm" variant="outline" onPress={addCustomProd} />
              </View>

              {/* 4. Observaciones */}
              <Text style={styles.formSectionTitle}>4. Observaciones & Estado del Manto</Text>
              <Input
                placeholder="Ej: Nudos leves detrás de orejas. Piel limpia. Conducta muy dócil..."
                value={observations}
                onChangeText={setObservations}
                multiline
                numberOfLines={3}
              />

              {/* 5. Fotos del Servicio */}
              <Text style={styles.formSectionTitle}>5. Fotografías del Servicio</Text>
              <View style={styles.photosRow}>
                {photos.map((ph, idx) => (
                  <View key={idx} style={styles.photoThumbWrap}>
                    <Image source={{ uri: ph }} style={styles.photoThumb} />
                    <TouchableOpacity
                      style={styles.removePhotoBtn}
                      onPress={() => setPhotos(photos.filter((_, i) => i !== idx))}
                    >
                      <MaterialCommunityIcons name="close" size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage} disabled={uploadingPhoto}>
                  {uploadingPhoto ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="camera-plus" size={24} color={colors.primary} />
                      <Text style={styles.addPhotoText}>Agregar Foto</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Submit button */}
              <Button
                title="Guardar & Completar Servicio"
                size="lg"
                variant="accent"
                fullWidth
                style={{ marginTop: spacing.xl }}
                onPress={handleSaveGroomingRecord}
                loading={savingRecord}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 3: AGENDAR NUEVO TURNO DE PELUQUERÍA */}
      {/* ============================================================ */}
      <Modal visible={newAppModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Agendar Turno de Peluquería</Text>
                <Text style={styles.modalSub}>Asignar paciente y servicio de grooming</Text>
              </View>
              <TouchableOpacity onPress={() => setNewAppModalVisible(false)} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing['3xl'] }}>
              {/* Seleccionar Mascota */}
              <Text style={styles.formSectionTitle}>1. Mascota del Turno</Text>
              {newSelectedPet ? (
                <View style={styles.selectedPetCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.petName}>{newSelectedPet.name}</Text>
                    <Text style={styles.ownerName}>Raza: {newSelectedPet.breed} • Dueño: {newSelectedPet.ownerName}</Text>
                  </View>
                  <Button title="Cambiar" size="sm" variant="ghost" onPress={() => setNewSelectedPet(null)} />
                </View>
              ) : (
                <>
                  <Input
                    placeholder="🔍 Buscar paciente por nombre o raza..."
                    value={newPetSearch}
                    onChangeText={setNewPetSearch}
                  />
                  <ScrollView style={{ maxHeight: 150, marginBottom: spacing.md }}>
                    {filteredPetsForBooking.slice(0, 6).map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={styles.petSearchRow}
                        onPress={() => setNewSelectedPet(p)}
                      >
                        <MaterialCommunityIcons name="paw" size={18} color={colors.primaryDark} />
                        <Text style={styles.petSearchName}>{p.name}</Text>
                        <Text style={styles.petSearchMeta}>({p.breed || 'Sin raza'})</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Fecha y Hora */}
              <Text style={styles.formSectionTitle}>2. Fecha y Hora</Text>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Input
                  label="Fecha (AAAA-MM-DD)"
                  value={newAppDateStr}
                  onChangeText={setNewAppDateStr}
                  containerStyle={{ flex: 1 }}
                />
                <Input
                  label="Hora (HH:MM)"
                  value={newAppTimeStr}
                  onChangeText={setNewAppTimeStr}
                  containerStyle={{ flex: 1 }}
                />
              </View>

              {/* Servicio */}
              <Text style={styles.formSectionTitle}>3. Servicio a Realizar</Text>
              <View style={styles.serviceGrid}>
                {SERVICE_TYPE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.serviceOption, newAppService === opt.id && styles.serviceOptionActive]}
                    onPress={() => setNewAppService(opt.id)}
                  >
                    <MaterialCommunityIcons
                      name={opt.icon as any}
                      size={20}
                      color={newAppService === opt.id ? colors.primaryDark : colors.textMuted}
                    />
                    <Text style={[styles.serviceOptionText, newAppService === opt.id && styles.serviceOptionTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notas */}
              <Text style={styles.formSectionTitle}>4. Notas o Solicitudes Especiales</Text>
              <Input
                placeholder="Ej: Pedir que sea corte bajito. Trae shampoo propio..."
                value={newAppNotes}
                onChangeText={setNewAppNotes}
                multiline
              />

              <Button
                title="Confirmar & Agendar Turno"
                size="lg"
                variant="primary"
                fullWidth
                style={{ marginTop: spacing.lg }}
                onPress={handleCreateNewAppointment}
                loading={creatingApp}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  subtitle: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },

  workspaceTabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  workspaceTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  workspaceTabActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  workspaceTabText: {
    fontFamily: fonts.nunito.semiBold,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  workspaceTabTextActive: {
    fontFamily: fonts.nunito.bold,
    color: colors.primaryDark,
  },

  sectionTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark },
  sectionSub: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginBottom: spacing.md, marginTop: 2 },

  patientDirectoryCard: { padding: spacing.md, marginBottom: spacing.md },
  patientRowHeader: { flexDirection: 'row', alignItems: 'center' },
  petMeta: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },

  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  dateNavBtn: { padding: spacing.xs },
  dateCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dateText: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark, textTransform: 'capitalize' },

  kpiRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  kpiValue: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.primaryDark },
  kpiLabel: { fontFamily: fonts.nunito.regular, fontSize: 10, color: colors.textMuted, marginTop: 2 },

  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md, alignItems: 'center' },
  filterPill: { height: 32, paddingHorizontal: spacing.md, borderRadius: 16, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  filterPillActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  filterPillText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.xs, color: colors.textMuted },
  filterPillTextActive: { color: colors.primaryDark, fontFamily: fonts.nunito.bold },

  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing['3xl'] },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  emptyCard: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center' },

  appCard: { padding: spacing.md, marginBottom: spacing.md },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  timeBlock: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark, marginLeft: 4 },

  petInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  petAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  petName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark },
  petBreed: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  ownerName: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  serviceNote: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textDark, marginBottom: spacing.sm },

  cardActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  bottomLogoutBtn: { marginTop: spacing.xl, marginBottom: spacing.xl },

  // Modales
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.bgMain, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark },
  modalSub: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  closeBtn: { padding: spacing.xs },

  historyTabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgCard },
  historyTab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  historyTabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  historyTabText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.xs, color: colors.textMuted },
  historyTabTextActive: { color: colors.primaryDark, fontFamily: fonts.nunito.bold },

  recordCard: { padding: spacing.md, marginBottom: spacing.sm },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  recordDate: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.textDark },
  recordDetail: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textDark, marginTop: 2 },
  recordObs: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  recordGroomer: { fontFamily: fonts.nunito.regular, fontSize: 10, color: colors.textLight, marginTop: 6 },
  recordPhotoThumb: { width: 60, height: 60, borderRadius: borderRadius.sm, marginRight: spacing.xs },

  formSectionTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.sm, color: colors.textDark, marginTop: spacing.md, marginBottom: spacing.xs },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  serviceOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceOptionActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  serviceOptionText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.xs, color: colors.textMuted },
  serviceOptionTextActive: { color: colors.primaryDark, fontFamily: fonts.nunito.bold },

  chipPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, marginRight: spacing.xs },
  chipPillText: { fontFamily: fonts.nunito.semiBold, fontSize: 11, color: colors.textMuted },

  productsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },
  prodCheckChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prodCheckChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  prodCheckText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  prodCheckTextActive: { fontFamily: fonts.nunito.bold, color: colors.primaryDark },

  photosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  photoThumbWrap: { position: 'relative' },
  photoThumb: { width: 72, height: 72, borderRadius: borderRadius.md },
  removePhotoBtn: { position: 'absolute', top: -4, right: -4, backgroundColor: colors.danger, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  addPhotoBtn: { width: 72, height: 72, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 2 },
  addPhotoText: { fontFamily: fonts.nunito.bold, fontSize: 9, color: colors.primary },

  selectedPetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  petSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  petSearchName: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark },
  petSearchMeta: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
});

export default GroomingHubScreen;
