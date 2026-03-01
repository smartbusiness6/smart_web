// src/components/ProtectedRoute.tsx
import { type ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'SUPERADMIN' | 'USER';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const [isTokenValid, setIsTokenValid] = useState(true);

  // Vérifier si le token est expiré
  useEffect(() => {
    const checkTokenValidity = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsTokenValid(false);
        return;
      }

      try {
        // Option 1: Vérifier la date d'expiration du token JWT
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convertir en millisecondes
        
        if (Date.now() >= exp) {
          // Token expiré
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsTokenValid(false);
        }
      } catch (error) {
        // Option 2: Faire une requête de vérification au backend
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (!response.ok) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setIsTokenValid(false);
          }
        } catch (err) {
          console.error('Erreur de vérification du token:', err);
          setIsTokenValid(false);
        }
      }
    };

    if (isAuthenticated) {
      checkTokenValidity();
    }
  }, [isAuthenticated]);

  // Afficher un écran de chargement pendant la vérification
  if (isLoading) {
    return (
      <div className="auth-loading-container">
        <div className="auth-loading-spinner"></div>
        <p>Vérification de l'authentification...</p>
      </div>
    );
  }

  // Rediriger vers login si non authentifié ou token invalide
  if (!isAuthenticated || !isTokenValid) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Vérifier les rôles si nécessaire
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'SUPERADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  // Tout est bon, afficher le contenu protégé
  return <>{children}</>;
};