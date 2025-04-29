import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '@/config/env';
import { User, Response } from '@/types';

interface FormData {
  name: string;
  age: number;
  job: string;
  email: string;
  password: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<Response>;
  signUp: (data: FormData) => Promise<Response>;
  logout: () => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<Response>;
  resendOTP: (email: string) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = !!token;

  // 🔄 Refresh token logic
  const refreshToken = async () => {
    try {
      const res = await axios.post(
        `${API}/auth/refresh`,
        {},
        {
          withCredentials: true,
          validateStatus: (status) => status < 500,
        }
      );
      if (res.data.error) {
        logout();
        return null;
      }

      if (res.data.success) {
        const newToken = res.data.data.accessToken;
        setToken(newToken);
        localStorage.setItem('token', newToken);
        return newToken;
      }
    } catch (err) {
      console.error('Failed to refresh token', err);
    }
    return null;
  };

  // 🔄 Fetch user details
  const fetchUser = async () => {
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const res = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: (status) => status < 500,
      });

      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (err) {
      console.log('Failed to fetch user', err);
    }
    setIsLoading(false);
  };

  // 🔑 Login
  const login = async (email: string, password: string) => {
    const res = await axios.post(
      `${API}/auth/sign-in`,
      { email, password },
      { withCredentials: true }
    );

    if (res.data.success) {
      const accessToken = res.data.data.accessToken;
      setToken(accessToken);
      localStorage.setItem('token', accessToken);
      fetchUser();
    }
    return res.data;
  };

  // 📝 Sign-up
  const signUp = async (data: FormData) => {
    const res = await axios.post(`${API}/auth/sign-up`, data, {
      withCredentials: true,
      validateStatus: (status) => status == 409 || status < 500,
    });

    if (res.data.success) {
      const accessToken = res.data.data.token;
      setToken(accessToken);
      localStorage.setItem('token', accessToken);
      fetchUser();
    }
    console.log(res.data);
    return res.data;
  };

  // 🚪 Logout
  const logout = async () => {
    try {
      await axios.post(`${API}/auth/sign-out`, {}, { withCredentials: true });
    } catch (error) {
      console.log('Logout request failed', error);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  // 🔄 Verify OTP
  const verifyOTP = async (email: string, otp: string) => {
    const res = await axios.post(
      `${API}/auth/verify`,
      { email, otp },
      { withCredentials: true }
    );
    return res.data;
  };

  // 🔄 Resend OTP
  const resendOTP = async (email: string) => {
    const res = await axios.post(
      `${API}/auth/resend`,
      { email },
      { withCredentials: true }
    );
    return res.data;
  };

  // 🔄 Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');

      if (storedToken) {
        const newToken = await refreshToken();
        if (newToken) {
          fetchUser();
        }
      } else {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        signUp,
        logout,
        verifyOTP,
        resendOTP,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
