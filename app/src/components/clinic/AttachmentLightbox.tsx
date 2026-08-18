// ============================================================
// Veterinaria La Plata — AttachmentLightbox
// Visor a pantalla completa de adjuntos (imágenes/estudios)
// ============================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../../config/theme';
import { Attachment } from '../../types';

const { width: SCREEN_W } = Dimensions.get('window');

interface AttachmentLightboxProps {
  visible: boolean;
  attachments: Attachment[];
  initialIndex?: number;
  onClose: () => void;
}

export const AttachmentLightbox: React.FC<AttachmentLightboxProps> = ({
  visible,
  attachments,
  initialIndex = 0,
  onClose,
}) => {
  const [index, setIndex] = useState(initialIndex);
  const current = attachments[index];

  const openPdf = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Aviso', 'No se pudo abrir el archivo.');
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      console.log('open pdf error:', error);
      Alert.alert('Error', 'No se pudo abrir el archivo.');
    }
  };

  const goPrev = () => setIndex((i) => (i - 1 + attachments.length) % attachments.length);
  const goNext = () => setIndex((i) => (i + 1) % attachments.length);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <MaterialCommunityIcons name="close" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.counter}>
            {attachments.length > 0 ? `${index + 1} / ${attachments.length}` : ''}
          </Text>
          {current && current.kind === 'pdf' && (
            <TouchableOpacity onPress={() => openPdf(current.url)} style={styles.iconBtn}>
              <MaterialCommunityIcons name="open-in-new" size={24} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {!current ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="image-off-outline" size={48} color="rgba(255,255,255,0.6)" />
            <Text style={styles.emptyText}>Sin adjuntos</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
                setIndex(Math.min(Math.max(next, 0), attachments.length - 1));
              }}
              contentContainerStyle={{ alignItems: 'center' }}
            >
              {attachments.map((a, i) => (
                <View key={i} style={{ width: SCREEN_W, alignItems: 'center', justifyContent: 'center' }}>
                  {a.kind === 'pdf' ? (
                    <TouchableOpacity style={styles.pdfBox} onPress={() => openPdf(a.url)}>
                      <MaterialCommunityIcons name="file-pdf-box" size={72} color={colors.danger} />
                      <Text style={styles.pdfText}>Ver PDF / Estudio</Text>
                    </TouchableOpacity>
                  ) : (
                    <Image
                      source={{ uri: a.url }}
                      style={styles.image}
                      resizeMode="contain"
                    />
                  )}
                  {a.caption ? <Text style={styles.caption}>{a.caption}</Text> : null}
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10, 20, 20, 0.95)' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.md,
  },
  iconBtn: { padding: spacing.xs },
  counter: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.md, color: '#FFF' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.md, color: 'rgba(255,255,255,0.7)', marginTop: spacing.sm },
  image: { width: SCREEN_W - spacing.xl, height: '80%', borderRadius: borderRadius.md },
  pdfBox: { alignItems: 'center', justifyContent: 'center' },
  pdfText: { fontFamily: fonts.nunito.bold, fontSize: fontSizes.md, color: '#FFF', marginTop: spacing.md },
  caption: {
    fontFamily: fonts.nunito.regular,
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.md,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});

export default AttachmentLightbox;
