import { ENDPOINTS } from '../constants';
import { AnalysisResult, HistoryRecord, User } from '../types';

export const apiService = {
  login: async (credentials: any) => {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  register: async (data: any) => {
    const response = await fetch(ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  logout: async (data: { UserName: string; MobileNumber: string }) => {
    try {
      await fetch(ENDPOINTS.LOGOUT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('Logout API call failed, clearing local state anyway.');
    }
  },

  analyzeImage: async (file: File, user: User): Promise<AnalysisResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('UserName', user.username);
    formData.append('MobileNumber', user.mobileNumber);

    const response = await fetch(ENDPOINTS.MEAL_AI, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error(`Server Error: ${response.status}`);
    
    const json = await response.json();
    const data = json.output || json;

    // Normalize response
    if (!data.total && Array.isArray(data.food)) {
        data.total = data.food.reduce((acc: any, item: any) => ({
            calories: acc.calories + (Number(item.calories) || 0),
            protein: acc.protein + (Number(item.protein) || 0),
            carbs: acc.carbs + (Number(item.carbs) || 0),
            fat: acc.fat + (Number(item.fat) || 0),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    }

    return data;
  },

  fetchHistory: async (user: User): Promise<HistoryRecord[]> => {
    const response = await fetch(ENDPOINTS.HISTORY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ UserName: user.username, MobileNumber: user.mobileNumber }),
    });

    const rawData = await response.json();
    // Handle potential wrapping in array or direct object
    const result = Array.isArray(rawData) ? rawData[0] : rawData;
    
    if (!result || !result.hasData || !result.data) return [];
    return result.data;
  },

  sendVoice: async (blob: Blob, sessionId: string) => {
    const formData = new FormData();
    formData.append('data', blob, 'voice.wav');
    formData.append('sessionId', sessionId);
    
    const response = await fetch(ENDPOINTS.VOICE, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error("Voice processing failed");
    return response.blob();
  }
};