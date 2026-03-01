// Sidebar.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuPackage,
  LuReceiptText,
  LuShoppingCart,
  LuTriangleAlert,
  LuUser,
  LuWallet,
} from "react-icons/lu";
import "./sidebar.css";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SidebarProps {
  /** Nombre d'alertes stock — alimente le badge "Alertes" et l'avatar */
  alertesStock: number;
  /** Contrôle l'ouverture en mode mobile */
  isOpen: boolean;
  /** Callback pour fermer la sidebar (clic sur overlay) */
  onClose: () => void;
  /** Nom de l'utilisateur connecté */
  userName?: string;
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: number;
  path: string;
}

// ─── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, active, badge, path }: NavItemProps) {
    const navigate = useNavigate();
  return (
    <div className={`nav-item${active ? " nav-item--active" : ""}`} onClick={()=>navigate(path)}>
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

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar({
  alertesStock,
  isOpen,
  onClose,
  userName = "Admin",
}: SidebarProps) {
  const navItems: NavItemProps[] = [
    { label: "Dashboard",  icon: LuLayoutDashboard, active: true, path: "/dashboard" },
    { label: "Ventes",     icon: LuReceiptText, path: "/vente" },
    { label: "Stock",      icon: LuPackage, path: "/stock" },
    { label: "Reports",    icon: LuTriangleAlert, badge: alertesStock, path: "/report" },
    { label: "Finance",    icon: LuWallet, path: "/finance" },
    {label: "RH", icon: LuUser, path: "/rh"}
  ];

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
            <img src="images/logo-smart" alt="Logo smart" />
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

        {/* ── User footer ──────────────────────────────────────────────────── */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              {userName?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <div className="sidebar__user-name">{userName}</div>
              <div className="sidebar__user-role">Administrateur</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}