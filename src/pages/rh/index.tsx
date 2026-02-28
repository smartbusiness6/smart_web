// src/pages/rh/RHScreen.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import {
  fetchAllUsers,
  // fetchAbsents,     // décommente si besoin
  // fetchPresents,
} from '../../redux/slices/rhSlices';
import {
  selectAllUsers as selectAllUsersSelector,
  selectUsersLoading as selectUsersLoadingSelector,
} from '../../redux/selectors/rh.selector';
import { useAuth } from '../../contexts/AuthContext';

// Icônes depuis react-icons (collection fa = Font Awesome)
import {
  FaUsers,
  FaMoneyBillWave,
  FaCalendarTimes,
  FaSearch,
  FaTimes,
  FaSyncAlt,
  FaUserPlus,
  FaChevronRight,
} from 'react-icons/fa';

import './index.css';

type FilterType = 'all' | 'admin' | 'employee';

export default function RHScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const users = useAppSelector(selectAllUsersSelector);
  const loading = useAppSelector(selectUsersLoadingSelector);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [errorAuth, setErrorAuth] = useState(false);

  // Vérification rôle ADMIN
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setErrorAuth(true);
    }
  }, [user]);

  // Chargement initial des données
  useEffect(() => {
    if (token && !errorAuth) {
      dispatch(fetchAllUsers(token));
    }
  }, [token, dispatch, errorAuth]);

  // Filtrage + calculs memo
  const { filteredUsers, totalSalary, onLeaveCount } = useMemo(() => {
    let list = users || [];

    // Filtre par rôle
    if (filter === 'admin') list = list.filter((u) => u.role === 'ADMIN');
    if (filter === 'employee') list = list.filter((u) => u.role !== 'ADMIN');

    // Recherche par nom
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      list = list.filter((u) => u.nom?.toLowerCase().includes(term));
    }

    const salarySum = list.reduce((sum, u) => sum + (u.profession?.salaire || 0), 0);
    const onLeave = list.filter((u) =>
      u.conges?.some((c) => new Date(c.dateFin) >= new Date())
    ).length;

    return {
      filteredUsers: list,
      totalSalary: salarySum,
      onLeaveCount: onLeave,
    };
  }, [users, filter, search]);

  const handleRefresh = () => {
    if (token) dispatch(fetchAllUsers(token));
  };

  if (loading) {
    return (
      <div className="rh-loading">
        <div className="spinner" />
        <p>Chargement de l'équipe...</p>
      </div>
    );
  }

  if (errorAuth) {
    return (
      <div className="rh-unauthorized">
        <h2>Accès restreint</h2>
        <p>Cette section est réservée aux administrateurs.</p>
        <button onClick={() => navigate('/')}>Retour à l'accueil</button>
      </div>
    );
  }

  return (
    <div className="rh-page">
      <header className="rh-header">
        <h1>Gestion RH</h1>
        <button className="btn-refresh" onClick={handleRefresh} title="Rafraîchir">
          <FaSyncAlt />
        </button>
      </header>

      <div className="stats-row">
        <div className="stat-card primary">
          <FaUsers className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{users?.length || 0}</span>
            <span className="stat-label">Collaborateurs</span>
          </div>
        </div>

        <div className="stat-card success">
          <FaMoneyBillWave className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{totalSalary.toLocaleString()} Ar</span>
            <span className="stat-label">Masse salariale</span>
          </div>
        </div>

        <div className="stat-card warning">
          <FaCalendarTimes className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{onLeaveCount}</span>
            <span className="stat-label">En congé</span>
          </div>
        </div>
      </div>

      <div className="controls-bar">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un collaborateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <FaTimes className="clear-btn" onClick={() => setSearch('')} />}
        </div>

        <div className="filter-group">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tous
          </button>
          <button
            className={`filter-btn ${filter === 'admin' ? 'active' : ''}`}
            onClick={() => setFilter('admin')}
          >
            Admins
          </button>
          <button
            className={`filter-btn ${filter === 'employee' ? 'active' : ''}`}
            onClick={() => setFilter('employee')}
          >
            Employés
          </button>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <FaSearch className="empty-icon" />
          <p>Aucun collaborateur ne correspond à votre recherche</p>
        </div>
      ) : (
        <div className="staff-grid">
          {filteredUsers.map((emp) => (
            <div
              key={emp.id}
              className="staff-card"
              onClick={() => navigate(`/rh/${emp.id}`)}
            >
              <div className="staff-avatar">
                {emp.nom?.charAt(0)?.toUpperCase() || '?'}
              </div>

              <div className="staff-main">
                <h3 className="staff-name">{emp.nom || '—'}</h3>
                <p className="staff-poste">{emp.profession?.poste || '—'}</p>
                <p className="staff-salary">
                  {emp.profession?.salaire?.toLocaleString() || '—'} Ar/mois
                </p>
              </div>

              <div className="staff-status">
                {emp.conges?.some((c) => new Date(c.dateFin) >= new Date()) && (
                  <span className="badge-conge">Congé</span>
                )}
                <FaChevronRight className="chevron" />
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="fab-add" onClick={() => navigate('/rh/add')}>
        <FaUserPlus />
      </button>
    </div>
  );
}