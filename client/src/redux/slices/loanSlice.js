import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchLoans, createLoanAPI, updateLoanAPI, deleteLoanAPI, fetchLoanStats } from '../../api/client';

export const loadLoans = createAsyncThunk(
  'loans/load',
  async (params = {}, { rejectWithValue }) => {
    try { const { data } = await fetchLoans(params); return { data, params }; }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Fetch failed'); }
  }
);

export const addLoanThunk = createAsyncThunk(
  'loans/add',
  async (loanData, { rejectWithValue }) => {
    try { const { data } = await createLoanAPI(loanData); return data; }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Add failed'); }
  }
);

export const updateLoanThunk = createAsyncThunk(
  'loans/update',
  async ({ id, data }, { rejectWithValue }) => {
    try { const res = await updateLoanAPI(id, data); return { id, data: res.data }; }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Update failed'); }
  }
);

export const removeLoanThunk = createAsyncThunk(
  'loans/remove',
  async (id, { rejectWithValue }) => {
    try { await deleteLoanAPI(id); return id; }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Delete failed'); }
  }
);

export const loadLoanStats = createAsyncThunk(
  'loans/stats',
  async (_, { rejectWithValue }) => {
    try { const { data } = await fetchLoanStats(); return data; }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Stats failed'); }
  }
);

const loanSlice = createSlice({
  name: 'loans',
  initialState: { list: [], stats: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadLoans.pending,     (s) => { s.loading = true; s.error = null; })
      .addCase(loadLoans.fulfilled,   (s, a) => { s.loading = false; s.list = a.payload.data; })
      .addCase(loadLoans.rejected,    (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(addLoanThunk.fulfilled, (s, a) => { s.list.push(a.payload); })
      .addCase(updateLoanThunk.fulfilled, (s, a) => {
        s.list = s.list.map((l) => l._id === a.payload.id ? a.payload.data : l);
      })
      .addCase(removeLoanThunk.fulfilled, (s, a) => {
        s.list = s.list.filter((l) => l._id !== a.payload);
      })
      .addCase(loadLoanStats.fulfilled, (s, a) => { s.stats = a.payload; })
      .addCase(loadLoanStats.rejected,  (s)   => { s.stats = null; });
  },
});

export default loanSlice.reducer;
