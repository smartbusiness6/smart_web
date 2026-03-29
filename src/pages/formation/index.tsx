// src/pages/formations/index.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../config/ApiConfig';
import './index.css';
import type { Formation, SuiviFormation } from '../../models';

// Icônes SVG modernes
const IconClock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconVideo = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <polygon points="22 8 18 12 22 16 22 8" />
  </svg>
);

const IconText = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 7h16M4 12h16M4 17h10" />
  </svg>
);

const IconImage = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <path d="M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
    <path d="M21 15l-5-4-3 3-4-4-5 5" />
  </svg>
);

const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconPlay = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const IconLock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function FormationPage() {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, logout } = useAuth();
  
  const [followedFormations, setFollowedFormations] = useState<Formation[]>([]);
  const [publicFormations, setPublicFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribingId, setSubscribingId] = useState<number | null>(null);
  const [unsubscribingId, setUnsubscribingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (sessionExpired) {
      const timer = setTimeout(() => {
        logout();
        navigate('/login', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [sessionExpired, logout, navigate]);

  useEffect(() => {
    loadFormations();
  }, [token, isAuthenticated]);

  const loadFormations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (isAuthenticated && token) {
        const followedResponse = await fetch(`${BASE_URL}/formation/entreprise/${user?.profession.idEntreprise}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (followedResponse.status === 401) {
          setSessionExpired(true);
          return;
        }

        if (followedResponse.ok) {
          const followedData = await followedResponse.json();
          setFollowedFormations(followedData);
        }
      }
      
      const publicResponse = await fetch(`${BASE_URL}/formation/public`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (publicResponse.ok) {
        const publicData = await publicResponse.json();
        setPublicFormations(publicData);
      } else {
        throw new Error('Erreur lors du chargement des formations publiques');
      }
      
    } catch (err: any) {
      console.error('Erreur lors du chargement:', err);
      setError(err.message || 'Erreur lors du chargement des formations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (formationId: number) => {
    if (!isAuthenticated || !token) {
      setError('Veuillez vous connecter pour vous inscrire à une formation');
      return;
    }
    
    setSubscribingId(formationId);
    setError(null);
    
    try {
      const response = await fetch(`${BASE_URL}/formations/suivi`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idFormation: formationId }),
      });

      if (response.status === 401) {
        setSessionExpired(true);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'inscription');
      }

      setSuccessMessage('Inscription réussie !');
      await loadFormations();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setSubscribingId(null);
    }
  };

  const handleUnsubscribe = async (formationId: number) => {
    if (!token) return;
    
    if (!window.confirm('Êtes-vous sûr de vouloir vous désinscrire de cette formation ?')) {
      return;
    }
    
    setUnsubscribingId(formationId);
    setError(null);
    
    try {
      const response = await fetch(`${BASE_URL}/formations/suivi/${formationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        setSessionExpired(true);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la désinscription');
      }

      setSuccessMessage('Désinscription réussie !');
      await loadFormations();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la désinscription');
    } finally {
      setUnsubscribingId(null);
    }
  };

  const handleViewFormation = (formationId: number) => {
    navigate(`/formation/${formationId}`);
  };

  const handleContinueLearning = (formationId: number) => {
    navigate(`/formation/${formationId}`);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
  };

  const getFormatIcon = (format?: string) => {
    switch (format) {
      case 'VIDEO':
        return <IconVideo />;
      case 'IMAGE':
        return <IconImage />;
      default:
        return <IconText />;
    }
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return 'completed';
    if (progress >= 75) return 'high';
    if (progress >= 50) return 'medium';
    if (progress >= 25) return 'low';
    return 'very-low';
  };

  const FormationCard = ({ 
    formation, 
    isFollowed = false, 
    suivi 
  }: { 
    formation: Formation; 
    isFollowed?: boolean; 
    suivi?: SuiviFormation;
  }) => {
    const isSubscribing = subscribingId === formation.id;
    const isUnsubscribing = unsubscribingId === formation.id;
    const progress = suivi?.progressionPourcent || 0;
    
    return (
      <div className="formation-card">
        <div className="formation-card-image">
          {formation.miniature ? (
            <img src={formation.miniature} alt={formation.titre} />
          ) : (
            <div className="image-placeholder">
              <span>📚</span>
            </div>
          )}
          {isFollowed && (
            <div className="formation-progress-badge">
              {progress}%
            </div>
          )}
        </div>
        
        <div className="formation-card-content">
          <h3 className="formation-title">{formation.titre}</h3>
          
          <p className="formation-description">
            {formation.description || 'Aucune description disponible'}
          </p>
          
          <div className="formation-meta">
            <span className="meta-item">
              <IconClock />
              {formatDuration(formation.dureeMinutes)}
            </span>
            {formation.lecons && formation.lecons.length > 0 && (
              <span className="meta-item">
                {getFormatIcon(formation.lecons[0]?.format)}
                {formation.lecons.length} leçon{formation.lecons.length > 1 ? 's' : ''}
              </span>
            )}
            {!formation.estPublique && (
              <span className="meta-item private">
                <IconLock />
                Privée
              </span>
            )}
          </div>
          
          {isFollowed && suivi && (
            <div className="formation-progress">
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${getProgressColor(progress)}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="progress-stats">
                <span>Progression: {progress}%</span>
                {suivi.statut === 'CERTIFIE' && (
                  <span className="certified-badge">
                    <IconCheck /> Certifié
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="formation-actions">
            {isFollowed ? (
              <>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleContinueLearning(formation.id)}
                >
                  <IconPlay /> Continuer
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleUnsubscribe(formation.id)}
                  disabled={isUnsubscribing}
                >
                  {isUnsubscribing ? '...' : 'Se désinscrire'}
                </button>
              </>
            ) : (
              <>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleViewFormation(formation.id)}
                >
                  Détails
                </button>
                {isAuthenticated && (
                  <button 
                    className="btn btn-success"
                    onClick={() => handleSubscribe(formation.id)}
                    disabled={isSubscribing}
                  >
                    {isSubscribing ? '...' : "S'inscrire"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (sessionExpired) {
    return (
      <div className="formations-page">
        <div className="session-expired-container">
          <div className="session-expired-card">
            <span className="icon-warning">⚠️</span>
            <h2>Session expirée</h2>
            <p>Votre session a expiré. Redirection...</p>
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="formations-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des formations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="formations-page">
      <div className="formations-container">
        {successMessage && (
          <div className="alert alert-success">
            {successMessage}
            <button className="alert-close" onClick={() => setSuccessMessage(null)}>×</button>
          </div>
        )}
        
        {error && (
          <div className="alert alert-error">
            {error}
            <button className="alert-close" onClick={() => setError(null)}>×</button>
          </div>
        )}
        
        {isAuthenticated && (
          <section className="formations-section">
            <div className="section-header">
              <h2>Mes formations suivies</h2>
              <span className="section-count">{followedFormations.length}</span>
            </div>
            
            {followedFormations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📖</div>
                <p>Aucune formation suivie</p>
                <p className="empty-hint">Explorez les formations ci-dessous !</p>
              </div>
            ) : (
              <div className="formations-grid">
                {followedFormations.map(formation => (
                  <FormationCard 
                    key={formation.id} 
                    formation={formation} 
                    isFollowed={true}
                    suivi={formation.suivi}
                  />
                ))}
              </div>
            )}
          </section>
        )}
        
        <section className="formations-section">
          <div className="section-header">
            <h2>Formations disponibles</h2>
            <span className="section-count">{publicFormations.length}</span>
          </div>
          
          {publicFormations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎓</div>
              <p>Aucune formation disponible</p>
              <p className="empty-hint">Revenez plus tard !</p>
            </div>
          ) : (
            <div className="formations-grid">
              {publicFormations.map(formation => {
                const isFollowed = followedFormations.some(f => f.id === formation.id);
                const suivi = formation.suivi;
                return (
                  <FormationCard 
                    key={formation.id} 
                    formation={formation}
                    isFollowed={isFollowed}
                    suivi={suivi}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}