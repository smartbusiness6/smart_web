// src/pages/stock/[id].tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LuPackage, 
  LuArrowLeft, 
  LuTrash2,
  LuShoppingCart,
  LuTrendingUp,
  LuTrendingDown,
  LuCalendar,
  LuDollarSign,
  LuBox,
  LuTruck,
  LuRefreshCw,
  LuCircleAlert,
  LuCirclePlus,
  LuPen,
  LuCircleCheck,
  LuCircleX
} from 'react-icons/lu';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import BASE_URL from '../../config/ApiConfig';
import './id.css';

// Types
interface Product {
  id: number;
  numero: string;
  nom: string;
  type: string;
  quantite: number;
  prixAchat: number;
  prixVente: number;
  seuilAlerte?: number;
  commandes?: Commande[];
  transactions?: Transaction[];
}

interface Commande {
  id: number;
  quantite: number;
  date: string;
  valide: boolean;
  fournisseur?: string;
}

interface Transaction {
  id: number;
  type: 'ENTREE' | 'SORTIE';
  quantite: number;
  date: string;
  prixUnitaire: number;
  montant: number;
}

// Tooltip personnalisé pour le graphique
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  const date = new Date(label);
  const formattedDate = date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short' 
  });

  return (
    <div className="chart-tooltip">
      <p className="tooltip-date">{formattedDate}</p>
      <p className="tooltip-value">
        {payload[0].value.toLocaleString('fr-FR')} Ar
      </p>
      <p className="tooltip-label">
        {payload[0].payload.type === 'ENTREE' ? 'Entrée' : 'Sortie'}
      </p>
    </div>
  );
};

