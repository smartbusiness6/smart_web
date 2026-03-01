// src/redux/selectors/stock.selector.ts
import { type RootState } from '../store';

export const selectAllProducts = (state: RootState) => state.stock.products;
export const selectStockLoading = (state: RootState) => state.stock.status === 'loading';
export const selectStockError = (state: RootState) => state.stock.error;
export const selectAddStatus = (state: RootState) => state.stock.addStatus;
export const selectAddSuccess = (state: RootState) => state.stock.addSuccess;
export const selectIsAdding = (state: RootState) => state.stock.addStatus === 'adding';