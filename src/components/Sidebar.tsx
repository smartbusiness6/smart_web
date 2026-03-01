// src/components/Sidebar/Sidebar.tsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuPackage,
  LuReceiptText,
  LuShoppingCart,
  LuTriangleAlert,
  LuUser,
  LuWallet,
  LuLogOut,
  LuCircleHelp,
  LuCreditCard,
  LuChevronUp,
  LuChevronDown,
  LuSettings
} from "react-icons/lu";
import "./sidebar.css";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SidebarProps {
  alertesStock: number;
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  badge?: number;
  path: string;
}

interface ProfileMenuItemProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color?: string;
}

// ─── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, badge, path }: NavItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Vérifier si l'item est actif
  const isActive = location.pathname === path || 
                   (path !== '/dashboard' && location.pathname.startsWith(path));

  return (
    <div 
      className={`nav-item${isActive ? " nav-item--active" : ""}`} 
      onClick={() => {
        navigate(path);
      }}
    >
      <span className="nav-item__icon">
        <Icon size={16} />
      </span>
      <span>{label}</span>
      {badge != null && badge > 0 && (
        <span className="nav-item__badge">{badge}</span>
      )}
    </div>
  );
}

// ─── ProfileMenuItem ──────────────────────────────────────────────────────────
function ProfileMenuItem({ icon: Icon, label, onClick, color }: ProfileMenuItemProps) {
  return (
    <div className="profile-menu-item" onClick={onClick}>
      <Icon size={14} color={color || "rgba(255,255,255,0.6)"} />
      <span style={{ color: color || "rgba(255,255,255,0.8)" }}>{label}</span>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar({
  alertesStock,
  isOpen,
  onClose,
  userName = "Admin",
  userRole = "Administrateur",
  onLogout
}: SidebarProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Obtenir le prénom et les initiales
  const firstName = userName?.split(' ')[0] || "Admin";
  const initials = userName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || "AD";

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems: NavItemProps[] = [
    { label: "Dashboard", icon: LuLayoutDashboard, path: "/dashboard" },
    { label: "Ventes", icon: LuReceiptText, path: "/vente" },
    { label: "Stock", icon: LuPackage, path: "/stock" },
    { label: "Reports", icon: LuTriangleAlert, badge: alertesStock, path: "/report" },
    { label: "Finance", icon: LuWallet, path: "/finance" },
    { label: "RH", icon: LuUser, path: "/rh" }
  ];

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setIsProfileMenuOpen(false);
  };

  const handleSubscription = () => {
    navigate('/subscription');
    setIsProfileMenuOpen(false);
  };

  const handleHelp = () => {
    navigate('/help');
    setIsProfileMenuOpen(false);
  };

  const handleSettings = () => {
    navigate('/settings');
    setIsProfileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile overlay — clique pour fermer */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      <aside className={`sidebar${isOpen ? " sidebar--open" : ""}`}>
        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">
            <span>📊</span>
          </div>
          <span className="sidebar__logo-text">My Business</span>
        </div>

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        <span className="sidebar__section-label">Navigation</span>
        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <NavItem key={item.label} {...item} />
          ))}
        </nav>

        {/* ── User footer avec menu contextuel ─────────────────────────────── */}
        <div className="sidebar__footer" ref={profileRef}>
          <div 
            className="sidebar__user" 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          >
            <div className="sidebar__avatar">
              {initials}
            </div>
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">{firstName}</div>
              <div className="sidebar__user-role">{userRole}</div>
            </div>
            <div className="sidebar__user-arrow">
              {isProfileMenuOpen ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
            </div>
          </div>

          {/* Menu contextuel du profil */}
          {isProfileMenuOpen && (
            <div className="profile-menu">
              <ProfileMenuItem 
                icon={LuCreditCard} 
                label="Abonnement" 
                onClick={handleSubscription}
              />
              <ProfileMenuItem 
                icon={LuSettings} 
                label="Paramètres" 
                onClick={handleSettings}
              />
              <ProfileMenuItem 
                icon={LuCircleHelp} 
                label="Aide & Support" 
                onClick={handleHelp}
              />
              <div className="profile-menu-divider" />
              <ProfileMenuItem 
                icon={LuLogOut} 
                label="Déconnexion" 
                onClick={handleLogout}
                color="#f87171"
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}