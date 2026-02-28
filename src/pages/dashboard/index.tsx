import React, { useCallback, useEffect, useState } from "react";

// ─── react-icons ─────────────────────────────────────────────────────────────
import {
  LuActivity,
  LuMenu,
  LuPackage,
  LuReceiptText,
  LuRefreshCw,
  LuShoppingCart,
  LuTriangleAlert,
  LuTrendingDown,
  LuTrendingUp,
  LuX,
} from "react-icons/lu";

// ─── recharts ────────────────────────────────────────────────────────────────
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import BASE_URL from "../../config/ApiConfig";
// ─── Sidebar + styles ─────────────────────────────────────────────────────────
import Sidebar from "../../components/Sidebar";
import "./index.css";
import { useAuth } from "../../contexts/AuthContext";


function setHeader(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function isToday(dateStr: string | Date) {
  const d = new Date(dateStr);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

function fmtAr(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardData {
  revenusHebdo:   number;
  ventesJour:     number;
  totalProduits:  number;
  alertesStock:   number;
  totalCommandes: number;
  variation:      string;
}

interface CaJour {
  jour: string;
  ca:   number;
}

interface CaData {
  mois:      string;
  totalMois: number;
  jours:     CaJour[];
}

// ─── Custom Recharts Tooltip ──────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      backgroundColor: "#0f1117",
      border: "1px solid rgba(74,222,128,0.25)",
      borderRadius: "10px",
      padding: "12px",
    }}>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", margin: "0 0 4px 0" }}>
        Jour {label}
      </p>
      <p style={{ 
        color: "#4ade80", 
        fontSize: "13px", 
        fontWeight: "600", 
        margin: 0,
        fontFamily: "'DM Mono', monospace"
      }}>
        {payload[0].value.toLocaleString("fr-FR")} Ar
      </p>
    </div>
  );
};

