// src/redux/slices/userSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import BASE_URL from '../../config/ApiConfig';

// Define User type based on your API (adjust as needed)
export interface User {
  id: number;
  nom: string;
  role: 'ADMIN' | 'USER'; // Adjust roles as per your schema
  profession: {
    poste: string;
    salaire: number;
  };
  conges: Array<{
    dateFin: string; // ISO date string
    // Add other conge fields if needed
  }>;
  // Add other fields from your User schema
}

interface UserState {
  users: User[];
  user: User | null;
  absents: User[];
  presents: User[];
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const initialState: UserState = {
  users: [],
  user: null,
  absents: [],
  presents: [],
  status: 'idle',
  error: null,
};

// Thunk for GET /rh/staff/ (all users, admin only)
export const fetchAllUsers = createAsyncThunk<User[], string>(
  'users/fetchAll',
  async (token, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/rh/staff/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

// Thunk for GET /rh/staff/id/{id} or /rh/staff/profile/{id} (get user by ID)
// Note: profile endpoint is similar but with different auth; use appropriate based on context
export const fetchUserById = createAsyncThunk<User, { id: number; token: string; isProfile?: boolean }>(
  'users/fetchById',
  async ({ id, token, isProfile = false }, { rejectWithValue }) => {
    const endpoint = isProfile ? 'profile' : 'id';
    try {
      const response = await fetch(`${BASE_URL}/rh/staff/${endpoint}/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

// Thunk for GET /rh/staff/missed/ (absents, admin only)
export const fetchAbsents = createAsyncThunk<User[], string>(
  'users/fetchAbsents',
  async (token, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/rh/staff/missed/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

// Thunk for GET /rh/staff/present/ (presents, admin only)
export const fetchPresents = createAsyncThunk<User[], string>(
  'users/fetchPresents',
  async (token, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/rh/staff/present/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // Add any sync reducers if needed
  },
  extraReducers: (builder) => {
    builder
      // fetchAllUsers
      .addCase(fetchAllUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAllUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.status = 'idle';
        state.users = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // fetchUserById
      .addCase(fetchUserById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserById.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = 'idle';
        state.user = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // fetchAbsents
      .addCase(fetchAbsents.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAbsents.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.status = 'idle';
        state.absents = action.payload;
      })
      .addCase(fetchAbsents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // fetchPresents
      .addCase(fetchPresents.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPresents.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.status = 'idle';
        state.presents = action.payload;
      })
      .addCase(fetchPresents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export default userSlice.reducer;