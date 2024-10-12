import { defineStore } from 'pinia';
import axios from 'axios';

interface User {
  _id: string;
  username: string;
  email: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null as string | null,
    user: null as User | null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async register(username: string, email: string, password: string) {
      try {
        console.log('Sending registration request:', { username, email });
        const response = await axios.post('/api/auth/register', { username, email, password });
        console.log('Registration response:', response.data);
        if (response.data.message) {
          console.log(response.data.message);
        }
      } catch (error: any) {
        console.error('Registration failed:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
          throw new Error(error.response.data.message || '注册失败，请稍后重试');
        } else if (error.request) {
          console.error('No response received:', error.request);
          throw new Error('无法连接到服务器，请检查网络连接');
        } else {
          console.error('Error setting up request:', error.message);
          throw error;
        }
      }
    },
    async login(email: string, password: string) {
      try {
        const response = await axios.post('/api/auth/login', { email, password });
        this.token = response.data.token;
        if (this.token) {
          localStorage.setItem('token', this.token);
          // 可以在这里获取用户信息
          // await this.fetchUserInfo();
        }
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
    },
    // 可以添加一个获取用户信息的方法
    // async fetchUserInfo() {
    //   try {
    //     const response = await axios.get('/api/auth/me');
    //     this.user = response.data;
    //   } catch (error) {
    //     console.error('Fetch user info failed:', error);
    //     throw error;
    //   }
    // },
  },
});