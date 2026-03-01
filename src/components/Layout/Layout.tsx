// src/components/Layout/Layout.tsx
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  // Ne pas afficher le layout sur la page de login
  if (location.pathname === '/') {
    return <Outlet />;
  }

  const alertesStock = 0; // À remplacer par votre logique réelle

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      <Sidebar
        alertesStock={alertesStock}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        userName={user?.nom}
        userRole={user?.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'}
        onLogout={logout}
      />

      <main className="main-area">
        <header className="top-bar">
          <button className="menu-button" onClick={toggleSidebar}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div className="page-title">
            {getPageTitle(location.pathname)}
          </div>
          <div className="top-bar-actions">
            {/* Vous pouvez ajouter des actions globales ici */}
          </div>
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// Fonction utilitaire pour obtenir le titre de la page
const getPageTitle = (pathname: string): string => {
  const titles: { [key: string]: string } = {
    '/dashboard': 'Tableau de bord',
    '/stock': 'Gestion de stock',
    '/vente': 'Gestion des ventes',
    '/finance': 'Finance',
    '/report': 'Rapports',
    '/rh': 'Ressources humaines',
  };

  // Gestion des sous-pages
  if (pathname.startsWith('/stock/')) {
    if (pathname.includes('/add')) return 'Ajouter un produit';
    if (pathname.includes('/update')) return 'Modifier un produit';
    return 'Détail du produit';
  }

  if (pathname.startsWith('/rh/')) {
    if (pathname.includes('/add')) return 'Ajouter un employé';
    if (pathname.includes('/update')) return 'Modifier un employé';
    return 'Détail de l\'employé';
  }

  if (pathname.startsWith('/vente/')) {
    if (pathname.includes('/add')) return 'Nouvelle vente';
    return 'Détail de la vente';
  }

  return titles[pathname] || 'My Business';
};

export default Layout;