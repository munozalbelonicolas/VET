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
import { colors, fonts, fontSizes, spacing, shadows } from '../../config/theme';
import { Button, Input } from '../../components/ui';
import { addProduct } from '../../services/shopService';
import { uploadImage } from '../../services/storageService';

interface AddProductModalProps {
  onClose: () => void;
  onProductAdded: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ onClose, onProductAdded }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  
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
    if (!name.trim() || !price.trim() || !imageUri) {
      Alert.alert('Error', 'Por favor completá los campos requeridos y seleccioná una imagen.');
      return;
    }

    setLoading(true);
    try {
      setUploadingImage(true);
      const fileName = `product-${Date.now()}.jpg`;
      const publicUrl = await uploadImage(imageUri, `shop/products/${fileName}`);
      setUploadingImage(false);

      await addProduct({
        name,
        description,
        brand,
        price: parseFloat(price) || 0,
        stock: parseInt(stock, 10) || 0,
        category: 'accessories', // Default for now
        species: 'both',
        variants: [],
        images: [publicUrl],
        active: true,
      });

      Alert.alert('¡Éxito! 🛒', `El producto ${name} se publicó en la tienda.`);
      onProductAdded();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el producto.');
      setUploadingImage(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nuevo Producto 📦</Text>
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
  footer: { padding: spacing.xl, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: "#FFF" },
  
  imageContainer: { alignSelf: 'center', marginVertical: spacing.md, position: 'relative' },
  productImage: { width: 200, height: 200, borderRadius: 12 },
  imagePlaceholder: { width: 200, height: 200, borderRadius: 12, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed' },
  imagePlaceholderText: { fontSize: fontSizes.sm, color: colors.textMuted, marginTop: spacing.md, fontFamily: fonts.nunito.semiBold },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
