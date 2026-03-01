// src/pages/ventes/VentesScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { fetchCommands, fetchClients, validatePayment, deleteCommand } from '../../redux/slices/venteSlice';
import { selectAllCommands, selectPaidCommands, selectPendingCommands, selectCommandsLoading } from '../../redux/selectors/vente.selector';
import { useAuth } from '../../contexts/AuthContext';
import { FaShoppingCart, FaEuroSign, FaClock, FaSearch, FaSyncAlt, FaPlus, FaTrash, FaCheck, FaFilePdf, FaTimes } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './index.css';
import type { detailledClient } from '../../models/interfaces';

type FilterType = 'all' | 'paid' | 'pending';

export default function VentesScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token } = useAuth();

  const allCommands = useAppSelector(selectAllCommands) || [];
  const paidCommands = useAppSelector(selectPaidCommands) || [];
  const pendingCommands = useAppSelector(selectPendingCommands) || [];
  const clients = useAppSelector(state => state.vente.clients) || [];
  const loading = useAppSelector(selectCommandsLoading);

  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showValidateModal, setShowValidateModal] = useState<number | null>(null);

  useEffect(() => {
    if (token) {
      dispatch(fetchCommands(token));
      dispatch(fetchClients(token)); // Assuming fetchClients is needed for clients section
    }
  }, [token, dispatch]);

  const handleRefresh = () => {
    if (token) dispatch(fetchCommands(token));
  };

  const filteredCommands = useMemo(() => {
    let list = activeFilter === 'paid' ? paidCommands : activeFilter === 'pending' ? pendingCommands : allCommands;

    if (searchValue.trim()) {
      const term = searchValue.toLowerCase().trim();
      list = list.filter(c => c.client?.nom.toLowerCase().includes(term) || c.reference?.toLowerCase().includes(term));
    }

    return list;
  }, [allCommands, paidCommands, pendingCommands, activeFilter, searchValue]);

  const stats = useMemo(() => ({
    total: allCommands.length,
    paid: paidCommands.length,
    pending: pendingCommands.length,
    totalAmount: allCommands.reduce((sum, c) => sum + (c.quantite * c.produit.prixVente), 0),
  }), [allCommands, paidCommands, pendingCommands]);

  const handleDelete = (id: number) => {
    if (token) dispatch(deleteCommand({ id, token }));
    setShowDeleteModal(null);
  };

  const handleValidate = (id: number) => {
    if (token) dispatch(validatePayment({ id, token }));
    setShowValidateModal(null);
  };

  const generatePdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Rapport Ventes', 20, 20);

    autoTable(doc, {
      head: [['Référence', 'Client', 'Produit', 'Qté', 'Montant', 'Statut']],
      body: filteredCommands.map(c => [
        c.reference || '—',
        c.client.nom,
        c.produit.nom,
        c.quantite,
        (c.quantite * c.produit.prixVente).toLocaleString(),
        c.valide ? 'Payé' : 'En attente',
      ]),
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [4, 149, 125] },
    });

    doc.save('rapport-ventes.pdf');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Chargement des ventes...</p>
      </div>
    );
  }

  return (
    <div className="ventes-container">
      <header className="ventes-header">
        <h1>Ventes</h1>
        <button className="refresh-btn" onClick={handleRefresh}>
          <FaSyncAlt />
        </button>
      </header>

      <div className="stats-grid">
        <div className="stat-card total">
          <FaShoppingCart className="stat-icon" />
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Commandes totales</div>
        </div>
        <div className="stat-card paid">
          <FaCheck className="stat-icon" />
          <div className="stat-value">{stats.paid}</div>
          <div className="stat-label">Payées</div>
        </div>
        <div className="stat-card pending">
          <FaClock className="stat-icon" />
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">En attente</div>
        </div>
        <div className="stat-card amount">
          <FaEuroSign className="stat-icon" />
          <div className="stat-value">{stats.totalAmount.toLocaleString()} Ar</div>
          <div className="stat-label">CA total</div>
        </div>
      </div>

      <div className="search-filter">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher client ou référence..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            className="search-input"
          />
          {searchValue && <FaTimes className="clear-icon" onClick={() => setSearchValue('')} />}
        </div>

        <div className="filter-buttons">
          <button className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
            Tous
          </button>
          <button className={`filter-btn ${activeFilter === 'paid' ? 'active' : ''}`} onClick={() => setActiveFilter('paid')}>
            Payées
          </button>
          <button className={`filter-btn ${activeFilter === 'pending' ? 'active' : ''}`} onClick={() => setActiveFilter('pending')}>
            En attente
          </button>
        </div>
      </div>

      <div className="commands-section">
        <h2 className="section-title">Commandes</h2>
        <div className="commands-grid">
          {filteredCommands.map(command => (
            <div key={command.id} className="command-card">
              <div className="command-info">
                <p className="command-ref">Réf: {command.reference || '—'}</p>
                <p className="command-client">{command.client.nom}</p>
                <p className="command-product">{command.produit.nom} x {command.quantite}</p>
                <p className="command-amount">{(command.quantite * command.produit.prixVente).toLocaleString()} Ar</p>
                <p className="command-date">{new Date(command.date).toLocaleDateString()}</p>
              </div>
              <div className="command-actions">
                {!command.valide && (
                  <button className="validate-btn" onClick={() => setShowValidateModal(command.id)}>
                    <FaCheck />
                  </button>
                )}
                <button className="delete-btn" onClick={() => setShowDeleteModal(command.id)}>
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
          {filteredCommands.length === 0 && (
            <div className="empty-state">
              <p>Aucune commande</p>
            </div>
          )}
        </div>
      </div>

      <div className="clients-section">
        <h2 className="section-title">Clients</h2>
        <div className="clients-grid">
          {clients.map((client: detailledClient) => (
            <div key={client.id} className="client-card">
              <p className="client-name">{client.nom}</p>
              <p className="client-email">{client.email}</p>
              <p className="client-phone">{client.telephone}</p>
              <p className="client-commandes">Commandes: {client.commandes.length}</p>
            </div>
          ))}
        </div>
      </div>

      <button className="pdf-btn" onClick={generatePdf}>
        <FaFilePdf /> Exporter PDF
      </button>

      <button className="fab" onClick={() => navigate('/ventes/add')}>
        <FaPlus />
      </button>

      {/* Modals */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirmer suppression ?</h3>
            <button className="confirm-btn" onClick={() => handleDelete(showDeleteModal)}>
              Oui
            </button>
            <button className="cancel-btn" onClick={() => setShowDeleteModal(null)}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {showValidateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Valider le paiement ?</h3>
            <button className="confirm-btn" onClick={() => handleValidate(showValidateModal)}>
              Oui
            </button>
            <button className="cancel-btn" onClick={() => setShowValidateModal(null)}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}