// ─── CaLineChart ──────────────────────────────────────────────────────────────
function CaLineChart({ jours }: { jours: CaJour[] }) {
  const chartData = jours.map((d) => ({
    jour: d.jour,
    revenu: d.ca,
  }));

  return (
    <div className="chart-card__chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#4ade80" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            horizontal={true} 
            vertical={false} 
            stroke="rgba(255,255,255,0.05)" 
          />
          <XAxis 
            dataKey="jour" 
            axisLine={false} 
            tickLine={false} 
            tick={{ 
              fontSize: 10, 
              fill: "rgba(255,255,255,0.3)",
              fontFamily: "'DM Mono', monospace"
            }}
            interval="preserveStartEnd"
            tickMargin={5}
          />
          <YAxis 
            hide={false}
            axisLine={false}
            tickLine={false}
            tick={{ 
              fontSize: 10, 
              fill: "rgba(255,255,255,0.25)",
              fontFamily: "'DM Mono', monospace"
            }}
            tickFormatter={fmtAr}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="revenu" 
            stroke="#4ade80" 
            strokeWidth={2.5}
            fill="url(#revenueGradient)" 
            dot={{ 
              r: 3, 
              fill: "#4ade80", 
              stroke: "#0a1a10", 
              strokeWidth: 2 
            }}
            activeDot={{ 
              r: 6, 
              fill: "#4ade80", 
              stroke: "#0a1a10", 
              strokeWidth: 2 
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────
interface KpiCardProps {
  title:          string;
  value:          string | number;
  icon:           React.ElementType;
  accent:         string;
  variation?:     string;
  variationType?: "positive" | "negative" | "neutral";
  onClick?:       () => void;
}

function KpiCard({ title, value, icon: Icon, accent, variation, variationType, onClick }: KpiCardProps) {
  const isPos = variationType === "positive";
  const isNeg = variationType === "negative";

  return (
    <div
      className={`kpi-card${onClick ? " kpi-card--clickable" : ""}`}
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
      onClick={onClick}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${accent}44`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
    >
      {/* ambient glow */}
      <div
        className="kpi-card__glow"
        style={{ background: `${accent}18` }}
      />

      <div className="kpi-card__header">
        <span className="kpi-card__label">{title}</span>
        <div
          className="kpi-card__icon"
          style={{ background: `${accent}18`, color: accent }}
        >
          <Icon size={18} />
        </div>
      </div>

      <div className="kpi-card__value">{value}</div>

      {variation && (
        <span
          className={`kpi-card__variation kpi-card__variation--${
            isPos ? "positive" : isNeg ? "negative" : "neutral"
          }`}
        >
          {isPos ? <LuTrendingUp size={12} /> : isNeg ? <LuTrendingDown size={12} /> : null}
          {variation}
        </span>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const {user,token} = useAuth();

  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const [data, setData] = useState<DashboardData>({
    revenusHebdo: 0, ventesJour: 0, totalProduits: 0,
    alertesStock: 0, totalCommandes: 0, variation: "",
  });

  const [caData, setCaData] = useState<CaData>({
    mois: "", totalMois: 0, jours: [],
  });

  // ── Fetch 6 APIs ─────────────────────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    setError(null);
    try {
      const h = setHeader(token!);
      const [alertRes, prodRes, cmdRes, bilanRes, sortiesRes, caRes] = await Promise.all([
        fetch(`${BASE_URL}/stock/produit/alerts/`,      { headers: h }), // 1. Alertes stock
        fetch(`${BASE_URL}/stock/produit`,              { headers: h }), // 2. Produits
        fetch(`${BASE_URL}/vente/commande`,             { headers: h }), // 3. Commandes
        fetch(`${BASE_URL}/finance/bilan/hebdo`,        { headers: h }), // 4. Bilan hebdo
        fetch(`${BASE_URL}/stock/mouvement`,            { headers: h }), // 5. Mouvements → ventes/jour
        fetch(`${BASE_URL}/finance/ca-journalier-mois`, { headers: h }), // 6. CA du mois
      ]);

      const alertes      = (await alertRes.json()).length;
      const produits     = (await prodRes.json()).length;
      const commandes    = (await cmdRes.json()).length;
      const bilan        = await bilanRes.json();
      const mouvements   = await sortiesRes.json();
      const caJournalier = await caRes.json();

      const ventes     = mouvements.filter((v: any) => v.type?.toString() === "SORTIE" && isToday(v.date));
      const sommeVente = ventes.reduce((s: number, v: any) => s + v.prixUnitaire * v.quantite, 0);

      setData({
        revenusHebdo:   bilan?.current?.ventes || 0,
        ventesJour:     sommeVente,
        totalProduits:  produits,
        alertesStock:   alertes,
        totalCommandes: commandes,
        variation:      bilan?.variation?.ca || "",
      });
      setCaData(caJournalier);
    } catch {
      setError("Serveur inaccessible — données de démo affichées.");
      // ── Mock data ─────────────────────────────────────────────────────────
      setData({
        revenusHebdo: 14_800_000, ventesJour: 3_250_000,
        totalProduits: 148, alertesStock: 7,
        totalCommandes: 64, variation: "+12.4%",
      });
      setCaData({
        mois: "Février 2026",
        totalMois: 87_500_000,
        jours: Array.from({ length: 28 }, (_, i) => ({
          jour: `${i + 1}`,
          ca:   Math.round(Math.random() * 4_000_000 + 1_500_000),
        })),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token!]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const vt =
    data.variation?.startsWith("+") ? "positive" :
    data.variation?.startsWith("-") ? "negative" : "neutral";

  const kpis: KpiCardProps[] = [
    {
      title: "Ventes du jour",
      value: `${data.ventesJour.toLocaleString("fr-FR")} Ar`,
      icon: LuReceiptText, accent: "#4ade80",
      variation: data.variation || undefined, variationType: vt,
    },
    {
      title: "Commandes",
      value: data.totalCommandes.toLocaleString("fr-FR"),
      icon: LuShoppingCart, accent: "#60a5fa",
    },
    {
      title: "Produits en stock",
      value: data.totalProduits.toLocaleString("fr-FR"),
      icon: LuPackage, accent: "#a78bfa",
    },
    {
      title: "Alertes stock",
      value: data.alertesStock,
      icon: LuTriangleAlert,
      accent: data.alertesStock > 0 ? "#f87171" : "#6b7280",
      variation: data.alertesStock > 0 ? `${data.alertesStock} produit(s)` : "Tout est OK",
      variationType: data.alertesStock > 0 ? "negative" : "neutral",
    },
  ];

  const stockItems = [
    { label: "Produits actifs",    value: data.totalProduits,  color: "#4ade80", pct: 85 },
    { label: "Alertes critiques",  value: data.alertesStock,   color: "#f87171", pct: data.totalProduits > 0 ? Math.round((data.alertesStock / data.totalProduits) * 100) : 0 },
    { label: "Commandes en cours", value: data.totalCommandes, color: "#60a5fa", pct: 70 },
  ];

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-loading__spinner" />
      <p className="dash-loading__text">Chargement du tableau de bord…</p>
    </div>
  );

  return (
    <div className="dash-layout">

      {/* ── Sidebar (composant séparé) ──────────────────────────────────── */}
      <Sidebar
        alertesStock={data.alertesStock}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={user?.nom!}
      />

      {/* ── Topbar ─────────────────────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar__left">
          <button
            className="topbar__menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <LuX size={18} /> : <LuMenu size={18} />}
          </button>
          <div>
            <div className="topbar__title">Tableau de bord</div>
            <div className="topbar__subtitle">
              {caData.mois ||
                new Date().toLocaleDateString("fr-FR", {
                  month: "long",
                  year: "numeric",
                })}
            </div>
          </div>
        </div>

        <div className="topbar__right">
          {error && (
            <span className="topbar__demo-badge">Démo</span>
          )}
          <button
            className={`topbar__refresh-btn${refreshing ? " topbar__refresh-btn--spinning" : ""}`}
            onClick={() => { setRefreshing(true); fetchDashboard(); }}
            disabled={refreshing}
          >
            <LuRefreshCw size={14} />
            {refreshing ? "Actualisation…" : "Actualiser"}
          </button>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="main-content">

        {/* KPI Grid */}
        <div className="kpi-grid">
          {kpis.map((card) => (
            <KpiCard key={card.title} {...card} />
          ))}
        </div>

        {/* CA Chart Card */}
        <div className="chart-card">
          <div className="chart-card__glow-top" />
          <div className="chart-card__glow-bottom" />

          <div className="chart-card__header">
            <div className="chart-card__title-group">
              <div className="chart-card__dot-row">
                <div className="chart-card__dot" />
                <span className="chart-card__label">Chiffre d'affaires</span>
              </div>
              <span className="chart-card__subtitle">
                Revenus journaliers — {caData.mois}
              </span>
            </div>
            <div className="chart-card__live-badge">
              <LuActivity size={14} />
              Live
            </div>
          </div>

          <div className="chart-card__amount">
            <span className="chart-card__amount-value">
              {caData.totalMois.toLocaleString("fr-FR")}
            </span>
            <span className="chart-card__amount-unit">Ar</span>
            <div className="chart-card__stats-row">
              <span className="chart-card__stat">
                ↑ Max {fmtAr(Math.max(...caData.jours.map((d) => d.ca), 1))} Ar
              </span>
              <span className="chart-card__stat">
                ~ Moy {fmtAr(Math.round(caData.totalMois / Math.max(caData.jours.length, 1)))} Ar
              </span>
            </div>
          </div>

          <CaLineChart jours={caData.jours} />
        </div>

        {/* Bottom row */}
        <div className="bottom-row">

          {/* Revenus hebdo */}
          <div className="bottom-card">
            <div className="bottom-card__title">Revenus hebdomadaires</div>
            <div className="hebdo-card__amount">
              {data.revenusHebdo.toLocaleString("fr-FR")}
              <span className="hebdo-card__amount-unit">Ar</span>
            </div>
            <div className="hebdo-card__bar-track">
              <div className="hebdo-card__bar-fill" />
            </div>
            <div className="hebdo-card__caption">65% de l'objectif mensuel</div>
          </div>

          {/* Stock status */}
          <div className="bottom-card">
            <div className="bottom-card__title stock-card__title">Statut du stock</div>
            {stockItems.map((item) => (
              <div key={item.label} className="stock-item">
                <div className="stock-item__row">
                  <span className="stock-item__label">{item.label}</span>
                  <span className="stock-item__value" style={{ color: item.color }}>
                    {item.value}
                  </span>
                </div>
                <div className="stock-item__bar-track">
                  <div
                    className="stock-item__bar-fill"
                    style={{
                      width: `${Math.min(item.pct, 100)}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}