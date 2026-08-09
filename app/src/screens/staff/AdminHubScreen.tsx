// ============================================================
// Veterinaria La Plata — Admin Hub Screen (Gestión & E-commerce)
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
  Linking,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../config/theme';
import { Card, Badge, Button, Input } from '../../components/ui';
import { CalendarView } from '../../components/ui/CalendarView';
import { AddProductModal } from './AddProductModal';
import { Product, Order, ShippingStatus, Appointment } from '../../types';
import {
  getProducts,
  getOrders,
  updateOrderShipping,
  updateProductStock,
  deleteProduct,
} from '../../services/shopService';

const MOCK_EMPLOYEES = [
  { id: 'emp-1', name: 'Dr. Roberto Santos', role: 'Veterinario', status: 'active', shifts: 'Lunes a Viernes' },
  { id: 'emp-2', name: 'Dra. Laura Gómez', role: 'Veterinario', status: 'active', shifts: 'Fines de semana' },
  { id: 'emp-3', name: 'Esteban Quito', role: 'Peluquero', status: 'inactive', shifts: 'Licencia' },
  { id: 'emp-4', name: 'Marta Pérez', role: 'Recepcionista', status: 'active', shifts: 'Lunes a Viernes (Mañana)' },
];

const MOCK_ADMIN_CLINIC_APPOINTMENTS: Appointment[] = [
  {
    id: 'app-101',
    petId: 'pet-1',
    petName: 'Luna',
    ownerId: 'client-001',
    ownerName: 'María González',
    type: 'vaccination',
    date: new Date(),
    timeSlot: '09:00 - 09:30',
    status: 'confirmed',
    notes: 'Vacuna Sextuple de rutina',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'app-102',
    petId: 'pet-2',
    petName: 'Max',
    ownerId: 'client-002',
    ownerName: 'Carlos Pérez',
    type: 'consultation',
    date: new Date(),
    timeSlot: '11:00 - 11:30',
    status: 'confirmed',
    notes: 'Consulta clínica general',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'app-103',
    petId: 'pet-3',
    petName: 'Bella',
    ownerId: 'client-003',
    ownerName: 'Ana López',
    type: 'grooming',
    date: new Date(),
    timeSlot: '14:30 - 15:30',
    status: 'confirmed',
    notes: 'Corte de pelo y baño completo',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

interface AdminHubScreenProps {
  initialTab?: 'calendar' | 'products' | 'orders' | 'employees';
}

export const AdminHubScreen: React.FC<AdminHubScreenProps> = ({ initialTab = 'calendar' }) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'products' | 'orders' | 'calendar'>(initialTab);
  const [addProductVisible, setAddProductVisible] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Tracking edit modal
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState('');

  useEffect(() => {
    loadProductsAndOrders();
  }, []);

  const loadProductsAndOrders = async () => {
    const prods = await getProducts();
    setProducts([...prods]);
    const ords = await getOrders();
    setOrders([...ords]);
  };

  const handleStockChange = async (productId: string, delta: number) => {
    await updateProductStock(productId, delta);
    loadProductsAndOrders();
  };

  const handleDeleteProduct = (productId: string) => {
    Alert.alert('Eliminar Producto', '¿Seguro que querés eliminar este producto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteProduct(productId);
          loadProductsAndOrders();
        },
      },
    ]);
  };

  const handleUpdateShipping = async (orderId: string, status: ShippingStatus) => {
    await updateOrderShipping(orderId, status);
    loadProductsAndOrders();
    Alert.alert('Estado Actualizado', `El pedido ${orderId} ahora está en estado: ${status}`);
  };

  const handleSaveTracking = async () => {
    if (!editingOrder) return;
    await updateOrderShipping(editingOrder.id, editingOrder.shippingStatus, trackingInput);
    setEditingOrder(null);
    loadProductsAndOrders();
    Alert.alert('Tracking Guardado 📦', `Código ${trackingInput} asignado al pedido.`);
  };

  const handleContactClient = (phone?: string, clientName?: string, orderId?: string) => {
    if (!phone) {
      Alert.alert('Aviso', 'Teléfono no disponible');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `¡Hola ${clientName || 'Cliente'}! Te escribimos de Veterinaria La Plata sobre tu pedido ${orderId || ''}.`
    );
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${message}`).catch(() => {
      Linking.openURL(`tel:${cleanPhone}`);
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Panel de Administración ⚙️</Text>
        <Text style={styles.subtitle}>Gestión de Clínica, Productos y Envíos</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'calendar' && styles.tabActive]}
          onPress={() => setActiveTab('calendar')}
        >
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.tabTextActive]}>
            📅 Agenda
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.tabActive]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
            Catálogo ({products.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            Pedidos ({orders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'employees' && styles.tabActive]}
          onPress={() => setActiveTab('employees')}
        >
          <Text style={[styles.tabText, activeTab === 'employees' && styles.tabTextActive]}>
            Personal
          </Text>
        </TouchableOpacity>
      </View>

      {/* CALENDAR TAB */}
      {activeTab === 'calendar' && (
        <View style={{ flex: 1 }}>
          <CalendarView appointments={MOCK_ADMIN_CLINIC_APPOINTMENTS} />
        </View>
      )}

      {/* EMPLOYEES TAB */}
      {activeTab === 'employees' && (
        <ScrollView contentContainerStyle={styles.list}>
          <Button title="+ Nuevo Empleado" size="sm" variant="accent" style={{ marginBottom: spacing.md }} />
          {MOCK_EMPLOYEES.map((emp) => (
            <Card key={emp.id} variant="elevated" style={styles.empCard}>
              <View style={styles.empHeader}>
                <View style={styles.roleBlock}>
                  <MaterialCommunityIcons
                    name={
                      emp.role === 'Veterinario'
                        ? 'stethoscope'
                        : emp.role === 'Peluquero'
                        ? 'scissors-cutting'
                        : 'clipboard-account'
                    }
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.roleText}>{emp.role}</Text>
                </View>
                <Badge
                  label={emp.status === 'active' ? 'Activo' : 'Inactivo'}
                  variant={emp.status === 'active' ? 'success' : 'danger'}
                />
              </View>
              <Text style={styles.empName}>{emp.name}</Text>
              <Text style={styles.empShifts}>Turnos: {emp.shifts}</Text>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={[styles.actionText, { color: colors.danger }]}>Suspender</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <ScrollView contentContainerStyle={styles.list}>
          <Button
            title="+ Agregar Nuevo Producto"
            onPress={() => setAddProductVisible(true)}
            size="md"
            variant="primary"
            style={{ marginBottom: spacing.md }}
          />

          {products.map((prod) => (
            <Card key={prod.id} variant="elevated" style={styles.productCard}>
              <View style={styles.prodRow}>
                <View style={styles.prodInfo}>
                  <Text style={styles.prodName}>{prod.name}</Text>
                  <Text style={styles.prodPrice}>${prod.price.toLocaleString('es-AR')}</Text>
                  <Text style={styles.prodCat}>Categoría: {prod.category}</Text>
                </View>

                {/* Stock Controls */}
                <View style={styles.stockControl}>
                  <Text style={styles.stockLabel}>Stock:</Text>
                  <View style={styles.stockCounter}>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => handleStockChange(prod.id, -1)}
                    >
                      <Text style={styles.counterText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.stockNum}>{prod.stock}</Text>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => handleStockChange(prod.id, 1)}
                    >
                      <Text style={styles.counterText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteProduct(prod.id)} style={{ marginTop: spacing.xs }}>
                    <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* ORDERS & SHIPPING TAB */}
      {activeTab === 'orders' && (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionDesc}>
            Seguimiento de pedidos de la tienda online, número de tracking y comunicación directa con compradores.
          </Text>

          {orders.map((ord) => (
            <Card key={ord.id} variant="elevated" style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>{ord.id}</Text>
                  <Text style={styles.orderClient}>👤 {ord.clientName}</Text>
                </View>
                <Badge
                  label={
                    ord.shippingStatus === 'delivered'
                      ? 'Entregado'
                      : ord.shippingStatus === 'shipped'
                      ? 'En camino'
                      : ord.shippingStatus === 'preparing'
                      ? 'En preparación'
                      : 'Pendiente'
                  }
                  variant={
                    ord.shippingStatus === 'delivered'
                      ? 'success'
                      : ord.shippingStatus === 'shipped'
                      ? 'primary'
                      : 'warning'
                  }
                />
              </View>

              <Text style={styles.orderAddr}>
                📍 {ord.shippingAddress.street} {ord.shippingAddress.number}, {ord.shippingAddress.city}
              </Text>
              <Text style={styles.orderTotal}>Total: ${ord.total.toLocaleString('es-AR')}</Text>

              {ord.trackingNumber ? (
                <View style={styles.trackingBox}>
                  <Text style={styles.trackingText}>🚚 Tracking: {ord.trackingNumber}</Text>
                </View>
              ) : null}

              {/* Order Status Action Buttons */}
              <Text style={styles.statusLabel}>Cambiar Estado:</Text>
              <View style={styles.statusButtons}>
                {(['preparing', 'shipped', 'delivered'] as ShippingStatus[]).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.stBtn,
                      ord.shippingStatus === st && styles.stBtnActive,
                    ]}
                    onPress={() => handleUpdateShipping(ord.id, st)}
                  >
                    <Text
                      style={[
                        styles.stBtnText,
                        ord.shippingStatus === st && styles.stBtnTextActive,
                      ]}
                    >
                      {st === 'preparing' ? 'Preparación' : st === 'shipped' ? 'Enviado' : 'Entregado'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Buttons: Tracking & Contact */}
              <View style={styles.orderActions}>
                <Button
                  title="✏️ Editar Tracking"
                  onPress={() => {
                    setEditingOrder(ord);
                    setTrackingInput(ord.trackingNumber || '');
                  }}
                  variant="outline"
                  size="sm"
                />
                <Button
                  title="💬 Contactar por WhatsApp"
                  onPress={() => handleContactClient(ord.clientPhone, ord.clientName, ord.id)}
                  variant="accent"
                  size="sm"
                />
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* Add Product Modal */}
      <Modal visible={addProductVisible} animationType="slide" presentationStyle="pageSheet">
        <AddProductModal
          onClose={() => setAddProductVisible(false)}
          onProductAdded={() => {
            setAddProductVisible(false);
            loadProductsAndOrders();
          }}
        />
      </Modal>

      {/* Edit Tracking Modal */}
      <Modal visible={!!editingOrder} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalCard}>
            <Text style={styles.modalTitle}>Asignar Tracking de Envío 📦</Text>
            <Text style={styles.modalSub}>Pedido: {editingOrder?.id}</Text>

            <Input
              label="Número de Seguimiento (Tracking)"
              placeholder="Ej: TRACK-2026-9911"
              value={trackingInput}
              onChangeText={setTrackingInput}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={() => setEditingOrder(null)}
                variant="outline"
                size="md"
              />
              <Button
                title="Guardar"
                onPress={handleSaveTracking}
                variant="primary"
                size="md"
              />
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { padding: spacing.xl, paddingBottom: spacing.md, paddingTop: spacing['2xl'] },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  subtitle: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: colors.textMuted, marginTop: spacing.xs },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: colors.border },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textMuted },
  tabTextActive: { color: colors.primaryDark, fontFamily: fonts.nunito.bold },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  empCard: { padding: spacing.lg, marginBottom: spacing.md },
  empHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  roleBlock: { flexDirection: 'row', alignItems: 'center' },
  roleText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.primary, marginLeft: spacing.xs },
  empName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, marginTop: spacing.xs },
  empShifts: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: colors.textMuted, marginTop: 4 },
  actions: { flexDirection: 'row', marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, justifyContent: 'flex-end', gap: spacing.lg },
  actionBtn: { paddingHorizontal: spacing.sm },
  actionText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.primary },
  sectionDesc: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginBottom: spacing.md },
  productCard: { padding: spacing.md, marginBottom: spacing.md },
  prodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prodInfo: { flex: 1, marginRight: spacing.md },
  prodName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark },
  prodPrice: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.primaryDark, marginTop: 2 },
  prodCat: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  stockControl: { alignItems: 'center' },
  stockLabel: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.textMuted },
  stockCounter: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  counterBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  counterText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.md, color: colors.primaryDark },
  stockNum: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark, minWidth: 20, textAlign: 'center' },
  orderCard: { padding: spacing.lg, marginBottom: spacing.md },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  orderId: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark },
  orderClient: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.primaryDark, marginTop: 2 },
  orderAddr: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: spacing.xs },
  orderTotal: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark, marginTop: 2 },
  trackingBox: { padding: spacing.xs, backgroundColor: colors.bgSoft, borderRadius: borderRadius.sm, marginTop: spacing.xs },
  trackingText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.primaryDark },
  statusLabel: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.textDark, marginTop: spacing.md, marginBottom: 4 },
  statusButtons: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  stBtn: { flex: 1, paddingVertical: spacing.xs, alignItems: 'center', borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  stBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stBtnText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.textMuted },
  stBtnTextActive: { color: colors.white },
  orderActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalCard: { padding: spacing.xl },
  modalTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, marginBottom: 2 },
  modalSub: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginBottom: spacing.md },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.md },
});

export default AdminHubScreen;
