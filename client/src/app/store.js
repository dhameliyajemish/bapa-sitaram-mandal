import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../redux/slices/authSlice';
import memberReducer from '../redux/slices/memberSlice';
import entryReducer from '../redux/slices/entrySlice';
import loanReducer from '../redux/slices/loanSlice';
import uiReducer from '../redux/slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    members: memberReducer,
    entries: entryReducer,
    loans: loanReducer,
    ui: uiReducer,
  },
});
