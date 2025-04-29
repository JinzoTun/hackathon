import axios from 'axios';
import { API } from '@/config/env';

// Get base API URL 
const API_BASE = API;
const LIVEKIT_API_URL = `${API_BASE}/livekit`;

/**
 * Helper function to get auth headers
 */
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const getConnectionDetails = async () => {
  try {
    const response = await axios.get(`${LIVEKIT_API_URL}/connection-details`, {
      headers: getAuthHeaders(),
    });

    if (
      !response.data ||
      !response.data.serverUrl ||
      !response.data.participantToken
    ) {
      throw new Error('Invalid connection details received from server');
    }

    return response.data;
  } catch (error) {
    console.error('Error getting connection details:', error);
    throw error;
  }
};
