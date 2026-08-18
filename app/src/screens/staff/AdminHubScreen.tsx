// ============================================================
// Veterinaria La Plata — Admin Hub Screen
// Gestión: agenda, catálogo, pedidos, personal, cupones,
// configuración, seguimientos y auditoría
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
  Share,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../config/theme';
import { Card, Badge, Button, Input } from '../../components/ui';
import { CalendarView } from '../../components/ui/CalendarView';
import { AddProductModal } from './AddProductModal';
import CouponsScreen from './CouponsScreen';
import ClinicSettingsScreen from './ClinicSettingsScreen';
import FollowUpsAdminScreen from './FollowUpsAdminScreen';
import AdminLogsScreen from './AdminLogsScreen';
import { Product, Order, ShippingStatus, Appointment, User } from '../../types';
import {
  getProducts,
  getOrders,
  updateOrderShipping,
  updateProductStock,
  deleteProduct,
} from '../../services/shopService';
import { getAllAppointments, updateAppointment } from '../../services/dataService';
import { getStaffUsers, setStaffActive, updateUserProfile } from '../../services/userService';
import { toCsv, logAdminAction } from '../../services/adminService';
import { createInAppNotification } from '../../services/notificationService';
import { useAuthStore } from '../../store/authStore';

export type AdminHubScreenTab =
  | 'calendar'
  | 'products'
  | 'orders'
  | 'employees'
  | 'coupons'
  | 'settings'
  | 'followups'
  | 'logs';

const roleLabelMap: Record<string, string> = {
  vet: 'Veterinario',
  groomer: 'Peluquero',
  receptionist: 'Recepcionista',
  admin: 'Administrador',
};

interface AdminHubScreenProps {
  initialTab?: AdminHubScreenTab;
}

type OrderFilter = 'all' | 'preparing' | 'shipped' | 'delivered';

