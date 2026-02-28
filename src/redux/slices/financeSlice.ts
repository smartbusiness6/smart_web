// src/redux/slices/financeSlice.ts
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import BASE_URL from '../../config/ApiConfig'; // Adjust if needed
import type { Transaction, Compte } from '../../models/index';
import type { BilanComptable, CompteResultat, FinanceState } from '../../models/interfaces';


const initialState: FinanceState = {
  weekly: null,
  monthly: null,
  annually: null,
  general: null,
  account: null,
  transactions: [],
  compteResultat: null,
  bilanComptable: null,
  loading: false,
  error: null,
};

// Thunk for fetching Compte Resultat
export const fetchCompteResultat = createAsyncThunk<CompteResultat, string>(
  'finance/fetchCompteResultat',
  async (token, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/finance/compte-resultat`, { // Assume endpoint
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

// Thunk for fetching Bilan Comptable
export const fetchBilanComptable = createAsyncThunk<BilanComptable, string>(
  'finance/fetchBilanComptable',
  async (token, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/finance/bilan-comptable`, { // Assume endpoint
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

// Thunk for fetching General (solde)
export const fetchGeneral = createAsyncThunk<Compte, string>(
  'finance/fetchGeneral',
  async (token, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/finance/general`, { // Assume endpoint based on getGeneral
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

// Thunk for fetching All Transactions
export const fetchAllTransactions = createAsyncThunk<Transaction[], string>(
  'finance/fetchAllTransactions',
  async (token, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/transactions/all`, { // Assume endpoint based on getAllTransactions
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

const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {
    // Add any sync reducers if needed
  },
  extraReducers: (builder) => {
    builder
      // fetchCompteResultat
      .addCase(fetchCompteResultat.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCompteResultat.fulfilled, (state, action: PayloadAction<CompteResultat>) => {
        state.loading = false;
        state.compteResultat = action.payload;
      })
      .addCase(fetchCompteResultat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchBilanComptable
      .addCase(fetchBilanComptable.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBilanComptable.fulfilled, (state, action: PayloadAction<BilanComptable>) => {
        state.loading = false;
        state.bilanComptable = action.payload;
      })
      .addCase(fetchBilanComptable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchGeneral
      .addCase(fetchGeneral.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGeneral.fulfilled, (state, action: PayloadAction<Compte>) => {
        state.loading = false;
        state.account = action.payload;
      })
      .addCase(fetchGeneral.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchAllTransactions
      .addCase(fetchAllTransactions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllTransactions.fulfilled, (state, action: PayloadAction<Transaction[]>) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchAllTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default financeSlice.reducer;