// src/redux/selectors/finance.selector.ts
import { type RootState } from '../store';

export const selectCompteResultat = (state: RootState) => state.finance.compteResultat;
export const selectBilanComptable = (state: RootState) => state.finance.bilanComptable;
export const selectAccount = (state: RootState) => state.finance.account;
export const selectTransactions = (state: RootState) => state.finance.transactions;
export const selectFinanceLoading = (state: RootState) => state.finance.loading;
export const selectFinanceError = (state: RootState) => state.finance.error;