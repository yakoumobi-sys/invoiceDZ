"use client";
import { useState, useRef } from "react";

const T = {
  white:"#FFFFFF",bg:"#F7F7F5",ink:"#111110",inkMid:"#444440",
  inkLight:"#88887F",border:"#E4E4DF",accent:"#1A6BFF",
  accentDark:"#0050E0",accentBg:"#EEF4FF",success:"#16A34A",
  warning:"#D97706",danger:"#DC2626",purple:"#7C3AED",
};

const DOC_TYPES = {
  FACTURE:{label:"Facture",prefix:"FAC",color:T.success,icon:"🧾",desc:"Demandez paiement pour vos services"},
  PROFORMA:{label:"Facture Proforma",prefix:"PRO",color:T.accent,icon:"📋",desc:"Estimez avant de facturer officiellement"},
  DEVIS:{label:"Devis",prefix:"DEV",color:T.purple,icon:"📝",desc:"Proposez un prix à votre client"},
  BON_COMMANDE:{label:"Bon de Commande",prefix:"BC",color:T.warning,icon:"🛒",desc:"Confirmez une commande fournisseur"},
  BON_LIVRAISON:{label:"Bon de Livraison",prefix:"BL",color:T.inkMid,icon:"🚚",desc:"Attestez la livraison de marchandises"},
};

const STATUTS = {
  BROUILLON:{label:"Brouillon",color:T.inkLight},ENVOYE:{label:"Envoyé",color:T.accent},
  ACCEPTE:{label:"Accepté",color:T.success},REFUSE:{label:"Refusé",color:T.danger},
  PAYE:{label:"Payé",color:T.success},PARTIEL:{label:"Partiel",color:T.warning},
  EN_ATTENTE:{label:"En attente",color:T.warning},LIVRE:{label:"Livré",color:T.success},
};

const STATUTS_PAR_TYPE = {
  FACTURE:["BROUILLON","ENVOYE","PAYE","PARTIEL"],
  PROFORMA:["BROUILLON","ENVOYE","ACCEPTE","REFUSE"],
  DEVIS:["BROUILLON","ENVOYE","ACCEPTE","REFUSE"],
  BON_COMMANDE:["BROUILLON","ENVOYE","EN_ATTENTE","ACCEPTE"],
  BON_LIVRAISON:["BROUILLON","ENVOYE","LIVRE"],
};

const emptyLigne = () => ({id:Math.random(),designation:"",quantite:1,unite:"Unité",prixUnitaire:0,remise:0,tva:19});
const newDoc = (type,user) => ({
  id:Math.random(),type,
  numero:`${DOC_TYPES[type].prefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random()*900)+100)}`,
  statut:"BROUILLON",date:new Date().toISOString().split("T")[0],dateEcheance:"",
  client:{nom:"",adresse:"",ville:"",email:"",telephone:"",nif:""},
  lignes:[emptyLigne()],notes:"",conditionsPaiement:"Virement / BaridiMob",
  remiseGlobale:0,tvaActive:true,
  entreprise:user?{...user.entreprise}:{nom:"",adresse:"",ville:"",telephone:"",email:"",nif:"",rc:"",ai:"",idFiscal:"",code:""},
  logo:user&&user.logo?user.logo:null,
  createdAt:new Date().toISOString(),
});

const calcLigne = l => {const ht=l.quantite*l.prixUnitaire*(1-l.remise/100);return{ht,tva:ht*(l.tva/100),ttc:ht*(1+l.tva/100)};};
const calcTotaux = (lignes,rem,tva) => {
  const sous=lignes.reduce((s,l)=>s+calcLigne(l).ht,0);
  const remAmt=sous*(rem/100);const base=sous-remAmt;
  const totalTVA=tva?lignes.reduce((s,l)=>s+calcLigne(l).tva,0)*(1-rem/100):0;
  return{sous,remAmt,base,totalTVA,ttc:base+totalTVA};
};
const fmtDA = n => new Intl.NumberFormat("fr-DZ",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+" DA";

function Btn({children,onClick,variant,size,style,disabled}){
  variant=variant||"default";size=size||"md";style=style||{};disabled=disabled||false;
  const [h,setH]=useState(false);
  const base={display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,border:"none",cursor:disabled?"not-allowed":"pointer",borderRadius:8,fontWeight:600,fontFamily:"inherit",transition:"all .15s",whiteSpace:"nowrap",opacity:disabled?.5:1};
  const sizes={sm:{padding:"7px 14px",fontSize:12},md:{padding:"10px 20px",fontSize:14},lg:{padding:"14px 32px",fontSize:16}};
  const variants={
    default:{background:h?"#EFEFED":T.white,color:T.ink,border:"1px solid "+T.border,boxShadow:"0 1px 2px rgba(0,0,0,.06)"},
    primary:{background:h?T.accentDark:T.accent,color:"#fff",boxShadow:"0 2px 8px rgba(26,107,255,.3)"},
    ghost:{background:"transparent",color:T.inkLight,border:"none"},
  };
  return <button onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} onClick={onClick} disabled={disabled} style={{...base,...sizes[size],...variants[variant],...style}}>{children}</button>;
}

function Input({value,onChange,placeholder,type,style}){
  type=type||"text";style=style||{};
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{background:T.white,border:"1px solid "+T.border,borderRadius:8,color:T.ink,padding:"10px 14px",fontSize:14,width:"100%",boxSizing:"border-box",fontFamily:"inherit",outline:"none",...style}}
    onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>;
}

