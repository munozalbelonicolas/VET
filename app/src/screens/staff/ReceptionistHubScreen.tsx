// ============================================================
// Veterinaria La Plata — Receptionist Hub Screen (Recepción, Turnero & Cobros MP)
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../config/theme';
import { Card, Badge, Button, Input } from '../../components/ui';
import { PaymentQRModal } from '../../components/ui/PaymentQRModal';
import { WaitingRoomTVDisplay } from './WaitingRoomTVDisplay';
import {
  QueueItem,
  subscribeToQueue,
  addToQueue,
  updateQueueStatus,
  removeFromQueue,
} from '../../services/waitingRoomService';
import { searchPets } from '../../services/staffService';
import { Pet, Order } from '../../types';
import { getOrders, updateOrderStatus } from '../../services/shopService';
import { useAuthStore } from '../../store/authStore';

interface BillingOp {
  id: string;
  type: 'appointment' | 'sale';
  time: string;
  client: string;
  description: string;
  amount: number;
  status: 'paid' | 'unpaid';
  orderId?: string;
}

export const ReceptionistHubScreen: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'queue' | 'billing'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [ops, setOps] = useState<BillingOp[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [chargeAmount, setChargeAmount] = useState(15000);
  const [chargeConcept, setChargeConcept] = useState('Cobro Servicio / Consulta');
  const [activeOpId, setActiveOpId] = useState<string | null>(null);

  // TV Screen Modal State
  const [tvScreenVisible, setTvScreenVisible] = useState(false);

  // Add to Queue Modal State
  const [addQueueVisible, setAddQueueVisible] = useState(false);
  const [newPetName, setNewPetName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newRoom, setNewRoom] = useState('Consultorio 1');
  const [petSearch, setPetSearch] = useState('');
  const [petResults, setPetResults] = useState<Pet[]>([]);
  const [selectedQueuePet, setSelectedQueuePet] = useState<Pet | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToQueue((items) => setQueue(items));
    loadBilling();
    return () => unsubscribe();
  }, []);

  const loadBilling = async () => {
    try {
      const orders = await getOrders();
      const billingOps: BillingOp[] = orders.map((o: Order) => ({
        id: o.id,
        type: 'sale',
        time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        client: o.clientName,
        description: `${o.items.map((i) => i.productName).join(', ') || 'Pedido'}`,
        amount: o.total,
        status: o.paymentStatus === 'approved' ? 'paid' : 'unpaid',
        orderId: o.id,
      }));
      setOps(billingOps);
    } catch (error) {
      console.log('loadBilling error:', error);
    }
  };

  const handleOpenPayment = (amount?: number, concept?: string, opId?: string) => {
    setChargeAmount(amount && amount > 0 ? amount : 15000);
    setChargeConcept(concept || 'Cobro de Mostrador');
    setActiveOpId(opId || null);
    setPaymentModalVisible(true);
  };

  const handlePaymentSuccess = async (amount: number, concept: string) => {
    if (activeOpId) {
      setOps((current) =>
        current.map((op) => (op.id === activeOpId ? { ...op, status: 'paid' } : op))
      );
      try {
        await updateOrderStatus(activeOpId, 'approved', 'preparing');
      } catch (e) {
        console.log('updateOrderStatus error:', e);
      }
    }
  };

  const handleAddPatientToQueue = async () => {
    if (!newPetName.trim() || !newOwnerName.trim()) {
      Alert.alert('Error', 'Ingresá el nombre de la mascota y del dueño');
      return;
    }

    try {
      await addToQueue(
        newPetName.trim(),
        newOwnerName.trim(),
        newReason || 'Consulta General',
        newRoom,
        selectedQueuePet?.id
      );
      setAddQueueVisible(false);
      setNewPetName('');
      setNewOwnerName('');
      setNewReason('');
      setPetSearch('');
      setPetResults([]);
      setSelectedQueuePet(null);
      Alert.alert('¡Paciente Registrado! 🎟️', `Orden de llegada asignado.`);
    } catch (error) {
      console.log('addToQueue error:', error);
      Alert.alert('Error', 'No se pudo registrar al paciente.');
    }
  };

  const handlePetSearch = async (text: string) => {
    setPetSearch(text);
    setSelectedQueuePet(null);
    if (text.trim().length < 2) {
      setPetResults([]);
      return;
    }
    try {
      const results = await searchPets(text, 8);
      setPetResults(results);
    } catch (error) {
      console.log('pet search error:', error);
      setPetResults([]);
    }
  };

  const handleCallPatient = async (id: string, room?: string) => {
    try {
      await updateQueueStatus(id, 'calling', room);
      Alert.alert('🔔 Paciente Llamado', 'Aparecerá destacado en la pantalla TV de la sala de espera.');
    } catch (error) {
      console.log('call error:', error);
    }
  };

  const handleCompletePatient = async (id: string) => {
    try {
      await updateQueueStatus(id, 'completed');
    } catch (error) {
      console.log('complete error:', error);
    }
  };

  const handleRemoveQueueItem = async (id: string) => {
    Alert.alert('Quitar paciente', '¿Eliminar a este paciente de la lista de espera?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFromQueue(id);
          } catch (error) {
            console.log('remove error:', error);
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que querés cerrar tu sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.title}>Recepción & Turnero</Text>
            <Text style={styles.subtitle}>Orden de Llegada y Caja en Mostrador</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <TouchableOpacity
              style={styles.tvLaunchBtn}
              onPress={() => setTvScreenVisible(true)}
            >
              <MaterialCommunityIcons name="television" size={18} color={colors.primaryDark} />
              <Text style={styles.tvLaunchText}>TV 📺</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
            >
              <MaterialCommunityIcons name="logout" size={18} color={colors.danger} />
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'queue' && styles.tabActive]}
          onPress={() => setActiveTab('queue')}
        >
          <Text style={[styles.tabText, activeTab === 'queue' && styles.tabTextActive]}>
            🎟️ Orden de Llegada ({queue.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'billing' && styles.tabActive]}
          onPress={() => setActiveTab('billing')}
        >
          <Text style={[styles.tabText, activeTab === 'billing' && styles.tabTextActive]}>
            💳 Caja & Cobros
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: QUEUE (ORDEN DE LLEGADA) */}
      {activeTab === 'queue' && (
        <ScrollView contentContainerStyle={styles.list}>
          <Button
            title="+ Registrar Llegada de Paciente"
            onPress={() => setAddQueueVisible(true)}
            variant="primary"
            size="md"
            style={{ marginBottom: spacing.md }}
          />

          {queue.length === 0 ? (
            <Card variant="outlined" style={styles.emptyCard}>
              <Text style={styles.emptyText}>No hay pacientes en sala de espera.</Text>
            </Card>
          ) : (
            queue.map((item) => (
              <Card key={item.id} variant="elevated" style={styles.queueCard}>
                <View style={styles.qHeader}>
                  <View style={styles.tPill}>
                    <Text style={styles.tText}>{item.ticketNumber}</Text>
                  </View>

                  <Badge
                    label={
                      item.status === 'calling'
                        ? '🔔 Llamando'
                        : item.status === 'in_consultation'
                        ? '🩺 En Atención'
                        : item.status === 'completed'
                        ? 'Atendido'
                        : 'En Espera'
                    }
                    variant={
                      item.status === 'calling'
                        ? 'warning'
                        : item.status === 'completed'
                        ? 'success'
                        : 'primary'
                    }
                  />
                </View>

                <Text style={styles.qPetName}>{item.petName} 🐾</Text>
                <Text style={styles.qOwnerName}>Dueño: {item.ownerName}</Text>
                <Text style={styles.qReason}>Motivo: {item.reason}</Text>
                <Text style={styles.qRoom}>Destino: {item.doctorOrRoom}</Text>

                {/* Queue Action Buttons */}
                <View style={styles.qActions}>
                  {item.status === 'waiting' && (
                    <Button
                      title="🔔 Llamar a Pantalla TV"
                      onPress={() => handleCallPatient(item.id, item.doctorOrRoom)}
                      variant="accent"
                      size="sm"
                    />
                  )}

                  {item.status === 'calling' && (
                    <Button
                      title="✓ Finalizar Atención"
                      onPress={() => handleCompletePatient(item.id)}
                      variant="primary"
                      size="sm"
                    />
                  )}

                  <TouchableOpacity onPress={() => handleRemoveQueueItem(item.id)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}

      {/* TAB 2: BILLING (CAJA Y COBROS) */}
      {activeTab === 'billing' && (
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.searchContainer}>
            <Input
              placeholder="🔍 Buscar por cliente o servicio..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {ops
            .filter(op =>
              op.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
              op.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((op) => (
              <Card key={op.id} variant="elevated" style={styles.opCard}>
                <View style={styles.opHeader}>
                  <View style={styles.typeBlock}>
                    <MaterialCommunityIcons
                      name={op.type === 'appointment' ? 'calendar-clock' : 'cart'}
                      size={18}
                      color={op.type === 'appointment' ? colors.primary : colors.accent}
                    />
                    <Text style={styles.timeText}>{op.time}</Text>
                  </View>
                  <Badge
                    label={op.status === 'paid' ? 'Pagado ✓' : 'Pendiente de Cobro'}
                    variant={op.status === 'paid' ? 'success' : 'danger'}
                  />
                </View>

                <Text style={styles.clientName}>{op.client}</Text>
                <Text style={styles.description}>{op.description}</Text>

                <View style={styles.footerRow}>
                  <Text style={styles.amountText}>${op.amount.toLocaleString('es-AR')}</Text>
                  {op.status === 'unpaid' ? (
                    <Button
                      title="💳 Cobrar MP QR"
                      size="sm"
                      variant="accent"
                      onPress={() => handleOpenPayment(op.amount, `${op.description} - ${op.client}`, op.id)}
                    />
                  ) : (
                    <Text style={{ fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.success }}>
                      Acreditado
                    </Text>
                  )}
                </View>
              </Card>
            ))}
        </ScrollView>
      )}

      {/* Floating Bottom Action Bar with MP QR Button */}
      <View style={styles.floatingActions}>
        <Button
          title="💳 Cobrar con Mercado Pago QR"
          icon={<MaterialCommunityIcons name="qrcode-scan" size={20} color="#FFF" />}
          onPress={() => handleOpenPayment(15000, 'Cobro en Mostrador')}
          style={styles.payBtn}
        />
      </View>

      {/* Add Patient Arrival Modal */}
      <Modal visible={addQueueVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Registrar Llegada de Paciente</Text>
            <TouchableOpacity onPress={() => setAddQueueVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.labelText}>Buscar mascota registrada (opcional)</Text>
            <Input
              placeholder="🔍 Ej: Luna, Michi..."
              value={petSearch}
              onChangeText={handlePetSearch}
              containerStyle={{ marginBottom: spacing.sm }}
            />

            {selectedQueuePet ? (
              <View style={styles.selectedPetRow}>
                <MaterialCommunityIcons name="paw" size={20} color={colors.primary} />
                <Text style={{ flex: 1, fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark, marginLeft: spacing.xs }}>
                  {selectedQueuePet.name} • {selectedQueuePet.breed || selectedQueuePet.species}
                </Text>
                <TouchableOpacity onPress={() => setSelectedQueuePet(null)}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={colors.textLight} />
                </TouchableOpacity>
              </View>
            ) : (
              petResults.length > 0 && (
                <View style={styles.petResultsBox}>
                  {petResults.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.petResultRow}
                      onPress={() => {
                        setSelectedQueuePet(p);
                        setNewPetName(p.name);
                        setNewOwnerName(p.ownerName || '');
                        setPetResults([]);
                        setPetSearch('');
                      }}
                    >
                      <MaterialCommunityIcons name={p.species === 'dog' ? 'dog' : 'cat'} size={18} color={colors.primary} />
                      <Text style={{ flex: 1, fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark, marginLeft: spacing.xs }}>
                        {p.name} ({p.breed || p.species})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )
            )}

            <Input
              label="Nombre de la Mascota"
              placeholder="Ej: Luna, Max..."
              value={newPetName}
              onChangeText={setNewPetName}
            />

            <Input
              label="Nombre del Dueño/a"
              placeholder="Ej: María González"
              value={newOwnerName}
              onChangeText={setNewOwnerName}
            />

            <Input
              label="Motivo de la Visita"
              placeholder="Ej: Consulta Médica, Vacuna..."
              value={newReason}
              onChangeText={setNewReason}
            />

            <Input
              label="Consultorio / Destino Asignado"
              placeholder="Ej: Consultorio 1 (Dr. Fernández)"
              value={newRoom}
              onChangeText={setNewRoom}
            />

            <Button
              title="Registrar en Turnero"
              onPress={handleAddPatientToQueue}
              variant="accent"
              size="lg"
              fullWidth
              style={{ marginTop: spacing.md }}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Mercado Pago Payment Modal */}
      <PaymentQRModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        initialAmount={chargeAmount}
        initialConcept={chargeConcept}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Fullscreen Waiting Room TV Display Modal */}
      <Modal visible={tvScreenVisible} animationType="fade">
        <WaitingRoomTVDisplay onClose={() => setTvScreenVisible(false)} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { padding: spacing.xl, paddingBottom: spacing.sm, paddingTop: spacing['2xl'] },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  subtitle: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  tvLaunchBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.primarySoft, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.primary },
  tvLaunchText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.primaryDark },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.dangerSoft || '#FEE2E2', borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.danger },
  logoutText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.danger },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  tab: { flex: 1, paddingVertical: spacing.xs, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: colors.border },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.xs, color: colors.textMuted },
  tabTextActive: { color: colors.primaryDark, fontFamily: fonts.nunito.bold },
  searchContainer: { marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 110 },
  emptyCard: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted },
  queueCard: { padding: spacing.md, marginBottom: spacing.sm },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  tPill: { backgroundColor: colors.primarySoft, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  tText: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.sm, color: colors.primaryDark },
  qPetName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark, marginTop: 2 },
  qOwnerName: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  qReason: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textDark, marginTop: 2 },
  qRoom: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.primaryDark, marginTop: 2 },
  qActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  opCard: { padding: spacing.lg, marginBottom: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.primary },
  opHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  typeBlock: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark, marginLeft: spacing.xs },
  clientName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, marginTop: spacing.xs },
  description: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  amountText: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark },
  floatingActions: { position: 'absolute', bottom: 20, left: spacing.lg, right: spacing.lg, ...shadows.lg },
  payBtn: { backgroundColor: '#009EE3', paddingVertical: spacing.md, borderRadius: borderRadius.lg },
  modalContainer: { flex: 1, backgroundColor: colors.bgMain, paddingTop: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark },
  modalContent: { padding: spacing.xl },
  labelText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark, marginBottom: spacing.xs },
  selectedPetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  petResultsBox: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  petResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});

export default ReceptionistHubScreen;
