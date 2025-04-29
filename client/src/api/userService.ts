import axios from 'axios';
import { API } from '@/config/env';
import { User } from '@/types';

// Function to get all users
export const getAllUsers = async (token: string | null): Promise<User[]> => {
  try {
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(`${API}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch users');
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Parse address string into lat/lng coordinates
export const parseAddressToCoordinates = (
  address: string
): { lat: number; lng: number } | null => {
  try {
    // Handle empty or undefined address
    if (!address) {
      console.error('Empty address provided');
      return null;
    }

    const commaSplit = address.split(',');
    if (commaSplit.length === 2) {
      const lat = parseFloat(commaSplit[0].trim());
      const lng = parseFloat(commaSplit[1].trim());

      if (!isNaN(lat) && !isNaN(lng)) {
        // Valid lat,lng format
        // Normalize longitude to be within -180 to 180 range
        const normalizedLng = normalizeLongitude(lng);
        return { lat, lng: normalizedLng };
      }
    }

    const numbers = address.match(/-?\d+\.?\d*/g);
    if (numbers && numbers.length >= 2) {
      const lat = parseFloat(numbers[0]);
      const lng = parseFloat(numbers[1]);

      if (!isNaN(lat) && !isNaN(lng)) {
        // Validate latitude is in range -90 to 90
        if (lat < -90 || lat > 90) {
          console.error(`Invalid latitude value: ${lat}`);
          return null;
        }

        // Normalize longitude to be within -180 to 180 range
        const normalizedLng = normalizeLongitude(lng);
        return { lat, lng: normalizedLng };
      }
    }

    console.error(`Could not parse address: ${address}`);
    return null;
  } catch (error) {
    console.error('Error parsing address:', error);
    return null;
  }
};

// Function to normalize longitude to -180 to 180 range
function normalizeLongitude(lng: number): number {
  // Handle the specific case we found where values are around -349
  if (lng < -180) {
    // Add 360 to convert -349 → 11 (which is the correct longitude)
    return lng + 360;
  } else if (lng > 180) {
    // Subtract 360 to handle values over 180
    return lng - 360;
  }
  return lng;
}

// Calculate distance between two points in kilometers using the Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
