import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../utils/api';
import {
  DEMO_AUTH_TOKENS,
  disableDemoSession,
  enableDemoSession,
  getDemoLogin,
  getDemoUserByToken,
  getDemoUserForSession,
  hasDemoSession,
  isDemoToken,
} from '../utils/demoAuth';
import { VALID_ROLES } from '../utils/roleRouting';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      loading: true,
      error: null,

      // Actions
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const demoLogin = getDemoLogin(email, password);
          if (demoLogin) {
            enableDemoSession(demoLogin.sessionType);
            set({
              user: demoLogin.user,
              token: demoLogin.token,
              isAuthenticated: true,
              loading: false,
              error: null,
            });
            return { success: true, user: demoLogin.user };
          }

          disableDemoSession();
          const response = await authAPI.login(email, password);

          // Validate role
          if (!VALID_ROLES.includes(response.user?.role)) {
            set({ loading: false, error: 'Unauthorized role', isAuthenticated: false });
            return { success: false, error: 'Unauthorized role' };
          }

          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
          return { success: true, user: response.user };
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';
          set({
            loading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
          return { success: false, error: errorMessage };
        }
      },

      loginWithOTP: async (otp, email, phone = null) => {
        set({ loading: true, error: null });
        try {
          const response = await authAPI.verifyOTP(otp, email, phone);

          // Validate role
          if (!VALID_ROLES.includes(response.user?.role)) {
            set({ loading: false, error: 'Unauthorized role', isAuthenticated: false });
            return { success: false, error: 'Unauthorized role' };
          }

          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
          return { success: true, user: response.user };
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'OTP verification failed';
          set({
            loading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
          return { success: false, error: errorMessage };
        }
      },

      signup: async (userData) => {
        set({ loading: true, error: null });
        try {
          const response = await authAPI.register(userData);

          // Check if OTP is required (new flow)
          if (response.requireOtp) {
            set({
              loading: false,
              error: null,
              // Don't set user/token yet
            });
            return { success: true, requireOtp: true, user: response.user };
          }

          // Legacy/Admin flow (if any)
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
          return { success: true, user: response.user };
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
          set({
            loading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        disableDemoSession();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      fetchMe: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return { success: false, error: 'No token found' };
        }

        if (isDemoToken(token) || hasDemoSession()) {
          const demoUser = getDemoUserByToken(token) || getDemoUserForSession();
          set({
            user: demoUser,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
          return { success: true, user: demoUser };
        }

        set({ loading: true, error: null });
        try {
          const response = await authAPI.getMe();

          // Validate role on rehydration too
          if (!VALID_ROLES.includes(response.user?.role)) {
            set({
              loading: false,
              error: 'Unauthorized role',
              isAuthenticated: false,
              user: null,
              token: null,
            });
            return { success: false, error: 'Unauthorized role' };
          }

          set({
            user: response.user,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
          return { success: true, user: response.user };
        } catch (error) {
          // Token might be invalid, clear auth state
          const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch user';
          set({
            loading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null,
          });
          return { success: false, error: errorMessage };
        }
      },

      hydrateFromStorage: () => {
        const { token, user } = get();
        if (isDemoToken(token) || hasDemoSession()) {
          const demoUser = getDemoUserByToken(token) || getDemoUserForSession();
          const sessionType =
            demoUser?.role === 'super_admin' || demoUser?.role === 'admin'
              ? 'admin'
              : demoUser?.role === 'driver'
              ? 'driver'
              : 'customer';
          enableDemoSession(sessionType);
          set({
            user: demoUser,
            token: token || DEMO_AUTH_TOKENS[sessionType],
            isAuthenticated: true,
            loading: false,
            error: null,
          });
          return;
        }

        if (token && user) {
          // Also validate the persisted role
          if (!VALID_ROLES.includes(user.role)) {
            set({ isAuthenticated: false, user: null, token: null, loading: false, error: 'Unauthorized role' });
            return;
          }
          set({ isAuthenticated: true, loading: false });
        } else {
          set({ isAuthenticated: false, loading: false });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

export default useAuthStore;
