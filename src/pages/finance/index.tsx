// src/pages/finance/index.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { fetchCompteResultat, fetchBilanComptable, fetchGeneral, fetchAllTransactions } from '../../redux/slices/financeSlice';
import { selectCompteResultat, selectBilanComptable, selectAccount, selectTransactions, selectFinanceLoading, selectFinanceError } from '../../redux/selectors/finance.selector';
import { useAuth } from '../../contexts/AuthContext';
import { FaChartPie, FaFileInvoiceDollar, FaExchangeAlt, FaArrowLeft, FaArrowRight, FaDownload } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import './index.css';

type SectionType = 'RESULTAT' | 'BILAN' | 'TRANSACTIONS';
type BilanSubType = 'ACTIF' | 'PASSIF';

const TRANSACTIONS_PER_PAGE = 4;

export default function FinanceScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const compteResultat = useAppSelector(selectCompteResultat);
  const bilanComptable = useAppSelector(selectBilanComptable);
  const account = useAppSelector(selectAccount);
  const transactions = useAppSelector(selectTransactions) || [];
  const loading = useAppSelector(selectFinanceLoading);
  const error = useAppSelector(selectFinanceError);

  const [sectionActive, setSectionActive] = useState<SectionType>('RESULTAT');
  const [bilanSubActive, setBilanSubActive] = useState<BilanSubType>('ACTIF');
  const [errorAuthorization, setErrorAuthorization] = useState(false);
  const [currentTxPage, setCurrentTxPage] = useState(1);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setErrorAuthorization(true);
    }
  }, [user]);

  useEffect(() => {
    if (token && !errorAuthorization) {
      dispatch(fetchCompteResultat(token));
      dispatch(fetchBilanComptable(token));
      dispatch(fetchGeneral(token));
      dispatch(fetchAllTransactions(token));
    }
  }, [token, dispatch, errorAuthorization]);

  const paginatedTransactions = transactions.slice(
    (currentTxPage - 1) * TRANSACTIONS_PER_PAGE,
    currentTxPage * TRANSACTIONS_PER_PAGE
  );

  const totalTxPages = Math.ceil(transactions.length / TRANSACTIONS_PER_PAGE);

  const handlePrevTxPage = () => {
    if (currentTxPage > 1) setCurrentTxPage(prev => prev - 1);
  };

  const handleNextTxPage = () => {
    if (currentTxPage < totalTxPages) setCurrentTxPage(prev => prev + 1);
  };

  const handleDownloadPdf = (type: 'resultat' | 'bilan') => {
    // Implement PDF generation and download logic here
    // For example, using jsPDF or browser print
    alert(`Téléchargement PDF pour ${type} en cours...`);
  };

  if (loading) {
    return (
      <div className="finance-loading">
        <div className="spinner" />
        <p>Chargement des finances...</p>
      </div>
    );
  }

  if (errorAuthorization) {
    return (
      <div className="finance-unauthorized">
        <h2>Accès interdit</h2>
        <p>Seuls les admins peuvent accéder à cette section.</p>
        <button onClick={() => navigate('/dashboard')}>Retour</button>
      </div>
    );
  }

  if (error) {
    return <div className="finance-error">Erreur: {error}</div>;
  }

  return (
    <div className="finance-container">
      <header className="finance-header">
        <h1>Finances</h1>
      </header>

      <div className="section-tabs">
        <button
          className={`tab ${sectionActive === 'RESULTAT' ? 'active' : ''}`}
          onClick={() => setSectionActive('RESULTAT')}
        >
          <FaChartPie /> Compte de résultat
        </button>
        <button
          className={`tab ${sectionActive === 'BILAN' ? 'active' : ''}`}
          onClick={() => setSectionActive('BILAN')}
        >
          <FaFileInvoiceDollar /> Bilan
        </button>
        <button
          className={`tab ${sectionActive === 'TRANSACTIONS' ? 'active' : ''}`}
          onClick={() => setSectionActive('TRANSACTIONS')}
        >
          <FaExchangeAlt /> Transactions
        </button>
      </div>

      {sectionActive === 'RESULTAT' && compteResultat && (
        <div className="section-content">
          <h2>Compte de résultat ({compteResultat.annee})</h2>
          <div className="finance-table">
            <div className="row"><span>Chiffre d'affaires</span><span>{compteResultat.chiffreAffaires.toLocaleString()} Ar</span></div>
            <div className="row"><span>Dépenses achats</span><span>{compteResultat.depenses.achats.toLocaleString()} Ar</span></div>
            <div className="row"><span>Dépenses transport</span><span>{compteResultat.depenses.transport.toLocaleString()} Ar</span></div>
            <div className="row highlight"><span>Marge brute</span><span>{compteResultat.margeBrute.toLocaleString()} Ar ({compteResultat.margeBrutePourcentage})</span></div>
            <div className="row"><span>Valeur ajoutée</span><span>{compteResultat.valeurAjoutee.toLocaleString()} Ar</span></div>
            <div className="row"><span>EBE</span><span>{compteResultat.ebe.toLocaleString()} Ar</span></div>
            <div className="row"><span>Résultat d'exploitation</span><span>{compteResultat.resultatExploitation.toLocaleString()} Ar</span></div>
            <div className="row highlight"><span>Résultat net</span><span>{compteResultat.resultatNet.toLocaleString()} Ar</span></div>
          </div>
          <button className="download-btn" onClick={() => handleDownloadPdf('resultat')}>
            <FaDownload /> Télécharger PDF
          </button>
        </div>
      )}

      {sectionActive === 'BILAN' && bilanComptable && (
        <div className="section-content">
          <h2>Bilan comptable ({bilanComptable.annee})</h2>
          <div className="sub-tabs">
            <button
              className={`sub-tab ${bilanSubActive === 'ACTIF' ? 'active' : ''}`}
              onClick={() => setBilanSubActive('ACTIF')}
            >
              Actif
            </button>
            <button
              className={`sub-tab ${bilanSubActive === 'PASSIF' ? 'active' : ''}`}
              onClick={() => setBilanSubActive('PASSIF')}
            >
              Passif
            </button>
          </div>

          {bilanSubActive === 'ACTIF' && (
            <div className="finance-table">
              <div className="row"><span>Stock valorisé</span><span>{bilanComptable.actif.stockValorise.toLocaleString()} Ar</span></div>
              <div className="row"><span>Créances clients</span><span>{bilanComptable.actif.creancesClients.toLocaleString()} Ar</span></div>
              <div className="row"><span>Trésorerie</span><span>{bilanComptable.actif.tresorerie.toLocaleString()} Ar</span></div>
              <div className="row highlight"><span>Total actif</span><span>{bilanComptable.actif.totalActif.toLocaleString()} Ar</span></div>
            </div>
          )}

          {bilanSubActive === 'PASSIF' && (
            <div className="finance-table">
              <div className="row"><span>Dettes fournisseurs</span><span>{bilanComptable.passif.dettesFournisseurs.toLocaleString()} Ar</span></div>
              <div className="row"><span>Capitaux propres</span><span>{bilanComptable.passif.capitauxPropres.toLocaleString()} Ar</span></div>
              <div className="row highlight"><span>Total passif</span><span>{bilanComptable.passif.totalPassif.toLocaleString()} Ar</span></div>
            </div>
          )}
          <button className="download-btn" onClick={() => handleDownloadPdf('bilan')}>
            <FaDownload /> Télécharger PDF
          </button>
        </div>
      )}

      {sectionActive === 'TRANSACTIONS' && (
        <div className="section-content">
          <h2>Transactions récentes</h2>
          {paginatedTransactions.map((tx:any) => (
            <div key={tx.id} className="transaction-item">
              <div className="tx-icon">
                <FaExchangeAlt />
              </div>
              <div>
                <p className="tx-ref">{tx.ref}</p>
                <p className="tx-date">{new Date(tx.date).toLocaleDateString()}</p>
              </div>
              <p className={`tx-amount ${tx.type === 'ENTREE' ? 'positive' : 'negative'}`}>
                {tx.type === 'ENTREE' ? '+' : '-'} {tx.quantite * tx.prixUnitaire} Ar
              </p>
            </div>
          ))}

          <div className="pagination">
            <button onClick={handlePrevTxPage} disabled={currentTxPage === 1} className="page-btn">
              <FaArrowLeft />
            </button>
            <p>Page {currentTxPage} / {totalTxPages}</p>
            <button onClick={handleNextTxPage} disabled={currentTxPage === totalTxPages} className="page-btn">
              <FaArrowRight />
            </button>
          </div>
        </div>
      )}

      {account && (
        <div className="account-summary">
          <h3>Solde actuel</h3>
          <p className="solde-value">{account.montant.toLocaleString()} Ar</p>
        </div>
      )}
    </div>
  );
}