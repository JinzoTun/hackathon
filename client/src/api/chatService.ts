import axios from 'axios';
import { API } from '@/config/env';

// Types
export interface User {
  _id: string;
  name: string;
  email: string;
  address?: string;
}

export interface Message {
  _id: string;
  content: string;
  sender: User;
  recipient: User;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  isAdviceRequest?: boolean;
  isAdviceResponse?: boolean;
  relatedAdviceRequestId?: string | null;
  rating?: number | null;
}

export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: string;
  unreadCount: { [key: string]: number };
  createdAt: string;
  updatedAt: string;
}

// API function to get all users
export const getUsers = async (): Promise<User[]> => {
  const token = localStorage.getItem('token');

  try {
    const response = await axios.get(`${API}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// API function to get all conversations
export const getConversations = async (): Promise<Conversation[]> => {
  const token = localStorage.getItem('token');

  try {
    const response = await axios.get(`${API}/chat/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

// API function to get messages with a specific user
export const getMessages = async (recipientId: string): Promise<Message[]> => {
  const token = localStorage.getItem('token');

  try {
    const response = await axios.get(`${API}/chat/messages/${recipientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

// API function to send a message
export const sendMessage = async (
  recipientId: string,
  content: string,
  options?: {
    isAdviceRequest?: boolean;
    isAdviceResponse?: boolean;
    relatedAdviceRequestId?: string;
  }
): Promise<Message | null> => {
  const token = localStorage.getItem('token');

  try {
    const response = await axios.post(
      `${API}/chat/messages`,
      {
        recipientId,
        content,
        ...options,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data.message;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};

// API function to rate advice message
export const rateAdvice = async (
  messageId: string,
  rating: number
): Promise<boolean> => {
  const token = localStorage.getItem('token');

  try {
    await axios.post(
      `${API}/chat/rate-advice`,
      { messageId, rating },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return true;
  } catch (error) {
    console.error('Error rating advice:', error);
    return false;
  }
};

// API function to get unread message counts
export const getUnreadCounts = async (): Promise<{
  totalUnread: number;
  conversations: any[];
}> => {
  const token = localStorage.getItem('token');

  try {
    const response = await axios.get(`${API}/chat/unread`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    return { totalUnread: 0, conversations: [] };
  }
};
