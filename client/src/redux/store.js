import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import authReducer   from './slices/authSlice';
import memberReducer from './slices/memberSlice';
import entryReducer  from './slices/entrySlice';


const rootReducer = combineReducers({
  auth:     authReducer,
  members:  memberReducer,
  entries:  entryReducer,

});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});
