"use client";

import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const auth = {
  login: async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    if (response.data.access_token) {
      localStorage.setItem('signwave_token', response.data.access_token);
    }
    return response.data;
  },
  register: async (email: string, password: string, full_name: string) => {
    const response = await axios.post(`${API_URL}/register`, { email, password, full_name });
    if (response.data.access_token) {
      localStorage.setItem('signwave_token', response.data.access_token);
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('signwave_token');
  },
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('signwave_token');
    }
    return null;
  },
  isAuthenticated: () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('signwave_token');
    }
    return false;
  }
};
