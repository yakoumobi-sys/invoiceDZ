"use client";
import { useEffect, useRef, useState } from "react";
import { T } from "../lib/constants";

export function Btn({ children, onClick, variant = "default", size = "md", style = {}, disabled, title, type = "button" }) {
  const [h, setH] = useState(false);
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, border: "none", cursor: disabled ? "not-allowed" : "pointer", borderRadius: 9, fontWeight: 600, fontFamily: "inherit", transition: "all .15s", whiteSpace: "nowrap", opacity: disabled ? 0.55 : 1 };
  const sizes = { sm: { padding: "7px 13px", fontSize: 12.5 }, md: { padding: "10px 18px", fontSize: 14 }, lg: { padding: "14px 28px", fontSize: 16 } };
  const variants = {
    default: { background: h ? "#ECF1EB" : T.white, color: T.ink, border: "1px solid " + T.border, boxShadow: "0 1px 2px rgba(19,37,30,.06)" },
    primary: { background: h ? T.accentDark : T.accent, color: "#fff", boxShadow: "0 2px 10px rgba(28,74,61,.28)" },
    leaf:    { background: h ? T.leafDark : T.leaf, color: "#fff", boxShadow: "0 2px 10px rgba(99,190,58,.3)" },
    ghost:   { background: h ? "#ECF1EB" : "transparent", color: T.inkMid, border: "none" },
    danger:  { background: h ? "#FBDBD8" : "#FDEEEC", color: T.danger, border: "1px solid #F5C9C4" },
    success: { background: h ? "#DBF0DC" : "#EAF6EB", color: T.success, border: "1px solid #C4E4C6" },
  };
  return (
    <button type={type} title={title} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      onClick={onClick} disabled={disabled}
      style={{ ...base, ...sizes[size], ...(variants[variant] || variants.default), ...style }}>
      {children}
    </button>
  );
}

export function Input({ value, onChange, placeholder, type = "text", style = {}, list, min, step, onBlurValue }) {
  return (
    <input type={type} value={value} list={list} min={min} step={step}
      onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      onBlur={onBlurValue ? (e) => onBlurValue(e.target.value) : undefined}
      style={{ background: T.white, border: "1px solid " + T.border, borderRadius: 9, color: T.ink, padding: "10px 13px", fontSize: 14, width: "100%", boxSizing: "border-box", fontFamily: "inherit", outline: "none", transition: "border-color .12s", ...style }}
      onFocus={(e) => (e.target.style.borderColor = T.leafDark)}
      onBlurCapture={(e) => (e.target.style.borderColor = T.border)} />
  );
}

export function Textarea({ value, onChange, placeholder, rows = 3, style = {} }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ background: T.white, border: "1px solid " + T.border, borderRadius: 9, color: T.ink, padding: "10px 13px", fontSize: 14, width: "100%", boxSizing: "border-box", fontFamily: "inherit", outline: "none", resize: "vertical", ...style }} />
  );
}

export function Sel({ value, onChange, options, style = {} }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ background: T.white, border: "1px solid " + T.border, borderRadius: 9, color: T.ink, padding: "10px 12px", fontSize: 14, width: "100%", fontFamily: "inherit", outline: "none", ...style }}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Toggle({ on, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!on)} aria-pressed={on}
      style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
      <span style={{ width: 38, height: 21, borderRadius: 11, background: on ? T.leafDark : "#CFD8CE", position: "relative", transition: "background .18s", flexShrink: 0 }}>
        <span style={{ width: 15, height: 15, borderRadius: 8, background: "#fff", position: "absolute", top: 3, left: on ? 20 : 3, transition: "left .18s", boxShadow: "0 1px 2px rgba(0,0,0,.25)" }} />
      </span>
      {label && <span style={{ fontSize: 13, color: T.inkMid }}>{label}</span>}
    </button>
  );
}

