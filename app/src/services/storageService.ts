// ============================================================
// Veterinaria La Plata — Storage Service (Cloudinary Unsigned)
// ============================================================

/**
 * Sube una imagen en base64 a Cloudinary usando un unsigned upload preset.
 * Nunca se firman las peticiones en el cliente (el API secret no debe
 * estar embebido en el bundle). Si Cloudinary no está configurado o falla,
 * se devuelve el data URI original para no romper el flujo.
 */
export const uploadImageBase64 = async (base64String: string, path?: string): Promise<string> => {
  const filePayload = base64String.startsWith('data:')
    ? base64String
    : `data:image/jpeg;base64,${base64String}`;

  try {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return filePayload;
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const bodyData: Record<string, string> = {
      file: filePayload,
      upload_preset: uploadPreset,
      // 'folder' opcional para organizar por módulo
      ...(path ? { folder: `veterinaria/${path.replace(/\//g, '_')}` } : {}),
    };

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn('Cloudinary notice:', data?.error?.message);
      return filePayload;
    }

    return data.secure_url;
  } catch (error: any) {
    console.warn('Cloudinary network notice, using fallback:', error?.message);
    return filePayload;
  }
};

export const uploadImage = async (uri: string, path?: string): Promise<string> => {
  if (!uri) throw new Error('URI vacía');
  if (uri.startsWith('data:')) {
    return uploadImageBase64(uri, path);
  }

  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          const url = await uploadImageBase64(base64Data, path);
          resolve(url);
        } catch {
          resolve(uri);
        }
      };
      reader.onerror = () => resolve(uri);
      reader.readAsDataURL(blob);
    });
  } catch {
    return uri;
  }
};

/**
 * Sube un PDF / estudio a Cloudinary (endpoint /raw/upload, sin API secret).
 */
export const uploadPdf = async (uri: string, path?: string): Promise<string | null> => {
  try {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) return null;

    const response = await fetch(uri);
    const blob = await response.blob();

    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });

    if (!base64) return null;

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;
    const bodyData: Record<string, string> = {
      file: base64,
      upload_preset: uploadPreset,
      ...(path ? { folder: `veterinaria/${path.replace(/\//g, '_')}` } : {}),
    };

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });
    const data: any = await uploadResponse.json();

    if (!uploadResponse.ok) {
      console.warn('Cloudinary raw notice:', data?.error?.message);
      return null;
    }

    return data.secure_url;
  } catch (error: any) {
    console.warn('Cloudinary raw network notice:', error?.message);
    return null;
  }
};
