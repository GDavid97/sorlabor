import { useEffect, useState, type ReactNode } from 'react';

import { dec, sg as fmtGravity, huf } from '../i18n';

export const fmt = (n: number, d = 1) => dec(n, d);
export const fmtSG = (g: number) => fmtGravity(g);
export const fmtHuf = (n: number) => huf(n);

interface NumProps {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  ariaLabel?: string;
  width?: number | string;
}

/** Számmező, ami engedi a gépelés közbeni üres / félkész értéket (és a vesszőt). */
export function Num({ value, onChange, step = 1, min, max, suffix, ariaLabel, width }: NumProps) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    const parsed = parseFloat(text.replace(',', '.'));
    if (parsed !== value) setText(String(Math.round(value * 1000) / 1000));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const commit = (t: string) => {
    let v = parseFloat(t.replace(',', '.'));
    if (!Number.isFinite(v)) return;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    onChange(v);
  };
  return (
    <label className="num" style={{ width }}>
      <input
        inputMode="decimal"
        aria-label={ariaLabel}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          commit(e.target.value);
        }}
        onBlur={() => setText(String(Math.round(value * 1000) / 1000))}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const v = Math.round((value + (e.key === 'ArrowUp' ? step : -step)) * 1000) / 1000;
            commit(String(v));
            setText(String(Math.max(min ?? -Infinity, Math.min(max ?? Infinity, v))));
          }
        }}
      />
      {suffix && <span>{suffix}</span>}
    </label>
  );
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: ReactNode; count?: number }[];
  active: T;
  onChange: (t: T) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          className={`tab ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count !== undefined && t.count > 0 && <span className="count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

/** Opcionális szám (üresen hagyható) – mérésekhez. `gravity` módban 1050 / 12,5 °P is elfogadott. */
export function OptNum({
  value,
  onChange,
  suffix,
  placeholder,
  parse,
  ariaLabel,
  big,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  suffix?: string;
  placeholder?: string;
  parse?: (v: number) => number | undefined;
  ariaLabel?: string;
  big?: boolean;
}) {
  const show = (v: number | undefined) => (v === undefined ? '' : parse ? dec(v, 3) : dec(v, v % 1 ? 2 : 0).replace(/([.,]\d*?)0+$/, '$1').replace(/[.,]$/, ''));
  const [text, setText] = useState(show(value));
  useEffect(() => {
    setText((t) => {
      const p = parseFloat(t.replace(',', '.'));
      const cur = Number.isFinite(p) ? (parse ? parse(p) : p) : undefined;
      return cur === value ? t : show(value);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <label className={`num ${big ? 'num-big' : ''}`}>
      <input
        inputMode="decimal"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const p = parseFloat(e.target.value.replace(',', '.'));
          if (e.target.value.trim() === '') onChange(undefined);
          else if (Number.isFinite(p)) {
            const v = parse ? parse(p) : p;
            if (v !== undefined) onChange(v);
          }
        }}
        onBlur={() => setText(show(value))}
      />
      {suffix && <span>{suffix}</span>}
    </label>
  );
}
