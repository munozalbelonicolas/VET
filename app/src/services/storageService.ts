// ============================================================
// Veterinaria La Plata — Storage Service (Cloudinary Signed)
// ============================================================
import * as Crypto from 'expo-crypto';

export const uploadImageBase64 = async (base64String: string, path?: string): Promise<string> => {
  const filePayload = base64String.startsWith('data:')
    ? base64String
    : `data:image/jpeg;base64,${base64String}`;

  try {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName) {
      return filePayload;
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    let bodyData: Record<string, string> = {};

    if (uploadPreset && (!apiKey || !apiSecret)) {
      // Unsigned Upload
      bodyData = {
        file: filePayload,
        upload_preset: uploadPreset,
      };
    } else if (apiKey && apiSecret) {
      // Signed Upload
      const timestamp = Math.round(new Date().getTime() / 1000).toString();
      let stringToSign = `timestamp=${timestamp}`;
      if (uploadPreset) {
        stringToSign = `timestamp=${timestamp}&upload_preset=${uploadPreset}`;
      }
      stringToSign += apiSecret;

      const signature = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA1,
        stringToSign
      );

      bodyData = {
        file: filePayload,
        api_key: apiKey,
        timestamp: timestamp,
        signature: signature,
      };

      if (uploadPreset) {
        bodyData.upload_preset = uploadPreset;
      }
    } else {
      return filePayload;
    }

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
      // If Cloudinary credentials lack permissions, use filePayload so app NEVER breaks or hangs
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
