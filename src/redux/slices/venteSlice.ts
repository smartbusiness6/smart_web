// src/redux/slices/commandeSlice.ts
import { createAsyncThunk, createSlice,type PayloadAction } from '@reduxjs/toolkit';
import BASE_URL from '../../config/ApiConfig'; // Adjust path
import type { CommandeResponse } from '../../models/interfaces';
import type { detailledClient } from '../../models/interfaces';
import type { facture } from '../../models';

interface CommandeState {
  commands: CommandeResponse[];
  paidCommands: CommandeResponse[];
  pendingCommands: CommandeResponse[];
  clients: detailledClient[]; // Assuming from getClients
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const initialState: CommandeState = {
  commands: [],
  paidCommands: [],
  pendingCommands: [],
  clients: [],
  status: 'idle',
  error: null,
};

// Thunk for fetching commands
export const fetchCommands = createAsyncThunk<CommandeResponse[], string>(
  'commands/fetchCommands',
  async (token, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/vente/commande`, {
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

// Thunk for validating payment
export const validatePayment = createAsyncThunk<CommandeResponse, { id: number; token: string }>(
  'commands/validatePayment',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/vente/commande/${id}/validate`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ valide: true, typePaiement: 'CASH' }), // Adjust based on original
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

// Thunk for deleting command
export const deleteCommand = createAsyncThunk<number, { id: number; token: string }>(
  'commands/deleteCommand',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/vente/commande/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return id;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

// Thunk for fetching clients (assumed from original code context)
export const fetchClients = createAsyncThunk<detailledClient[], string>(
  'commands/fetchClients',
  async (token, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/vente/clients`, { // Assume endpoint
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

const commandeSlice = createSlice({
  name: 'commands',
  initialState,
  reducers: {
    // Add if needed
  },
  extraReducers: (builder) => {
    builder
      // fetchCommands
      .addCase(fetchCommands.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCommands.fulfilled, (state, action: PayloadAction<CommandeResponse[]>) => {
        state.status = 'idle';
        state.commands = action.payload;
        state.paidCommands = action.payload.filter(c => c.valide && c.factures.every((f:facture) => f.payed));
        state.pendingCommands = action.payload.filter(c => !c.valide || c.factures.some((f:facture) => !f.payed));
      })
      .addCase(fetchCommands.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // validatePayment
      .addCase(validatePayment.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(validatePayment.fulfilled, (state, action: PayloadAction<CommandeResponse>) => {
        state.status = 'idle';
        const updated = action.payload;
        state.commands = state.commands.map(c => c.id === updated.id ? updated : c);
        state.paidCommands = [...state.paidCommands, updated];
        state.pendingCommands = state.pendingCommands.filter(c => c.id !== updated.id);
      })
      .addCase(validatePayment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // deleteCommand
      .addCase(deleteCommand.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteCommand.fulfilled, (state, action: PayloadAction<number>) => {
        state.status = 'idle';
        const id = action.payload;
        state.commands = state.commands.filter(c => c.id !== id);
        state.paidCommands = state.paidCommands.filter(c => c.id !== id);
        state.pendingCommands = state.pendingCommands.filter(c => c.id !== id);
      })
      .addCase(deleteCommand.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // fetchClients
      .addCase(fetchClients.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchClients.fulfilled, (state, action: PayloadAction<detailledClient[]>) => {
        state.status = 'idle';
        state.clients = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export default commandeSlice.reducer;