function Sel({value,onChange,options}){
  return <select value={value} onChange={e=>onChange(e.target.value)}
    style={{background:T.white,border:"1px solid "+T.border,borderRadius:8,color:T.ink,padding:"10px 14px",fontSize:14,width:"100%",fontFamily:"inherit",outline:"none"}}>
    {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
  </select>;
}

function Badge({label,color}){
  return <span style={{background:color+"18",color,border:"1px solid "+color+"30",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700}}>{label}</span>;
}

function Lbl({children}){
  return <div style={{color:T.inkLight,fontSize:11,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>{children}</div>;
}

function Card({children,style,onClick,onMouseEnter,onMouseLeave}){
  return <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{background:T.white,border:"1px solid "+T.border,borderRadius:12,padding:24,...(style||{})}}>{children}</div>;
}

function Logo(){
  return <div style={{display:"flex",alignItems:"center",gap:8}}>
    <div style={{width:30,height:30,background:T.accent,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <span style={{color:"#fff",fontSize:16,fontWeight:900}}>i</span>
    </div>
    <span style={{fontWeight:800,fontSize:18,letterSpacing:-.5}}>Invoice<span style={{color:T.accent}}>DZ</span></span>
  </div>;
}

// LANDING
function Landing({onSignup,onLogin}){
  const [faq,setFaq]=useState(null);
  const faqs=[
    {q:"Est-ce gratuit ?",a:"Oui. Le plan gratuit permet 5 documents/mois. Le plan Pro à 1 990 DA/mois est illimité."},
    {q:"Puis-je ajouter mon logo ?",a:"Oui, lors de la création de chaque document vous pouvez uploader votre logo."},
    {q:"Comment fonctionne la TVA ?",a:"InvoiceDZ supporte la TVA algérienne à 19%. Vous pouvez la désactiver si besoin."},
    {q:"Mes données sont-elles sécurisées ?",a:"Vos données sont privées et vous pouvez les exporter ou supprimer à tout moment."},
  ];
  return <div style={{background:T.bg,minHeight:"100vh",fontFamily:"system-ui,-apple-system,sans-serif",color:T.ink}}>
    <nav style={{background:T.white,borderBottom:"1px solid "+T.border,position:"sticky",top:0,zIndex:100}}>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"0 24px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <Logo/>
        <div style={{display:"flex",gap:8}}>
          <Btn variant="ghost" size="sm" onClick={onLogin}>Connexion</Btn>
          <Btn variant="primary" size="sm" onClick={onSignup}>Créer un compte</Btn>
        </div>
      </div>
    </nav>
    <section style={{maxWidth:1100,margin:"0 auto",padding:"88px 24px 64px",textAlign:"center"}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:8,background:T.accentBg,border:"1px solid "+T.accent+"22",borderRadius:20,padding:"6px 16px",marginBottom:28}}>
        <span style={{width:6,height:6,borderRadius:3,background:T.accent,display:"inline-block"}}/>
        <span style={{fontSize:12,color:T.accent,fontWeight:600}}>Facturation en ligne · Conçu pour l'Algérie</span>
      </div>
      <h1 style={{fontSize:"clamp(36px,5.5vw,60px)",fontWeight:900,lineHeight:1.1,letterSpacing:-2,marginBottom:20}}>
        Vos documents professionnels<br/><span style={{color:T.accent}}>en 3 étapes.</span>
      </h1>
      <p style={{fontSize:17,color:T.inkMid,maxWidth:480,margin:"0 auto 36px",lineHeight:1.65}}>
        Factures, devis, bons de livraison — créez, exportez et gérez depuis un seul endroit.
      </p>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:64}}>
        <Btn variant="primary" size="lg" onClick={onSignup}>Créer ma première facture →</Btn>
        <Btn size="lg" onClick={onLogin}>Se connecter</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20,maxWidth:820,margin:"0 auto"}}>
        {[{n:"1",title:"Choisir le type",desc:"Facture, Devis, Proforma, Bon de commande ou Bon de livraison"},
          {n:"2",title:"Remplir & personnaliser",desc:"Vos infos, votre logo, les lignes et conditions de paiement"},
          {n:"3",title:"Exporter en PDF",desc:"Document professionnel prêt à imprimer ou envoyer"}].map(s=>(
          <div key={s.n} style={{background:T.white,border:"1px solid "+T.border,borderRadius:12,padding:24,textAlign:"left"}}>
            <div style={{width:32,height:32,borderRadius:8,background:T.accentBg,color:T.accent,fontWeight:800,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>{s.n}</div>
            <div style={{fontWeight:700,fontSize:15,marginBottom:6}}>{s.title}</div>
            <div style={{color:T.inkLight,fontSize:13,lineHeight:1.6}}>{s.desc}</div>
          </div>
        ))}
      </div>
    </section>
    <section style={{background:T.white,borderTop:"1px solid "+T.border,borderBottom:"1px solid "+T.border,padding:"48px 24px"}}>
      <div style={{maxWidth:900,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14}}>
        {Object.entries(DOC_TYPES).map(([k,t])=>(
          <div key={k} style={{textAlign:"center",padding:"20px 12px",borderRadius:10,border:"1px solid "+t.color+"28",background:t.color+"08"}}>
            <div style={{fontSize:28,marginBottom:10}}>{t.icon}</div>
            <div style={{fontWeight:700,fontSize:12,color:t.color}}>{t.label}</div>
          </div>
        ))}
      </div>
    </section>
    <section style={{maxWidth:760,margin:"0 auto",padding:"64px 24px"}}>
      <div style={{textAlign:"center",marginBottom:44}}>
        <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Tarifs</div>
        <h2 style={{fontSize:30,fontWeight:800,letterSpacing:-.8}}>Simple et transparent.</h2>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {[{name:"Gratuit",price:"0 DA",period:"/mois",features:["5 documents/mois","5 types de documents","Export PDF","Support email"],cta:"Commencer",v:"default"},
          {name:"Pro",price:"1 990 DA",period:"/mois",features:["Documents illimités","Logo personnalisé","Multi-entreprises","Support prioritaire"],cta:"Essayer Pro",v:"primary",hot:true}].map(p=>(
          <div key={p.name} style={{background:p.hot?T.ink:T.white,border:"1px solid "+(p.hot?"transparent":T.border),borderRadius:14,padding:28,position:"relative"}}>
            {p.hot&&<div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:T.accent,color:"#fff",borderRadius:20,padding:"3px 14px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>Le plus populaire</div>}
            <div style={{color:p.hot?"#777":T.inkLight,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>{p.name}</div>
            <div style={{display:"flex",alignItems:"baseline",gap:3,marginBottom:20}}>
              <span style={{fontSize:30,fontWeight:900,color:p.hot?"#fff":T.ink}}>{p.price}</span>
              <span style={{color:p.hot?"#555":T.inkLight,fontSize:13}}>{p.period}</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
              {p.features.map(f=><div key={f} style={{display:"flex",gap:8,fontSize:13,color:p.hot?"#bbb":T.inkMid}}><span style={{color:p.hot?T.accent:T.success,fontWeight:700}}>✓</span>{f}</div>)}
            </div>
            <Btn variant={p.v} style={{width:"100%"}} onClick={onSignup}>{p.cta}</Btn>
          </div>
        ))}
      </div>
    </section>
    <section style={{background:T.white,borderTop:"1px solid "+T.border,padding:"48px 24px"}}>
      <div style={{maxWidth:600,margin:"0 auto"}}>
        <h2 style={{fontSize:26,fontWeight:800,textAlign:"center",marginBottom:32,letterSpacing:-.5}}>Questions fréquentes</h2>
        {faqs.map((f,i)=>(
          <div key={i} style={{borderBottom:"1px solid "+T.border}}>
            <button onClick={()=>setFaq(faq===i?null:i)} style={{width:"100%",background:"none",border:"none",padding:"15px 0",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:600,color:T.ink,textAlign:"left"}}>
              {f.q}<span style={{color:T.inkLight,fontSize:18,transform:faq===i?"rotate(45deg)":"none",transition:"transform .2s",flexShrink:0,marginLeft:12}}>+</span>
            </button>
            {faq===i&&<div style={{paddingBottom:14,fontSize:13,color:T.inkMid,lineHeight:1.7}}>{f.a}</div>}
          </div>
        ))}
      </div>
    </section>
    <section style={{background:T.accent,padding:"56px 24px",textAlign:"center"}}>
      <h2 style={{fontSize:30,fontWeight:900,color:"#fff",letterSpacing:-.8,marginBottom:12}}>Prêt à professionnaliser votre facturation ?</h2>
      <p style={{color:"rgba(255,255,255,.7)",marginBottom:24,fontSize:15}}>Gratuit pour commencer. Aucune carte bancaire requise.</p>
      <Btn size="lg" style={{background:"#fff",color:T.accent,fontWeight:800}} onClick={onSignup}>Créer mon compte gratuitement</Btn>
    </section>
    <footer style={{background:T.ink,padding:"28px 24px"}}>
      <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <Logo/>
        <div style={{fontSize:12,color:"#555"}}>© 2025 InvoiceDZ · contact@invoicedz.dz</div>
      </div>
    </footer>
  </div>;
}

// AUTH
function Auth({mode,onAuth,onToggle}){
  const [nom,setNom]=useState("");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const handle = () => {
    if(mode==="signup"&&!nom.trim()){setErr("Entrez votre nom");return;}
    if(!email.includes("@")){setErr("Email invalide");return;}
    if(pass.length<6){setErr("Mot de passe trop court (min 6 car.)");return;}
    setErr("");
    onAuth({id:Math.random(),nom:nom||email.split("@")[0],email,
      entreprise:{nom:"",adresse:"",ville:"",telephone:"",email:"",nif:"",rc:"",ai:"",idFiscal:"",code:""},
      logo:null});
  };
  return <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,-apple-system,sans-serif",padding:24}}>
    <div style={{width:"100%",maxWidth:400}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <Logo/>
        <div style={{marginTop:24,fontSize:22,fontWeight:800,letterSpacing:-.5}}>{mode==="signup"?"Créer votre compte":"Bon retour 👋"}</div>
        <div style={{color:T.inkLight,fontSize:14,marginTop:6}}>{mode==="signup"?"Gratuit · Aucune carte requise":"Connectez-vous à votre espace"}</div>
      </div>
      <Card style={{padding:32}}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {mode==="signup"&&<div><Lbl>Votre nom</Lbl><Input value={nom} onChange={setNom} placeholder="Mohamed Yakoubi"/></div>}
          <div><Lbl>Email</Lbl><Input value={email} onChange={setEmail} placeholder="vous@email.dz" type="email"/></div>
          <div><Lbl>Mot de passe</Lbl><Input value={pass} onChange={setPass} placeholder="Min. 6 caractères" type="password"/></div>
          {err&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",fontSize:13,color:T.danger}}>{err}</div>}
          <Btn variant="primary" size="lg" onClick={handle} style={{width:"100%",marginTop:4}}>
            {mode==="signup"?"Créer mon compte →":"Se connecter →"}
          </Btn>
        </div>
      </Card>
      <div style={{textAlign:"center",marginTop:20,fontSize:13,color:T.inkLight}}>
        {mode==="signup"?"Déjà un compte ?":"Pas encore de compte ?"}{" "}
        <button onClick={onToggle} style={{background:"none",border:"none",color:T.accent,fontWeight:600,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>
          {mode==="signup"?"Se connecter":"Créer un compte"}
        </button>
      </div>
    </div>
  </div>;
}

// STEP 1
function Step1({onChoix}){
  const [sel,setSel]=useState(null);
  return <div style={{maxWidth:760,margin:"0 auto",padding:"48px 24px"}}>
    <div style={{marginBottom:36,textAlign:"center"}}>
      <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Étape 1 / 3</div>
      <h2 style={{fontSize:26,fontWeight:800,letterSpacing:-.5,marginBottom:8}}>Quel document voulez-vous créer ?</h2>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:32}}>
      {Object.entries(DOC_TYPES).map(([k,t])=>(
        <button key={k} onClick={()=>setSel(k)} style={{background:sel===k?t.color+"12":T.white,border:"2px solid "+(sel===k?t.color:T.border),borderRadius:12,padding:"20px 16px",textAlign:"left",cursor:"pointer",fontFamily:"inherit",transition:"all .15s",outline:"none"}}>
          <div style={{fontSize:28,marginBottom:10}}>{t.icon}</div>
          <div style={{fontWeight:700,fontSize:14,color:sel===k?t.color:T.ink,marginBottom:4}}>{t.label}</div>
          <div style={{fontSize:12,color:T.inkLight,lineHeight:1.5}}>{t.desc}</div>
        </button>
      ))}
    </div>
    <div style={{display:"flex",justifyContent:"flex-end"}}>
      <Btn variant="primary" size="lg" disabled={!sel} onClick={()=>onChoix(sel)}>Continuer →</Btn>
    </div>
  </div>;
}

// STEP 2
function Step2({doc,onChange,onNext,onBack}){
  const up=(path,val)=>{const parts=path.split(".");const next={...doc};let obj=next;for(let i=0;i<parts.length-1;i++)obj=obj[parts[i]]={...obj[parts[i]]};obj[parts[parts.length-1]]=val;onChange(next);};
  const upL=(id,f,v)=>onChange({...doc,lignes:doc.lignes.map(l=>l.id===id?{...l,[f]:["designation","unite"].includes(f)?v:parseFloat(v)||0}:l)});
  const addL=()=>onChange({...doc,lignes:[...doc.lignes,emptyLigne()]});
  const delL=id=>onChange({...doc,lignes:doc.lignes.filter(l=>l.id!==id)});
  const showPrix=doc.type!=="BON_LIVRAISON";
  const showTVA=doc.tvaActive&&showPrix;
  const totaux=calcTotaux(doc.lignes,doc.remiseGlobale,doc.tvaActive);
  const ti=DOC_TYPES[doc.type];
  const fileRef=useRef(null);
  const handleLogo=e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>onChange({...doc,logo:ev.target.result});r.readAsDataURL(file);};
  return <div style={{maxWidth:960,margin:"0 auto",padding:"32px 24px"}}>
    <div style={{marginBottom:24,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
      <div>
        <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Étape 2 / 3</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>{ti.icon}</span>
          <h2 style={{fontSize:20,fontWeight:800,letterSpacing:-.4,margin:0}}>{ti.label}</h2>
          <Badge label={doc.numero} color={ti.color}/>
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <Btn size="sm" onClick={onBack}>← Retour</Btn>
        <Btn variant="primary" size="sm" onClick={onNext}>Aperçu & Export →</Btn>
      </div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Card>
        <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:1.5,textTransform:"uppercase",marginBottom:16}}>Document</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14}}>
          <div><Lbl>Numéro</Lbl><Input value={doc.numero} onChange={v=>up("numero",v)}/></div>
          <div><Lbl>Statut</Lbl><Sel value={doc.statut} onChange={v=>up("statut",v)} options={STATUTS_PAR_TYPE[doc.type].map(s=>({value:s,label:STATUTS[s].label}))}/></div>
          <div><Lbl>Date</Lbl><Input type="date" value={doc.date} onChange={v=>up("date",v)}/></div>
          {doc.type!=="BON_LIVRAISON"&&<div><Lbl>Échéance</Lbl><Input type="date" value={doc.dateEcheance} onChange={v=>up("dateEcheance",v)}/></div>}
        </div>
      </Card>
      <Card>
        <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:1.5,textTransform:"uppercase",marginBottom:16}}>Logo entreprise</div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          {doc.logo?<div style={{position:"relative"}}>
            <img src={doc.logo} alt="logo" style={{height:56,maxWidth:150,objectFit:"contain",borderRadius:6,border:"1px solid "+T.border}}/>
            <button onClick={()=>onChange({...doc,logo:null})} style={{position:"absolute",top:-8,right:-8,background:T.danger,color:"#fff",border:"none",borderRadius:10,width:20,height:20,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>:<div onClick={()=>fileRef.current.click()} style={{width:120,height:56,border:"2px dashed "+T.border,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:T.inkLight,fontSize:12,textAlign:"center",padding:8}}>+ Uploader logo</div>}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} style={{display:"none"}}/>
          <div style={{fontSize:12,color:T.inkLight,lineHeight:1.7}}>PNG transparent recommandé<br/>Apparaît en haut du document</div>
        </div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card>
          <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:1.5,textTransform:"uppercase",marginBottom:16}}>Votre entreprise</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div><Lbl>Nom</Lbl><Input value={doc.entreprise&&doc.entreprise.nom||""} onChange={v=>up("entreprise.nom",v)} placeholder="YAKOUBI MOHAMED"/></div>
            <div><Lbl>Adresse</Lbl><Input value={doc.entreprise&&doc.entreprise.adresse||""} onChange={v=>up("entreprise.adresse",v)} placeholder="Clos de la Grotte, Ann Benian"/></div>
            <div><Lbl>Ville</Lbl><Input value={doc.entreprise&&doc.entreprise.ville||""} onChange={v=>up("entreprise.ville",v)} placeholder="Alger"/></div>
            <div><Lbl>Téléphone</Lbl><Input value={doc.entreprise&&doc.entreprise.telephone||""} onChange={v=>up("entreprise.telephone",v)} placeholder="05XX XX XX XX"/></div>
            <div><Lbl>Email</Lbl><Input value={doc.entreprise&&doc.entreprise.email||""} onChange={v=>up("entreprise.email",v)} placeholder="email@entreprise.dz"/></div>
            <div><Lbl>Code</Lbl><Input value={doc.entreprise&&doc.entreprise.code||""} onChange={v=>up("entreprise.code",v)} placeholder="20-036"/></div>
            <div><Lbl>Reg. Com.</Lbl><Input value={doc.entreprise&&doc.entreprise.rc||""} onChange={v=>up("entreprise.rc",v)} placeholder="23A5058012"/></div>
            <div><Lbl>Art. d'Imp.</Lbl><Input value={doc.entreprise&&doc.entreprise.ai||""} onChange={v=>up("entreprise.ai",v)} placeholder="16570583839"/></div>
            <div><Lbl>Id. Fiscal</Lbl><Input value={doc.entreprise&&doc.entreprise.idFiscal||""} onChange={v=>up("entreprise.idFiscal",v)} placeholder="19716320010218961600"/></div>
            <div><Lbl>NIF</Lbl><Input value={doc.entreprise&&doc.entreprise.nif||""} onChange={v=>up("entreprise.nif",v)} placeholder="000000000000000"/></div>
          </div>
        </Card>
        <Card>
          <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:1.5,textTransform:"uppercase",marginBottom:16}}>Client</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div><Lbl>Nom / Entreprise</Lbl><Input value={doc.client.nom} onChange={v=>up("client.nom",v)} placeholder="Nom du client"/></div>
            <div><Lbl>Adresse</Lbl><Input value={doc.client.adresse} onChange={v=>up("client.adresse",v)} placeholder="Adresse"/></div>
            <div><Lbl>Ville</Lbl><Input value={doc.client.ville} onChange={v=>up("client.ville",v)} placeholder="Alger"/></div>
            <div><Lbl>Email</Lbl><Input value={doc.client.email} onChange={v=>up("client.email",v)} placeholder="client@email.dz"/></div>
            <div><Lbl>Téléphone</Lbl><Input value={doc.client.telephone} onChange={v=>up("client.telephone",v)} placeholder="05XX XX XX XX"/></div>
            <div><Lbl>NIF Client</Lbl><Input value={doc.client.nif} onChange={v=>up("client.nif",v)} placeholder="000000000000000"/></div>
          </div>
        </Card>
      </div>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:1.5,textTransform:"uppercase"}}>Lignes</div>
          {showPrix&&<div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:T.inkLight}}>TVA 19%</span>
            <div onClick={()=>up("tvaActive",!doc.tvaActive)} style={{width:36,height:20,borderRadius:10,background:doc.tvaActive?T.accent:T.border,cursor:"pointer",position:"relative",transition:"background .2s"}}>
              <div style={{width:14,height:14,borderRadius:7,background:"#fff",position:"absolute",top:3,left:doc.tvaActive?19:3,transition:"left .2s"}}/>
            </div>
          </div>}
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:showPrix?640:360}}>
            <thead><tr style={{borderBottom:"2px solid "+T.border}}>
              {["Désignation","Qté","Unité",...(showPrix?["P.U. HT","Rem%",...(showTVA?["TVA%"]:[]),"Total HT"]:[]),""].map((h,i)=>(
                <th key={i} style={{color:T.inkLight,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",padding:"0 6px 10px",textAlign:i===0?"left":"right"}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{doc.lignes.map(l=>{
              const {ht}=calcLigne(l);
              return <tr key={l.id} style={{borderBottom:"1px solid "+T.border}}>
                <td style={{padding:"8px 6px",minWidth:150}}><Input value={l.designation} onChange={v=>upL(l.id,"designation",v)} placeholder="Description..."/></td>
                <td style={{padding:"8px 4px",width:58}}><Input value={l.quantite} onChange={v=>upL(l.id,"quantite",v)} type="number" style={{textAlign:"right"}}/></td>
                <td style={{padding:"8px 4px",width:68}}><Input value={l.unite} onChange={v=>upL(l.id,"unite",v)}/></td>
                {showPrix&&<>
                  <td style={{padding:"8px 4px",width:90}}><Input value={l.prixUnitaire} onChange={v=>upL(l.id,"prixUnitaire",v)} type="number" style={{textAlign:"right"}}/></td>
                  <td style={{padding:"8px 4px",width:52}}><Input value={l.remise} onChange={v=>upL(l.id,"remise",v)} type="number" style={{textAlign:"right"}}/></td>
                  {showTVA&&<td style={{padding:"8px 4px",width:52}}><Input value={l.tva} onChange={v=>upL(l.id,"tva",v)} type="number" style={{textAlign:"right"}}/></td>}
                  <td style={{padding:"8px 6px",width:100,textAlign:"right",fontSize:13,fontWeight:600,color:T.inkMid}}>{ht.toLocaleString("fr-DZ",{minimumFractionDigits:2})}</td>
                </>}
                <td style={{padding:"8px 4px",width:28,textAlign:"center"}}>
                  <button onClick={()=>delL(l.id)} style={{background:"none",border:"none",color:T.border,cursor:"pointer",fontSize:14,padding:"2px 5px",transition:"color .15s"}} onMouseEnter={e=>e.target.style.color=T.danger} onMouseLeave={e=>e.target.style.color=T.border}>✕</button>
                </td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        <Btn size="sm" onClick={addL} style={{marginTop:12}}>+ Ajouter une ligne</Btn>
        {showPrix&&<div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",marginTop:20,gap:7}}>
          <div style={{display:"flex",gap:28,fontSize:13}}><span style={{color:T.inkLight}}>Sous-total HT</span><span style={{fontWeight:600}}>{fmtDA(totaux.sous)}</span></div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:13,color:T.inkLight}}>Remise globale</span>
            <Input value={doc.remiseGlobale} onChange={v=>up("remiseGlobale",parseFloat(v)||0)} type="number" style={{width:56,textAlign:"right"}}/>
            <span style={{fontSize:13,color:T.inkLight}}>%</span>
          </div>
          {showTVA&&<div style={{display:"flex",gap:28,fontSize:13}}><span style={{color:T.inkLight}}>TVA</span><span style={{fontWeight:600}}>{fmtDA(totaux.totalTVA)}</span></div>}
          <div style={{display:"flex",gap:28,fontSize:17,fontWeight:800,color:T.accent,borderTop:"2px solid "+T.ink,paddingTop:10}}>
            <span>TOTAL {showTVA?"TTC":"HT"}</span><span>{fmtDA(showTVA?totaux.ttc:totaux.base)}</span>
          </div>
        </div>}
      </Card>
      <Card>
        <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:1.5,textTransform:"uppercase",marginBottom:16}}>Conditions & Notes</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {showPrix&&<div><Lbl>Mode de paiement</Lbl><Input value={doc.conditionsPaiement} onChange={v=>up("conditionsPaiement",v)}/></div>}
          <div style={{gridColumn:showPrix?"auto":"span 2"}}><Lbl>Notes</Lbl><textarea value={doc.notes} onChange={e=>up("notes",e.target.value)} style={{background:T.white,border:"1px solid "+T.border,borderRadius:8,color:T.ink,padding:"10px 14px",fontSize:14,width:"100%",minHeight:72,boxSizing:"border-box",fontFamily:"inherit",resize:"vertical",outline:"none"}}/></div>
        </div>
      </Card>
    </div>
    <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}>
      <Btn variant="primary" size="lg" onClick={onNext}>Aperçu & Export →</Btn>
    </div>
  </div>;
}

