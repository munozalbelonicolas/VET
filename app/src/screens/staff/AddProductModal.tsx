// ============================================================
// Veterinaria La Plata — Add Product Modal
// ============================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../config/theme';
import { Button, Input } from '../../components/ui';
import { addProduct, updateProduct } from '../../services/shopService';
import { uploadImage } from '../../services/storageService';
import { Product, ProductCategory, PetSpecies } from '../../types';

const CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: 'food', label: '🍖 Alimentos' },
  { id: 'medication', label: '💊 Farmacia' },
  { id: 'accessories', label: '🧸 Accesorios' },
  { id: 'hygiene', label: '🧴 Higiene' },
  { id: 'toys', label: '🎾 Juguetes' },
];

const SPECIES_OPTIONS: { id: PetSpecies | 'both'; label: string }[] = [
  { id: 'both', label: 'Todos' },
  { id: 'dog', label: '🐶 Perro' },
  { id: 'cat', label: '🐱 Gato' },
];

interface AddProductModalProps {
  onClose: () => void;
  onProductAdded: () => void;
  editingProduct?: Product | null;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ onClose, onProductAdded, editingProduct }) => {
  const isEditing = !!editingProduct;
  const [name, setName] = useState(editingProduct?.name || '');
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [brand, setBrand] = useState(editingProduct?.brand || '');
  const [price, setPrice] = useState(editingProduct ? String(editingProduct.price) : '');
  const [salePrice, setSalePrice] = useState(editingProduct?.salePrice ? String(editingProduct.salePrice) : '');
  const [stock, setStock] = useState(editingProduct ? String(editingProduct.stock) : '');
  const [category, setCategory] = useState<ProductCategory>(editingProduct?.category || 'accessories');
  const [species, setSpecies] = useState<PetSpecies | 'both'>(editingProduct?.species || 'both');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [hasOffer, setHasOffer] = useState(!!editingProduct?.salePrice);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la galería');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !price.trim() || (!isEditing && !imageUri)) {
      Alert.alert('Error', 'Por favor completá los campos requeridos y seleccioná una imagen.');
      return;
    }
    const parsedPrice = parseFloat(price.replace(/\./g, '').replace(',', '.')) || 0;
    if (parsedPrice <= 0) {
      Alert.alert('Error', 'Ingresá un precio válido mayor a cero.');
      return;
    }
    const parsedSalePrice = hasOffer ? (parseFloat(salePrice.replace(/\./g, '').replace(',', '.')) || 0) : undefined;
    if (hasOffer && (!parsedSalePrice || parsedSalePrice <= 0)) {
      Alert.alert('Error', 'Ingresá un precio de oferta válido.');
      return;
    }
    if (hasOffer && (parsedSalePrice ?? 0) >= parsedPrice) {
      Alert.alert('Error', 'El precio de oferta debe ser menor al precio original.');
      return;
    }
    const parsedStock = Math.max(0, parseInt(stock, 10) || 0);

    setLoading(true);
    try {
      let images: string[] = editingProduct?.images?.filter((i) => typeof i === 'string') || [];
      if (imageUri) {
        setUploadingImage(true);
        try {
          const fileName = `product-${Date.now()}.jpg`;
          const publicUrl = await uploadImage(imageUri, `shop/products/${fileName}`);
          if (publicUrl) images = [publicUrl];
        } finally {
          setUploadingImage(false);
        }
      }

      const payload = {
        name: name.trim(),
        description,
        brand: brand.trim(),
        price: parsedPrice,
        salePrice: parsedSalePrice,
        stock: parsedStock,
        category,
        species,
        variants: [],
        images,
        active: true,
      };

      if (isEditing && editingProduct) {
        await updateProduct(editingProduct.id, payload);
        Alert.alert('¡Éxito! 🛒', `El producto ${name} fue actualizado.`);
      } else {
        await addProduct(payload);
        Alert.alert('¡Éxito! 🛒', `El producto ${name} se publicó en la tienda.`);
      }
      onProductAdded();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el producto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Foto del Producto (Requerido)</Text>
        <TouchableOpacity style={styles.imageContainer} onPress={pickImage} disabled={uploadingImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.productImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="camera-plus" size={48} color={colors.textMuted} />
              <Text style={styles.imagePlaceholderText}>Subir foto</Text>
            </View>
          )}
          {uploadingImage && (
            <View style={styles.imageOverlay}>
              <ActivityIndicator color="#FFF" />
              <Text style={{color: '#FFF', marginTop: 8}}>Subiendo imagen...</Text>
            </View>
          )}
        </TouchableOpacity>

        <Input
          label="Nombre del Producto"
          placeholder="Ej: Juguete para morder"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Marca"
          placeholder="Ej: Kong"
          value={brand}
          onChangeText={setBrand}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input
              label="Precio ($)"
              placeholder="0.00"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Stock (Unidades)"
              placeholder="10"
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Oferta */}
        <TouchableOpacity style={styles.offerToggle} onPress={() => setHasOffer((v) => !v)}>
          <MaterialCommunityIcons
            name={hasOffer ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            size={22}
            color={hasOffer ? colors.accent : colors.textMuted}
          />
          <Text style={styles.offerToggleText}>Publicar con precio de oferta (sale)</Text>
        </TouchableOpacity>
        {hasOffer && (
          <Input
            label="Precio de oferta ($)"
            placeholder="Ej: 49900"
            value={salePrice}
            onChangeText={setSalePrice}
            keyboardType="numeric"
          />
        )}

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.selectorRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.selectorChip, category === c.id && styles.selectorChipActive]}
              onPress={() => setCategory(c.id)}
            >
              <Text style={[styles.selectorChipText, category === c.id && styles.selectorChipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Especie</Text>
        <View style={styles.selectorRow}>
          {SPECIES_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.selectorChip, species === s.id && styles.selectorChipActive]}
              onPress={() => setSpecies(s.id)}
            >
              <Text style={[styles.selectorChipText, species === s.id && styles.selectorChipTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Descripción"
          placeholder="Detalles del producto..."
          value={description}
          onChangeText={setDescription}
          multiline
        />

      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Publicar en Tienda"
          onPress={handleSubmit}
          loading={loading || uploadingImage}
          variant="accent"
          size="lg"
          fullWidth
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.xl, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.xl, color: colors.textDark },
  closeBtn: { padding: spacing.xs },
  content: { padding: spacing.xl, gap: spacing.md },
  label: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.sm, color: colors.textDark, marginBottom: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.md },
  offerToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  offerToggleText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.sm, color: colors.textDark },
  selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  selectorChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  selectorChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  selectorChipText: { fontFamily: fonts.nunito.semiBold, fontSize: fontSizes.xs, color: colors.textMuted },
  selectorChipTextActive: { color: colors.primaryDark, fontFamily: fonts.nunito.bold },
  footer: { padding: spacing.xl, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: "#FFF" },
  
  imageContainer: { alignSelf: 'center', marginVertical: spacing.md, position: 'relative' },
  productImage: { width: 200, height: 200, borderRadius: 12 },
  imagePlaceholder: { width: 200, height: 200, borderRadius: 12, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed' },
  imagePlaceholderText: { fontSize: fontSizes.sm, color: colors.textMuted, marginTop: spacing.md, fontFamily: fonts.nunito.semiBold },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
