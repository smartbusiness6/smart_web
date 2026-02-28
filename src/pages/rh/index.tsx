// src/components/RHScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/store'; // Assumer le même hook Redux
import { selectAllUsers, selectUsersLoading } from '@/redux/selectors/user.selector';
import { fetchProfessions } from '@/redux/slices/professionSlice';
import { fetchUsers } from '@/redux/slices/userSlice';
import { useAuth } from '../AuthContext'; // Assumer le même contexte Auth
import { useNavigate } from 'react-router-dom'; // Pour la navigation web
import PeopleIcon from '@mui/icons-material/People'; // Icons Material-UI pour web
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import './rh.css'; // Importer le CSS

type FilterType = 'all' | 'admin' | 'simple';

const UnauthorizedModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  if (!visible) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Accès non autorisé</h2>
        <p>Vous devez être administrateur pour accéder à cette page.</p>
        <button onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
};

export default function RHScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const users = useAppSelector(selectAllUsers);
  const loading = useAppSelector(selectUsersLoading);
  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const conges = useAppSelector((state) => state.conges); // Assumer le slice conges existe
  const professions = useAppSelector((state) => state.professions);
  const [errorAuthorization, setErrorAuthorization] = useState(false);
  const navigate = useNavigate();

  // Vérification ADMIN
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setErrorAuthorization(true);
    }
  }, [user]);

  // Chargement des données
  useEffect(() => {
    if (user?.token) {
      dispatch(fetchProfessions(user.token));
      dispatch(fetchUsers(user.token));
    }
  }, [user?.token, dispatch]);

  // Calculs memoized
  const { masseSalariale, enConge, filteredData } = useMemo(() => {
    let filtered = users;

    // Filtre par rôle
    if (activeFilter === 'admin') filtered = filtered.filter((u) => u.role === 'ADMIN');
    if (activeFilter === 'simple') filtered = filtered.filter((u) => u.role !== 'ADMIN');

    // Recherche par nom
    if (searchValue) {
      filtered = filtered.filter((u) => u.nom.toLowerCase().includes(searchValue.toLowerCase()));
    }

    const masse = filtered.reduce((sum, u) => sum + u.profession.salaire, 0);
    const congesCount = filtered.filter((u) => u.conges.some((c) => new Date(c.dateFin) >= new Date())).length;

    return {
      masseSalariale: masse,
      enConge: congesCount,
      filteredData: filtered,
    };
  }, [users, activeFilter, searchValue]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.token) {
      await Promise.all([
        dispatch(fetchUsers(user.token)),
        dispatch(fetchProfessions(user.token)),
      ]);
    }
    setRefreshing(false);
  };

  const navigateToAdd = () => navigate('/rh/add');
  const navigateToDetail = (userId: number) => navigate(`/rh/${userId}`);
  const navigateToProfessions = () => navigate('/profession/list');

  if (loading || refreshing) {
    return (
      <div className="loading-container">
        <div className="spinner" /> {/* Simple spinner CSS */}
        <p className="loading-text">Chargement des employés...</p>
      </div>
    );
  }

  return (
    <div className="rh-container">
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <PeopleIcon className="stat-icon" />
          <p className="stat-number">{users.length}</p>
          <p className="stat-label">Effectif total</p>
        </div>
        <div className="stat-card stat-card-success">
          <AccountBalanceWalletIcon className="stat-icon" />
          <p className="stat-number">{masseSalariale.toLocaleString()} Ar</p>
          <p className="stat-label">Masse salariale</p>
        </div>
        <div className="stat-card stat-card-warning">
          <EventBusyIcon className="stat-icon" />
          <p className="stat-number">{conges.conges.length}</p> {/* Adapter si nécessaire */}
          <p className="stat-label">En congé</p>
        </div>
        <div className="stat-card stat-card-warning clickable" onClick={navigateToProfessions}>
          <EventBusyIcon className="stat-icon" />
          <p className="stat-number">{professions.ids.length}</p>
          <p className="stat-label">Professions</p>
        </div>
      </div>

      <div className="search-container">
        <div className="search-box">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher un employé..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          {searchValue.length > 0 && (
            <ClearIcon className="clear-icon" onClick={() => setSearchValue('')} />
          )}
        </div>
      </div>

      <div className="filter-container">
        <button
          className={`filter-chip ${activeFilter === 'all' ? 'active-chip' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          Tous
        </button>
        <button
          className={`filter-chip ${activeFilter === 'admin' ? 'active-chip' : ''}`}
          onClick={() => setActiveFilter('admin')}
        >
          Admins
        </button>
        <button
          className={`filter-chip ${activeFilter === 'simple' ? 'active-chip' : ''}`}
          onClick={() => setActiveFilter('simple')}
        >
          Employés
        </button>
      </div>

      <div className="list">
        {filteredData.length === 0 ? (
          <div className="empty-state">
            <SearchIcon className="empty-icon" />
            <p className="empty-text">Aucun employé trouvé</p>
          </div>
        ) : (
          filteredData.map((emp) => (
            <div
              key={emp.id}
              className="employee-card"
              onClick={() => navigateToDetail(emp.id)}
            >
              <div className="employee-info">
                <div className="avatar">
                  <span className="avatar-text">{emp.nom.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="employee-name">{emp.nom}</p>
                  <p className="employee-role">{emp.profession.poste}</p>
                  <p className="employee-salary">
                    {emp.profession.salaire.toLocaleString()} Ar/mois
                  </p>
                </div>
              </div>
              <div className="employee-right">
                {emp.conges.some((c) => new Date(c.dateFin) >= new Date()) && (
                  <div className="leave-badge">
                    <EventBusyIcon className="leave-icon" />
                    <span className="leave-text">Congé</span>
                  </div>
                )}
                <ChevronRightIcon className="chevron-icon" />
              </div>
            </div>
          ))
        )}
      </div>

      <UnauthorizedModal
        visible={errorAuthorization}
        onClose={() => {
          setErrorAuthorization(false);
          navigate('/');
        }}
      />

      <button className="fab" onClick={navigateToAdd}>
        <PersonAddIcon className="fab-icon" />
      </button>

      <button className="refresh-button" onClick={onRefresh}>
        Rafraîchir
      </button>
    </div>
  );
}