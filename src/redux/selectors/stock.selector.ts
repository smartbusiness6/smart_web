// src/redux/selectors/stock.selector.ts
import { type RootState } from '../store';

export const selectAllProducts = (state: RootState) => state.stock.products;
export const selectStockLoading = (state: RootState) => state.stock.status === 'loading';
export const selectStockError = (state: RootState) => state.stock.error;