export const AdminHubScreen: React.FC<AdminHubScreenProps> = ({ initialTab = 'calendar' }) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminHubScreenTab>(initialTab);
  const [addProductVisible, setAddProductVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [staffVets, setStaffVets] = useState<User[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');

  // Tracking edit modal
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState('');

  // Order detail modal
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Appointment assign modal
  const [assigningAppointment, setAssigningAppointment] = useState<Appointment | null>(null);

  // Staff specialty modal
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [specialtyInput, setSpecialtyInput] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') return;
    loadAll();
  }, [user?.role]);

  const loadAll = async () => {
    try {
      const [prods, ords, apps, staff] = await Promise.all([
        getProducts(),
        getOrders(),
        getAllAppointments(),
        getStaffUsers(),
      ]);
      setProducts(prods);
      setOrders(ords);
      setAppointments(apps);
      setEmployees(staff);
      setStaffVets(staff.filter((s) => s.role === 'vet'));
    } catch (error) {
      console.log('loadAll error:', error);
    }
  };

  // ---------- PRODUCTOS ----------
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleStockChange = async (productId: string, delta: number) => {
    try {
      await updateProductStock(productId, delta);
      await logAdminAction({ id: user?.id || '', name: user?.name }, 'stock_update', productId, `delta=${delta}`);
    } catch (error) {
      console.log('stock change error:', error);
      return;
    }
    loadAll();
  };

  const handleDeleteProduct = (productId: string) => {
    Alert.alert('Eliminar Producto', '¿Seguro que querés eliminar este producto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(productId);
            await logAdminAction({ id: user?.id || '', name: user?.name }, 'product_delete', productId);
            loadAll();
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar el producto.');
          }
        },
      },
    ]);
  };

  // ---------- PEDIDOS ----------
  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== 'all' && o.shippingStatus !== orderFilter) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const match =
        o.clientName.toLowerCase().includes(q) ||
        (o.trackingNumber || '').toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleUpdateShipping = async (orderId: string, status: ShippingStatus) => {
    try {
      await updateOrderShipping(orderId, status);
      await logAdminAction({ id: user?.id || '', name: user?.name }, 'order_status', orderId, `status=${status}`);
      loadAll();
      Alert.alert('Estado Actualizado', `El pedido ${orderId} ahora está en estado: ${status}`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado del pedido.');
    }
  };

  const handleSaveTracking = async () => {
    if (!editingOrder) return;
    if (!trackingInput.trim()) {
      Alert.alert('Error', 'Ingresá un número de tracking.');
      return;
    }
    try {
      await updateOrderShipping(editingOrder.id, editingOrder.shippingStatus, trackingInput.trim());
      await logAdminAction({ id: user?.id || '', name: user?.name }, 'tracking_update', editingOrder.id, trackingInput.trim());
      setEditingOrder(null);
      loadAll();
      Alert.alert('Tracking Guardado 📦', `Código ${trackingInput} asignado al pedido.`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el tracking.');
    }
  };

  const handleExportOrdersCsv = async () => {
    const csv = toCsv(
      ['ID', 'Cliente', 'Teléfono', 'Total', 'Pago', 'Envío', 'Dirección', 'Fecha'],
      orders.map((o) => [
        o.id,
        o.clientName,
        o.clientPhone || '',
        o.total,
        o.paymentStatus,
        o.shippingStatus,
        `${o.shippingAddress.street} ${o.shippingAddress.number}, ${o.shippingAddress.city}`,
        new Date(o.createdAt).toLocaleString('es-AR'),
      ])
    );
    try {
      await Share.share({ message: csv, title: 'Pedidos - export CSV' });
    } catch (error) {
      console.log('export error:', error);
    }
  };

  // ---------- TURNOS ----------
  const pendingAppointments = appointments.filter((a) => a.status === 'pending');

  const handleConfirmAppointment = async (app: Appointment) => {
    try {
      await updateAppointment(app.id, { status: 'confirmed' });
      await logAdminAction({ id: user?.id || '', name: user?.name }, 'appointment_confirm', app.petName);
      await createInAppNotification({
        userId: app.ownerId,
        type: 'appointment_confirmation',
        title: 'Turno confirmado ✓',
        body: `Tu turno para ${app.petName} fue confirmado.`,
        data: { appointmentId: app.id },
      }).catch(() => {});
      loadAll();
    } catch (error) {
      console.log('confirm appointment error:', error);
      Alert.alert('Error', 'No se pudo confirmar el turno.');
    }
  };

  // ---------- EMPLEADOS ----------
  const handleToggleEmployeeActive = async (emp: User) => {
    try {
      await setStaffActive(emp.id, !emp.active);
      await logAdminAction({ id: user?.id || '', name: user?.name }, 'employee_toggle', emp.name, `active=${!emp.active}`);
      loadAll();
    } catch (error) {
      console.log('toggle employee error:', error);
      Alert.alert('Error', 'No se pudo actualizar el empleado.');
    }
  };

  // ---------- CONTACTO CLIENTE ----------
  const handleContactClient = (phone?: string, clientName?: string, orderId?: string) => {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      Alert.alert('Aviso', 'Teléfono no disponible');
      return;
    }
    const message = encodeURIComponent(
      `¡Hola ${clientName || 'Cliente'}! Te escribimos de Veterinaria La Plata sobre tu pedido ${orderId || ''}.`
    );
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${message}`).catch(() => {
      Linking.openURL(`tel:${cleanPhone}`);
    });
  };

  if (user?.role !== 'admin') {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <MaterialCommunityIcons name="shield-lock-outline" size={48} color={colors.danger} />
        <Text style={{ fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.md, color: colors.textMuted, marginTop: spacing.md }}>
          No tenés permisos de administrador.
        </Text>
      </View>
    );
  }

  // Pantallas dedicadas
  if (activeTab === 'coupons') return <CouponsScreen />;
  if (activeTab === 'settings') return <ClinicSettingsScreen />;
  if (activeTab === 'followups') return <FollowUpsAdminScreen />;
  if (activeTab === 'logs') return <AdminLogsScreen />;

  const tabs: { id: AdminHubScreenTab; label: string; count?: number }[] = [
    { id: 'calendar', label: 'Agenda', count: pendingAppointments.length },
    { id: 'products', label: 'Catálogo', count: filteredProducts.length },
    { id: 'orders', label: 'Pedidos', count: orders.length },
    { id: 'employees', label: 'Personal' },
    { id: 'coupons', label: 'Cupones' },
    { id: 'settings', label: 'Config' },
    { id: 'followups', label: 'Seguim.' },
    { id: 'logs', label: 'Auditoría' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel de Administración ⚙️</Text>
        <Text style={styles.subtitle}>Gestión de Clínica, Productos y Envíos</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, activeTab === t.id && styles.tabActive]}
            onPress={() => setActiveTab(t.id)}
          >
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>
              {t.label}
              {t.count !== undefined && t.count > 0 ? ` (${t.count})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* CALENDAR TAB */}
      {activeTab === 'calendar' && (
        <View style={{ flex: 1 }}>
          {pendingAppointments.length > 0 && (
            <View style={styles.pendingSection}>
              <Text style={styles.sectionLabel}>Turnos pendientes de confirmación</Text>
              {pendingAppointments.slice(0, 6).map((app) => (
                <Card key={app.id} variant="outlined" style={styles.pendingCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingPet}>{app.petName} 🐾</Text>
                    <Text style={styles.pendingMeta}>
                      {new Date(app.date).toLocaleDateString('es-AR')} • {app.type}
                    </Text>
                    <Text style={styles.pendingMeta}>Dueño: {app.ownerName}</Text>
                  </View>
                  <View style={styles.pendingActions}>
                    <Button title="✓ Confirmar" size="sm" variant="primary" onPress={() => handleConfirmAppointment(app)} style={{ marginBottom: spacing.xs }} />
                    <Button title="Asignar" size="sm" variant="outline" onPress={() => setAssigningAppointment(app)} disabled={!staffVets.length} />
                  </View>
                </Card>
              ))}
            </View>
          )}
          <CalendarView appointments={appointments} />
        </View>
      )}

      {/* EMPLOYEES TAB */}
      {activeTab === 'employees' && (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionDesc}>
            Los roles del personal se asignan al crear la cuenta (Firebase Admin). Acá podés ver el estado y la especialidad de cada integrante.
          </Text>
          {employees.length === 0 ? (
            <Card variant="outlined" style={{ padding: spacing.xl, alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted }}>
                No hay personal registrado con roles de staff.
              </Text>
            </Card>
          ) : (
            employees.map((emp) => (
              <Card key={emp.id} variant="elevated" style={styles.empCard}>
                <View style={styles.empHeader}>
                  <View style={styles.roleBlock}>
                    <MaterialCommunityIcons
                      name={emp.role === 'vet' ? 'stethoscope' : emp.role === 'groomer' ? 'scissors-cutting' : 'clipboard-account'}
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.roleText}>{roleLabelMap[emp.role] || emp.role}</Text>
                  </View>
                  <Badge label={emp.active ? 'Activo' : 'Inactivo'} variant={emp.active ? 'success' : 'danger'} />
                </View>
                <Text style={styles.empName}>{emp.name}</Text>
                <Text style={styles.empShifts}>{emp.email}</Text>
                {(emp as any).specialty ? <Text style={styles.empSpecialty}>Especialidad: {(emp as any).specialty}</Text> : null}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      setEditingEmployee(emp);
                      setSpecialtyInput((emp as any).specialty || '');
                    }}
                  >
                    <Text style={styles.actionText}>Especialidad</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleEmployeeActive(emp)}>
                    <Text style={[styles.actionText, { color: emp.active ? colors.danger : colors.success }]}>
                      {emp.active ? 'Suspender' : 'Reactivar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <View style={{ flex: 1 }}>
          <View style={styles.listTopBar}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Input placeholder="🔍 Buscar producto..." value={productSearch} onChangeText={setProductSearch} containerStyle={{ marginBottom: 0 }} />
            </View>
            <Button
              title="+ Agregar"
              onPress={() => { setEditingProduct(null); setAddProductVisible(true); }}
              size="md"
              variant="primary"
            />
          </View>

          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Card key={item.id} variant="elevated" style={styles.productCard}>
                <View style={styles.prodRow}>
                  <View style={styles.prodInfo}>
                    <View style={styles.prodNameRow}>
                      <Text style={styles.prodName} numberOfLines={1}>{item.name}</Text>
                      {item.salePrice ? <Badge label="OFERTA" variant="accent" size="sm" /> : null}
                    </View>
                    <Text style={styles.prodPrice}>
                      ${(item.salePrice || item.price).toLocaleString('es-AR')}
                      {item.salePrice ? <Text style={styles.oldPrice}>  ${item.price.toLocaleString('es-AR')}</Text> : null}
                    </Text>
                    <Text style={styles.prodCat}>Categoría: {item.category}</Text>
                    {item.stock <= 5 ? (
                      <Text style={styles.lowStock}>⚠️ Stock bajo: {item.stock}</Text>
                    ) : (
                      <Text style={styles.prodStock}>Stock: {item.stock}</Text>
                    )}
                  </View>

                  <View style={styles.stockControl}>
                    <Text style={styles.stockLabel}>Stock:</Text>
                    <View style={styles.stockCounter}>
                      <TouchableOpacity style={styles.counterBtn} onPress={() => handleStockChange(item.id, -1)}>
                        <Text style={styles.counterText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.stockNum}>{item.stock}</Text>
                      <TouchableOpacity style={styles.counterBtn} onPress={() => handleStockChange(item.id, 1)}>
                        <Text style={styles.counterText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.prodActions}>
                      <TouchableOpacity onPress={() => { setEditingProduct(item); setAddProductVisible(true); }}>
                        <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteProduct(item.id)} style={{ marginLeft: spacing.md }}>
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Card>
            )}
            ListEmptyComponent={
              <Card variant="outlined" style={{ padding: spacing.xl, alignItems: 'center' }}>
                <Text style={{ fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted }}>
                  No se encontraron productos.
                </Text>
              </Card>
            }
          />
        </View>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <View style={{ flex: 1 }}>
          <View style={styles.listTopBar}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Input placeholder="🔍 Cliente, tracking o ID..." value={orderSearch} onChangeText={setOrderSearch} containerStyle={{ marginBottom: 0 }} />
            </View>
            <Button title="Exportar CSV" size="sm" variant="outline" onPress={handleExportOrdersCsv} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.orderFilterRow}>
            {(['all', 'preparing', 'shipped', 'delivered'] as OrderFilter[]).map((f) => (
              <TouchableOpacity key={f} style={[styles.orderFilterPill, orderFilter === f && styles.orderFilterPillActive]} onPress={() => setOrderFilter(f)}>
                <Text style={[styles.orderFilterText, orderFilter === f && styles.orderFilterTextActive]}>
                  {f === 'all' ? 'Todos' : f === 'preparing' ? 'Preparación' : f === 'shipped' ? 'Enviados' : 'Entregados'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Card variant="elevated" style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderId}>{item.id.slice(0, 8)}...</Text>
                    <Text style={styles.orderClient}>👤 {item.clientName}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setViewingOrder(item)}>
                    <Badge label="Ver detalle" variant="primary" size="sm" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.orderAddr}>
                  📍 {item.shippingAddress.street} {item.shippingAddress.number}, {item.shippingAddress.city}
                </Text>
                <View style={styles.orderInfoRow}>
                  <Text style={styles.orderTotal}>Total: ${item.total.toLocaleString('es-AR')}</Text>
                  <Badge
                    label={
                      item.shippingStatus === 'delivered' ? 'Entregado' :
                      item.shippingStatus === 'shipped' ? 'En camino' :
                      item.shippingStatus === 'preparing' ? 'En preparación' : 'Pendiente'
                    }
                    variant={item.shippingStatus === 'delivered' ? 'success' : item.shippingStatus === 'shipped' ? 'primary' : 'warning'}
                  />
                </View>

                {item.couponCode ? (
                  <Text style={styles.couponApplied}>🎟️ Cupón: {item.couponCode}</Text>
                ) : null}
                {item.trackingNumber ? (
                  <View style={styles.trackingBox}>
                    <Text style={styles.trackingText}>🚚 Tracking: {item.trackingNumber}</Text>
                  </View>
                ) : null}

                <Text style={styles.statusLabel}>Cambiar Estado:</Text>
                <View style={styles.statusButtons}>
                  {(['preparing', 'shipped', 'delivered'] as ShippingStatus[]).map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.stBtn, item.shippingStatus === st && styles.stBtnActive]}
                      onPress={() => handleUpdateShipping(item.id, st)}
                    >
                      <Text style={[styles.stBtnText, item.shippingStatus === st && styles.stBtnTextActive]}>
                        {st === 'preparing' ? 'Preparación' : st === 'shipped' ? 'Enviado' : 'Entregado'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.orderActions}>
                  <Button title="✏️ Tracking" onPress={() => { setEditingOrder(item); setTrackingInput(item.trackingNumber || ''); }} variant="outline" size="sm" />
                  <Button title="💬 WhatsApp" onPress={() => handleContactClient(item.clientPhone, item.clientName, item.id)} variant="accent" size="sm" />
                </View>
              </Card>
            )}
            ListEmptyComponent={
              <Card variant="outlined" style={{ padding: spacing.xl, alignItems: 'center' }}>
                <Text style={{ fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted }}>No hay pedidos para este filtro.</Text>
              </Card>
            }
          />
        </View>
      )}

      {/* Add/Edit Product Modal */}
      <Modal visible={addProductVisible} animationType="slide" presentationStyle="pageSheet">
        <AddProductModal
          editingProduct={editingProduct}
          onClose={() => setAddProductVisible(false)}
          onProductAdded={() => {
            setAddProductVisible(false);
            loadAll();
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
              <Button title="Cancelar" onPress={() => setEditingOrder(null)} variant="outline" size="md" />
              <Button title="Guardar" onPress={handleSaveTracking} variant="primary" size="md" />
            </View>
          </Card>
        </View>
      </Modal>

      {/* Order Detail Modal */}
      <Modal visible={!!viewingOrder} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setViewingOrder(null)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalle del Pedido 📦</Text>
            <TouchableOpacity onPress={() => setViewingOrder(null)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
            </TouchableOpacity>
          </View>
          {viewingOrder && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.detailLabel}>Cliente</Text>
              <Text style={styles.detailValue}>{viewingOrder.clientName}</Text>
              {viewingOrder.clientPhone ? <Text style={styles.detailSub}>{viewingOrder.clientPhone}</Text> : null}

              <Text style={styles.detailLabel}>Artículos</Text>
              {viewingOrder.items.map((it, i) => (
                <View key={i} style={styles.detailItemRow}>
                  <Text style={{ flex: 1, fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark }}>
                    {it.productName} × {it.quantity}
                  </Text>
                  <Text style={{ fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark }}>
                    ${(it.price * it.quantity).toLocaleString('es-AR')}
                  </Text>
                </View>
              ))}
              {viewingOrder.couponCode ? (
                <View style={styles.detailItemRow}>
                  <Text style={{ flex: 1, fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.success }}>Cupón: {viewingOrder.couponCode}</Text>
                  <Text style={{ fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.success }}>-${viewingOrder.discount.toLocaleString('es-AR')}</Text>
                </View>
              ) : null}
              <View style={styles.detailItemRow}>
                <Text style={{ flex: 1, fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark }}>Total</Text>
                <Text style={{ fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.primaryDark }}>
                  ${viewingOrder.total.toLocaleString('es-AR')}
                </Text>
              </View>

              <Text style={styles.detailLabel}>Envío</Text>
              <Text style={styles.detailValue}>
                {viewingOrder.shippingAddress.street} {viewingOrder.shippingAddress.number}, {viewingOrder.shippingAddress.city}
              </Text>
              <Text style={styles.detailSub}>Estado: {viewingOrder.shippingStatus} • Pago: {viewingOrder.paymentStatus}</Text>

              {viewingOrder.trackingUpdates.length > 0 && (
                <>
                  <Text style={styles.detailLabel}>Historial</Text>
                  {viewingOrder.trackingUpdates.map((u, i) => (
                    <Text key={i} style={styles.detailSub}>
                      • {new Date(u.timestamp).toLocaleString('es-AR')} — {u.description || u.status}
                    </Text>
                  ))}
                </>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Assign Vet Modal */}
      <Modal visible={!!assigningAppointment} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalCard}>
            <Text style={styles.modalTitle}>Asignar profesional</Text>
            <Text style={styles.modalSub}>
              Turno de {assigningAppointment?.petName} — {assigningAppointment?.ownerName}
            </Text>
            {staffVets.length === 0 ? (
              <Text style={styles.modalSub}>No hay veterinarios registrados.</Text>
            ) : (
              staffVets.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={styles.assignRow}
                  onPress={async () => {
                    try {
                      await updateAppointment(assigningAppointment!.id, { professionalId: v.id, professionalName: v.name });
                      await logAdminAction({ id: user?.id || '', name: user?.name }, 'appointment_assign', assigningAppointment!.petName, v.name);
                      setAssigningAppointment(null);
                      loadAll();
                      Alert.alert('Asignado ✓', `Turno asignado a ${v.name}.`);
                    } catch (error) {
                      console.log('assign error:', error);
                    }
                  }}
                >
                  <MaterialCommunityIcons name="stethoscope" size={18} color={colors.primary} />
                  <Text style={{ fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark, marginLeft: spacing.sm }}>{v.name}</Text>
                </TouchableOpacity>
              ))
            )}
            <Button title="Cerrar" onPress={() => setAssigningAppointment(null)} variant="ghost" size="sm" style={{ marginTop: spacing.md }} />
          </Card>
        </View>
      </Modal>

      {/* Employee specialty Modal */}
      <Modal visible={!!editingEmployee} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalCard}>
            <Text style={styles.modalTitle}>Especialidad de {editingEmployee?.name}</Text>
            <Input label="Especialidad (ej: Dermatología, Cirugía...)" value={specialtyInput} onChangeText={setSpecialtyInput} placeholder="Ej: Dermatología" />
            <View style={styles.modalButtons}>
              <Button title="Cancelar" onPress={() => setEditingEmployee(null)} variant="outline" size="md" />
              <Button
                title="Guardar"
                size="md"
                variant="primary"
                onPress={async () => {
                  if (!editingEmployee) return;
                  try {
                    await updateUserProfile(editingEmployee.id, { specialty: specialtyInput.trim() } as any);
                    await logAdminAction({ id: user?.id || '', name: user?.name }, 'employee_update', editingEmployee.name, specialtyInput.trim());
                    setEditingEmployee(null);
                    loadAll();
                    Alert.alert('Guardado ✓', 'Especialidad actualizada.');
                  } catch (error) {
                    console.log('update specialty error:', error);
                    Alert.alert('Error', 'No se pudo guardar la especialidad.');
                  }
                }}
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
  tabsContainer: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  tab: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: borderRadius.full, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  tabText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.xs, color: colors.textMuted },
  tabTextActive: { color: colors.primaryDark, fontFamily: fonts.nunito.bold },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  listTopBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionLabel: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark, marginBottom: spacing.sm, marginTop: spacing.xs },
  sectionDesc: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginBottom: spacing.md },
  pendingSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  pendingCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, marginBottom: spacing.sm },
  pendingPet: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark },
  pendingMeta: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 1 },
  pendingActions: { alignItems: 'flex-end' },
  empCard: { padding: spacing.lg, marginBottom: spacing.md },
  empHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  roleBlock: { flexDirection: 'row', alignItems: 'center' },
  roleText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.primary, marginLeft: spacing.xs },
  empName: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, marginTop: spacing.xs },
  empShifts: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: colors.textMuted, marginTop: 2 },
  empSpecialty: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.accentDark, marginTop: 4 },
  actions: { flexDirection: 'row', marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, justifyContent: 'flex-end', gap: spacing.lg },
  actionBtn: { paddingHorizontal: spacing.sm },
  actionText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.primary },
  productCard: { padding: spacing.md, marginBottom: spacing.md },
  prodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prodInfo: { flex: 1, marginRight: spacing.md },
  prodNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  prodName: { flex: 1, fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark },
  prodPrice: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.primaryDark, marginTop: 2 },
  oldPrice: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, textDecorationLine: 'line-through' },
  prodCat: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  prodStock: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  lowStock: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.danger, marginTop: 2 },
  stockControl: { alignItems: 'center' },
  stockLabel: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.textMuted },
  stockCounter: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  counterBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  counterText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.md, color: colors.primaryDark },
  stockNum: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark, minWidth: 20, textAlign: 'center' },
  prodActions: { flexDirection: 'row', marginTop: spacing.sm },
  orderFilterRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  orderFilterPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  orderFilterPillActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  orderFilterText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.xs, color: colors.textMuted },
  orderFilterTextActive: { color: colors.primaryDark, fontFamily: fonts.nunito.bold },
  orderCard: { padding: spacing.lg, marginBottom: spacing.md },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  orderId: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark },
  orderClient: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.primaryDark, marginTop: 2 },
  orderAddr: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: spacing.xs },
  orderInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  orderTotal: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark },
  couponApplied: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.success, marginTop: spacing.xs },
  trackingBox: { padding: spacing.xs, backgroundColor: colors.primarySoft, borderRadius: borderRadius.sm, marginTop: spacing.xs },
  trackingText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.primaryDark },
  statusLabel: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.textDark, marginTop: spacing.md, marginBottom: 4 },
  statusButtons: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  stBtn: { flex: 1, paddingVertical: spacing.xs, alignItems: 'center', borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  stBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stBtnText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.textMuted },
  stBtnTextActive: { color: colors.textWhite },
  orderActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalCard: { padding: spacing.xl },
  modalTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, marginBottom: 2 },
  modalSub: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, marginBottom: spacing.md },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.md },
  modalContainer: { flex: 1, backgroundColor: colors.bgMain, paddingTop: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalContent: { padding: spacing.xl },
  detailLabel: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: spacing.md, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.md, color: colors.textDark },
  detailSub: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
  detailItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  assignRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.hairline },
});

export default AdminHubScreen;
