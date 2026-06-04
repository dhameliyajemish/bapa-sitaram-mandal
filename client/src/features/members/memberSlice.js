import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchMembers = createAsyncThunk('members/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/members', { params });
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

export const createMember = createAsyncThunk('members/create', async (body, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/members', body);
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

export const updateMember = createAsyncThunk('members/update', async ({ id, body }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/members/${id}`, body);
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

export const deleteMember = createAsyncThunk('members/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/members/${id}`);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

const memberSlice = createSlice({
  name: 'members',
  initialState: { list: [], total: 0, loading: false, error: null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMembers.pending, (s) => { s.loading = true; })
      .addCase(fetchMembers.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; s.total = a.payload.total; })
      .addCase(fetchMembers.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createMember.fulfilled, (s, a) => { s.list.unshift(a.payload); s.total += 1; })
      .addCase(updateMember.fulfilled, (s, a) => {
        const i = s.list.findIndex(m => m._id === a.payload._id);
        if (i !== -1) s.list[i] = a.payload;
      })
      .addCase(deleteMember.fulfilled, (s, a) => { s.list = s.list.filter(m => m._id !== a.payload); s.total -= 1; });
  },
});

export const { clearError } = memberSlice.actions;
export default memberSlice.reducer;
