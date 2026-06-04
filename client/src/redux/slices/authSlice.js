import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginAPI, registerAPI, forgotPasswordAPI, resetPasswordAPI } from '../../api/client';

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await loginAPI(credentials);
      localStorage.setItem('mandal_token', data.token);
      localStorage.setItem('mandal_user', JSON.stringify(data));
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await registerAPI(userData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (emailData, { rejectWithValue }) => {
    try {
      const { data } = await forgotPasswordAPI(emailData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send OTP');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (resetData, { rejectWithValue }) => {
    try {
      const { data } = await resetPasswordAPI(resetData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to reset password');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    admin:   JSON.parse(localStorage.getItem('mandal_user') || 'null'),
    token:   localStorage.getItem('mandal_token') || null,
    loading: false,
    error:   null,
  },
  reducers: {
    logout: (state) => {
      state.admin = null; state.token = null; state.error = null;
      localStorage.removeItem('mandal_token');
      localStorage.removeItem('mandal_user');
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending,     (s) => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled,   (s, a) => {
        s.loading = false; s.admin = a.payload; s.token = a.payload.token;
      })
      .addCase(login.rejected,    (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(register.pending,  (s) => { s.loading = true; s.error = null; })
      .addCase(register.fulfilled,(s) => { s.loading = false; })
      .addCase(register.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(forgotPassword.pending,  (s) => { s.loading = true; s.error = null; })
      .addCase(forgotPassword.fulfilled,(s) => { s.loading = false; })
      .addCase(forgotPassword.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(resetPassword.pending,  (s) => { s.loading = true; s.error = null; })
      .addCase(resetPassword.fulfilled,(s) => { s.loading = false; })
      .addCase(resetPassword.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
