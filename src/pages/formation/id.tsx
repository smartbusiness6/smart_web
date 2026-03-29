// src/pages/formations/[id].tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../config/ApiConfig';
import './id.css';

// Types
interface Formation {
  id: number;
  titre: string;
  description: string | null;
  miniature: string | null;
  dureeMinutes: number;
  estPublique: boolean;
  idEntreprise: number | null;
  createdAt: string;
  updatedAt: string;
  lecons: Lecon[];
  suivi?: SuiviFormation;
}

interface Lecon {
  id: number;
  idFormation: number;
  titre: string;
  ordre: number;
  format: 'TEXTE' | 'VIDEO' | 'IMAGE';
  contenuTexte: string | null;
  urlVideo: string | null;
  urlImage: string | null;
  paragraphes: Paragraphe[];
}

interface Paragraphe {
  id: number;
  titre: string;
  texte: string;
  fichierMedia: string;
  idLecon: number;
}

interface SuiviFormation {
  id: number;
  idUtilisateur: number;
  idFormation: number;
  statut: 'NON_COMMENCE' | 'EN_COURS' | 'TERMINE' | 'CERTIFIE';
  progressionPourcent: number;
  tempsPasseSecondes: number;
  derniereLecon: number;
  dateDebut: string | null;
  dateCompletion: string | null;
  certificatDelivre: boolean;
  lienCertificat: string | null;
}

// Icônes
const IconClock = () => <span className="icon">⏱️</span>;
const IconVideo = () => <span className="icon">📹</span>;
const IconText = () => <span className="icon">📝</span>;
const IconImage = () => <span className="icon">🖼️</span>;
const IconCheck = () => <span className="icon">✓</span>;
const IconPlay = () => <span className="icon">▶️</span>;
const IconLock = () => <span className="icon">🔒</span>;
const IconUnlock = () => <span className="icon">🔓</span>;
const IconArrowLeft = () => <span className="icon">←</span>;
const IconBook = () => <span className="icon">📖</span>;
const IconCertificate = () => <span className="icon">🏆</span>;
const IconLoading = () => <span className="icon loading">⏳</span>;

