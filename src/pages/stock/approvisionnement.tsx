// src/pages/stock/reapprovisionner.tsx - Version corrigée

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LuPackage, 
  LuArrowLeft, 
  LuTruck, 
  LuDollarSign,
  LuRefreshCw,
  LuPlus,
  LuMinus,
  LuCircleCheck,
  LuCircleAlert,
  LuInfo,
  LuShoppingCart
} from 'react-icons/lu';
import BASE_URL from '../../config/ApiConfig';
import './approvisionnement.css';

interface Product {
  id: number;
  numero: string;
  nom: string;
  type: string;
  quantite: number;
  prixAchat: number;
  prixVente: number;
  idEntreprise: number;
}

export default function ReapprovisionnerScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quantite, setQuantite] = useState<number>(1); // Initialisation explicite
  const [prixAchat, setPrixAchat] = useState<number>(0);
  const [transport, setTransport] = useState<number>(0);
  const [fournisseur, setFournisseur] = useState('');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  useEffect(() => {
    fetchProduct();
  }, [id, token]);

  const fetchProduct = async () => {
    if (!token || !id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/stock/produit/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du produit');
      }

      const data = await response.json();
      setProduct(data);
      setPrixAchat(data.prixAchat);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !id || !product) return;
    
    if (quantite <= 0) {
      setError('La quantité doit être supérieure à 0');
      return;
    }

    if (prixAchat <= 0) {
      setError('Le prix d\'achat doit être supérieur à 0');
      return;
    }

    setShowConfirmation(true);
  };

  const confirmReappro = async () => {
    if (!token || !id || !product) return;

    setSubmitting(true);
    setError(null);

    try {
      // Calcul du montant total pour l'historique
      const montantTotal = (prixAchat * quantite) + transport;
      
      // Préparer les données pour la mise à jour
      const updateData: any = {
        quantite: product.quantite + quantite // Nouvelle quantité = ancienne + ajoutée
      };
      
      // Si l'utilisateur est admin et que le prix d'achat a changé, on met à jour
      if (isAdmin && prixAchat !== product.prixAchat) {
        updateData.prixAchat = prixAchat;
      }

      // Appel API pour mettre à jour le produit
      const response = await fetch(`${BASE_URL}/stock/produit/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'approvisionnement');
      }

      setSuccess(true);
      
      // Rediriger après 2 secondes
      setTimeout(() => {
        navigate(`/stock/${id}`);
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setShowConfirmation(false);
    } finally {
      setSubmitting(false);
    }
  };

  const incrementQuantite = () => {
    setQuantite(prev => {
      const newValue = prev + 1;
      console.log('Nouvelle quantité:', newValue); // Debug
      return newValue;
    });
  };

  const decrementQuantite = () => {
    setQuantite(prev => {
      if (prev > 1) {
        const newValue = prev - 1;
        console.log('Nouvelle quantité:', newValue); // Debug
        return newValue;
      }
      return prev;
    });
  };

  const handleQuantiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Valeur brute:', value); // Debug
    
    if (value === '') {
      setQuantite(1);
      return;
    }
    
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1) {
      setQuantite(numValue);
      console.log('Quantité définie à:', numValue); // Debug
    } else if (numValue < 1) {
      setQuantite(1);
    }
  };

  const montantTotal = (prixAchat * quantite) + transport;
  const nouvelleQuantite = (product?.quantite || 0) + quantite;

  // Debug: afficher la quantité actuelle
  console.log('Quantité actuelle dans le state:', quantite);

  if (loading) {
    return (
      <div className="reappro-loading">
        <div className="spinner" />
        <p>Chargement du produit...</p>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="reappro-error">
        <LuCircleAlert size={48} />
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/stock')} className="back-button">
          Retour à la liste
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reappro-success">
        <LuCircleCheck size={64} color="#05aa65" />
        <h2>Approvisionnement réussi !</h2>
        <p>
          {quantite} unités de <strong>{product?.nom}</strong> ont été ajoutées au stock.
        </p>
        <div className="success-details">
          <div className="detail-item">
            <span>Nouveau stock:</span>
            <strong>{nouvelleQuantite} unités</strong>
          </div>
          <div className="detail-item">
            <span>Montant total:</span>
            <strong>{montantTotal.toLocaleString()} Ar</strong>
          </div>
          {prixAchat !== product?.prixAchat && isAdmin && (
            <div className="detail-item warning">
              <span>Prix d'achat mis à jour:</span>
              <strong>{prixAchat.toLocaleString()} Ar</strong>
            </div>
          )}
        </div>
        <button onClick={() => navigate(`/stock/${id}`)} className="success-button">
          Voir le produit
        </button>
      </div>
    );
  }

  return (
    <div className="reappro-container">
      {/* Header */}
      <div className="reappro-header">
        <button className="back-button" onClick={() => navigate(`/stock/${id}`)}>
          <LuArrowLeft size={20} />
          Retour
        </button>
        <div className="header-title">
          <h1>Réapprovisionnement</h1>
          <p className="product-name">{product?.nom} - Réf: {product?.numero}</p>
        </div>
      </div>

      {/* Informations produit */}
      <div className="product-info-card">
        <div className="info-item">
          <LuPackage className="info-icon" />
          <div>
            <span className="info-label">Stock actuel</span>
            <span className="info-value">{product?.quantite.toLocaleString()} unités</span>
          </div>
        </div>
        <div className="info-item">
          <LuDollarSign className="info-icon" />
          <div>
            <span className="info-label">Prix d'achat actuel</span>
            <span className="info-value">{product?.prixAchat.toLocaleString()} Ar</span>
          </div>
        </div>
        <div className="info-item">
          <LuShoppingCart className="info-icon" />
          <div>
            <span className="info-label">Prix de vente</span>
            <span className="info-value">{product?.prixVente.toLocaleString()} Ar</span>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="reappro-form">
        {error && (
          <div className="error-message">
            <LuCircleAlert size={20} />
            {error}
          </div>
        )}

        {/* Quantité à approvisionner - VERSION CORRIGÉE */}
        <div className="form-group">
          <label htmlFor="quantite">
            Quantité à approvisionner <span className="required">*</span>
          </label>
          <div className="quantity-input">
            <button 
              type="button" 
              onClick={decrementQuantite}
              className="quantity-btn"
              disabled={quantite <= 1}
            >
              <LuMinus />
            </button>
            <input
              type="number"
              id="quantite"
              name="quantite"
              value={quantite}
              onChange={handleQuantiteChange}
              min="1"
              step="1"
              required
              className="quantity-field"
            />
            <button 
              type="button" 
              onClick={incrementQuantite}
              className="quantity-btn"
            >
              <LuPlus />
            </button>
          </div>
          <small className="field-hint">
            La quantité sera ajoutée au stock actuel
          </small>
          {/* Affichage de debug - à retirer après correction */}
          <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            Valeur actuelle: {quantite} unité{quantite > 1 ? 's' : ''}
          </div>
        </div>

        {/* Prix d'achat */}
        <div className="form-group">
          <label htmlFor="prixAchat">
            Prix d'achat unitaire (Ar) <span className="required">*</span>
          </label>
          <div className="input-wrapper">
            <LuDollarSign className="input-icon" />
            <input
              type="number"
              id="prixAchat"
              value={prixAchat}
              onChange={(e) => setPrixAchat(Math.max(0, parseInt(e.target.value) || 0))}
              min="0"
              required
              step="100"
            />
          </div>
          {isAdmin && prixAchat !== product?.prixAchat && (
            <div className="info-text">
              <LuInfo size={14} />
              ⚠️ Le prix d'achat sera mis à jour pour ce produit
            </div>
          )}
        </div>

        {/* Frais de transport */}
        <div className="form-group">
          <label htmlFor="transport">Frais de transport (Ar)</label>
          <div className="input-wrapper">
            <LuTruck className="input-icon" />
            <input
              type="number"
              id="transport"
              value={transport}
              onChange={(e) => setTransport(Math.max(0, parseInt(e.target.value) || 0))}
              min="0"
              step="100"
            />
          </div>
          <small className="field-hint">
            Les frais de transport seront ajoutés au coût total
          </small>
        </div>

        {/* Fournisseur */}
        <div className="form-group">
          <label htmlFor="fournisseur">Fournisseur</label>
          <input
            type="text"
            id="fournisseur"
            value={fournisseur}
            onChange={(e) => setFournisseur(e.target.value)}
            placeholder="Nom du fournisseur (optionnel)"
          />
        </div>

        {/* Note */}
        <div className="form-group">
          <label htmlFor="note">Note</label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Informations supplémentaires (optionnel)"
            rows={3}
          />
        </div>

        {/* Résumé */}
        <div className="summary-card">
          <h3>Résumé de l'approvisionnement</h3>
          <div className="summary-row">
            <span>Stock actuel:</span>
            <strong>{product?.quantite.toLocaleString()} unités</strong>
          </div>
          <div className="summary-row highlight">
            <span>Quantité à ajouter:</span>
            <strong className="highlight-value">+ {quantite} unités</strong>
          </div>
          <div className="summary-divider" />
          <div className="summary-row total-new">
            <span>Nouveau stock:</span>
            <strong>{nouvelleQuantite.toLocaleString()} unités</strong>
          </div>
          
          <div className="summary-subsection">
            <h4>Détail financier</h4>
            <div className="summary-row">
              <span>Prix unitaire:</span>
              <strong>{prixAchat.toLocaleString()} Ar</strong>
            </div>
            <div className="summary-row">
              <span>Sous-total:</span>
              <strong>{(prixAchat * quantite).toLocaleString()} Ar</strong>
            </div>
            {transport > 0 && (
              <div className="summary-row">
                <span>Transport:</span>
                <strong>{transport.toLocaleString()} Ar</strong>
              </div>
            )}
            <div className="summary-row total">
              <span>Total TTC:</span>
              <strong>{montantTotal.toLocaleString()} Ar</strong>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate(`/stock/${id}`)}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <LuRefreshCw className="spinning" />
                Traitement...
              </>
            ) : (
              <>
                <LuCircleCheck />
                Valider l'approvisionnement
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal de confirmation */}
      {showConfirmation && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <LuCircleAlert size={48} color="#05aa65" />
            <h2>Confirmer l'approvisionnement</h2>
            <div className="confirmation-details">
              <div className="confirmation-item">
                <span>Produit:</span>
                <strong>{product?.nom}</strong>
              </div>
              <div className="confirmation-item">
                <span>Quantité:</span>
                <strong>{quantite} unités</strong>
              </div>
              <div className="confirmation-item">
                <span>Stock actuel:</span>
                <strong>{product?.quantite} unités</strong>
              </div>
              <div className="confirmation-item">
                <span>Nouveau stock:</span>
                <strong>{nouvelleQuantite} unités</strong>
              </div>
              <div className="confirmation-item">
                <span>Montant total:</span>
                <strong>{montantTotal.toLocaleString()} Ar</strong>
              </div>
              {fournisseur && (
                <div className="confirmation-item">
                  <span>Fournisseur:</span>
                  <strong>{fournisseur}</strong>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-modal-btn"
                onClick={() => setShowConfirmation(false)}
              >
                Annuler
              </button>
              <button 
                className="confirm-modal-btn"
                onClick={confirmReappro}
                disabled={submitting}
              >
                {submitting ? 'Traitement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}