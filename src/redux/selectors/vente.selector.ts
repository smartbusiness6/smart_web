// src/redux/selectors/ventes.selector.ts

import { type RootState } from '../store';

export const selectAllCommands = (state: RootState) => state.vente.commands;
export const selectPaidCommands = (state: RootState) => state.vente.paidCommands;
export const selectPendingCommands = (state: RootState) => state.vente.pendingCommands;
export const selectCommandsLoading = (state: RootState) => state.vente.status === 'loading';
export const selectCommandsError = (state: RootState) => state.vente.error;