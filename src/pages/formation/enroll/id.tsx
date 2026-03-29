// src/pages/formations/[id]/enroll.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import BASE_URL from '../../../config/ApiConfig';
import './id.css';

// Types basés sur la structure Prisma
interface Formation {
  id: number;
  titre: string;
  description: string | null;
  miniature: string | null;
  dureeMinutes: number;
  lecons: Lecon[];
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
  progressionPourcent: number;
  tempsPasseSecondes: number;
  derniereLecon: number;
  statut: 'NON_COMMENCE' | 'EN_COURS' | 'TERMINE' | 'CERTIFIE';
}

// Icônes
const IconVideo = () => <span className="icon">📹</span>;
const IconText = () => <span className="icon">📝</span>;
const IconImage = () => <span className="icon">🖼️</span>;
const IconPlay = () => <span className="icon">▶️</span>;
const IconCheck = () => <span className="icon">✓</span>;
const IconArrowLeft = () => <span className="icon">←</span>;
const IconBook = () => <span className="icon">📖</span>;
const IconDocument = () => <span className="icon">📄</span>;
const IconDownload = () => <span className="icon">⬇️</span>;

export default function EnrollFormationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, isAuthenticated, logout } = useAuth();
  
  // États
  const [formation, setFormation] = useState<Formation | null>(null);
  const [suivi, setSuivi] = useState<SuiviFormation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLecon, setSelectedLecon] = useState<Lecon | null>(null);
  const [selectedParagraphe, setSelectedParagraphe] = useState<Paragraphe | null>(null);
  const [expandedParagraphes, setExpandedParagraphes] = useState<number[]>([]);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(false);

  // Timer pour suivre le temps passé
  const [startTime, setStartTime] = useState<number>(Date.now());

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

  // Charger la formation et le suivi
  useEffect(() => {
    loadFormation();
  }, [id]);

  // Timer pour mettre à jour le temps passé
  useEffect(() => {
    const interval = setInterval(() => {
      if (updateProgress && suivi && formation) {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        if (elapsedSeconds >= 30) { // Mettre à jour toutes les 30 secondes
          updateTimeSpent();
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [updateProgress, startTime, suivi]);

  const loadFormation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Charger la formation avec ses leçons et paragraphes
      const response = await fetch(`${BASE_URL}/formations/${id}`, {
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
      
      // Si l'utilisateur est connecté, charger son suivi
      if (isAuthenticated && token) {
        await loadSuivi(data.id);
      }
      
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message || 'Erreur lors du chargement de la formation');
    } finally {
      setLoading(false);
    }
  };

  const loadSuivi = async (formationId: number) => {
    try {
      const response = await fetch(`${BASE_URL}/formations/suivies`, {
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
        const formations = await response.json();
        const followed = formations.find((f: any) => f.id === formationId);
        if (followed && followed.suivi) {
          setSuivi(followed.suivi);
          
          // Charger la dernière leçon vue
          const lastLeconIndex = followed.suivi.derniereLecon;
          if (lastLeconIndex > 0 && formation?.lecons) {
            const leconToLoad = formation.lecons.find(l => l.ordre === lastLeconIndex);
            if (leconToLoad) {
              setSelectedLecon(leconToLoad);
              if (leconToLoad.paragraphes.length > 0) {
                setSelectedParagraphe(leconToLoad.paragraphes[0]);
              }
            }
          } else if (formation?.lecons && formation.lecons.length > 0) {
            // Charger la première leçon par défaut
            setSelectedLecon(formation.lecons[0]);
            if (formation.lecons[0].paragraphes.length > 0) {
              setSelectedParagraphe(formation.lecons[0].paragraphes[0]);
            }
          }
          
          setUpdateProgress(true);
          setStartTime(Date.now());
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement du suivi:', err);
    }
  };

  const updateTimeSpent = async () => {
    if (!suivi || !formation || !selectedLecon) return;
    
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const newTotalSeconds = suivi.tempsPasseSecondes + elapsedSeconds;
    
    try {
      const response = await fetch(`${BASE_URL}/formations/suivi/${formation.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tempsPasseSecondes: newTotalSeconds,
          derniereLecon: selectedLecon.ordre,
          statut: 'EN_COURS'
        }),
      });

      if (response.ok) {
        setSuivi(prev => prev ? {
          ...prev,
          tempsPasseSecondes: newTotalSeconds,
          derniereLecon: selectedLecon.ordre
        } : null);
        setStartTime(Date.now());
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du temps:', err);
    }
  };

  const updateLeconProgress = async (leconOrdre: number) => {
    if (!suivi || !formation) return;
    
    // Calculer la progression
    const totalLecons = formation.lecons.length;
    const leconsVues = leconOrdre;
    const progression = Math.round((leconsVues / totalLecons) * 100);
    
    try {
      const response = await fetch(`${BASE_URL}/formations/suivi/${formation.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progressionPourcent: progression,
          derniereLecon: leconOrdre,
          statut: progression >= 100 ? 'TERMINE' : 'EN_COURS'
        }),
      });

      if (response.ok) {
        setSuivi(prev => prev ? {
          ...prev,
          progressionPourcent: progression,
          derniereLecon: leconOrdre,
          statut: progression >= 100 ? 'TERMINE' : 'EN_COURS'
        } : null);
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la progression:', err);
    }
  };

  const handleSelectLecon = (lecon: Lecon) => {
    setSelectedLecon(lecon);
    setSelectedParagraphe(lecon.paragraphes.length > 0 ? lecon.paragraphes[0] : null);
    setExpandedParagraphes([]);
    
    // Mettre à jour la progression
    if (suivi && lecon.ordre > (suivi.derniereLecon || 0)) {
      updateLeconProgress(lecon.ordre);
    }
    
    // Réinitialiser le timer
    setStartTime(Date.now());
  };

  const handleSelectParagraphe = (paragraphe: Paragraphe) => {
    setSelectedParagraphe(paragraphe);
  };

  const toggleParagraphe = (paragrapheId: number) => {
    setExpandedParagraphes(prev =>
      prev.includes(paragrapheId)
        ? prev.filter(id => id !== paragrapheId)
        : [...prev, paragrapheId]
    );
  };

  const handleDownloadMedia = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const renderLeconContent = () => {
    if (!selectedLecon) return null;

    switch (selectedLecon.format) {
      case 'TEXTE':
        return (
          <div className="lecon-text-content">
            {selectedLecon.contenuTexte ? (
              <div 
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: selectedLecon.contenuTexte }}
              />
            ) : (
              <p className="no-content">Aucun contenu texte disponible</p>
            )}
          </div>
        );

      case 'VIDEO':
        return (
          <div className="lecon-video-content">
            {selectedLecon.urlVideo ? (
              <video 
                controls 
                className="video-player"
                onTimeUpdate={(e) => {
                  // Optionnel: suivre la progression vidéo
                }}
              >
                <source src={selectedLecon.urlVideo} type="video/mp4" />
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            ) : (
              <p className="no-content">Aucune vidéo disponible</p>
            )}
          </div>
        );

      case 'IMAGE':
        return (
          <div className="lecon-image-content">
            {selectedLecon.urlImage ? (
              <img 
                src={selectedLecon.urlImage} 
                alt={selectedLecon.titre}
                className="image-full"
              />
            ) : (
              <p className="no-content">Aucune image disponible</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="enroll-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement de la formation...</p>
        </div>
      </div>
    );
  }

  if (error || !formation) {
    return (
      <div className="enroll-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Erreur</h2>
          <p>{error || 'Formation non trouvée'}</p>
          <button className="btn btn-primary" onClick={() => navigate(`/formations/${id}`)}>
            Retour à la formation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="enroll-page">
      <div className="enroll-container">
        {/* Header */}
        <div className="enroll-header">
          <button className="back-button" onClick={() => navigate(`/formations/${id}`)}>
            <IconArrowLeft /> Retour
          </button>
          <h1>{formation.titre}</h1>
          {suivi && (
            <div className="progress-info">
              <div className="progress-bar-small">
                <div 
                  className="progress-fill-small" 
                  style={{ width: `${suivi.progressionPourcent}%` }}
                />
              </div>
              <span className="progress-text">{suivi.progressionPourcent}%</span>
              <span className="time-spent">
                Temps: {formatDuration(suivi.tempsPasseSecondes)}
              </span>
            </div>
          )}
        </div>

        <div className="enroll-layout">
          {/* Sidebar - Liste des leçons */}
          <aside className="lecons-sidebar">
            <h3>Programme</h3>
            <div className="lecons-list">
              {formation.lecons.map((lecon) => (
                <div
                  key={lecon.id}
                  className={`lecon-sidebar-item ${selectedLecon?.id === lecon.id ? 'active' : ''}`}
                  onClick={() => handleSelectLecon(lecon)}
                >
                  <div className="lecon-sidebar-icon">
                    {getFormatIcon(lecon.format)}
                  </div>
                  <div className="lecon-sidebar-info">
                    <div className="lecon-sidebar-title">
                      {lecon.ordre}. {lecon.titre}
                    </div>
                    <div className="lecon-sidebar-meta">
                      {lecon.paragraphes.length} paragraphe{lecon.paragraphes.length > 1 ? 's' : ''}
                    </div>
                  </div>
                  {suivi && suivi.derniereLecon >= lecon.ordre && (
                    <IconCheck />
                  )}
                </div>
              ))}
            </div>
          </aside>

          {/* Main content - Leçon et paragraphes */}
          <main className="lecon-main">
            {selectedLecon ? (
              <>
                <div className="lecon-header-main">
                  <h2>{selectedLecon.titre}</h2>
                  <div className="lecon-format-badge">
                    {getFormatIcon(selectedLecon.format)}
                    {selectedLecon.format === 'TEXTE' && 'Texte'}
                    {selectedLecon.format === 'VIDEO' && 'Vidéo'}
                    {selectedLecon.format === 'IMAGE' && 'Image'}
                  </div>
                </div>

                {/* Contenu principal de la leçon */}
                <div className="lecon-main-content">
                  {renderLeconContent()}
                </div>

                {/* Paragraphes */}
                {selectedLecon.paragraphes.length > 0 && (
                  <div className="paragraphes-section">
                    <h3>Paragraphes associés</h3>
                    <div className="paragraphes-list">
                      {selectedLecon.paragraphes.map((paragraphe) => (
                        <div
                          key={paragraphe.id}
                          className={`paragraphe-card ${selectedParagraphe?.id === paragraphe.id ? 'active' : ''}`}
                          onClick={() => handleSelectParagraphe(paragraphe)}
                        >
                          <div className="paragraphe-header">
                            <h4>{paragraphe.titre}</h4>
                            {paragraphe.fichierMedia && (
                              <button
                                className="btn-icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadMedia(paragraphe.fichierMedia, paragraphe.titre);
                                }}
                              >
                                <IconDownload />
                              </button>
                            )}
                          </div>
                          <div className="paragraphe-preview">
                            {paragraphe.texte.substring(0, 100)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paragraphe sélectionné */}
                {selectedParagraphe && (
                  <div className="paragraphe-detail">
                    <div className="paragraphe-detail-header">
                      <h3>{selectedParagraphe.titre}</h3>
                      {selectedParagraphe.fichierMedia && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleDownloadMedia(selectedParagraphe.fichierMedia, selectedParagraphe.titre)}
                        >
                          <IconDownload /> Télécharger le média
                        </button>
                      )}
                    </div>
                    <div className="paragraphe-detail-content">
                      <div className="paragraphe-text">
                        {selectedParagraphe.texte}
                      </div>
                      {selectedParagraphe.fichierMedia && (
                        <div className="paragraphe-media">
                          {selectedParagraphe.fichierMedia.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img 
                              src={selectedParagraphe.fichierMedia} 
                              alt={selectedParagraphe.titre}
                              className="media-image"
                            />
                          ) : selectedParagraphe.fichierMedia.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video 
                              controls 
                              className="media-video"
                              src={selectedParagraphe.fichierMedia}
                            />
                          ) : (
                            <div className="media-document">
                              <IconDocument />
                              <a 
                                href={selectedParagraphe.fichierMedia} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                Ouvrir le document
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-lecon-selected">
                <IconBook />
                <p>Sélectionnez une leçon pour commencer</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}