"use client";
import { useState } from "react";
// ─── DESIGN TOKENS ────────────────────────────────────────────────────
const T = {
  white: "#FFFFFF",
  bg: "#F8F8F6",
  surface: "#FFFFFF",
  ink: "#111110",
  inkMid: "#444440",
  inkLight: "#888884",
  border: "#E4E4E0",
  borderStrong: "#C8C8C4",
  accent: "#1A6BFF",
  accentHover: "#0050E0",
  accentBg: "#EEF4FF",
  success: "#16A34A",
  successBg: "#F0FDF4",
  warning: "#D97706",
  warningBg: "#FFFBEB",
  danger: "#DC2626",
  dangerBg: "#FEF2F2",
  purple: "#7C3AED",
};

const DOC_TYPES = {
  FACTURE:      { label: "Facture",           prefix: "FAC", color: T.success,  icon: "🧾" },
  PROFORMA:     { label: "Facture Proforma",  prefix: "PRO", color: T.accent,   icon: "📋" },
  DEVIS:        { label: "Devis",             prefix: "DEV", color: T.purple,   icon: "📝" },
  BON_COMMANDE: { label: "Bon de Commande",   prefix: "BC",  color: T.warning,  icon: "🛒" },
  BON_LIVRAISON:{ label: "Bon de Livraison",  prefix: "BL",  color: T.inkMid,   icon: "🚚" },
};

const STATUTS = {
  BROUILLON:  { label: "Brouillon",   color: T.inkLight },
  ENVOYE:     { label: "Envoyé",      color: T.accent },
  ACCEPTE:    { label: "Accepté",     color: T.success },
  REFUSE:     { label: "Refusé",      color: T.danger },
  PAYE:       { label: "Payé",        color: T.success },
  PARTIEL:    { label: "Partiel",     color: T.warning },
  EN_ATTENTE: { label: "En attente",  color: T.warning },
  LIVRE:      { label: "Livré",       color: T.success },
};

const STATUTS_PAR_TYPE = {
  FACTURE:       ["BROUILLON","ENVOYE","PAYE","PARTIEL"],
  PROFORMA:      ["BROUILLON","ENVOYE","ACCEPTE","REFUSE"],
  DEVIS:         ["BROUILLON","ENVOYE","ACCEPTE","REFUSE"],
  BON_COMMANDE:  ["BROUILLON","ENVOYE","EN_ATTENTE","ACCEPTE"],
  BON_LIVRAISON: ["BROUILLON","ENVOYE","LIVRE"],
};

const COMPANY = { nom: "InvoiceDZ", site: "invoicedz.dz", email: "contact@invoicedz.dz" };

// ─── HELPERS ──────────────────────────────────────────────────────────
const emptyLigne = () => ({ id: Math.random(), designation: "", quantite: 1, unite: "Unité", prixUnitaire: 0, remise: 0, tva: 19 });
const newDoc = (type = "FACTURE") => ({
  id: Math.random(), type,
  numero: `${DOC_TYPES[type].prefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random()*900)+100)}`,
  statut: "BROUILLON",
  date: new Date().toISOString().split("T")[0],
  dateEcheance: "",
  client: { nom: "", adresse: "", ville: "", email: "", telephone: "", nif: "" },
  lignes: [emptyLigne()],
  notes: "", conditionsPaiement: "Virement / BaridiMob",
  remiseGlobale: 0, tvaActive: true,
  entreprise: { nom: "", adresse: "", ville: "", telephone: "", email: "", nif: "", rc: "", ai: "", idFiscal: "", code: "" },
});

const calcLigne = l => { const ht = l.quantite * l.prixUnitaire * (1 - l.remise/100); return { ht, tva: ht*(l.tva/100), ttc: ht*(1+l.tva/100) }; };
const calcTotaux = (lignes, rem=0, tva=true) => {
  const sous = lignes.reduce((s,l)=>s+calcLigne(l).ht,0);
  const remAmt = sous*(rem/100);
  const base = sous - remAmt;
  const totalTVA = tva ? lignes.reduce((s,l)=>s+calcLigne(l).tva,0)*(1-rem/100) : 0;
  return { sous, remAmt, base, totalTVA, ttc: base+totalTVA };
};
const fmtDA = n => new Intl.NumberFormat("fr-DZ",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+" DA";

// ─── UI PRIMITIVES ────────────────────────────────────────────────────
const css = (obj) => Object.entries(obj).map(([k,v])=>`${k.replace(/([A-Z])/g,m=>'-'+m.toLowerCase())}:${v}`).join(';');

function Btn({ children, onClick, variant="default", size="md", style={} }) {
  const [hover, setHover] = useState(false);
  const base = { display:"inline-flex", alignItems:"center", gap:6, border:"none", cursor:"pointer", borderRadius:8, fontWeight:600, fontFamily:"inherit", transition:"all .15s", whiteSpace:"nowrap" };
  const sizes = { sm:{padding:"6px 14px",fontSize:12}, md:{padding:"10px 20px",fontSize:14}, lg:{padding:"14px 32px",fontSize:16} };
  const variants = {
    default: { background: hover?"#F0F0EE":T.white, color:T.ink, border:`1px solid ${T.border}`, boxShadow:"0 1px 2px rgba(0,0,0,.06)" },
    primary: { background: hover?T.accentHover:T.accent, color:T.white, boxShadow:"0 2px 8px rgba(26,107,255,.25)" },
    ghost:   { background:"transparent", color:T.inkLight, border:"none" },
    danger:  { background: hover?"#FEE2E2":T.dangerBg, color:T.danger, border:`1px solid #FECACA` },
  };
  return <button onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onClick={onClick} style={{...base,...sizes[size],...variants[variant],...style}}>{children}</button>;
}

function Input({ value, onChange, placeholder, type="text", style={} }) {
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:7,color:T.ink,padding:"9px 12px",fontSize:14,width:"100%",boxSizing:"border-box",fontFamily:"inherit",outline:"none",transition:"border .15s",...style}}
    onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border} />;
}

