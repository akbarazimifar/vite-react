import { configureStore } from '@reduxjs/toolkit';
import roomReducer from '../features/room/roomSlice';
import userReducer from '../features/user/userSlice'


// Then go to index.jsx to set the final step
export const store = configureStore({
  reducer: {
    user: userReducer,
    room: roomReducer
  },
});