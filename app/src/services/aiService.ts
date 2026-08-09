// ============================================================
// Veterinaria La Plata — AI Chatbot Service (Gemini Context-Aware)
// ============================================================
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface UserContext {
  userName?: string;
  pets?: Array<{
    name: string;
    species: string;
    breed: string;
    currentWeight: number;
    ageYears?: number;
    ageMonths?: number;
    healthStatus?: string;
    notes?: string;
  }>;
}

const buildSystemInstruction = (context?: UserContext): string => {
  let contextPrompt = '';
  if (context && context.pets && context.pets.length > 0) {
    contextPrompt = `
INFORMACIÓN CONTEXTUAL DEL CLIENTE Y SUS MASCOTAS:
- Nombre del Cliente: ${context.userName || 'Cliente'}
- Mascotas del Cliente (${context.pets.length}):
${context.pets
  .map(
    (p, i) =>
      `  ${i + 1}. Nombre: "${p.name}" | Especie: ${p.species === 'dog' ? 'Perro' : 'Gato'} | Raza: ${p.breed} | Peso: ${p.currentWeight} kg | Edad: ${p.ageYears || 0} años y ${p.ageMonths || 0} meses | Salud: ${p.healthStatus || 'Excelente'}`
  )
  .join('\n')}

REGLAS DE PERSONALIZACIÓN OBLIGATORIAS:
1. Ya conocés los datos exactos de la mascota del cliente. NO le preguntes qué raza es, qué peso tiene ni cuántos años tiene.
2. Si el cliente pregunta "¿Qué alimento me recomendás para mi perro/gato?" o hace cualquier consulta sobre su mascota, nombrá directamente a su mascota por su nombre (ej: "${context.pets[0].name}") y dale recomendaciones 100% personalizadas según su raza (${context.pets[0].breed}) y su peso (${context.pets[0].currentWeight} kg).
3. Para perros pequeños/miniatura como Yorky (menos de 5kg), recomendá alimentos "Adult Small Breed" o "Mini" y croquetas de tamaño reducido.
`;
  }

  return `
Sos el asistente virtual experto de Veterinaria La Plata. Tu objetivo es ayudar a los clientes con:
- Recomendaciones de alimento para perros y gatos.
- Recomendaciones de accesorios o ropa para mascotas.
- Responder dudas generales sobre cuidados básicos.
- Guiar a los clientes a agendar un turno (indicándoles que pueden ir a "Mis Turnos" > "Nuevo Turno").

${contextPrompt}

Tono: Amigable, profesional, empático, usando emojis relacionados a mascotas (🐾, 🐕, 🐈) y con tono rioplatense (voseo).
Importante: Si preguntan por temas médicos graves o urgencias, recomendá INMEDIATAMENTE agendar un turno o comunicarse por teléfono. No des diagnósticos médicos definitivos.
`;
};

export const getChatbotResponse = async (
  userMessage: string,
  history: { role: string; parts: [{ text: string }] }[] = [],
  context?: UserContext
): Promise<string> => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  if (!apiKey) {
    return "Error: No se ha configurado la API Key de Gemini (EXPO_PUBLIC_GEMINI_API_KEY).";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const systemInstruction = buildSystemInstruction(context);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
    });

    // Ensure history starts with 'user' role as required by Gemini API
    const firstUserIdx = history.findIndex((h) => h.role === 'user');
    const sanitizedHistory = firstUserIdx >= 0 ? history.slice(firstUserIdx) : [];

    const chat = model.startChat({
      history: sanitizedHistory,
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error in AI Chatbot:', error);
    return "Ups, tuve un problema al procesar tu mensaje. ¿Podés intentar de nuevo? 🐾";
  }
};
