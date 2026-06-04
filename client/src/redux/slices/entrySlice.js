import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchEntries, createEntryAPI, fetchEntriesByMonth, deleteEntryAPI } from '../../api/client';

export const loadEntries = createAsyncThunk(
  'entries/load',
  async (_, { rejectWithValue }) => {
    try { const { data } = await fetchEntries(); return data; }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Fetch failed'); }
  }
);

export const addEntryThunk = createAsyncThunk(
  'entries/add',
  async (entryData, { rejectWithValue }) => {
    try { const { data } = await createEntryAPI(entryData); return data; }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Add failed'); }
  }
);

export const deleteEntryThunk = createAsyncThunk(
  'entries/delete',
  async (id, { rejectWithValue }) => {
    try { await deleteEntryAPI(id); return id; }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Delete failed'); }
  }
);

export const loadEntriesByMonth = createAsyncThunk(
  'entries/byMonth',
  async (month, { rejectWithValue }) => {
    try { const { data } = await fetchEntriesByMonth(month); return data; }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Fetch failed'); }
  }
);

const entrySlice = createSlice({
  name: 'entries',
  initialState: { list: [], loading: false, error: null, lastFetched: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadEntries.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(loadEntries.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; s.lastFetched = Date.now(); })
      .addCase(loadEntries.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(addEntryThunk.fulfilled, (s, a) => { s.list.push(a.payload); })
      .addCase(deleteEntryThunk.fulfilled, (s, a) => { s.list = s.list.filter(e => e._id !== a.payload); });
  },
});

export default entrySlice.reducer;
