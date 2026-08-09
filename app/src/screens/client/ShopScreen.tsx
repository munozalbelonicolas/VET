// ============================================================
// Veterinaria La Plata — Shop & Catalog Screen (Fase 3)
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../config/theme';
import { Card, Badge, Button, Input } from '../../components/ui';
import { Product, CartItem } from '../../types';
import { getProducts } from '../../services/shopService';
import { useCartStore } from '../../store/cartStore';

export const ShopScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment' | 'success'>('cart');

  const { items, addItem, removeItem, updateQuantity, clearCart, getTotal, getSubtotal } = useCartStore();

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, selectedSpecies]);

  const loadProducts = async () => {
    const list = await getProducts(selectedCategory, selectedSpecies);
    setProducts(list);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || '',
      price: product.salePrice || product.price,
      quantity: 1,
    });
    Alert.alert('¡Agregado al carrito! 🛒', `${product.name} se sumó a tu compra.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Petshop 🛒</Text>
          <Text style={styles.subtitle}>Envíos a todo La Plata</Text>
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
        {[
          { id: 'all', label: 'Todo' },
          { id: 'food', label: 'Alimentos' },
          { id: 'medication', label: 'Farmacia' },
          { id: 'accessories', label: 'Accesorios' },
          { id: 'hygiene', label: 'Higiene' },
        ].map((c) => (
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
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productList}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <Card variant="elevated" style={styles.productCard}>
            <View style={styles.imgPlaceholder}>
              {item.images && item.images.length > 0 ? (
                <Image source={item.images[0]} style={{ width: '100%', height: '100%', resizeMode: 'cover', borderRadius: borderRadius.md }} />
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
              title="Agregar"
              onPress={() => handleAddToCart(item)}
              variant="primary"
              size="sm"
              fullWidth
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        )}
      />

      {/* Cart Modal */}
      <Modal visible={cartModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {checkoutStep === 'cart' ? 'Mi Carrito 🛒' : checkoutStep === 'shipping' ? 'Envío 🚚' : 'Pago 💳'}
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
                  <View style={styles.totalRow}>
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
              <Input label="Calle y Número" placeholder="Ej: Calle 7 N° 1234" />
              <Input label="Depto / Piso" placeholder="Ej: 3 B (Opcional)" />
              <Input label="Notas para el repartidor" placeholder="Ej: Tocar timbre 3..." />

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

              <TouchableOpacity style={styles.paymentOptionActive}>
                <MaterialCommunityIcons name="credit-card" size={28} color={colors.primaryDark} />
                <View style={{ marginLeft: spacing.md }}>
                  <Text style={styles.paymentTitle}>Mercado Pago</Text>
                  <Text style={styles.paymentSub}>Tarjetas, Débito, Dinero en cuenta</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.paymentOption}>
                <MaterialCommunityIcons name="bank-transfer" size={28} color={colors.textMuted} />
                <View style={{ marginLeft: spacing.md }}>
                  <Text style={styles.paymentTitle}>Transferencia Bancaria</Text>
                  <Text style={styles.paymentSub}>Subir comprobante</Text>
                </View>
              </TouchableOpacity>

              <Button
                title={`Pagar $${getTotal().toLocaleString('es-AR')}`}
                onPress={() => {
                  clearCart();
                  setCheckoutStep('cart');
                  setCartModalVisible(false);
                  Alert.alert('¡Pedido Confirmado! 🎉', 'Tu compra fue procesada con éxito. Te avisaremos cuando esté en camino.');
                }}
                variant="accent"
                size="lg"
                fullWidth
                style={{ marginTop: spacing.xl }}
              />
            </ScrollView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing['2xl'], paddingBottom: spacing.sm },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes['2xl'], color: colors.textDark },
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
  productList: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  columnWrapper: { justifyContent: 'space-between' },
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
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  totalLabel: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark },
  totalValue: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.primaryDark },
  sectionTitle: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.lg, color: colors.textDark, marginBottom: spacing.md },
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard, marginBottom: spacing.md },
  paymentOptionActive: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: 16, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primarySoft, marginBottom: spacing.md },
  paymentTitle: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.md, color: colors.textDark },
  paymentSub: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
});

export default ShopScreen;
