import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchTransactions = createAsyncThunk('transactions/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/transactions', { params });
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

export const fetchSummary = createAsyncThunk('transactions/summary', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/transactions/summary');
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

export const addTransaction = createAsyncThunk('transactions/add', async (body, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/transactions', body);
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

export const deleteTransaction = createAsyncThunk('transactions/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/transactions/${id}`);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

const transactionSlice = createSlice({
  name: 'transactions',
  initialState: { list: [], summary: null, loading: false, error: null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (s) => { s.loading = true; })
      .addCase(fetchTransactions.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; })
      .addCase(fetchTransactions.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchSummary.fulfilled, (s, a) => { s.summary = a.payload; })
      .addCase(addTransaction.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(deleteTransaction.fulfilled, (s, a) => { s.list = s.list.filter(t => t._id !== a.payload); });
  },
});

export const { clearError } = transactionSlice.actions;
export default transactionSlice.reducer;
