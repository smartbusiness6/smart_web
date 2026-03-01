// src/pages/stock/update/[id].tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LuSave,
  LuArrowLeft,
  LuPackage,
  LuDollarSign,
  LuTag,
  LuHash,
  LuBox,
  LuCircleAlert,
  LuCircleCheck,
  LuLoader
} from 'react-icons/lu';
import './update.css';

interface ProductData {
  id: number;
  numero: string;
  nom: string;
  type: string;
  quantite: number;
  prixAchat: number;
  prixVente: number;
}

export default function UpdateProductScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);

  // États du formulaire
  const [formData, setFormData] = useState({
    numero: '',
    nom: '',
    type: '',
    quantite: '',
    prixAchat: '',
    prixVente: '',
  });

  const BASE_URL = 'http://localhost:3000'; // À remplacer par votre config

  // Charger les données du produit
  useEffect(() => {
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

        const data: ProductData = await response.json();
        setProduct(data);
        setFormData({
          numero: data.numero || '',
          nom: data.nom || '',
          type: data.type || '',
          quantite: data.quantite?.toString() || '',
          prixAchat: data.prixAchat?.toString() || '',
          prixVente: data.prixVente?.toString() || '',
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, token]);

  // Gérer les changements dans le formulaire
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Valider le formulaire
  const isFormValid = () => {
    return (
      formData.numero.trim() !== '' &&
      formData.nom.trim() !== '' &&
      formData.type.trim() !== '' &&
      formData.quantite.trim() !== '' &&
      !isNaN(Number(formData.quantite)) &&
      Number(formData.quantite) >= 0 &&
      formData.prixAchat.trim() !== '' &&
      !isNaN(Number(formData.prixAchat)) &&
      Number(formData.prixAchat) >= 0 &&
      formData.prixVente.trim() !== '' &&
      !isNaN(Number(formData.prixVente)) &&
      Number(formData.prixVente) >= 0
    );
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      setError('Veuillez remplir tous les champs correctement');
      return;
    }

    if (!token || !id) {
      setError('Erreur d\'authentification');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const updatedData = {
        nom: formData.nom,
        numero: formData.numero,
        quantite: parseInt(formData.quantite) || 0,
        prixAchat: parseInt(formData.prixAchat) || 0,
        prixVente: parseInt(formData.prixVente) || 0,
        type: formData.type,
      };

      const response = await fetch(`${BASE_URL}/stock/produit/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      const updatedProduct = await response.json();
      setProduct(updatedProduct);
      setSuccess(true);

      // Rediriger après 2 secondes
      setTimeout(() => {
        navigate(`/stock/${id}`);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="update-product-loading">
        <div className="spinner" />
        <p>Chargement du produit...</p>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="update-product-error">
        <LuCircleAlert size={48} />
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/stock')} className="back-to-list">
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="update-product-container">
      {/* Header */}
      <div className="update-header">
        <button 
          className="back-button"
          onClick={() => navigate(`/stock/${id}`)}
        >
          <LuArrowLeft size={20} />
          Retour
        </button>
        <h1>Modifier le produit</h1>
      </div>

      {/* Formulaire */}
      <div className="update-form-container">
        <form onSubmit={handleSubmit} className="update-form">
          {/* Image ou icône du produit */}
          <div className="form-header">
            <div className="product-avatar">
              <LuPackage size={48} />
            </div>
            <div className="product-title">
              <h2>{product?.nom}</h2>
              <span className="product-id">ID: {product?.id}</span>
            </div>
          </div>

          {/* Grille du formulaire */}
          <div className="form-grid">
            {/* Numéro */}
            <div className="form-group">
              <label htmlFor="numero">
                <LuHash className="input-icon" />
                Numéro du produit
              </label>
              <input
                type="text"
                id="numero"
                value={formData.numero}
                onChange={(e) => handleChange('numero', e.target.value)}
                placeholder="Ex: PROD-001"
                className={!formData.numero && error ? 'error' : ''}
              />
              {!formData.numero && error && (
                <span className="error-message">Champ requis</span>
              )}
            </div>

            {/* Nom */}
            <div className="form-group">
              <label htmlFor="nom">
                <LuTag className="input-icon" />
                Nom du produit
              </label>
              <input
                type="text"
                id="nom"
                value={formData.nom}
                onChange={(e) => handleChange('nom', e.target.value)}
                placeholder="Ex: Ordinateur portable"
                className={!formData.nom && error ? 'error' : ''}
              />
              {!formData.nom && error && (
                <span className="error-message">Champ requis</span>
              )}
            </div>

            {/* Catégorie */}
            <div className="form-group">
              <label htmlFor="type">
                <LuBox className="input-icon" />
                Catégorie
              </label>
              <input
                type="text"
                id="type"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                placeholder="Ex: Électronique"
                className={!formData.type && error ? 'error' : ''}
              />
              {!formData.type && error && (
                <span className="error-message">Champ requis</span>
              )}
            </div>

            {/* Quantité */}
            <div className="form-group">
              <label htmlFor="quantite">
                <LuPackage className="input-icon" />
                Quantité en stock
              </label>
              <input
                type="number"
                id="quantite"
                value={formData.quantite}
                onChange={(e) => handleChange('quantite', e.target.value)}
                placeholder="0"
                min="0"
                step="1"
                className={(!formData.quantite || Number(formData.quantite) < 0) && error ? 'error' : ''}
              />
              {(!formData.quantite || Number(formData.quantite) < 0) && error && (
                <span className="error-message">Quantité invalide</span>
              )}
            </div>

            {/* Prix d'achat */}
            <div className="form-group">
              <label htmlFor="prixAchat">
                <LuDollarSign className="input-icon" />
                Prix d'achat (Ar)
              </label>
              <input
                type="number"
                id="prixAchat"
                value={formData.prixAchat}
                onChange={(e) => handleChange('prixAchat', e.target.value)}
                placeholder="0"
                min="0"
                step="100"
                className={(!formData.prixAchat || Number(formData.prixAchat) < 0) && error ? 'error' : ''}
              />
              {(!formData.prixAchat || Number(formData.prixAchat) < 0) && error && (
                <span className="error-message">Prix invalide</span>
              )}
            </div>

            {/* Prix de vente */}
            <div className="form-group">
              <label htmlFor="prixVente">
                <LuDollarSign className="input-icon" />
                Prix de vente (Ar)
              </label>
              <input
                type="number"
                id="prixVente"
                value={formData.prixVente}
                onChange={(e) => handleChange('prixVente', e.target.value)}
                placeholder="0"
                min="0"
                step="100"
                className={(!formData.prixVente || Number(formData.prixVente) < 0) && error ? 'error' : ''}
              />
              {(!formData.prixVente || Number(formData.prixVente) < 0) && error && (
                <span className="error-message">Prix invalide</span>
              )}
            </div>
          </div>

          {/* Messages d'erreur globaux */}
          {error && (
            <div className="form-error">
              <LuCircleAlert size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate(`/stock/${id}`)}
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={submitting || !isFormValid()}
            >
              {submitting ? (
                <>
                  <LuLoader className="spinning" size={18} />
                  Enregistrement...
                </>
              ) : (
                <>
                  <LuSave size={18} />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>

        {/* Informations supplémentaires */}
        <div className="info-sidebar">
          <div className="info-card">
            <h3>À propos de la modification</h3>
            <ul>
              <li>✓ Les champs marqués d'un * sont obligatoires</li>
              <li>✓ Les quantités doivent être des nombres positifs</li>
              <li>✓ Les prix sont en Ariary (Ar)</li>
              <li>✓ La modification est irréversible</li>
            </ul>
          </div>

          <div className="stats-card">
            <h3>Statistiques</h3>
            <div className="stat-item">
              <span className="stat-label">Valeur du stock</span>
              <span className="stat-value">
                {(Number(formData.quantite) * Number(formData.prixAchat) || 0).toLocaleString()} Ar
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Marge unitaire</span>
              <span className="stat-value">
                {((Number(formData.prixVente) - Number(formData.prixAchat)) || 0).toLocaleString()} Ar
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Marge totale</span>
              <span className="stat-value">
                {((Number(formData.prixVente) - Number(formData.prixAchat)) * Number(formData.quantite) || 0).toLocaleString()} Ar
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de succès */}
      {success && (
        <div className="success-modal">
          <div className="success-content">
            <LuCircleCheck size={48} />
            <h2>Modification réussie !</h2>
            <p>Le produit a été mis à jour avec succès.</p>
            <p className="redirect-note">Redirection vers la page du produit...</p>
          </div>
        </div>
      )}
    </div>
  );
}