export default function ProductDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'mouvements' | 'commandes'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  const fetchProduct = async () => {
    if (!token || !id) return;
    
    try {
      setRefreshing(true);
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
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      console.error('Erreur fetch product:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id, token]);

  const handleDelete = async () => {
    if (!token || !id) return;
    
    try {
      const response = await fetch(`${BASE_URL}/stock/produit/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      navigate('/stock', { state: { message: 'Produit supprimé avec succès' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      setShowDeleteModal(false);
    }
  };

  const handleValidateCommande = async (commandeId: number) => {
    if (!token) return;

    try {
      const response = await fetch(`${BASE_URL}/vente/commande/valid/${commandeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Mettre à jour l'état local
        setProduct(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            commandes: prev.commandes?.map(cmd =>
              cmd.id === commandeId ? { ...cmd, valide: true } : cmd
            ),
          };
        });
      }
    } catch (err) {
      console.error('Erreur validation commande:', err);
    }
  };

  // Préparer les données pour le graphique
  const chartData = product?.transactions
    ?.slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(t => ({
      date: t.date,
      montant: t.montant,
      type: t.type,
      quantite: t.quantite,
    })) || [];

  // Calculer les statistiques
  const totalEntrees = product?.transactions
    ?.filter(t => t.type === 'ENTREE')
    .reduce((sum, t) => sum + t.quantite, 0) || 0;

  const totalSorties = product?.transactions
    ?.filter(t => t.type === 'SORTIE')
    .reduce((sum, t) => sum + t.quantite, 0) || 0;

  const commandesEnAttente = product?.commandes
    ?.filter(c => !c.valide).length || 0;

  const stockStatus = product?.quantite || 0;
  const seuilAlerte = product?.seuilAlerte || 10;
  const isLowStock = stockStatus <= seuilAlerte;

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="spinner" />
        <p>Chargement du produit...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-error">
        <LuCircleAlert size={48} />
        <h2>Erreur</h2>
        <p>{error || 'Produit non trouvé'}</p>
        <button onClick={() => navigate('/stock')} className="back-to-list">
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      {/* Header */}
      <div className="product-detail-header">
        <div className="header-left">
          <button 
            className="back-button"
            onClick={() => navigate('/stock')}
          >
            <LuArrowLeft size={20} />
            Retour
          </button>
          <div className="header-title">
            <h1>{product.nom}</h1>
            <span className="product-ref">Réf: {product.numero}</span>
          </div>
        </div>

        <div className="header-actions">
          <button 
            className="refresh-button"
            onClick={fetchProduct}
            disabled={refreshing}
          >
            <LuRefreshCw className={refreshing ? 'spinning' : ''} size={18} />
            Actualiser
          </button>
          
          <button 
            className="restock-button"
            onClick={() => navigate(`/transaction/add/${id}`)}
          >
            <LuCirclePlus size={18} />
            Réapprovisionner
          </button>

          {isAdmin && (
            <>
              <button 
                className="edit-button"
                onClick={() => navigate(`/stock/update/${id}`)}
              >
                <LuPen size={18} />
                Modifier
              </button>
              
              <button 
                className="delete-button"
                onClick={() => setShowDeleteModal(true)}
              >
                <LuTrash2 size={18} />
                Supprimer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stock Alert Banner */}
      {isLowStock && (
        <div className="stock-alert-banner">
          <LuCircleAlert size={24} />
          <div className="alert-content">
            <strong>Stock critique</strong>
            <p>Ce produit est en dessous du seuil d'alerte ({seuilAlerte} unités)</p>
          </div>
          <button 
            className="alert-action"
            onClick={() => navigate(`/transaction/add/${id}`)}
          >
            Réapprovisionner
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(5, 170, 101, 0.1)', color: '#05aa65' }}>
            <LuPackage />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Stock actuel</span>
            <span className="kpi-value">{product.quantite.toLocaleString()}</span>
            <span className="kpi-unit">unités</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(52, 152, 219, 0.1)', color: '#3498db' }}>
            <LuTrendingUp />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Prix de vente</span>
            <span className="kpi-value">{product.prixVente.toLocaleString()}</span>
            <span className="kpi-unit">Ar</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(155, 89, 182, 0.1)', color: '#9b59b6' }}>
            <LuTruck />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Prix d'achat</span>
            <span className="kpi-value">{product.prixAchat.toLocaleString()}</span>
            <span className="kpi-unit">Ar</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(241, 196, 15, 0.1)', color: '#f1c40f' }}>
            <LuShoppingCart />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Commandes en attente</span>
            <span className="kpi-value">{commandesEnAttente}</span>
            <span className="kpi-unit">{commandesEnAttente > 1 ? 'commandes' : 'commande'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Aperçu général
        </button>
        <button
          className={`tab-button ${activeTab === 'mouvements' ? 'active' : ''}`}
          onClick={() => setActiveTab('mouvements')}
        >
          Mouvements
        </button>
        <button
          className={`tab-button ${activeTab === 'commandes' ? 'active' : ''}`}
          onClick={() => setActiveTab('commandes')}
        >
          Commandes
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Graphique */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Évolution des mouvements</h3>
                <div className="chart-legend">
                  <span className="legend-item">
                    <span className="legend-dot" style={{ background: '#05aa65' }} />
                    Montant (Ar)
                  </span>
                </div>
              </div>

              <div className="chart-container">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="montantGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#05aa65" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#05aa65" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid horizontal={true} vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#666' }}
                        tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#666' }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="montant" 
                        stroke="#05aa65" 
                        strokeWidth={2}
                        fill="url(#montantGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="no-chart-data">
                    <LuBox size={48} />
                    <p>Aucune donnée à afficher</p>
                  </div>
                )}
              </div>

              {/* Statistiques */}
              <div className="stats-grid">
                <div className="stat-item">
                  <LuTrendingUp className="stat-icon entrees" />
                  <div className="stat-info">
                    <span className="stat-label">Total entrées</span>
                    <span className="stat-value">{totalEntrees.toLocaleString()}</span>
                  </div>
                </div>
                <div className="stat-item">
                  <LuTrendingDown className="stat-icon sorties" />
                  <div className="stat-info">
                    <span className="stat-label">Total sorties</span>
                    <span className="stat-value">{totalSorties.toLocaleString()}</span>
                  </div>
                </div>
                <div className="stat-item">
                  <LuDollarSign className="stat-icon ca" />
                  <div className="stat-info">
                    <span className="stat-label">CA total</span>
                    <span className="stat-value">
                      {product.transactions
                        ?.filter(t => t.type === 'SORTIE')
                        .reduce((sum, t) => sum + t.montant, 0)
                        .toLocaleString()} Ar
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations produit */}
            <div className="info-card">
              <h3>Informations produit</h3>
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">Catégorie</span>
                  <span className="info-value">{product.type}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Seuil d'alerte</span>
                  <span className="info-value">{product.seuilAlerte || 'Non défini'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Dernier mouvement</span>
                  <span className="info-value">
                    {product.transactions && product.transactions.length > 0 
                      ? new Date(product.transactions[0].date).toLocaleDateString('fr-FR')
                      : 'Aucun mouvement'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Stock restant</span>
                  <span className={`info-value ${isLowStock ? 'low-stock' : ''}`}>
                    {product.quantite} unités
                  </span>
                </div>
              </div>

              {/* Barre de progression du stock */}
              <div className="stock-progress">
                <div className="progress-header">
                  <span>Niveau de stock</span>
                  <span>{Math.min(100, Math.round((product.quantite / (product.quantite + totalSorties)) * 100))}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${Math.min(100, Math.round((product.quantite / (product.quantite + totalSorties)) * 100))}%`,
                      background: isLowStock ? '#e74c3c' : '#05aa65'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mouvements' && (
          <div className="mouvements-tab">
            <div className="transactions-list">
              {product.transactions && product.transactions.length > 0 ? (
                product.transactions.map((transaction, index) => (
                  <div key={index} className="transaction-item">
                    <div className="transaction-icon">
                      {transaction.type === 'ENTREE' ? (
                        <LuTrendingUp style={{ color: '#05aa65' }} size={24} />
                      ) : (
                        <LuTrendingDown style={{ color: '#e74c3c' }} size={24} />
                      )}
                    </div>
                    <div className="transaction-details">
                      <div className="transaction-header">
                        <span className="transaction-type">
                          {transaction.type === 'ENTREE' ? 'Réapprovisionnement' : 'Vente'}
                        </span>
                        <span className="transaction-date">
                          <LuCalendar size={14} />
                          {new Date(transaction.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="transaction-stats">
                        <span className="transaction-quantite">
                          Quantité: {transaction.quantite} unités
                        </span>
                        <span className="transaction-montant">
                          Montant: {transaction.montant.toLocaleString()} Ar
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <LuBox size={64} />
                  <h3>Aucun mouvement</h3>
                  <p>Ce produit n'a pas encore de mouvements enregistrés</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'commandes' && (
          <div className="commandes-tab">
            <div className="commandes-header">
              <h3>Commandes en cours</h3>
              <button 
                className="new-commande-btn"
                onClick={() => navigate(`/commande/add/${id}`)}
              >
                <LuCircleAlert size={18} />
                Nouvelle commande
              </button>
            </div>

            <div className="commandes-list">
              {product.commandes && product.commandes.length > 0 ? (
                product.commandes.map((commande) => (
                  <div key={commande.id} className="commande-item">
                    <div className="commande-status">
                      {commande.valide ? (
                        <LuCircleCheck className="status-icon success" size={24} />
                      ) : (
                        <LuCircleX className="status-icon pending" size={24} />
                      )}
                    </div>
                    <div className="commande-details">
                      <div className="commande-header">
                        <span className="commande-quantite">
                          {commande.quantite} unités
                        </span>
                        <span className={`commande-badge ${commande.valide ? 'valide' : 'en-attente'}`}>
                          {commande.valide ? 'Livrée' : 'En attente'}
                        </span>
                      </div>
                      <div className="commande-footer">
                        <span className="commande-date">
                          <LuCalendar size={14} />
                          {new Date(commande.date).toLocaleDateString('fr-FR')}
                        </span>
                        {commande.fournisseur && (
                          <span className="commande-fournisseur">
                            Fournisseur: {commande.fournisseur}
                          </span>
                        )}
                      </div>
                    </div>
                    {!commande.valide && (
                      <button
                        className="validate-commande-btn"
                        onClick={() => handleValidateCommande(commande.id)}
                      >
                        Valider
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <LuShoppingCart size={64} />
                  <h3>Aucune commande</h3>
                  <p>Ce produit n'a pas encore de commandes</p>
                  <button 
                    className="create-commande-btn"
                    onClick={() => navigate(`/commande/add/${id}`)}
                  >
                    Créer une commande
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <LuCircleAlert size={48} color="#e74c3c" />
            <h2>Confirmer la suppression</h2>
            <p>
              Êtes-vous sûr de vouloir supprimer le produit <strong>"{product.nom}"</strong> ?
              Cette action est irréversible.
            </p>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Annuler
              </button>
              <button 
                className="confirm-delete-btn"
                onClick={handleDelete}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}