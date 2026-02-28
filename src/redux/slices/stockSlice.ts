// src/redux/slices/stockSlice.ts
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import BASE_URL from '../../config/ApiConfig'; // Adjust path if needed
import type { Produit } from '../../models'; // From models.ts

interface StockState {
  products: Produit[];
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const initialState: StockState = {
  products: [],
  status: 'idle',
  error: null,
};

export const fetchProducts = createAsyncThunk<Produit[], string>(
  'stock/fetchProducts',
  async (token, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/stock/products`, { // Assume endpoint based on context
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

const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    // Add sync reducers if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Produit[]>) => {
        state.status = 'idle';
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export default stockSlice.reducer;