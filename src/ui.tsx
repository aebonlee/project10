import { useState, useEffect, type ReactNode, type CSSProperties } from 'react';

/** localStorage 동기화 state */
export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => {
    try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ } }, [key, val]);
  return [val, setVal];
}

export interface Meta { id: number; icon: string; title: string; tagline: string; members: string[]; color: string; note?: string; }

/** 앱 상단 히어로 헤더 */
export const Hero = ({ m }: { m: Meta }) => (
  <header className="hero" style={{ borderLeft: `5px solid ${m.color}` }}>
    <span className="hero-ic" style={{ background: `${m.color}1a` }}>{m.icon}</span>
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', fontWeight: 800, color: m.color }}>PROJECT {String(m.id).padStart(2, '0')}</span>
        {m.note && <span style={{ fontSize: '11px', color: 'var(--faint)' }}>· {m.note}</span>}
      </div>
      <h1>{m.title}</h1>
      <p style={{ margin: 0, color: 'var(--sub)', fontSize: '14px' }}>{m.tagline}</p>
      {m.members.length > 0 && <p style={{ margin: '8px 0 0', fontSize: '12.5px', color: 'var(--faint)' }}>팀원 {m.members.join(' · ')}</p>}
    </div>
  </header>
);

export const Chip = ({ active, color = 'var(--primary)', onClick, children }: { active: boolean; color?: string; onClick: () => void; children: ReactNode }) => (
  <button type="button" onClick={onClick} style={{
    padding: '8px 14px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', borderRadius: '999px',
    border: '1px solid', borderColor: active ? color : 'var(--border)', background: active ? color : 'var(--card)', color: active ? '#fff' : 'var(--sub)',
  }}>{children}</button>
);

export const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label>{label}{hint && <span style={{ fontWeight: 400, color: 'var(--faint)', marginLeft: '6px', fontSize: '12.5px' }}>{hint}</span>}</label>
    {children}
  </div>
);

export const Pill = ({ color = 'var(--primary)', children }: { color?: string; children: ReactNode }) => (
  <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff', background: color, padding: '2px 9px', borderRadius: '999px', whiteSpace: 'nowrap' }}>{children}</span>
);

export const Stack = ({ gap = 18, children }: { gap?: number; children: ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap }}>{children}</div>
);
export const Row = ({ gap = 16, children }: { gap?: number; children: ReactNode }) => (
  <div style={{ display: 'flex', gap, flexWrap: 'wrap' }}>{children}</div>
);
export const Box = ({ style, children }: { style?: CSSProperties; children: ReactNode }) => (
  <div className="box" style={style}>{children}</div>
);
