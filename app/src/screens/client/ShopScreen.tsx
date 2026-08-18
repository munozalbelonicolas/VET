// ============================================================
// Veterinaria La Plata — Shop & Catalog Screen
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../config/theme';
import { Card, Badge, Button, Input } from '../../components/ui';
import { Product, OrderPaymentMethod, OrderItem } from '../../types';
import { getProducts, createOrder, updateProductStock } from '../../services/shopService';
import { validateCoupon, discountFor, applyCoupon } from '../../services/couponService';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { createInAppNotification } from '../../services/notificationService';

const CATEGORIES = [
  { id: 'all', label: 'Todo' },
  { id: 'food', label: 'Alimentos' },
  { id: 'medication', label: 'Farmacia' },
  { id: 'accessories', label: 'Accesorios' },
  { id: 'hygiene', label: 'Higiene' },
];

const toImageUrl = (image: any): string | undefined => {
  if (typeof image === 'string') return image;
  return undefined;
};

export const ShopScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment' | 'success'>('cart');

  const { items, addItem, updateQuantity, clearCart, getTotal, getSubtotal, getDiscount, couponCode, setCoupon, removeCoupon } = useCartStore();

  // Shipping form state
  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingNumber, setShippingNumber] = useState('');
  const [shippingApartment, setShippingApartment] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>('mercadopago');
  const [placingOrder, setPlacingOrder] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, selectedSpecies]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const list = await getProducts(selectedCategory, selectedSpecies);
      setProducts(list);
    } catch (error) {
      console.log('loadProducts error:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToCart = (product: Product) => {
    const stock = product.stock || 0;
    const existing = items.find((i) => i.productId === product.id);
    if (existing && existing.quantity >= stock) {
      Alert.alert('Sin stock', `No hay más unidades disponibles de ${product.name}.`);
      return;
    }
    if (stock <= 0) {
      Alert.alert('Sin stock', `Este producto no está disponible por el momento.`);
      return;
    }
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: toImageUrl(product.images?.[0]) || '',
      price: product.salePrice || product.price,
      quantity: 1,
    });
    Alert.alert('¡Agregado al carrito! 🛒', `${product.name} se sumó a tu compra.`);
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      setCouponError('Ingresá un código de descuento.');
      return;
    }
    setApplyingCoupon(true);
    try {
      const result = await validateCoupon(code);
      if (!result.valid || !result.coupon) {
        setCouponError(result.message);
        return;
      }
      const discount = discountFor(result.coupon, getSubtotal());
      if (discount <= 0) {
        setCouponError(result.coupon.minPurchase
          ? `Este cupón requiere una compra mínima de $${result.coupon.minPurchase.toLocaleString('es-AR')}.`
          : 'Este cupón no aplica a tu carrito.');
        return;
      }
      setCoupon(result.coupon.code, {
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
        minPurchase: result.coupon.minPurchase,
      });
      setCouponInput('');
      setCouponError('');
      Alert.alert('¡Descuento aplicado! 🎉', `Ahorrás $${discount.toLocaleString('es-AR')} con el código ${result.coupon.code}.`);
    } catch (error) {
      console.log('apply coupon error:', error);
      setCouponError('No se pudo validar el cupón. Intentá de nuevo.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Debés iniciar sesión para comprar');
      return;
    }
    if (!shippingStreet.trim() || !shippingNumber.trim()) {
      Alert.alert('Error', 'Ingresá calle y número de la dirección de entrega');
      return;
    }
    if (items.length === 0) return;

    setPlacingOrder(true);
    try {
      const orderItems: OrderItem[] = items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        productImage: typeof i.productImage === 'string' ? i.productImage : '',
        variantId: i.variantId,
        variantName: i.variantName,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.price * i.quantity,
      }));

      const subtotal = getSubtotal();
      const discount = getDiscount();
      const total = getTotal();

      await createOrder({
        clientId: user.id,
        clientName: user.name,
        items: orderItems,
        subtotal,
        discount,
        total,
        couponCode: couponCode || undefined,
        paymentMethod,
        paymentStatus: 'pending',
        clientPhone: user.phone || '',
        shippingAddress: {
          street: shippingStreet.trim(),
          number: shippingNumber.trim(),
          floor: '',
          apartment: shippingApartment.trim(),
          city: user.address?.city || 'La Plata',
          province: user.address?.province || 'Buenos Aires',
          zipCode: user.address?.zipCode || '',
          notes: shippingNotes.trim(),
        },
        shippingStatus: 'preparing',
        trackingNumber: '',
        trackingUpdates: [{ status: 'preparing', timestamp: new Date(), description: 'Pedido recibido' }],
      });

      // Descontar stock
      for (const item of items) {
        try {
          await updateProductStock(item.productId, -item.quantity);
        } catch (e) {
          console.log('Stock update error (non blocking):', e);
        }
      }

      // Registrar uso del cupón
      if (couponCode) {
        try {
          await applyCoupon(couponCode);
        } catch (e) {
          console.log('Coupon usage error (non blocking):', e);
        }
      }

      // Notificación in-app
      try {
        await createInAppNotification({
          userId: user.id,
          type: 'order_status',
          title: 'Pedido recibido 🛒',
          body: couponCode
            ? `Tu pedido fue registrado con un descuento de $${discount.toLocaleString('es-AR')}.`
            : 'Tu pedido fue registrado y está en preparación.',
        });
      } catch (e) {
        console.log('Notif error (non blocking):', e);
      }

      clearCart();
      setCheckoutStep('success');
      setShippingStreet('');
      setShippingNumber('');
      setShippingApartment('');
      setShippingNotes('');
    } catch (error) {
      console.log('Order error:', error);
      Alert.alert('Error', 'No se pudo procesar el pedido. Intentá de nuevo.');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Petshop</Text>
          <Text style={styles.subtitle}>Envíos coordinados</Text>
        </View>
        <TouchableOpacity style={styles.cartBtn} onPress={() => setCartModalVisible(true)}>
          <MaterialCommunityIcons name="cart-outline" size={28} color={colors.textDark} />
          {items.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{items.reduce((sum, i) => sum + i.quantity, 0)}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Input
          placeholder="Buscar alimentos, medicamentos, juguetes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="magnify"
        />
      </View>

      {/* Species Filter Pills */}
      <View style={styles.pillsRow}>
        {[
          { id: 'all', label: 'Todos' },
          { id: 'dog', label: '🐶 Perros' },
          { id: 'cat', label: '🐱 Gatos' },
        ].map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.pill, selectedSpecies === s.id && styles.pillActive]}
            onPress={() => setSelectedSpecies(s.id)}
          >
            <Text style={[styles.pillText, selectedSpecies === s.id && styles.pillTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.catItem, selectedCategory === c.id && styles.catItemActive]}
            onPress={() => setSelectedCategory(c.id)}
          >
            <Text style={[styles.catText, selectedCategory === c.id && styles.catTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product List */}
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productList}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <View style={styles.emptyProducts}>
              <MaterialCommunityIcons name="package-variant" size={56} color={colors.textLight} />
              <Text style={styles.emptyProductsText}>No hay productos para mostrar.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card variant="elevated" style={styles.productCard}>
              <View style={styles.imgPlaceholder}>
                {item.images && item.images.length > 0 && typeof item.images[0] === 'string' ? (
                  <Image source={{ uri: item.images[0] }} style={{ width: '100%', height: '100%', resizeMode: 'cover', borderRadius: borderRadius.md }} />
                ) : (
                  <MaterialCommunityIcons
                    name={item.category === 'food' ? 'food-drumstick' : item.category === 'medication' ? 'pill' : 'paw'}
                    size={48}
                    color={colors.primary}
                  />
                )}
                {item.salePrice && (
                  <View style={styles.saleBadge}>
                    <Text style={styles.saleBadgeText}>OFERTA</Text>
                  </View>
                )}
              </View>

              <Text style={styles.productBrand}>{item.brand}</Text>
              <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

              <View style={styles.priceRow}>
                <Text style={styles.price}>${(item.salePrice || item.price).toLocaleString('es-AR')}</Text>
                {item.salePrice && (
                  <Text style={styles.oldPrice}>${item.price.toLocaleString('es-AR')}</Text>
                )}
              </View>

              <Button
                title={(item.stock ?? 0) <= 0 ? 'Sin stock' : 'Agregar'}
                onPress={() => handleAddToCart(item)}
                variant="primary"
                size="sm"
                fullWidth
                disabled={(item.stock ?? 0) <= 0}
                style={{ marginTop: spacing.sm }}
              />
            </Card>
          )}
        />
      )}

      {/* Cart Modal */}
      <Modal visible={cartModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {checkoutStep === 'cart' ? 'Mi Carrito 🛒' : checkoutStep === 'shipping' ? 'Envío 🚚' : checkoutStep === 'payment' ? 'Pago 💳' : '¡Listo! 🎉'}
            </Text>
            <TouchableOpacity onPress={() => { setCartModalVisible(false); setCheckoutStep('cart'); }}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          {checkoutStep === 'cart' && (
            <View style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.cartList}>
                {items.length === 0 ? (
                  <View style={styles.emptyCart}>
                    <MaterialCommunityIcons name="cart-off" size={60} color={colors.textMuted} />
                    <Text style={styles.emptyCartTitle}>Tu carrito está vacío</Text>
                  </View>
                ) : (
                  items.map((item) => (
                    <View key={item.productId} style={styles.cartItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cartItemTitle}>{item.productName}</Text>
                        <Text style={styles.cartItemPrice}>${(item.price * item.quantity).toLocaleString('es-AR')}</Text>
                      </View>

                      <View style={styles.qtyContainer}>
                        <TouchableOpacity onPress={() => updateQuantity(item.productId, item.quantity - 1)}>
                          <MaterialCommunityIcons name="minus-circle-outline" size={24} color={colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => updateQuantity(item.productId, item.quantity + 1)}>
                          <MaterialCommunityIcons name="plus-circle-outline" size={24} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              {items.length > 0 && (
                <View style={styles.cartFooter}>
                  {/* Cupón de descuento */}
                  {couponCode ? (
                    <View style={styles.appliedCouponBox}>
                      <MaterialCommunityIcons name="ticket-percent" size={18} color={colors.success} />
                      <Text style={styles.appliedCouponText}>
                        {couponCode} — Ahorrás ${getDiscount().toLocaleString('es-AR')}
                      </Text>
                      <TouchableOpacity onPress={removeCoupon}>
                        <MaterialCommunityIcons name="close-circle" size={20} color={colors.textLight} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.couponRow}>
                      <View style={{ flex: 1, marginRight: spacing.sm }}>
                        <Input
                          placeholder="🎟️ Código de descuento"
                          value={couponInput}
                          onChangeText={(v) => { setCouponInput(v); setCouponError(''); }}
                          containerStyle={{ marginBottom: 0 }}
                          autoCapitalize="characters"
                        />
                      </View>
                      <Button
                        title="Aplicar"
                        onPress={handleApplyCoupon}
                        variant="outline"
                        size="md"
                        loading={applyingCoupon}
                        disabled={!couponInput.trim()}
                      />
                    </View>
                  )}
                  {couponError ? <Text style={styles.couponError}>{couponError}</Text> : null}

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>
                      {getDiscount() > 0 ? `Subtotal (con ${couponCode})` : 'Total:'}
                    </Text>
                    {getDiscount() > 0 ? (
                      <Text style={styles.oldTotal}>${getSubtotal().toLocaleString('es-AR')}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.totalRow, { marginTop: 0 }]}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalValue}>${getTotal().toLocaleString('es-AR')}</Text>
                  </View>
                  <Button
                    title="Iniciar Compra 🎉"
                    onPress={() => setCheckoutStep('shipping')}
                    variant="accent"
                    size="lg"
                    fullWidth
                  />
                </View>
              )}
            </View>
          )}

          {checkoutStep === 'shipping' && (
            <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
              <Text style={styles.sectionTitle}>Dirección de entrega</Text>
              <Input
                label="Calle"
                placeholder="Ej: Calle 7"
                value={shippingStreet}
                onChangeText={setShippingStreet}
              />
              <Input
                label="Número"
                placeholder="Ej: 1234"
                value={shippingNumber}
                onChangeText={setShippingNumber}
                keyboardType="number-pad"
              />
              <Input
                label="Depto / Piso (Opcional)"
                placeholder="Ej: 3 B"
                value={shippingApartment}
                onChangeText={setShippingApartment}
              />
              <Input
                label="Notas para el repartidor (Opcional)"
                placeholder="Ej: Tocar timbre 3..."
                value={shippingNotes}
                onChangeText={setShippingNotes}
                multiline
              />

              <Button
                title="Continuar al Pago →"
                onPress={() => setCheckoutStep('payment')}
                variant="primary"
                size="lg"
                fullWidth
                style={{ marginTop: spacing.lg }}
              />
            </ScrollView>
          )}

          {checkoutStep === 'payment' && (
            <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
              <Text style={styles.sectionTitle}>Método de Pago</Text>

              <TouchableOpacity
                style={paymentMethod === 'mercadopago' ? styles.paymentOptionActive : styles.paymentOption}
                onPress={() => setPaymentMethod('mercadopago')}
              >
                <MaterialCommunityIcons name="credit-card" size={28} color={paymentMethod === 'mercadopago' ? colors.primaryDark : colors.textMuted} />
                <View style={{ marginLeft: spacing.md }}>
                  <Text style={styles.paymentTitle}>Mercado Pago</Text>
                  <Text style={styles.paymentSub}>Tarjetas, Débito, Dinero en cuenta</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={paymentMethod === 'transfer' ? styles.paymentOptionActive : styles.paymentOption}
                onPress={() => setPaymentMethod('transfer')}
              >
                <MaterialCommunityIcons name="bank-transfer" size={28} color={paymentMethod === 'transfer' ? colors.primaryDark : colors.textMuted} />
                <View style={{ marginLeft: spacing.md }}>
                  <Text style={styles.paymentTitle}>Transferencia Bancaria</Text>
                  <Text style={styles.paymentSub}>Te enviaremos los datos por WhatsApp</Text>
                </View>
              </TouchableOpacity>

              <Button
                title={placingOrder ? 'Procesando...' : `Confirmar pedido $${getTotal().toLocaleString('es-AR')}`}
                onPress={handlePlaceOrder}
                loading={placingOrder}
                variant="accent"
                size="lg"
                fullWidth
                style={{ marginTop: spacing.xl }}
              />
            </ScrollView>
          )}

          {checkoutStep === 'success' && (
            <View style={styles.successState}>
              <MaterialCommunityIcons name="check-circle" size={80} color={colors.success} />
              <Text style={styles.successTitle}>¡Pedido Confirmado! 🎉</Text>
              <Text style={styles.successDesc}>
                Tu compra fue registrada. Te avisaremos por notificaciones cuando esté en camino.
              </Text>
              <Button
                title="Seguir comprando"
                onPress={() => { setCartModalVisible(false); setCheckoutStep('cart'); }}
                variant="primary"
                size="lg"
                fullWidth
                style={{ marginTop: spacing.xl }}
              />
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing['2xl'], paddingBottom: spacing.sm },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes['2xl'], color: colors.textDark, letterSpacing: 0.4 },
  subtitle: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  cartBtn: { position: 'relative', padding: spacing.xs },
  cartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: colors.danger, borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: '#FFF', fontSize: 10, fontFamily: fonts.nunito.bold },
  pillsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.sm },
  pill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  pillText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.xs, color: colors.textMuted },
  pillTextActive: { color: colors.primaryDark, fontFamily: fonts.nunito.bold },
  catScroll: { flexGrow: 0, paddingLeft: spacing.lg, marginBottom: spacing.md },
  catItem: { marginRight: spacing.md, paddingBottom: 4 },
  catItemActive: { borderBottomWidth: 2, borderBottomColor: colors.accent },
  catText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textMuted },
  catTextActive: { color: colors.accentDark, fontFamily: fonts.nunito.bold },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  productList: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  columnWrapper: { justifyContent: 'space-between' },
  emptyProducts: { alignItems: 'center', marginTop: spacing['3xl'] },
  emptyProductsText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: spacing.md },
  productCard: { width: '48%', padding: spacing.md, marginBottom: spacing.md },
  imgPlaceholder: { width: '100%', height: 110, backgroundColor: colors.primarySoft, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm, position: 'relative' },
  saleBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: colors.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  saleBadgeText: { color: '#FFF', fontSize: 9, fontFamily: fonts.nunito.bold },
  productBrand: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.xs, color: colors.textMuted },
  productName: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark, height: 36 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  price: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.primaryDark },
  oldPrice: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted, textDecorationLine: 'line-through', marginLeft: spacing.xs },
  modalContainer: { flex: 1, backgroundColor: colors.bgMain, paddingTop: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  cartList: { padding: spacing.xl },
  emptyCart: { alignItems: 'center', marginTop: spacing['3xl'] },
  emptyCartTitle: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.md, color: colors.textMuted, marginTop: spacing.md },
  cartItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  cartItemTitle: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark },
  cartItemPrice: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.sm, color: colors.primaryDark, marginTop: 2 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  qtyText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.md, paddingHorizontal: spacing.xs },
  cartFooter: { padding: spacing.xl, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgCard },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  totalLabel: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark },
  totalValue: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.primaryDark },
  oldTotal: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: colors.textMuted, textDecorationLine: 'line-through' },
  couponRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  couponError: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.danger, marginBottom: spacing.sm },
  appliedCouponBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.successSoft, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  appliedCouponText: { flex: 1, fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.successDark },
  sectionTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, marginBottom: spacing.md },
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard, marginBottom: spacing.md },
  paymentOptionActive: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: 16, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primarySoft, marginBottom: spacing.md },
  paymentTitle: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.md, color: colors.textDark },
  paymentSub: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  successState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing['2xl'] },
  successTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes['2xl'], color: colors.textDark, marginTop: spacing.lg },
  successDesc: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },
});

export default ShopScreen;
