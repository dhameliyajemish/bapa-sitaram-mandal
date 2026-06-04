import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchLoans = createAsyncThunk('loans/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/loans', { params });
    return Array.isArray(data) ? data : (data.data || []);
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

export const createLoan = createAsyncThunk('loans/create', async (body, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/loans', body);
    return data.data || data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

export const payLoanEMI = createAsyncThunk('loans/payEMI', async ({ id, body }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/loans/${id}/pay-emi`, body);
    return data.data || data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

const loanSlice = createSlice({
  name: 'loans',
  initialState: { list: [], loading: false, error: null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLoans.pending, (s) => { s.loading = true; })
      .addCase(fetchLoans.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(fetchLoans.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createLoan.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(payLoanEMI.fulfilled, (s, a) => {
        const i = s.list.findIndex(l => l._id === a.payload._id);
        if (i !== -1) s.list[i] = a.payload;
      });
  },
});

export const { clearError } = loanSlice.actions;
export default loanSlice.reducer;
