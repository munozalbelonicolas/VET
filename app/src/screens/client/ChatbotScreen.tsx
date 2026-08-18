// ============================================================
// Veterinaria La Plata — AI Chatbot Screen (Personalizado con Mascotas)
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, borderRadius, shadows } from '../../config/theme';
import { Input } from '../../components/ui';
import { getChatbotResponse, UserContext } from '../../services/aiService';
import { useAuthStore } from '../../store/authStore';
import { getPetsByOwner } from '../../services/dataService';
import { Pet } from '../../types';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatbotScreenProps {
  onClose: () => void;
}

const calculateAge = (birthDate?: Date): { years: number; months: number } => {
  if (!birthDate) return { years: 0, months: 0 };
  const today = new Date();
  const birth = new Date(birthDate);
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  return { years: Math.max(0, years), months: Math.max(0, months) };
};

const healthLabel = (status?: string): string => {
  switch (status) {
    case 'green': return 'Excelente';
    case 'yellow': return 'Atención';
    case 'red': return 'Requiere control';
    default: return 'Desconocido';
  }
};

export const ChatbotScreen: React.FC<ChatbotScreenProps> = ({ onClose }) => {
  const { user } = useAuthStore();
  const [pets, setPets] = useState<Pet[]>([]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! 🐾 Soy tu asistente veterinario virtual. ¿En qué te puedo ayudar hoy?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadUserPets();
  }, []);

  const loadUserPets = async () => {
    if (!user?.id) return;
    try {
      const userPets = await getPetsByOwner(user.id);
      setPets(userPets);

      if (userPets.length > 0) {
        const pet = userPets[0];
        setMessages([
          {
            id: '1',
            text: `¡Hola ${user?.name?.split(' ')[0] || ''}! 🐾 Veo que tenés a ${pet.name} (${pet.breed}, ${pet.currentWeight} kg). ¿En qué puedo ayudarte hoy con ${pet.name}?`,
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.log('loadUserPets error:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    // Build context object
    const userContext: UserContext = {
      userName: user?.name || 'Cliente',
      pets: pets.map((p) => {
        const calculatedAge = calculateAge(p.birthDate);
        return {
          name: p.name,
          species: p.species,
          breed: p.breed,
          currentWeight: p.currentWeight,
          ageYears: p.ageYears !== undefined ? p.ageYears : calculatedAge.years,
          ageMonths: p.ageMonths !== undefined ? p.ageMonths : calculatedAge.months,
          healthStatus: healthLabel(p.healthStatus),
          notes: p.notes,
        };
      }),
    };

    // Convert history format for Gemini
    const history = messages.map((m) => ({
      role: m.isUser ? 'user' : 'model',
      parts: [{ text: m.text }],
    })) as { role: string; parts: [{ text: string }] }[];

    try {
      const responseText = await getChatbotResponse(userMsg.text, history, userContext);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.log('Chatbot error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: 'Ups, tuve un problema al procesar tu mensaje. ¿Podés intentar de nuevo? 🐾',
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.botAvatar}>
            <MaterialCommunityIcons name="robot" size={20} color="#FFF" />
          </View>
          <View>
            <Text style={styles.title}>Asistente Virtual</Text>
            <Text style={styles.subtitle}>Personalizado para tus mascotas</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[styles.messageBubble, msg.isUser ? styles.userBubble : styles.botBubble]}
          >
            <Text style={[styles.messageText, msg.isUser ? styles.userMessageText : styles.botMessageText]}>
              {msg.text}
            </Text>
            <Text style={[styles.timeText, msg.isUser ? styles.userTimeText : styles.botTimeText]}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={[styles.messageBubble, styles.botBubble, styles.loadingBubble]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Pensando respuesta para {pets[0]?.name || 'tu mascota'}...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Input
            placeholder="Escribí tu mensaje..."
            value={inputText}
            onChangeText={setInputText}
            style={styles.input}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          <MaterialCommunityIcons name="send" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  title: { fontFamily: fonts.quicksand.bold, fontSize: fontSizes.md, color: colors.textDark },
  subtitle: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.primary },
  closeBtn: { padding: spacing.xs },
  messagesContainer: { flex: 1, paddingHorizontal: spacing.lg },
  messagesContent: { paddingVertical: spacing.md },
  messageBubble: {
    maxWidth: '85%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgCard,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: { fontSize: fontSizes.sm, lineHeight: 20 },
  userMessageText: { fontFamily: fonts.nunito.regular, color: colors.textWhite },
  botMessageText: { fontFamily: fonts.nunito.regular, color: colors.textDark },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  userTimeText: { color: 'rgba(255,255,255,0.8)' },
  botTimeText: { color: colors.textMuted },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  loadingText: { fontFamily: fonts.nunito.regular, fontSize: fontSizes.xs, color: colors.textMuted },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputWrapper: { flex: 1, marginRight: spacing.sm },
  input: { marginBottom: 0 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});

export default ChatbotScreen;