export default function DetailedFormationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, isAuthenticated, logout } = useAuth();
  
  // États
  const [formation, setFormation] = useState<Formation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [activeLecon, setActiveLecon] = useState<number>(0);
  const [expandedLecons, setExpandedLecons] = useState<number[]>([]);

  // Gestion de session expirée
  useEffect(() => {
    if (sessionExpired) {
      const timer = setTimeout(() => {
        logout();
        navigate('/login', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [sessionExpired, logout, navigate]);

  // Charger la formation
  useEffect(() => {
    loadFormation();
  }, [id]);

  const loadFormation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BASE_URL}/formation/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement de la formation');
      }

      const data = await response.json();
      setFormation(data);
      
      // Si l'utilisateur est connecté, vérifier son suivi
      if (isAuthenticated && token) {
        await checkSubscription(data.id);
      }
      
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message || 'Erreur lors du chargement de la formation');
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async (formationId: number) => {
    try {
      const response = await fetch(`${BASE_URL}/formation/suivi/${formationId}/check`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        setSessionExpired(true);
        return;
      }

      if (response.ok) {
        const result = await response.json();
        if (result.subscribed) {
          // Récupérer le suivi complet
          await loadFollowedFormation(formationId);
        }
      }
    } catch (err) {
      console.error('Erreur lors de la vérification:', err);
    }
  };

  const loadFollowedFormation = async (formationId: number) => {
    try {
      const response = await fetch(`${BASE_URL}/formation/suivi`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const formations = await response.json();
        const followed = formations.find((f: any) => f.id === formationId);
        if (followed && followed.suivi) {
          setFormation(prev => prev ? { ...prev, suivi: followed.suivi } : null);
          // Définir la dernière leçon active
          if (followed.suivi.derniereLecon > 0) {
            setActiveLecon(followed.suivi.derniereLecon);
          }
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      setError('Veuillez vous connecter pour vous inscrire');
      return;
    }

    setSubscribing(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/formation/suivi`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idFormation: Number(id) }),
      });

      if (response.status === 401) {
        setSessionExpired(true);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'inscription');
      }

      const suivi = await response.json();
      setFormation(prev => prev ? { ...prev, suivi } : null);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir vous désinscrire de cette formation ?')) {
      return;
    }

    setUnsubscribing(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/formations/suivi/${id}`, {
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

      setFormation(prev => prev ? { ...prev, suivi: undefined } : null);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUnsubscribing(false);
    }
  };

  const handleStartLearning = () => {
    if (!formation) return;
    
    // Rediriger vers la page d'apprentissage
    navigate(`/formations/${id}/enroll`);
  };

  const handleContinueLearning = () => {
    if (!formation) return;
    
    // Rediriger vers la page d'apprentissage
    navigate(`/formations/${id}/enroll`);
  };

  const toggleLecon = (leconIndex: number) => {
    setExpandedLecons(prev => 
      prev.includes(leconIndex) 
        ? prev.filter(i => i !== leconIndex)
        : [...prev, leconIndex]
    );
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'VIDEO':
        return <IconVideo />;
      case 'IMAGE':
        return <IconImage />;
      default:
        return <IconText />;
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'NON_COMMENCE':
        return <span className="badge badge-secondary">Non commencé</span>;
      case 'EN_COURS':
        return <span className="badge badge-primary">En cours</span>;
      case 'TERMINE':
        return <span className="badge badge-success">Terminé</span>;
      case 'CERTIFIE':
        return <span className="badge badge-certified">Certifié</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="formation-detail-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement de la formation...</p>
        </div>
      </div>
    );
  }

  if (error || !formation) {
    return (
      <div className="formation-detail-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Erreur</h2>
          <p>{error || 'Formation non trouvée'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/formations')}>
            Retour aux formations
          </button>
        </div>
      </div>
    );
  }

  const isSubscribed = !!formation.suivi;
  const suivi = formation.suivi;
  const progress = suivi?.progressionPourcent || 0;
  const isCompleted = progress >= 100;

  return (
    <div className="formation-detail-page">
      <div className="formation-detail-container">
        {/* Header avec retour */}
        <div className="detail-header">
          <button className="back-button" onClick={() => navigate('/formations')}>
            <IconArrowLeft /> Retour
          </button>
        </div>

        {/* Image de couverture */}
        <div className="formation-cover">
          {formation.miniature ? (
            <img src={formation.miniature} alt={formation.titre} />
          ) : (
            <div className="cover-placeholder">
              <IconBook />
            </div>
          )}
          {isSubscribed && (
            <div className="progress-overlay">
              <div className="progress-circle">
                <svg viewBox="0 0 36 36">
                  <path
                    className="progress-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="progress-fill"
                    strokeDasharray={`${progress}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" className="progress-text">{progress}%</text>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Contenu principal */}
        <div className="formation-content">
          <div className="formation-info">
            <h1 className="formation-title">{formation.titre}</h1>
            
            <div className="formation-meta">
              <span className="meta-item">
                <IconClock /> {formatDuration(formation.dureeMinutes)}
              </span>
              <span className="meta-item">
                {getFormatIcon(formation.lecons[0]?.format || 'TEXTE')}
                {formation.lecons.length} leçon{formation.lecons.length > 1 ? 's' : ''}
              </span>
              {!formation.estPublique && (
                <span className="meta-item private">
                  <IconLock /> Privée
                </span>
              )}
              {isSubscribed && suivi && getStatutBadge(suivi.statut)}
            </div>

            <div className="formation-description">
              <h3>Description</h3>
              <p>{formation.description || 'Aucune description disponible'}</p>
            </div>

            {/* Progression détaillée */}
            {isSubscribed && suivi && (
              <div className="progress-detail">
                <h3>Ma progression</h3>
                <div className="progress-bar-large">
                  <div 
                    className="progress-fill-large" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="progress-stats-detail">
                  <span>Temps passé: {Math.floor(suivi.tempsPasseSecondes / 60)} minutes</span>
                  <span>Leçon: {suivi.derniereLecon} / {formation.lecons.length}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="formation-actions-detail">
              {!isSubscribed ? (
                <button 
                  className="btn btn-success btn-large"
                  onClick={handleSubscribe}
                  disabled={subscribing}
                >
                  {subscribing ? 'Inscription...' : "S'inscrire à la formation"}
                </button>
              ) : (
                <div className="actions-group">
                  <button 
                    className="btn btn-primary btn-large"
                    onClick={isCompleted ? handleStartLearning : handleContinueLearning}
                  >
                    <IconPlay /> 
                    {isCompleted ? 'Voir la formation' : progress > 0 ? 'Continuer' : 'Commencer'}
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={handleUnsubscribe}
                    disabled={unsubscribing}
                  >
                    {unsubscribing ? 'Désinscription...' : 'Se désinscrire'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Programme de la formation */}
          <div className="formation-program">
            <h2>Programme de la formation</h2>
            <div className="lecons-list">
              {formation.lecons.map((lecon, index) => (
                <div 
                  key={lecon.id} 
                  className={`lecon-item ${expandedLecons.includes(index) ? 'expanded' : ''}`}
                >
                  <div 
                    className="lecon-header"
                    onClick={() => toggleLecon(index)}
                  >
                    <div className="lecon-number">{index + 1}</div>
                    <div className="lecon-info">
                      <h4>{lecon.titre}</h4>
                      <div className="lecon-meta">
                        {getFormatIcon(lecon.format)}
                        {lecon.paragraphes.length} paragraphe{lecon.paragraphes.length > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="lecon-expand">
                      {expandedLecons.includes(index) ? '−' : '+'}
                    </div>
                  </div>
                  {expandedLecons.includes(index) && (
                    <div className="lecon-content">
                      {lecon.format === 'TEXTE' && lecon.contenuTexte && (
                        <div className="lecon-texte">
                          <p>{lecon.contenuTexte.substring(0, 200)}...</p>
                        </div>
                      )}
                      {lecon.format === 'VIDEO' && lecon.urlVideo && (
                        <div className="lecon-video-preview">
                          <div className="video-placeholder">
                            <IconVideo />
                            <span>Vidéo: {lecon.titre}</span>
                          </div>
                        </div>
                      )}
                      {lecon.format === 'IMAGE' && lecon.urlImage && (
                        <div className="lecon-image-preview">
                          <img src={lecon.urlImage} alt={lecon.titre} />
                        </div>
                      )}
                      <div className="lecon-paragraphes">
                        <p className="paragraphe-count">
                          {lecon.paragraphes.length} paragraphe{lecon.paragraphes.length > 1 ? 's' : ''} à découvrir
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section certification */}
          {suivi?.certificatDelivre && suivi.lienCertificat && (
            <div className="certification-section">
              <div className="certification-card">
                <IconCertificate />
                <h3>Certification obtenue !</h3>
                <p>Félicitations ! Vous avez complété cette formation avec succès.</p>
                <a 
                  href={suivi.lienCertificat} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-certified"
                >
                  Télécharger mon certificat
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}