function Select({ value, onChange, options, style={} }) {
  return <select value={value} onChange={e=>onChange(e.target.value)}
    style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:7,color:T.ink,padding:"9px 12px",fontSize:14,width:"100%",fontFamily:"inherit",outline:"none",...style}}>
    {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
  </select>;
}

function Badge({ label, color }) {
  return <span style={{background:color+"18",color,border:`1px solid ${color}30`,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,letterSpacing:.3}}>{label}</span>;
}

function Label({ children }) {
  return <div style={{color:T.inkLight,fontSize:11,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>{children}</div>;
}

function Card({ children, style={} }) {
  return <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:12,padding:24,...style}}>{children}</div>;
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────
function Landing({ onEnter }) {
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    { q: "Est-ce que c'est gratuit ?", a: "Oui, le plan gratuit permet de créer jusqu'à 5 documents par mois. Le plan Pro à 1 990 DA/mois est illimité." },
    { q: "Mes données sont-elles sécurisées ?", a: "Toutes vos données sont chiffrées et hébergées en Algérie. Vous pouvez exporter ou supprimer vos données à tout moment." },
    { q: "Puis-je personnaliser mes documents avec mon logo ?", a: "Oui, sur le plan Pro vous pouvez ajouter votre logo, vos couleurs et vos coordonnées bancaires." },
    { q: "Comment fonctionne la TVA algérienne ?", a: "InvoiceDZ est configuré pour la TVA algérienne (19% standard). Vous pouvez aussi la désactiver pour les entreprises exonérées." },
    { q: "Puis-je exporter en PDF ?", a: "Oui, chaque document peut être exporté en PDF prêt à imprimer ou à envoyer par email." },
  ];

  const features = [
    { icon:"🧾", title:"5 types de documents", desc:"Facture, Proforma, Devis, Bon de Commande, Bon de Livraison — tout en un seul endroit." },
    { icon:"⚡", title:"Création en 30 secondes", desc:"Interface épurée, sans friction. Remplissez, prévisualisez, exportez." },
    { icon:"🇩🇿", title:"Conforme Algérie", desc:"TVA 19%, NIF, BaridiMob, CCP — pensé pour les entreprises algériennes." },
    { icon:"📊", title:"Tableau de bord", desc:"Suivez vos documents, montants en attente et clients en un coup d'œil." },
    { icon:"🔒", title:"Données sécurisées", desc:"Vos documents sont sauvegardés et accessibles depuis n'importe quel appareil." },
    { icon:"🖨️", title:"Export PDF", desc:"Documents professionnels prêts à imprimer ou à envoyer par email." },
  ];

  return (
    <div style={{background:T.bg,minHeight:"100vh",fontFamily:"system-ui,-apple-system,sans-serif",color:T.ink}}>

      {/* NAV */}
      <nav style={{background:T.white,borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 24px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,background:T.accent,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"#fff",fontSize:14,fontWeight:900}}>i</span>
            </div>
            <span style={{fontWeight:800,fontSize:17,letterSpacing:-.5}}>Invoice<span style={{color:T.accent}}>DZ</span></span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Btn variant="ghost" size="sm">Connexion</Btn>
            <Btn variant="primary" size="sm" onClick={onEnter}>Essayer gratuitement</Btn>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{maxWidth:1100,margin:"0 auto",padding:"80px 24px 60px",textAlign:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:T.accentBg,border:`1px solid ${T.accent}30`,borderRadius:20,padding:"6px 16px",marginBottom:32}}>
          <span style={{width:6,height:6,borderRadius:3,background:T.accent,display:"inline-block"}}/>
          <span style={{fontSize:12,color:T.accent,fontWeight:600}}>Nouveau · Facturation en ligne pour l'Algérie</span>
        </div>

        <h1 style={{fontSize:"clamp(36px,6vw,64px)",fontWeight:900,lineHeight:1.08,letterSpacing:-2,marginBottom:24,color:T.ink}}>
          Vos factures algériennes,<br/>
          <span style={{color:T.accent}}>sans perdre de temps.</span>
        </h1>

        <p style={{fontSize:18,color:T.inkMid,maxWidth:520,margin:"0 auto 40px",lineHeight:1.6}}>
          Créez des factures, devis et bons de livraison conformes en quelques secondes. Conçu pour les PME et indépendants algériens.
        </p>

        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:60}}>
          <Btn variant="primary" size="lg" onClick={onEnter}>Créer ma première facture →</Btn>
          <Btn size="lg">Voir une démo</Btn>
        </div>

        {/* Fake doc preview */}
        <div style={{maxWidth:720,margin:"0 auto",background:T.white,border:`1px solid ${T.border}`,borderRadius:16,padding:32,boxShadow:"0 8px 40px rgba(0,0,0,.08)",textAlign:"left"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
            <div>
              <div style={{fontWeight:900,fontSize:18,letterSpacing:-0.5,marginBottom:4}}>Entreprise SARL</div>
              <div style={{fontSize:12,color:T.inkLight}}>Alger, Algérie · NIF: 099123456789000</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{background:T.success,color:"#fff",borderRadius:6,padding:"4px 12px",fontSize:11,fontWeight:700,marginBottom:8}}>FACTURE</div>
              <div style={{fontWeight:700,fontSize:16}}>FAC-2025-001</div>
              <div style={{fontSize:12,color:T.inkLight,marginTop:4}}>15 juin 2025</div>
            </div>
          </div>
          <div style={{borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`,padding:"16px 0",marginBottom:16}}>
            {[["Personnalisation T-shirts DTF (50 pcs)","50","Unité","1 200","60 000"],["Broderie logo entreprise (10 pcs)","10","Unité","3 500","35 000"]].map(([d,q,u,p,t],i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"3fr 1fr 1fr 1fr 1fr",gap:8,padding:"8px 0",fontSize:13,color:i===0?T.ink:T.inkMid}}>
                <span>{d}</span><span style={{textAlign:"center"}}>{q}</span><span style={{textAlign:"center"}}>{u}</span><span style={{textAlign:"right"}}>{p}</span><span style={{textAlign:"right",fontWeight:600}}>{t}</span>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <div style={{minWidth:220}}>
              {[["Sous-total HT","95 000 DA"],["TVA 19%","18 050 DA"]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:13,color:T.inkLight,marginBottom:4}}><span>{l}</span><span>{v}</span></div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:16,borderTop:`2px solid ${T.ink}`,paddingTop:8,marginTop:8}}><span>TOTAL TTC</span><span style={{color:T.accent}}>113 050 DA</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{background:T.ink,padding:"48px 24px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:32,textAlign:"center"}}>
          {[["500+","Entreprises utilisatrices"],["5 types","De documents supportés"],["100%","Conforme fiscalité algérienne"]].map(([n,l])=>(
            <div key={l}>
              <div style={{fontSize:40,fontWeight:900,color:T.white,letterSpacing:-1}}>{n}</div>
              <div style={{fontSize:14,color:"#888",marginTop:6}}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{maxWidth:1100,margin:"0 auto",padding:"80px 24px"}}>
        <div style={{textAlign:"center",marginBottom:56}}>
          <div style={{fontSize:12,fontWeight:700,color:T.accent,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Fonctionnalités</div>
          <h2 style={{fontSize:36,fontWeight:800,letterSpacing:-1}}>Tout ce qu'il vous faut, rien de superflu.</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20}}>
          {features.map(f=>(
            <Card key={f.title} style={{transition:"box-shadow .2s",cursor:"default"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.1)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
              <div style={{fontSize:28,marginBottom:14}}>{f.icon}</div>
              <div style={{fontWeight:700,fontSize:16,marginBottom:8}}>{f.title}</div>
              <div style={{color:T.inkLight,fontSize:14,lineHeight:1.6}}>{f.desc}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* DOC TYPES */}
      <section style={{background:T.white,borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`,padding:"64px 24px"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <h2 style={{fontSize:32,fontWeight:800,letterSpacing:-.8}}>5 documents, une seule plateforme.</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:16}}>
            {Object.entries(DOC_TYPES).map(([k,t])=>(
              <div key={k} style={{textAlign:"center",padding:"24px 16px",borderRadius:12,border:`1px solid ${t.color}30`,background:t.color+"08"}}>
                <div style={{fontSize:32,marginBottom:12}}>{t.icon}</div>
                <div style={{fontWeight:700,fontSize:13,color:t.color}}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{maxWidth:1100,margin:"0 auto",padding:"80px 24px"}}>
        <div style={{textAlign:"center",marginBottom:56}}>
          <div style={{fontSize:12,fontWeight:700,color:T.accent,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Tarifs</div>
          <h2 style={{fontSize:36,fontWeight:800,letterSpacing:-1}}>Simple et transparent.</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,maxWidth:700,margin:"0 auto"}}>
          {[
            { name:"Gratuit", price:"0 DA", period:"/mois", features:["5 documents/mois","Tous les types de documents","Export PDF","Support email"], cta:"Commencer", variant:"default" },
            { name:"Pro", price:"1 990 DA", period:"/mois", features:["Documents illimités","Logo personnalisé","Multi-entreprises","Priorité support","Statistiques avancées"], cta:"Essayer Pro", variant:"primary", highlight:true },
          ].map(p=>(
            <div key={p.name} style={{background:p.highlight?T.ink:T.white,border:`1px solid ${p.highlight?T.ink:T.border}`,borderRadius:16,padding:32,position:"relative"}}>
              {p.highlight && <div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:T.accent,color:"#fff",borderRadius:20,padding:"4px 16px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>Le plus populaire</div>}
              <div style={{color:p.highlight?"#888":T.inkLight,fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>{p.name}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:24}}>
                <span style={{fontSize:36,fontWeight:900,color:p.highlight?T.white:T.ink}}>{p.price}</span>
                <span style={{color:p.highlight?"#666":T.inkLight,fontSize:14}}>{p.period}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
                {p.features.map(f=>(
                  <div key={f} style={{display:"flex",gap:8,alignItems:"center",fontSize:14,color:p.highlight?"#CCC":T.inkMid}}>
                    <span style={{color:p.highlight?T.accent:T.success,fontWeight:700}}>✓</span>{f}
                  </div>
                ))}
              </div>
              <Btn variant={p.variant} style={{width:"100%",justifyContent:"center"}} onClick={onEnter}>{p.cta}</Btn>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{background:T.white,borderTop:`1px solid ${T.border}`,padding:"64px 24px"}}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <h2 style={{fontSize:32,fontWeight:800,letterSpacing:-.8}}>Questions fréquentes</h2>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {faqs.map((f,i)=>(
              <div key={i} style={{borderBottom:`1px solid ${T.border}`,overflow:"hidden"}}>
                <button onClick={()=>setActiveFaq(activeFaq===i?null:i)} style={{width:"100%",background:"none",border:"none",padding:"18px 0",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",fontFamily:"inherit",fontSize:15,fontWeight:600,color:T.ink,textAlign:"left"}}>
                  {f.q}
                  <span style={{color:T.inkLight,fontSize:18,transform:activeFaq===i?"rotate(45deg)":"none",transition:"transform .2s",flexShrink:0,marginLeft:16}}>+</span>
                </button>
                {activeFaq===i && <div style={{paddingBottom:18,fontSize:14,color:T.inkMid,lineHeight:1.7}}>{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{background:T.accent,padding:"72px 24px",textAlign:"center"}}>
        <h2 style={{fontSize:36,fontWeight:900,color:"#fff",letterSpacing:-1,marginBottom:16}}>Prêt à professionnaliser<br/>votre facturation ?</h2>
        <p style={{color:"rgba(255,255,255,.75)",fontSize:16,marginBottom:32}}>Rejoignez des centaines d'entreprises algériennes. Gratuit pour commencer.</p>
        <Btn size="lg" style={{background:"#fff",color:T.accent,fontWeight:800}} onClick={onEnter}>Créer mon compte gratuitement</Btn>
      </section>

      {/* FOOTER */}
      <footer style={{background:T.ink,padding:"40px 24px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:24,height:24,background:T.accent,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"#fff",fontSize:12,fontWeight:900}}>i</span>
            </div>
            <span style={{fontWeight:800,color:"#fff"}}>Invoice<span style={{color:T.accent}}>DZ</span></span>
          </div>
          <div style={{fontSize:13,color:"#555"}}>© 2025 InvoiceDZ · Algérie · contact@invoicedz.dz</div>
          <div style={{display:"flex",gap:20}}>
            {["Confidentialité","CGU","Contact"].map(l=><a key={l} href="#" style={{color:"#555",fontSize:13,textDecoration:"none"}}>{l}</a>)}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── APP DASHBOARD ────────────────────────────────────────────────────
function App({ onBack }) {
  const [docs, setDocs] = useState([
    { ...newDoc("FACTURE"), id:1, numero:"FAC-2025-001", statut:"PAYE", date:"2025-06-01", client:{nom:"Café El Bahdja",adresse:"Alger Centre",ville:"Alger",email:"",telephone:"",nif:""}, lignes:[{id:1,designation:"Tabliers personnalisés DTF",quantite:20,unite:"Pcs",prixUnitaire:1800,remise:0,tva:19}], remiseGlobale:0, tvaActive:true, notes:"", conditionsPaiement:"BaridiMob", dateEcheance:"", entreprise:{} },
    { ...newDoc("DEVIS"),   id:2, numero:"DEV-2025-012", statut:"ENVOYE", date:"2025-06-10", client:{nom:"Clinique Ibn Sina",adresse:"Hydra",ville:"Alger",email:"",telephone:"",nif:""}, lignes:[{id:2,designation:"Blouses médicales brodées",quantite:50,unite:"Pcs",prixUnitaire:2200,remise:5,tva:19}], remiseGlobale:0, tvaActive:true, notes:"", conditionsPaiement:"Virement", dateEcheance:"2025-07-01", entreprise:{} },
  ]);
  const [activeId, setActiveId] = useState(null);
  const [screen, setScreen] = useState("list"); // list | edit
  const [tab, setTab] = useState("edit");
  const [filterType, setFilterType] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeDoc = docs.find(d=>d.id===activeId);
  const filtered = docs.filter(d=>{
    if(filterType!=="ALL"&&d.type!==filterType) return false;
    if(search&&!d.numero.toLowerCase().includes(search.toLowerCase())&&!d.client.nom.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const createDoc = (type) => { const d=newDoc(type); setDocs(p=>[d,...p]); setActiveId(d.id); setScreen("edit"); setTab("edit"); };
  const updateDoc = (u) => setDocs(p=>p.map(d=>d.id===u.id?u:d));
  const deleteDoc = (id) => { setDocs(p=>p.filter(d=>d.id!==id)); if(activeId===id){setActiveId(null);setScreen("list");} };

  const totauxAll = docs.reduce((acc,d)=>{ const t=calcTotaux(d.lignes,d.remiseGlobale,d.tvaActive); acc.total+=t.ttc; if(d.statut==="PAYE")acc.paye+=t.ttc; return acc; },{total:0,paye:0});

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"system-ui,-apple-system,sans-serif",color:T.ink}}>

      {/* TOPBAR */}
      <div style={{background:T.white,borderBottom:`1px solid ${T.border}`,height:56,display:"flex",alignItems:"center",padding:"0 20px",gap:12,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div style={{width:28,height:28,background:T.accent,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{color:"#fff",fontSize:14,fontWeight:900}}>i</span>
          </div>
          <span style={{fontWeight:800,fontSize:16,letterSpacing:-.5}}>Invoice<span style={{color:T.accent}}>DZ</span></span>
        </div>

        {screen==="edit"&&activeDoc&&(
          <div style={{display:"flex",alignItems:"center",gap:6,flex:1,minWidth:0}}>
            <span style={{color:T.border}}>›</span>
            <span style={{color:T.inkLight,fontSize:13,flexShrink:0}}>{DOC_TYPES[activeDoc.type].label}</span>
            <span style={{color:T.border}}>›</span>
            <span style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeDoc.numero}</span>
            <Badge label={STATUTS[activeDoc.statut].label} color={STATUTS[activeDoc.statut].color} />
          </div>
        )}

        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
          {screen==="edit"&&(
            <>
              <div style={{display:"flex",background:T.bg,borderRadius:8,border:`1px solid ${T.border}`,overflow:"hidden"}}>
                {[["edit","✏️ Éditer"],["preview","👁 Aperçu"]].map(([t,l])=>(
                  <button key={t} onClick={()=>setTab(t)} style={{padding:"7px 14px",fontSize:12,fontWeight:600,background:tab===t?T.white:"transparent",color:tab===t?T.ink:T.inkLight,border:"none",cursor:"pointer",fontFamily:"inherit",borderRight:t==="edit"?`1px solid ${T.border}`:"none"}}>
                    {l}
                  </button>
                ))}
              </div>
              <Btn size="sm" onClick={()=>{setScreen("list");setActiveId(null);}}>← Retour</Btn>
            </>
          )}
          <Btn variant="ghost" size="sm" onClick={onBack} style={{fontSize:12}}>Site ↗</Btn>
        </div>
      </div>

      {screen==="list" ? (
        <div style={{maxWidth:1100,margin:"0 auto",padding:24}}>

          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginBottom:28}}>
            {[
              { label:"Total documents", value:docs.length, color:T.ink },
              { label:"Total facturé", value:fmtDA(totauxAll.total), color:T.accent },
              { label:"Total payé", value:fmtDA(totauxAll.paye), color:T.success },
              { label:"En attente", value:fmtDA(totauxAll.total-totauxAll.paye), color:T.warning },
            ].map(s=>(
              <Card key={s.label} style={{padding:"18px 20px"}}>
                <div style={{fontSize:11,color:T.inkLight,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>{s.label}</div>
                <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.value}</div>
              </Card>
            ))}
          </div>

          {/* Actions + filtres */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:12}}>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <Input value={search} onChange={setSearch} placeholder="Rechercher..." style={{width:200}} />
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {[["ALL","Tous"],...Object.entries(DOC_TYPES).map(([k,v])=>[k,v.label])].map(([k,l])=>(
                  <button key={k} onClick={()=>setFilterType(k)} style={{padding:"8px 14px",fontSize:12,fontWeight:600,borderRadius:7,border:`1px solid ${filterType===k?T.accent:T.border}`,background:filterType===k?T.accentBg:"transparent",color:filterType===k?T.accent:T.inkLight,cursor:"pointer",fontFamily:"inherit"}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {Object.entries(DOC_TYPES).map(([k,t])=>(
                <button key={k} onClick={()=>createDoc(k)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",fontSize:12,fontWeight:600,borderRadius:7,border:`1px solid ${t.color}40`,background:t.color+"10",color:t.color,cursor:"pointer",fontFamily:"inherit"}}>
                  + {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Liste */}
          {filtered.length===0 ? (
            <Card style={{textAlign:"center",padding:60}}>
              <div style={{fontSize:40,marginBottom:16}}>📄</div>
              <div style={{color:T.inkLight,fontSize:15}}>Aucun document · Créez votre premier document ci-dessus</div>
            </Card>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {filtered.map(doc=>{
                const ti=DOC_TYPES[doc.type], si=STATUTS[doc.statut];
                const t=calcTotaux(doc.lignes,doc.remiseGlobale,doc.tvaActive);
                const showPrix=doc.type!=="BON_LIVRAISON";
                return (
                  <Card key={doc.id} style={{padding:"16px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,transition:"border-color .15s,box-shadow .15s"}}
                    onClick={()=>{setActiveId(doc.id);setScreen("edit");setTab("edit");}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.06)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow="none";}}>
                    <div style={{fontSize:20,flexShrink:0}}>{ti.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                        <span style={{fontSize:11,fontWeight:700,color:ti.color,textTransform:"uppercase",letterSpacing:.5}}>{ti.label}</span>
                        <span style={{fontWeight:700,fontSize:14}}>{doc.numero}</span>
                        <Badge label={si.label} color={si.color} />
                      </div>
                      <div style={{color:T.inkLight,fontSize:13}}>{doc.client.nom||"Client non défini"} · {doc.date}</div>
                    </div>
                    {showPrix&&<div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontWeight:700,fontSize:15}}>{fmtDA(doc.tvaActive?t.ttc:t.base)}</div>
                      <div style={{color:T.inkLight,fontSize:11}}>{doc.lignes.length} ligne{doc.lignes.length>1?"s":""}</div>
                    </div>}
                    <button onClick={e=>{e.stopPropagation();deleteDoc(doc.id);}} style={{background:"none",border:"none",color:T.border,cursor:"pointer",fontSize:16,padding:"4px 8px",flexShrink:0,transition:"color .15s"}}
                      onMouseEnter={e=>e.target.style.color=T.danger}
                      onMouseLeave={e=>e.target.style.color=T.border}>✕</button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : activeDoc ? (
        <div style={{maxWidth:900,margin:"0 auto",padding:24}}>
          {tab==="edit" ? <DocEditorFull doc={activeDoc} onChange={updateDoc} /> : <DocPreviewFull doc={activeDoc} />}
        </div>
      ) : null}
    </div>
  );
}

// ─── ÉDITEUR ──────────────────────────────────────────────────────────
function DocEditorFull({ doc, onChange }) {
  const up = (path, val) => {
    const parts=path.split("."); const next={...doc}; let obj=next;
    for(let i=0;i<parts.length-1;i++) obj=obj[parts[i]]={...obj[parts[i]]};
    obj[parts[parts.length-1]]=val; onChange(next);
  };
  const upL = (id,field,val) => onChange({...doc,lignes:doc.lignes.map(l=>l.id===id?{...l,[field]:["designation","unite"].includes(field)?val:parseFloat(val)||0}:l)});
  const addL = () => onChange({...doc,lignes:[...doc.lignes,emptyLigne()]});
  const delL = (id) => onChange({...doc,lignes:doc.lignes.filter(l=>l.id!==id)});
  const showPrix = doc.type!=="BON_LIVRAISON";
  const showTVA = doc.tvaActive&&showPrix;
  const totaux = calcTotaux(doc.lignes,doc.remiseGlobale,doc.tvaActive);
  const s = { mb:{ marginBottom:16 } };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

      <Card>
        <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:1.5,textTransform:"uppercase",marginBottom:20}}>Informations générales</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
          <div><Label>Numéro</Label><Input value={doc.numero} onChange={v=>up("numero",v)} /></div>
          <div><Label>Statut</Label><Select value={doc.statut} onChange={v=>up("statut",v)} options={STATUTS_PAR_TYPE[doc.type].map(s=>({value:s,label:STATUTS[s].label}))} /></div>
          <div><Label>Date</Label><Input type="date" value={doc.date} onChange={v=>up("date",v)} /></div>
          {doc.type!=="BON_LIVRAISON"&&<div><Label>Date d'échéance</Label><Input type="date" value={doc.dateEcheance} onChange={v=>up("dateEcheance",v)} /></div>}
        </div>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card>
          <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:1.5,textTransform:"uppercase",marginBottom:20}}>Votre entreprise</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div><Label>Nom</Label><Input value={doc.entreprise?.nom||""} onChange={v=>up("entreprise.nom",v)} placeholder="YAKOUBI MOHAMED" /></div>
            <div><Label>Adresse</Label><Input value={doc.entreprise?.adresse||""} onChange={v=>up("entreprise.adresse",v)} placeholder="Clos de la Grotte, Ann Benian, n° 137" /></div>
            <div><Label>Ville</Label><Input value={doc.entreprise?.ville||""} onChange={v=>up("entreprise.ville",v)} placeholder="Alger" /></div>
            <div><Label>Téléphone</Label><Input value={doc.entreprise?.telephone||""} onChange={v=>up("entreprise.telephone",v)} placeholder="05XX XX XX XX" /></div>
            <div><Label>Email</Label><Input value={doc.entreprise?.email||""} onChange={v=>up("entreprise.email",v)} placeholder="email@entreprise.dz" /></div>
            <div><Label>Code</Label><Input value={doc.entreprise?.code||""} onChange={v=>up("entreprise.code",v)} placeholder="20-036" /></div>
            <div><Label>Reg. Com.</Label><Input value={doc.entreprise?.rc||""} onChange={v=>up("entreprise.rc",v)} placeholder="23A5058012" /></div>
            <div><Label>Art. d'Imp.</Label><Input value={doc.entreprise?.ai||""} onChange={v=>up("entreprise.ai",v)} placeholder="16570583839" /></div>
            <div><Label>Id. Fiscal</Label><Input value={doc.entreprise?.idFiscal||""} onChange={v=>up("entreprise.idFiscal",v)} placeholder="19716320010218961600" /></div>
            <div><Label>NIF</Label><Input value={doc.entreprise?.nif||""} onChange={v=>up("entreprise.nif",v)} placeholder="000000000000000" /></div>
          </div>
        </Card>
        <Card>
          <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:1.5,textTransform:"uppercase",marginBottom:20}}>Client</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div><Label>Nom / Entreprise</Label><Input value={doc.client.nom} onChange={v=>up("client.nom",v)} placeholder="Nom du client" /></div>
            <div><Label>Adresse</Label><Input value={doc.client.adresse} onChange={v=>up("client.adresse",v)} placeholder="Adresse" /></div>
            <div><Label>Ville</Label><Input value={doc.client.ville} onChange={v=>up("client.ville",v)} placeholder="Alger" /></div>
            <div><Label>Email</Label><Input value={doc.client.email} onChange={v=>up("client.email",v)} placeholder="client@email.dz" /></div>
            <div><Label>Téléphone</Label><Input value={doc.client.telephone} onChange={v=>up("client.telephone",v)} placeholder="05XX XX XX XX" /></div>
            <div><Label>NIF</Label><Input value={doc.client.nif} onChange={v=>up("client.nif",v)} placeholder="000000000000000" /></div>
          </div>
        </Card>
      </div>

      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:1.5,textTransform:"uppercase"}}>Lignes</div>
          {showPrix&&<div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:T.inkLight}}>TVA</span>
            <div onClick={()=>up("tvaActive",!doc.tvaActive)} style={{width:36,height:20,borderRadius:10,background:doc.tvaActive?T.accent:T.border,cursor:"pointer",position:"relative",transition:"background .2s"}}>
              <div style={{width:14,height:14,borderRadius:7,background:"#fff",position:"absolute",top:3,left:doc.tvaActive?19:3,transition:"left .2s"}}/>
            </div>
          </div>}
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:showPrix?640:360}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {["Désignation","Qté","Unité",...(showPrix?["P.U. HT","Rem%",...(showTVA?["TVA%"]:[""]),"Total HT"]:[]),""].map((h,i)=>(
                  <th key={i} style={{color:T.inkLight,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",padding:"0 6px 10px",textAlign:i===0?"left":"right"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doc.lignes.map(l=>{
                const {ht}=calcLigne(l);
                return <tr key={l.id} style={{borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:"8px 6px",minWidth:140}}><Input value={l.designation} onChange={v=>upL(l.id,"designation",v)} placeholder="Description..." /></td>
                  <td style={{padding:"8px 6px",width:60}}><Input value={l.quantite} onChange={v=>upL(l.id,"quantite",v)} type="number" style={{textAlign:"right"}} /></td>
                  <td style={{padding:"8px 6px",width:70}}><Input value={l.unite} onChange={v=>upL(l.id,"unite",v)} /></td>
                  {showPrix&&<>
                    <td style={{padding:"8px 6px",width:90}}><Input value={l.prixUnitaire} onChange={v=>upL(l.id,"prixUnitaire",v)} type="number" style={{textAlign:"right"}} /></td>
                    <td style={{padding:"8px 6px",width:55}}><Input value={l.remise} onChange={v=>upL(l.id,"remise",v)} type="number" style={{textAlign:"right"}} /></td>
                    {showTVA&&<td style={{padding:"8px 6px",width:55}}><Input value={l.tva} onChange={v=>upL(l.id,"tva",v)} type="number" style={{textAlign:"right"}} /></td>}
                    <td style={{padding:"8px 6px",width:100,textAlign:"right",fontSize:13,fontWeight:600,color:T.inkMid}}>{ht.toLocaleString("fr-DZ",{minimumFractionDigits:2})}</td>
                  </>}
                  <td style={{padding:"8px 4px",width:32,textAlign:"center"}}>
                    <button onClick={()=>delL(l.id)} style={{background:"none",border:"none",color:T.border,cursor:"pointer",fontSize:15,padding:"2px 6px",transition:"color .15s"}}
                      onMouseEnter={e=>e.target.style.color=T.danger} onMouseLeave={e=>e.target.style.color=T.border}>✕</button>
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <Btn size="sm" onClick={addL} style={{marginTop:12}}>+ Ajouter une ligne</Btn>

        {showPrix&&<div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",marginTop:24,gap:8}}>
          <div style={{display:"flex",gap:32,fontSize:13}}><span style={{color:T.inkLight}}>Sous-total HT</span><span style={{fontWeight:600}}>{fmtDA(totaux.sous)}</span></div>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:13,color:T.inkLight}}>Remise globale</span>
            <Input value={doc.remiseGlobale} onChange={v=>up("remiseGlobale",parseFloat(v)||0)} type="number" style={{width:60,textAlign:"right"}} />
            <span style={{fontSize:13,color:T.inkLight}}>%</span>
          </div>
          {showTVA&&<div style={{display:"flex",gap:32,fontSize:13}}><span style={{color:T.inkLight}}>TVA</span><span style={{fontWeight:600}}>{fmtDA(totaux.totalTVA)}</span></div>}
          <div style={{display:"flex",gap:32,fontSize:17,fontWeight:800,color:T.accent,borderTop:`2px solid ${T.ink}`,paddingTop:10}}>
            <span>TOTAL {showTVA?"TTC":"HT"}</span><span>{fmtDA(showTVA?totaux.ttc:totaux.base)}</span>
          </div>
        </div>}
      </Card>

      <Card>
        <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:1.5,textTransform:"uppercase",marginBottom:20}}>Conditions & Notes</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {showPrix&&<div><Label>Mode de paiement</Label><Input value={doc.conditionsPaiement} onChange={v=>up("conditionsPaiement",v)} /></div>}
          <div style={{gridColumn:showPrix?"auto":"span 2"}}>
            <Label>Notes</Label>
            <textarea value={doc.notes} onChange={e=>up("notes",e.target.value)} style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:7,color:T.ink,padding:"9px 12px",fontSize:14,width:"100%",minHeight:80,boxSizing:"border-box",fontFamily:"inherit",resize:"vertical",outline:"none"}} />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── APERÇU ───────────────────────────────────────────────────────────
function DocPreviewFull({ doc }) {
  const ti = DOC_TYPES[doc.type];
  const totaux = calcTotaux(doc.lignes,doc.remiseGlobale,doc.tvaActive);
  const showPrix = doc.type!=="BON_LIVRAISON";
  const showTVA = doc.tvaActive&&showPrix;
  const ent = doc.entreprise||{};

  return (
    <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,padding:48,boxShadow:"0 4px 24px rgba(0,0,0,.08)",fontFamily:"Georgia,serif",color:"#111",maxWidth:800,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:36}}>
        <div>
          <div style={{fontFamily:"system-ui",fontWeight:900,fontSize:20,letterSpacing:-1}}>{ent.nom||"Votre Entreprise"}</div>
          <div style={{marginTop:10,fontSize:12,color:"#555",lineHeight:1.9,fontFamily:"system-ui"}}>
            {ent.adresse&&<div>{ent.adresse}</div>}
            {ent.ville&&<div>{ent.ville}</div>}
            {ent.telephone&&<div>{ent.telephone}</div>}
            {ent.email&&<div>{ent.email}</div>}
            {ent.code&&<div>Code : {ent.code}</div>}
            {ent.rc&&<div>Reg. Com. n° {ent.rc}</div>}
            {ent.ai&&<div>Art. d'Imp. n° {ent.ai}</div>}
            {ent.idFiscal&&<div>Id. Fiscal n° {ent.idFiscal}</div>}
            {ent.nif&&<div>NIF: {ent.nif}</div>}
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{background:ti.color,color:"#fff",padding:"6px 18px",borderRadius:6,fontFamily:"system-ui",fontWeight:800,fontSize:12,letterSpacing:1,marginBottom:10,display:"inline-block"}}>{ti.label.toUpperCase()}</div>
          <div style={{fontFamily:"system-ui",fontWeight:800,fontSize:18}}>{doc.numero}</div>
          <div style={{fontSize:12,color:"#777",fontFamily:"system-ui",marginTop:6}}>Date : {doc.date}</div>
          {doc.dateEcheance&&<div style={{fontSize:12,color:"#777",fontFamily:"system-ui"}}>Échéance : {doc.dateEcheance}</div>}
        </div>
      </div>

      <div style={{borderTop:"2px solid #111",marginBottom:28}}/>

      <div style={{marginBottom:28}}>
        <div style={{fontFamily:"system-ui",fontSize:10,letterSpacing:2,color:"#999",marginBottom:6,textTransform:"uppercase"}}>Destinataire</div>
        <div style={{fontWeight:700,fontSize:15,fontFamily:"system-ui"}}>{doc.client.nom||"—"}</div>
        <div style={{fontSize:12,color:"#555",fontFamily:"system-ui",marginTop:4,lineHeight:1.8}}>
          {doc.client.adresse&&<div>{doc.client.adresse}</div>}
          {doc.client.ville&&<div>{doc.client.ville}</div>}
          {doc.client.email&&<div>{doc.client.email}</div>}
          {doc.client.telephone&&<div>{doc.client.telephone}</div>}
          {doc.client.nif&&<div>NIF: {doc.client.nif}</div>}
        </div>
      </div>

      <table style={{width:"100%",borderCollapse:"collapse",marginBottom:24}}>
        <thead>
          <tr style={{background:"#111",color:"#fff"}}>
            {["Désignation","Qté","Unité",...(showPrix?["P.U. HT","Rem%",...(showTVA?["TVA%"]:[]),"Total HT"]:[])].map((h,i)=>(
              <th key={i} style={{padding:"10px 12px",textAlign:i===0?"left":"right",fontFamily:"system-ui",fontSize:10,letterSpacing:1,textTransform:"uppercase",fontWeight:700}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {doc.lignes.map((l,i)=>{
            const {ht}=calcLigne(l);
            return <tr key={l.id} style={{background:i%2===0?"#F8F8F6":"#fff",borderBottom:"1px solid #EEE"}}>
              <td style={{padding:"10px 12px",fontSize:13}}>{l.designation||<span style={{color:"#bbb"}}>—</span>}</td>
              <td style={{padding:"10px 8px",textAlign:"right",fontSize:13}}>{l.quantite}</td>
              <td style={{padding:"10px 8px",textAlign:"right",fontSize:12,color:"#777"}}>{l.unite}</td>
              {showPrix&&<>
                <td style={{padding:"10px 8px",textAlign:"right",fontSize:13}}>{l.prixUnitaire.toLocaleString("fr-DZ")}</td>
                <td style={{padding:"10px 8px",textAlign:"right",fontSize:13,color:l.remise>0?"#C8762E":"#bbb"}}>{l.remise>0?`${l.remise}%`:"—"}</td>
                {showTVA&&<td style={{padding:"10px 8px",textAlign:"right",fontSize:13}}>{l.tva}%</td>}
                <td style={{padding:"10px 12px",textAlign:"right",fontSize:13,fontWeight:600}}>{ht.toLocaleString("fr-DZ",{minimumFractionDigits:2})}</td>
              </>}
            </tr>;
          })}
        </tbody>
      </table>

      {showPrix&&<div style={{display:"flex",justifyContent:"flex-end"}}>
        <div style={{minWidth:260}}>
          {[["Sous-total HT",fmtDA(totaux.sous)],...(doc.remiseGlobale>0?[["Remise ("+doc.remiseGlobale+"%)","-"+fmtDA(totaux.remAmt)],["Base HT",fmtDA(totaux.base)]]:[])]
            .map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #EEE",fontSize:13,color:"#666"}}><span>{l}</span><span style={{color:"#111"}}>{v}</span></div>)}
          {showTVA&&<div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #EEE",fontSize:13,color:"#666"}}><span>TVA</span><span>{fmtDA(totaux.totalTVA)}</span></div>}
          <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0",fontWeight:800,fontSize:17,color:"#111",borderTop:"2px solid #111",marginTop:4}}>
            <span>TOTAL {showTVA?"TTC":"HT"}</span><span style={{color:T.accent}}>{fmtDA(showTVA?totaux.ttc:totaux.base)}</span>
          </div>
        </div>
      </div>}

      {(doc.conditionsPaiement||doc.notes)&&<div style={{borderTop:"1px solid #EEE",paddingTop:20,marginTop:24}}>
        {showPrix&&doc.conditionsPaiement&&<div style={{marginBottom:10}}>
          <div style={{fontFamily:"system-ui",fontSize:10,letterSpacing:1.5,color:"#999",marginBottom:4,textTransform:"uppercase"}}>Mode de paiement</div>
          <div style={{fontSize:13}}>{doc.conditionsPaiement}</div>
        </div>}
        {doc.notes&&<div>
          <div style={{fontFamily:"system-ui",fontSize:10,letterSpacing:1.5,color:"#999",marginBottom:4,textTransform:"uppercase"}}>Notes</div>
          <div style={{fontSize:13}}>{doc.notes}</div>
        </div>}
      </div>}

      <div style={{marginTop:40,textAlign:"center",fontFamily:"system-ui",fontSize:10,color:"#bbb",letterSpacing:1}}>
        Généré via InvoiceDZ · invoicedz.dz
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────
export default function Root() {
  const [page, setPage] = useState("landing"); // landing | app
  return page==="landing"
    ? <Landing onEnter={()=>setPage("app")} />
    : <App onBack={()=>setPage("landing")} />;
}