export function Badge({ label, color }) {
  return (
    <span style={{ background: color + "16", color, border: "1px solid " + color + "30", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

export function Lbl({ children }) {
  return <div style={{ color: T.inkLight, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>{children}</div>;
}

export function Card({ children, style, onClick, onMouseEnter, onMouseLeave, id }) {
  return (
    <div id={id} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
      style={{ background: T.white, border: "1px solid " + T.border, borderRadius: 13, padding: 22, ...(style || {}) }}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, color = T.ink, icon }) {
  return (
    <Card style={{ padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, color: T.inkLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 7 }}>{label}</div>
          <div style={{ fontSize: typeof value === "number" ? 26 : 16, fontWeight: 800, color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
          {sub && <div style={{ fontSize: 11.5, color: T.inkLight, marginTop: 4 }}>{sub}</div>}
        </div>
        {icon && <span style={{ fontSize: 20, opacity: 0.85 }}>{icon}</span>}
      </div>
    </Card>
  );
}

export function Logo({ size = 30, withText = true }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
      <img src="/logo.jpg" alt="invoicedz" style={{ height: size + 8, width: "auto", borderRadius: 7, display: "block" }} />
      {withText && (
        <span style={{ fontWeight: 800, fontSize: size * 0.6, letterSpacing: -0.5, color: T.ink }}>
          invoice<span style={{ color: T.leafDark }}>dz</span>
        </span>
      )}
    </span>
  );
}

export function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
      <div style={{ width: 32, height: 32, border: "3px solid " + T.border, borderTop: "3px solid " + T.leafDark, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export function Empty({ icon = "📄", text, action }) {
  return (
    <Card style={{ textAlign: "center", padding: 52 }}>
      <div style={{ fontSize: 38, marginBottom: 12 }}>{icon}</div>
      <div style={{ color: T.inkLight, fontSize: 15, marginBottom: action ? 18 : 0 }}>{text}</div>
      {action}
    </Card>
  );
}

/* ── Modale accessible (Échap, clic hors zone) ── */
export function Modal({ open, onClose, title, children, width = 520 }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(15,28,23,.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div role="dialog" aria-modal="true"
        style={{ background: T.white, borderRadius: 15, width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto", padding: 24, boxShadow: "0 18px 60px rgba(0,0,0,.25)", animation: "fadeUp .22s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>{title}</div>
          <button onClick={onClose} aria-label="Fermer"
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.inkLight, padding: 4, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Menu déroulant (⋯) ── */
export function Menu({ items, label = "⋯" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <span ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }} aria-label="Actions"
        style={{ background: open ? "#ECF1EB" : "transparent", border: "1px solid " + (open ? T.border : "transparent"), borderRadius: 8, padding: "4px 10px", fontSize: 16, cursor: "pointer", color: T.inkMid, fontWeight: 700 }}>
        {label}
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: T.white, border: "1px solid " + T.border, borderRadius: 11, boxShadow: "0 10px 34px rgba(0,0,0,.14)", minWidth: 190, zIndex: 250, padding: 5, animation: "fadeUp .14s ease" }}>
          {items.filter(Boolean).map((it, i) =>
            it === "—" ? <div key={i} style={{ height: 1, background: T.border, margin: "5px 6px" }} /> : (
              <button key={i} onClick={(e) => { e.stopPropagation(); setOpen(false); it.onClick(); }}
                style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", background: "none", border: "none", textAlign: "left", padding: "9px 11px", fontSize: 13.5, cursor: "pointer", borderRadius: 8, color: it.danger ? T.danger : T.ink, fontWeight: 500 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = it.danger ? "#FDEEEC" : "#F0F5EF")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
                <span style={{ width: 18, textAlign: "center" }}>{it.icon}</span>{it.label}
              </button>
            ))}
        </div>
      )}
    </span>
  );
}

/* ── Toast ── */
export function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", background: T.ink, color: "#fff", padding: "11px 20px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, zIndex: 400, boxShadow: "0 10px 30px rgba(0,0,0,.3)", animation: "fadeUp .25s ease", maxWidth: "90vw" }}>
      {msg}
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState("");
  const t = useRef(null);
  const show = (m) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(""), 2600);
  };
  return [msg, show];
}
