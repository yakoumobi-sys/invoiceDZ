"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T, DOC_TYPES } from "../lib/constants";
import { Btn, Logo } from "../components/ui";

export default function Landing() {
  const router = useRouter();
  const [faq, setFaq] = useState(null);

  const faqs = [
    { q:"Est-ce gratuit ?", a:"Oui. Le plan gratuit permet 5 documents/mois. Le plan Pro à 1 990 DA/mois est illimité." },
    { q:"Puis-je ajouter mon logo ?", a:"Oui, lors de la création de chaque document vous pouvez uploader votre logo." },
    { q:"Comment fonctionne la TVA ?", a:"InvoiceDZ supporte la TVA algérienne à 19%. Vous pouvez la désactiver si besoin." },
    { q:"Mes données sont-elles sécurisées ?", a:"Vos données sont stockées de façon sécurisée. Vous pouvez les exporter à tout moment." },
  ];

  return (
    <div style={{background:T.bg,minHeight:"100vh",color:T.ink}}>
      {/* NAV */}
      <nav style={{background:T.white,borderBottom:"1px solid "+T.border,position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 24px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <Logo/>
          <div style={{display:"flex",gap:8}}>
            <Btn variant="ghost" size="sm" onClick={()=>router.push("/auth")}>Connexion</Btn>
            <Btn variant="primary" size="sm" onClick={()=>router.push("/auth?mode=signup")}>Créer un compte</Btn>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{maxWidth:1100,margin:"0 auto",padding:"88px 24px 64px",textAlign:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:T.accentBg,border:"1px solid "+T.accent+"22",borderRadius:20,padding:"6px 16px",marginBottom:28}}>
          <span style={{width:6,height:6,borderRadius:3,background:T.accent,display:"inline-block"}}/>
          <span style={{fontSize:12,color:T.accent,fontWeight:600}}>Facturation en ligne · Conçu pour l'Algérie</span>
        </div>
        <h1 style={{fontSize:"clamp(36px,5.5vw,60px)",fontWeight:900,lineHeight:1.1,letterSpacing:-2,marginBottom:20,color:T.ink}}>
          Vos documents professionnels<br/>
          <span style={{color:T.accent}}>en 3 étapes.</span>
        </h1>
        <p style={{fontSize:17,color:T.inkMid,maxWidth:480,margin:"0 auto 36px",lineHeight:1.65}}>
          Factures, devis, bons de livraison — créez, exportez en PDF et gérez depuis un seul endroit.
        </p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:64}}>
          <Btn variant="primary" size="lg" onClick={()=>router.push("/auth?mode=signup")}>
            Créer ma première facture →
          </Btn>
          <Btn size="lg" onClick={()=>router.push("/auth")}>Se connecter</Btn>
        </div>

        {/* Steps */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20,maxWidth:820,margin:"0 auto"}}>
          {[
            {n:"1",title:"Choisir le type",desc:"Facture, Devis, Proforma, Bon de commande ou Bon de livraison"},
            {n:"2",title:"Remplir & personnaliser",desc:"Vos infos, votre logo, les lignes et conditions"},
            {n:"3",title:"Exporter en PDF",desc:"Document professionnel téléchargeable instantanément"},
          ].map(s=>(
            <div key={s.n} style={{background:T.white,border:"1px solid "+T.border,borderRadius:12,padding:24,textAlign:"left"}}>
              <div style={{width:32,height:32,borderRadius:8,background:T.accentBg,color:T.accent,fontWeight:800,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>{s.n}</div>
              <div style={{fontWeight:700,fontSize:15,marginBottom:6}}>{s.title}</div>
              <div style={{color:T.inkLight,fontSize:13,lineHeight:1.6}}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DOC TYPES */}
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

      {/* PRICING */}
      <section style={{maxWidth:760,margin:"0 auto",padding:"64px 24px"}}>
        <div style={{textAlign:"center",marginBottom:44}}>
          <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Tarifs</div>
          <h2 style={{fontSize:30,fontWeight:800,letterSpacing:-.8}}>Simple et transparent.</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          {[
            {name:"Gratuit",price:"0 DA",period:"/mois",features:["5 documents/mois","5 types de documents","Export PDF","Support email"],cta:"Commencer",v:"default"},
            {name:"Pro",price:"1 990 DA",period:"/mois",features:["Documents illimités","Logo personnalisé","Multi-entreprises","Support prioritaire"],cta:"Essayer Pro",v:"primary",hot:true},
          ].map(p=>(
            <div key={p.name} style={{background:p.hot?"#111":T.white,border:"1px solid "+(p.hot?"transparent":T.border),borderRadius:14,padding:28,position:"relative"}}>
              {p.hot&&<div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:T.accent,color:"#fff",borderRadius:20,padding:"3px 14px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>Le plus populaire</div>}
              <div style={{color:p.hot?"#777":T.inkLight,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>{p.name}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:3,marginBottom:20}}>
                <span style={{fontSize:30,fontWeight:900,color:p.hot?"#fff":T.ink}}>{p.price}</span>
                <span style={{color:p.hot?"#555":T.inkLight,fontSize:13}}>{p.period}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
                {p.features.map(f=>(
                  <div key={f} style={{display:"flex",gap:8,fontSize:13,color:p.hot?"#bbb":T.inkMid}}>
                    <span style={{color:p.hot?T.accent:T.success,fontWeight:700}}>✓</span>{f}
                  </div>
                ))}
              </div>
              <Btn variant={p.v} style={{width:"100%"}} onClick={()=>router.push("/auth?mode=signup")}>{p.cta}</Btn>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{background:T.white,borderTop:"1px solid "+T.border,padding:"48px 24px"}}>
        <div style={{maxWidth:600,margin:"0 auto"}}>
          <h2 style={{fontSize:26,fontWeight:800,textAlign:"center",marginBottom:32,letterSpacing:-.5}}>Questions fréquentes</h2>
          {faqs.map((f,i)=>(
            <div key={i} style={{borderBottom:"1px solid "+T.border}}>
              <button onClick={()=>setFaq(faq===i?null:i)} style={{width:"100%",background:"none",border:"none",padding:"15px 0",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:600,color:T.ink,textAlign:"left"}}>
                {f.q}
                <span style={{color:T.inkLight,fontSize:18,transform:faq===i?"rotate(45deg)":"none",transition:"transform .2s",flexShrink:0,marginLeft:12}}>+</span>
              </button>
              {faq===i&&<div style={{paddingBottom:14,fontSize:13,color:T.inkMid,lineHeight:1.7}}>{f.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{background:T.accent,padding:"56px 24px",textAlign:"center"}}>
        <h2 style={{fontSize:30,fontWeight:900,color:"#fff",letterSpacing:-.8,marginBottom:12}}>Prêt à professionnaliser votre facturation ?</h2>
        <p style={{color:"rgba(255,255,255,.7)",marginBottom:24,fontSize:15}}>Gratuit pour commencer. Aucune carte bancaire requise.</p>
        <Btn size="lg" style={{background:"#fff",color:T.accent,fontWeight:800}} onClick={()=>router.push("/auth?mode=signup")}>
          Créer mon compte gratuitement
        </Btn>
      </section>

      <footer style={{background:"#111",padding:"28px 24px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <Logo/>
          <div style={{fontSize:12,color:"#555"}}>© 2025 InvoiceDZ · contact@invoicedz.dz</div>
        </div>
      </footer>
    </div>
  );
}