// STEP 3
function Step3({doc,onBack,onSave}){
  const ti=DOC_TYPES[doc.type];
  const totaux=calcTotaux(doc.lignes,doc.remiseGlobale,doc.tvaActive);
  const showPrix=doc.type!=="BON_LIVRAISON";
  const showTVA=doc.tvaActive&&showPrix;
  const ent=doc.entreprise||{};
  const printRef=useRef(null);
  const handlePrint=()=>{
    const content=printRef.current.innerHTML;
    const win=window.open("","_blank");
    win.document.write("<!DOCTYPE html><html><head><title>"+doc.numero+"</title><style>body{margin:0;padding:0;font-family:Georgia,serif}@media print{body{margin:0}}</style></head><body>"+content+"</body></html>");
    win.document.close();win.focus();
    setTimeout(()=>{win.print();win.close();},500);
  };
  return <div style={{maxWidth:880,margin:"0 auto",padding:"32px 24px"}}>
    <div style={{marginBottom:24,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
      <div>
        <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Étape 3 / 3</div>
        <h2 style={{fontSize:20,fontWeight:800,letterSpacing:-.4,margin:0}}>Aperçu & Export</h2>
      </div>
      <div style={{display:"flex",gap:8}}>
        <Btn size="sm" onClick={onBack}>← Modifier</Btn>
        <Btn size="sm" onClick={handlePrint} style={{background:"#F0FDF4",color:T.success,border:"1px solid "+T.success+"30"}}>🖨️ PDF / Imprimer</Btn>
        <Btn variant="primary" size="sm" onClick={onSave}>✓ Enregistrer au dashboard</Btn>
      </div>
    </div>
    <div ref={printRef} style={{background:"#fff",border:"1px solid "+T.border,borderRadius:12,padding:48,boxShadow:"0 4px 24px rgba(0,0,0,.07)",fontFamily:"Georgia,serif",color:"#111"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:32}}>
        <div>
          {doc.logo&&<img src={doc.logo} alt="logo" style={{height:56,maxWidth:160,objectFit:"contain",marginBottom:12,display:"block"}}/>}
          <div style={{fontFamily:"system-ui",fontWeight:900,fontSize:18,letterSpacing:-.5}}>{ent.nom||"Votre Entreprise"}</div>
          <div style={{marginTop:8,fontSize:11.5,color:"#555",lineHeight:2,fontFamily:"system-ui"}}>
            {ent.adresse&&<div>{ent.adresse}{ent.ville?", "+ent.ville:""}</div>}
            {ent.telephone&&<div>{ent.telephone}</div>}
            {ent.email&&<div>{ent.email}</div>}
            {ent.code&&<div>Code : {ent.code}</div>}
            {ent.rc&&<div>Reg. Com. n° {ent.rc}</div>}
            {ent.ai&&<div>Art. d'Imp. n° {ent.ai}</div>}
            {ent.idFiscal&&<div>Id. Fiscal n° {ent.idFiscal}</div>}
            {ent.nif&&<div>NIF : {ent.nif}</div>}
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{background:ti.color,color:"#fff",padding:"6px 16px",borderRadius:6,fontFamily:"system-ui",fontWeight:800,fontSize:11,letterSpacing:1.2,marginBottom:10,display:"inline-block"}}>{ti.label.toUpperCase()}</div>
          <div style={{fontFamily:"system-ui",fontWeight:800,fontSize:18}}>{doc.numero}</div>
          <div style={{fontSize:11.5,color:"#777",fontFamily:"system-ui",marginTop:6}}>Date : {doc.date}</div>
          {doc.dateEcheance&&<div style={{fontSize:11.5,color:"#777",fontFamily:"system-ui"}}>Échéance : {doc.dateEcheance}</div>}
        </div>
      </div>
      <div style={{borderTop:"2px solid #111",marginBottom:24}}/>
      <div style={{marginBottom:24}}>
        <div style={{fontFamily:"system-ui",fontSize:9,letterSpacing:2.5,color:"#aaa",textTransform:"uppercase",marginBottom:6}}>Destinataire</div>
        <div style={{fontWeight:700,fontSize:14,fontFamily:"system-ui"}}>{doc.client.nom||"—"}</div>
        <div style={{fontSize:11.5,color:"#555",fontFamily:"system-ui",marginTop:4,lineHeight:1.9}}>
          {doc.client.adresse&&<div>{doc.client.adresse}{doc.client.ville?", "+doc.client.ville:""}</div>}
          {doc.client.email&&<div>{doc.client.email}</div>}
          {doc.client.telephone&&<div>{doc.client.telephone}</div>}
          {doc.client.nif&&<div>NIF : {doc.client.nif}</div>}
        </div>
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",marginBottom:20}}>
        <thead><tr style={{background:"#111",color:"#fff"}}>
          {["N°","Désignation","Qté","Unité",...(showPrix?["P.U. HT","Rem%",...(showTVA?["TVA%"]:[]),"Total HT"]:[])].map((h,i)=>(
            <th key={i} style={{padding:"9px 10px",textAlign:i<=1?"left":"right",fontFamily:"system-ui",fontSize:9,letterSpacing:1.2,textTransform:"uppercase",fontWeight:700}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>{doc.lignes.map((l,i)=>{
          const {ht}=calcLigne(l);
          return <tr key={l.id} style={{background:i%2===0?"#F8F8F6":"#fff",borderBottom:"1px solid #EEE"}}>
            <td style={{padding:"9px 10px",fontSize:12,color:"#999",width:28}}>{i+1}</td>
            <td style={{padding:"9px 10px",fontSize:12}}>{l.designation||<span style={{color:"#ccc"}}>—</span>}</td>
            <td style={{padding:"9px 8px",textAlign:"right",fontSize:12}}>{l.quantite}</td>
            <td style={{padding:"9px 8px",textAlign:"right",fontSize:11,color:"#777"}}>{l.unite}</td>
            {showPrix&&<>
              <td style={{padding:"9px 8px",textAlign:"right",fontSize:12}}>{l.prixUnitaire.toLocaleString("fr-DZ")}</td>
              <td style={{padding:"9px 8px",textAlign:"right",fontSize:12,color:l.remise>0?"#C8762E":"#ccc"}}>{l.remise>0?l.remise+"%":"—"}</td>
              {showTVA&&<td style={{padding:"9px 8px",textAlign:"right",fontSize:12}}>{l.tva}%</td>}
              <td style={{padding:"9px 10px",textAlign:"right",fontSize:12,fontWeight:600}}>{ht.toLocaleString("fr-DZ",{minimumFractionDigits:2})}</td>
            </>}
          </tr>;
        })}</tbody>
      </table>
      {showPrix&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:20}}>
        <div style={{minWidth:250}}>
          {[["Sous-total HT",fmtDA(totaux.sous)],...(doc.remiseGlobale>0?[["Remise ("+doc.remiseGlobale+"%)","-"+fmtDA(totaux.remAmt)],["Base HT",fmtDA(totaux.base)]]:[])]
            .map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #EEE",fontSize:12,color:"#666"}}><span>{l}</span><span style={{color:"#111"}}>{v}</span></div>)}
          {showTVA&&<div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #EEE",fontSize:12,color:"#666"}}><span>TVA</span><span>{fmtDA(totaux.totalTVA)}</span></div>}
          <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",fontWeight:800,fontSize:16,color:"#111",borderTop:"2px solid #111",marginTop:4}}>
            <span>TOTAL {showTVA?"TTC":"HT"}</span><span style={{color:T.accent}}>{fmtDA(showTVA?totaux.ttc:totaux.base)}</span>
          </div>
        </div>
      </div>}
      {(doc.conditionsPaiement||doc.notes)&&<div style={{borderTop:"1px solid #EEE",paddingTop:16,marginTop:8}}>
        {showPrix&&doc.conditionsPaiement&&<div style={{marginBottom:8}}>
          <div style={{fontFamily:"system-ui",fontSize:9,letterSpacing:2,color:"#aaa",textTransform:"uppercase",marginBottom:3}}>Mode de paiement</div>
          <div style={{fontSize:12}}>{doc.conditionsPaiement}</div>
        </div>}
        {doc.notes&&<div>
          <div style={{fontFamily:"system-ui",fontSize:9,letterSpacing:2,color:"#aaa",textTransform:"uppercase",marginBottom:3}}>Notes</div>
          <div style={{fontSize:12}}>{doc.notes}</div>
        </div>}
      </div>}
      <div style={{marginTop:32,textAlign:"center",fontFamily:"system-ui",fontSize:9,color:"#ccc",letterSpacing:1}}>Document généré via InvoiceDZ · invoicedz.dz</div>
    </div>
    <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:24}}>
      <Btn size="md" onClick={handlePrint} style={{background:"#F0FDF4",color:T.success,border:"1px solid "+T.success+"30"}}>🖨️ Imprimer / Enregistrer en PDF</Btn>
      <Btn variant="primary" size="md" onClick={onSave}>✓ Enregistrer & Dashboard</Btn>
    </div>
  </div>;
}

// DASHBOARD
function Dashboard({user,docs,onNewDoc,onViewDoc,onLogout}){
  const [filter,setFilter]=useState("ALL");
  const [search,setSearch]=useState("");
  const filtered=docs.filter(d=>{
    if(filter!=="ALL"&&d.type!==filter)return false;
    if(search&&!d.numero.toLowerCase().includes(search.toLowerCase())&&!d.client.nom.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  });
  const tot=docs.reduce((acc,d)=>{const t=calcTotaux(d.lignes,d.remiseGlobale,d.tvaActive);acc.total+=t.ttc;if(d.statut==="PAYE")acc.paye+=t.ttc;if(d.statut==="ENVOYE"||d.statut==="EN_ATTENTE")acc.attente+=t.ttc;return acc;},{total:0,paye:0,attente:0});
  return <div style={{minHeight:"100vh",background:T.bg,fontFamily:"system-ui,-apple-system,sans-serif",color:T.ink}}>
    <div style={{background:T.white,borderBottom:"1px solid "+T.border,height:56,display:"flex",alignItems:"center",padding:"0 24px",gap:12,position:"sticky",top:0,zIndex:100}}>
      <Logo/>
      <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontSize:13,color:T.inkLight}}>Bonjour, {user.nom} 👋</span>
        <Btn variant="primary" size="sm" onClick={onNewDoc}>+ Nouveau document</Btn>
        <Btn variant="ghost" size="sm" onClick={onLogout}>Déconnexion</Btn>
      </div>
    </div>
    <div style={{maxWidth:1100,margin:"0 auto",padding:24}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:28}}>
        {[{label:"Total documents",value:docs.length,color:T.ink,icon:"📄"},
          {label:"Total facturé",value:fmtDA(tot.total),color:T.accent,icon:"💰"},
          {label:"Payé",value:fmtDA(tot.paye),color:T.success,icon:"✅"},
          {label:"En attente",value:fmtDA(tot.attente),color:T.warning,icon:"⏳"}].map(s=>(
          <Card key={s.label} style={{padding:"16px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:11,color:T.inkLight,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>{s.label}</div>
                <div style={{fontSize:typeof s.value==="number"?28:15,fontWeight:800,color:s.color}}>{s.value}</div>
              </div>
              <span style={{fontSize:22}}>{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <Input value={search} onChange={setSearch} placeholder="Rechercher..." style={{width:200}}/>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[["ALL","Tous"],...Object.entries(DOC_TYPES).map(([k,v])=>[k,v.label])].map(([k,l])=>(
              <button key={k} onClick={()=>setFilter(k)} style={{padding:"7px 12px",fontSize:12,fontWeight:600,borderRadius:7,border:"1px solid "+(filter===k?T.accent:T.border),background:filter===k?T.accentBg:"transparent",color:filter===k?T.accent:T.inkLight,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
            ))}
          </div>
        </div>
        <Btn variant="primary" size="sm" onClick={onNewDoc}>+ Nouveau</Btn>
      </div>
      {filtered.length===0?(
        <Card style={{textAlign:"center",padding:60}}>
          <div style={{fontSize:40,marginBottom:14}}>📄</div>
          <div style={{color:T.inkLight,fontSize:15,marginBottom:20}}>{docs.length===0?"Aucun document pour l'instant":"Aucun résultat"}</div>
          {docs.length===0&&<Btn variant="primary" onClick={onNewDoc}>Créer mon premier document →</Btn>}
        </Card>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map(doc=>{
            const ti=DOC_TYPES[doc.type],si=STATUTS[doc.statut];
            const t=calcTotaux(doc.lignes,doc.remiseGlobale,doc.tvaActive);
            const showPrix=doc.type!=="BON_LIVRAISON";
            return <Card key={doc.id} style={{padding:"14px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,transition:"border-color .15s,box-shadow .15s"}}
              onClick={()=>onViewDoc(doc)}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.06)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow="none";}}>
              <div style={{fontSize:18,flexShrink:0}}>{ti.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{fontSize:10,fontWeight:700,color:ti.color,textTransform:"uppercase",letterSpacing:.5}}>{ti.label}</span>
                  <span style={{fontWeight:700,fontSize:14}}>{doc.numero}</span>
                  <Badge label={si.label} color={si.color}/>
                </div>
                <div style={{color:T.inkLight,fontSize:12}}>{doc.client.nom||"Client non défini"} · {doc.date}</div>
              </div>
              {showPrix&&<div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontWeight:700,fontSize:14}}>{fmtDA(doc.tvaActive?t.ttc:t.base)}</div>
                <div style={{color:T.inkLight,fontSize:11}}>{doc.lignes.length} ligne{doc.lignes.length>1?"s":""}</div>
              </div>}
            </Card>;
          })}
        </div>
      )}
    </div>
  </div>;
}

// ROOT
export default function Root(){
  const [page,setPage]=useState("landing");
  const [authMode,setAuthMode]=useState("signup");
  const [user,setUser]=useState(null);
  const [docs,setDocs]=useState([]);
  const [wDoc,setWDoc]=useState(null);
  const [wStep,setWStep]=useState(1);
  const [vDoc,setVDoc]=useState(null);

  const handleAuth=u=>{setUser(u);setPage("dashboard");};
  const startWizard=()=>{setWDoc(null);setWStep(1);setPage("wizard");};
  const handleChoix=type=>{setWDoc(newDoc(type,user));setWStep(2);};
  const handleSave=()=>{setDocs(p=>[{...wDoc,id:Math.random()},...p]);setPage("dashboard");setWDoc(null);setWStep(1);};
  const handleView=doc=>{setVDoc(doc);setPage("view");};

  const StepBar=()=>(
    <div style={{background:T.white,borderBottom:"1px solid "+T.border,height:56,display:"flex",alignItems:"center",padding:"0 24px",gap:24,position:"sticky",top:0,zIndex:100}}>
      <Logo/>
      <div style={{display:"flex",gap:6,marginLeft:16,alignItems:"center"}}>
        {[{n:1,l:"Type"},{n:2,l:"Remplir"},{n:3,l:"Export"}].map((s,i)=>(
          <div key={s.n} style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:24,height:24,borderRadius:12,background:wStep>=s.n?T.accent:T.border,color:wStep>=s.n?"#fff":T.inkLight,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{s.n}</div>
            <span style={{fontSize:12,color:wStep===s.n?T.ink:T.inkLight,fontWeight:wStep===s.n?600:400}}>{s.l}</span>
            {i<2&&<span style={{color:T.border,fontSize:14,marginLeft:6}}>›</span>}
          </div>
        ))}
      </div>
      <div style={{marginLeft:"auto"}}>
        {user&&<Btn variant="ghost" size="sm" onClick={()=>setPage("dashboard")}>Dashboard</Btn>}
      </div>
    </div>
  );

  if(page==="landing") return <Landing onSignup={()=>{setAuthMode("signup");setPage("auth");}} onLogin={()=>{setAuthMode("login");setPage("auth");}}/>;
  if(page==="auth") return <Auth mode={authMode} onAuth={handleAuth} onToggle={()=>setAuthMode(m=>m==="signup"?"login":"signup")}/>;
  if(page==="wizard") return <div style={{minHeight:"100vh",background:T.bg,fontFamily:"system-ui,-apple-system,sans-serif"}}>
    <StepBar/>
    {wStep===1&&<Step1 onChoix={handleChoix}/>}
    {wStep===2&&wDoc&&<Step2 doc={wDoc} onChange={setWDoc} onNext={()=>setWStep(3)} onBack={()=>setWStep(1)}/>}
    {wStep===3&&wDoc&&<Step3 doc={wDoc} onBack={()=>setWStep(2)} onSave={handleSave}/>}
  </div>;
  if(page==="view"&&vDoc) return <div style={{minHeight:"100vh",background:T.bg,fontFamily:"system-ui,-apple-system,sans-serif"}}>
    <div style={{background:T.white,borderBottom:"1px solid "+T.border,height:56,display:"flex",alignItems:"center",padding:"0 24px",gap:12,position:"sticky",top:0,zIndex:100}}>
      <Logo/>
      <div style={{marginLeft:"auto"}}><Btn size="sm" onClick={()=>setPage("dashboard")}>← Dashboard</Btn></div>
    </div>
    <Step3 doc={vDoc} onBack={()=>setPage("dashboard")} onSave={()=>setPage("dashboard")}/>
  </div>;
  if(page==="dashboard"&&user) return <Dashboard user={user} docs={docs} onNewDoc={startWizard} onViewDoc={handleView} onLogout={()=>{setUser(null);setDocs([]);setPage("landing");}}/>;
  return null;
}
