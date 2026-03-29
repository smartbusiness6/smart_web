// src/components/notifications/NotificationToast.tsx
import { useEffect, useState } from 'react';

export type NotificationType = 'ALERT' | 'INFO' | 'WARNING' | 'SUCCESS';

export interface NotificationPayload {
  icon: string;
  message: string;
  typeNotif: NotificationType;
  emitType: 'PRIVATE' | 'PUBLIC';
  idEntreprise?: number;
  data?: any;
  createdAt?: string;
  socketEvent: string;
}

interface ToastItem extends NotificationPayload {
  id: number;
}

const ICONS: Record<string, string> = {
  email:       '📧',
  alert:       '🚨',
  information: 'ℹ️',
  success:     '✅',
  warning:     '⚠️',
  stock:       '📦',
  'truck-fast':'🚚',
  user:        '👤',
  money:       '💰',
};

const COLORS: Record<NotificationType, string> = {
  SUCCESS: '#04957d',
  INFO:    '#3f96d1',
  WARNING: '#f59e0b',
  ALERT:   '#ef4444',
};

const LABELS: Record<NotificationType, string> = {
  SUCCESS: 'Succès',
  INFO:    'Information',
  WARNING: 'Attention',
  ALERT:   'Alerte',
};

interface Props {
  toasts: ToastItem[];
  onRemove: (id: number) => void;
}

export const NotificationToast = ({ toasts, onRemove }: Props) => {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '360px',
      width: '100%',
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => (
        <div key={toast.id} style={{
          backgroundColor: '#ffffff',
          border: `1px solid ${COLORS[toast.typeNotif]}22`,
          borderLeft: `4px solid ${COLORS[toast.typeNotif]}`,
          borderRadius: '10px',
          padding: '14px 16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          pointerEvents: 'all',
          animation: 'toastSlideIn 0.3s ease',
        }}>

          {/* Icône */}
          <span style={{ fontSize: '22px', lineHeight: 1, flexShrink: 0 }}>
            {ICONS[toast.icon] ?? '🔔'}
          </span>

          {/* Contenu */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0,
              fontSize: '13px',
              fontWeight: 700,
              color: COLORS[toast.typeNotif],
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {LABELS[toast.typeNotif]}
            </p>
            <p style={{
              margin: '4px 0 0',
              fontSize: '13px',
              color: '#333',
              lineHeight: 1.5,
            }}>
              {toast.message}
            </p>
            {toast.createdAt && (
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#aaa' }}>
                {new Date(toast.createdAt).toLocaleTimeString('fr-FR')}
              </p>
            )}
          </div>

          {/* Barre de progression + bouton fermer */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => onRemove(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#bbb',
                padding: 0,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Barre de progression auto-close */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            borderRadius: '0 0 10px 10px',
            backgroundColor: COLORS[toast.typeNotif],
            animation: 'toastProgress 5s linear forwards',
          }} />
        </div>
      ))}

      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// ── Hook pour gérer la liste des toasts ─────────────────────────
let _toastCounter = 0;

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (payload: NotificationPayload) => {
    const id = Date.now() + _toastCounter++;
    setToasts(prev => [...prev, { ...payload, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}