"use client";
import { useState } from "react";
import { T } from "../lib/constants";

export function Btn({ children, onClick, variant, size, style, disabled }) {
  variant = variant || "default"; size = size || "md"; style = style || {};
  const [h, setH] = useState(false);
  const base = { display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, border:"none", cursor:disabled?"not-allowed":"pointer", borderRadius:8, fontWeight:600, fontFamily:"inherit", transition:"all .15s", whiteSpace:"nowrap", opacity:disabled?.5:1 };
  const sizes = { sm:{padding:"7px 14px",fontSize:12}, md:{padding:"10px 20px",fontSize:14}, lg:{padding:"14px 32px",fontSize:16} };
  const variants = {
    default: { background:h?"#EFEFED":T.white, color:T.ink, border:"1px solid "+T.border, boxShadow:"0 1px 2px rgba(0,0,0,.06)" },
    primary: { background:h?T.accentDark:T.accent, color:"#fff", boxShadow:"0 2px 8px rgba(26,107,255,.3)" },
    ghost:   { background:"transparent", color:T.inkLight, border:"none" },
    danger:  { background:h?"#FEE2E2":"#FEF2F2", color:T.danger, border:"1px solid #FECACA" },
    success: { background:h?"#DCFCE7":"#F0FDF4", color:T.success, border:"1px solid #BBF7D0" },
  };
  return (
    <button onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      onClick={onClick} disabled={disabled}
      style={{...base,...sizes[size],...(variants[variant]||variants.default),...style}}>
      {children}
    </button>
  );
}

export function Input({ value, onChange, placeholder, type, style }) {
  type = type || "text"; style = style || {};
  return (
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{background:T.white,border:"1px solid "+T.border,borderRadius:8,color:T.ink,padding:"10px 14px",fontSize:14,width:"100%",boxSizing:"border-box",fontFamily:"inherit",outline:"none",...style}}
      onFocus={e=>e.target.style.borderColor=T.accent}
      onBlur={e=>e.target.style.borderColor=T.border} />
  );
}

export function Sel({ value, onChange, options }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{background:T.white,border:"1px solid "+T.border,borderRadius:8,color:T.ink,padding:"10px 14px",fontSize:14,width:"100%",fontFamily:"inherit",outline:"none"}}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Badge({ label, color }) {
  return (
    <span style={{background:color+"18",color,border:"1px solid "+color+"30",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700}}>
      {label}
    </span>
  );
}

export function Lbl({ children }) {
  return <div style={{color:T.inkLight,fontSize:11,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>{children}</div>;
}

export function Card({ children, style, onClick, onMouseEnter, onMouseLeave }) {
  return (
    <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
      style={{background:T.white,border:"1px solid "+T.border,borderRadius:12,padding:24,...(style||{})}}>
      {children}
    </div>
  );
}

export function Logo() {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{width:30,height:30,background:T.accent,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{color:"#fff",fontSize:16,fontWeight:900}}>i</span>
      </div>
      <span style={{fontWeight:800,fontSize:18,letterSpacing:-.5,color:T.ink}}>
        Invoice<span style={{color:T.accent}}>DZ</span>
      </span>
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:48}}>
      <div style={{width:32,height:32,border:"3px solid "+T.border,borderTop:"3px solid "+T.accent,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
