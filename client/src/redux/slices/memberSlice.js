import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchMembers, createMemberAPI, updateMemberAPI, deleteMemberAPI } from '../../api/client';

export const loadMembers = createAsyncThunk(
  'members/load',
  async (_, { rejectWithValue }) => {
    try { const { data } = await fetchMembers(); return data; }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Fetch failed'); }
  }
);

export const addMember = createAsyncThunk(
  'members/add',
  async (memberData, { rejectWithValue }) => {
    try { const { data } = await createMemberAPI(memberData); return data.data || data; }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Add failed'); }
  }
);

export const editMember = createAsyncThunk(
  'members/edit',
  async ({ id, data }, { rejectWithValue }) => {
    try { const res = await updateMemberAPI(id, data); return { id, data: res.data.data || res.data }; }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Update failed'); }
  }
);

export const removeMember = createAsyncThunk(
  'members/remove',
  async (id, { rejectWithValue }) => {
    try { await deleteMemberAPI(id); return id; }
    catch (err) { return rejectWithValue(err.response?.data?.message || 'Delete failed'); }
  }
);

const sortMembersList = (list) => {
  return [...list].sort((a, b) => {
    const numA = parseInt(a.fataNo, 10);
    const numB = parseInt(b.fataNo, 10);
    if (isNaN(numA) && isNaN(numB)) return (a.fataNo || '').localeCompare(b.fataNo || '');
    if (isNaN(numA)) return 1;
    if (isNaN(numB)) return -1;
    return numA - numB;
  });
};

const memberSlice = createSlice({
  name: 'members',
  initialState: { list: [], loading: false, error: null, lastFetched: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadMembers.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(loadMembers.fulfilled, (s, a) => {
        s.loading = false;
        s.list = sortMembersList(a.payload.data || a.payload || []);
        s.lastFetched = Date.now();
      })
      .addCase(loadMembers.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(addMember.fulfilled,  (s, a) => {
        s.list = sortMembersList([...s.list, a.payload]);
      })
      .addCase(editMember.fulfilled, (s, a) => {
        s.list = sortMembersList(s.list.map((m) => m._id === a.payload.id ? a.payload.data : m));
      })
      .addCase(removeMember.fulfilled, (s, a) => {
        s.list = s.list.filter((m) => m._id !== a.payload);
      });
  },
});

export default memberSlice.reducer;
