// src/redux/selectors/rh.selector.ts
import  type{ RootState } from '../store';

export const selectAllUsers = (state: RootState) => state.rh.users;
export const selectUser = (state: RootState) => state.rh.user;
export const selectAbsents = (state: RootState) => state.rh.absents;
export const selectPresents = (state: RootState) => state.rh.presents;
export const selectUsersLoading = (state: RootState) => state.rh.status === 'loading';
export const selectUsersError = (state: RootState) => state.rh.error;