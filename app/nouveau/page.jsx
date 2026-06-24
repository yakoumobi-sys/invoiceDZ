"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { T, DOC_TYPES, STATUTS, STATUTS_PAR_TYPE, newDoc, emptyLigne, calcLigne, calcTotaux, fmtDA } from "../../lib/constants";
import { Btn, Input, Sel, Lbl, Card, Badge, Logo } from "../../components/ui";

// ─── STEP 1 ───────────────────────────────────────────────────────────
function Step1({ onChoix }) {
  const [sel, setSel] = useState(null);
  return (
    <div style={{maxWidth:760,margin:"0 auto",padding:"48px 24px"}}>
      <div style={{marginBottom:36,textAlign:"center"}}>
        <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Étape 1 / 3</div>
        <h2 style={{fontSize:26,fontWeight:800,letterSpacing:-.5,marginBottom:8,color:T.ink}}>Quel document voulez-vous créer ?</h2>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:32}}>
        {Object.entries(DOC_TYPES).map(([k,t])=>(
          <button key={k} onClick={()=>setSel(k)}
            style={{background:sel===k?t.color+"12":T.white,border:"2px solid "+(sel===k?t.color:T.border),borderRadius:12,padding:"20px 16px",textAlign:"left",cursor:"pointer",fontFamily:"inherit",transition:"all .15s",outline:"none"}}>
            <div style={{fontSize:28,marginBottom:10}}>{t.icon}</div>
            <div style={{fontWeight:700,fontSize:14,color:sel===k?t.color:T.ink,marginBottom:4}}>{t.label}</div>
            <div style={{fontSize:12,color:T.inkLight,lineHeight:1.5}}>{t.desc}</div>
          </button>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"flex-end"}}>
        <Btn variant="primary" size="lg" disabled={!sel} onClick={()=>onChoix(sel)}>Continuer →</Btn>
      </div>
    </div>
  );
}

// ─── STEP 2 ───────────────────────────────────────────────────────────
function Step2({ doc, onChange, onNext, onBack }) {
  const up = (path, val) => {
    const parts = path.split(".");
    const next = { ...doc }; let obj = next;
    for (let i = 0; i < parts.length-1; i++) obj = obj[parts[i]] = { ...obj[parts[i]] };
    obj[parts[parts.length-1]] = val;
    onChange(next);
  };
  const upL = (id, f, v) => onChange({ ...doc, lignes: doc.lignes.map(l => l.id===id ? { ...l, [f]: ["designation","unite"].includes(f)?v:parseFloat(v)||0 } : l) });
  const addL = () => onChange({ ...doc, lignes: [...doc.lignes, emptyLigne()] });
  const delL = id => onChange({ ...doc, lignes: doc.lignes.filter(l => l.id!==id) });
  const showPrix = doc.type !== "BON_LIVRAISON";
  const showTVA = doc.tvaActive && showPrix;
  const totaux = calcTotaux(doc.lignes, doc.remiseGlobale, doc.tvaActive);
  const ti = DOC_TYPES[doc.type];
  const fileRef = useRef(null);

  const handleLogo = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange({ ...doc, logo: ev.target.result });
    reader.readAsDataURL(file);
  };

  return (
    <div style={{maxWidth:960,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{marginBottom:24,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Étape 2 / 3</div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>{ti.icon}</span>
            <h2 style={{fontSize:20,fontWeight:800,letterSpacing:-.4,margin:0,color:T.ink}}>{ti.label}</h2>
            <Badge label={doc.numero} color={ti.color}/>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn size="sm" onClick={onBack}>← Retour</Btn>
          <Btn variant="primary" size="sm" onClick={onNext}>Aperçu & Export →</Btn>
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:16}}>

        {/* Infos doc */}
        <Card>
          <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:1.5,textTransform:"uppercase",marginBottom:16}}>Document</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14}}>
            <div><Lbl>Numéro</Lbl><Input value={doc.numero} onChange={v=>up("numero",v)}/></div>
            <div><Lbl>Statut</Lbl><Sel value={doc.statut} onChange={v=>up("statut",v)} options={STATUTS_PAR_TYPE[doc.type].map(s=>({value:s,label:STATUTS[s].label}))}/></div>
            <div><Lbl>Date</Lbl><Input type="date" value={doc.date} onChange={v=>up("date",v)}/></div>
            {doc.type!=="BON_LIVRAISON"&&<div><Lbl>Échéance</Lbl><Input type="date" value={doc.dateEcheance} onChange={v=>up("dateEcheance",v)}/></div>}
          </div>
        </Card>

        {/* Logo */}
        <Card>
          <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:1.5,textTransform:"uppercase",marginBottom:16}}>Logo entreprise</div>
          <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
            {doc.logo ? (
              <div style={{position:"relative"}}>
                <img src={doc.logo} alt="logo" style={{height:56,maxWidth:150,objectFit:"contain",borderRadius:6,border:"1px solid "+T.border}}/>
                <button onClick={()=>onChange({...doc,logo:null})} style={{position:"absolute",top:-8,right:-8,background:T.danger,color:"#fff",border:"none",borderRadius:10,width:20,height:20,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
            ) : (
              <div onClick={()=>fileRef.current.click()} style={{width:140,height:60,border:"2px dashed "+T.border,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:T.inkLight,fontSize:13,textAlign:"center",padding:8}}>
                📎 Uploader logo
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} style={{display:"none"}}/>
            <div style={{fontSize:12,color:T.inkLight,lineHeight:1.7}}>PNG transparent recommandé<br/>Apparaît en haut du document</div>
          </div>
        </Card>

        {/* Entreprise + Client */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Card>
            <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:1.5,textTransform:"uppercase",marginBottom:16}}>Votre entreprise</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div><Lbl>Nom</Lbl><Input value={doc.entreprise?.nom||""} onChange={v=>up("entreprise.nom",v)} placeholder="YAKOUBI MOHAMED"/></div>
              <div><Lbl>Adresse</Lbl><Input value={doc.entreprise?.adresse||""} onChange={v=>up("entreprise.adresse",v)} placeholder="Clos de la Grotte, Ann Benian"/></div>
              <div><Lbl>Ville</Lbl><Input value={doc.entreprise?.ville||""} onChange={v=>up("entreprise.ville",v)} placeholder="Alger"/></div>
              <div><Lbl>Téléphone</Lbl><Input value={doc.entreprise?.telephone||""} onChange={v=>up("entreprise.telephone",v)} placeholder="05XX XX XX XX"/></div>
              <div><Lbl>Email</Lbl><Input value={doc.entreprise?.email||""} onChange={v=>up("entreprise.email",v)} placeholder="email@entreprise.dz"/></div>
              <div><Lbl>Code</Lbl><Input value={doc.entreprise?.code||""} onChange={v=>up("entreprise.code",v)} placeholder="20-036"/></div>
              <div><Lbl>Reg. Com.</Lbl><Input value={doc.entreprise?.rc||""} onChange={v=>up("entreprise.rc",v)} placeholder="23A5058012"/></div>
              <div><Lbl>Art. d'Imp.</Lbl><Input value={doc.entreprise?.ai||""} onChange={v=>up("entreprise.ai",v)} placeholder="16570583839"/></div>
              <div><Lbl>Id. Fiscal</Lbl><Input value={doc.entreprise?.idFiscal||""} onChange={v=>up("entreprise.idFiscal",v)} placeholder="19716320010218961600"/></div>
              <div><Lbl>NIF</Lbl><Input value={doc.entreprise?.nif||""} onChange={v=>up("entreprise.nif",v)} placeholder="000000000000000"/></div>
            </div>
          </Card>
          <Card>
            <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:1.5,textTransform:"uppercase",marginBottom:16}}>Client</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div><Lbl>Nom / Entreprise</Lbl><Input value={doc.client?.nom||""} onChange={v=>up("client.nom",v)} placeholder="Nom du client"/></div>
              <div><Lbl>Adresse</Lbl><Input value={doc.client?.adresse||""} onChange={v=>up("client.adresse",v)} placeholder="Adresse"/></div>
              <div><Lbl>Ville</Lbl><Input value={doc.client?.ville||""} onChange={v=>up("client.ville",v)} placeholder="Alger"/></div>
              <div><Lbl>Email</Lbl><Input value={doc.client?.email||""} onChange={v=>up("client.email",v)} placeholder="client@email.dz"/></div>
              <div><Lbl>Téléphone</Lbl><Input value={doc.client?.telephone||""} onChange={v=>up("client.telephone",v)} placeholder="05XX XX XX XX"/></div>
              <div><Lbl>NIF Client</Lbl><Input value={doc.client?.nif||""} onChange={v=>up("client.nif",v)} placeholder="000000000000000"/></div>
            </div>
          </Card>
        </div>

        {/* Lignes */}
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:1.5,textTransform:"uppercase"}}>Lignes</div>
            {showPrix&&(
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:T.inkLight}}>TVA 19%</span>
                <div onClick={()=>up("tvaActive",!doc.tvaActive)} style={{width:36,height:20,borderRadius:10,background:doc.tvaActive?T.accent:T.border,cursor:"pointer",position:"relative",transition:"background .2s"}}>
                  <div style={{width:14,height:14,borderRadius:7,background:"#fff",position:"absolute",top:3,left:doc.tvaActive?19:3,transition:"left .2s"}}/>
                </div>
              </div>
            )}
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:showPrix?640:360}}>
              <thead>
                <tr style={{borderBottom:"2px solid "+T.border}}>
                  {["Désignation","Qté","Unité",...(showPrix?["P.U. HT","Rem%",...(showTVA?["TVA%"]:[]),"Total HT"]:[]),""].map((h,i)=>(
                    <th key={i} style={{color:T.inkLight,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",padding:"0 6px 10px",textAlign:i===0?"left":"right"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doc.lignes.map(l=>{
                  const {ht}=calcLigne(l);
                  return (
                    <tr key={l.id} style={{borderBottom:"1px solid "+T.border}}>
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
                        <button onClick={()=>delL(l.id)} style={{background:"none",border:"none",color:T.border,cursor:"pointer",fontSize:14,padding:"2px 5px",transition:"color .15s"}}
                          onMouseEnter={e=>e.target.style.color=T.danger} onMouseLeave={e=>e.target.style.color=T.border}>✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Btn size="sm" onClick={addL} style={{marginTop:12}}>+ Ajouter une ligne</Btn>
          {showPrix&&(
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",marginTop:20,gap:7}}>
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
            </div>
          )}
        </Card>

        {/* Notes */}
        <Card>
          <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:1.5,textTransform:"uppercase",marginBottom:16}}>Conditions & Notes</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {showPrix&&<div><Lbl>Mode de paiement</Lbl><Input value={doc.conditionsPaiement||""} onChange={v=>up("conditionsPaiement",v)}/></div>}
            <div style={{gridColumn:showPrix?"auto":"span 2"}}>
              <Lbl>Notes</Lbl>
              <textarea value={doc.notes||""} onChange={e=>up("notes",e.target.value)}
                style={{background:T.white,border:"1px solid "+T.border,borderRadius:8,color:T.ink,padding:"10px 14px",fontSize:14,width:"100%",minHeight:72,boxSizing:"border-box",fontFamily:"inherit",resize:"vertical",outline:"none"}}/>
            </div>
          </div>
        </Card>
      </div>

      <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}>
        <Btn variant="primary" size="lg" onClick={onNext}>Aperçu & Export →</Btn>
      </div>
    </div>
  );
}

// ─── STEP 3 : APERÇU + EXPORT ─────────────────────────────────────────
function Step3({ doc, onBack, onSave, saving }) {
  const ti = DOC_TYPES[doc.type];
  const totaux = calcTotaux(doc.lignes, doc.remiseGlobale, doc.tvaActive);
  const showPrix = doc.type !== "BON_LIVRAISON";
  const showTVA = doc.tvaActive && showPrix;
  const ent = doc.entreprise || {};

  const handleExport = () => {
    // Build a clean print page and trigger browser print-to-PDF
    const docHtml = document.getElementById("invoice-preview").innerHTML;
    const printWin = window.open("", "_blank", "width=900,height=700");
    printWin.document.open();
    printWin.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>${doc.numero}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; color: #111; background: #fff; }
    @page { size: A4; margin: 15mm 15mm 20mm 15mm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 10px; }
    img { max-width: 150px; height: auto; }
    div { max-width: 100%; }
  </style>
</head>
<body>${docHtml}</body>
</html>`);
    printWin.document.close();
    printWin.addEventListener("load", () => {
      printWin.focus();
      printWin.print();
    });
  };

  return (
    <div style={{maxWidth:880,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{marginBottom:24,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.accent,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Étape 3 / 3</div>
          <h2 style={{fontSize:20,fontWeight:800,letterSpacing:-.4,margin:0,color:T.ink}}>Aperçu & Export</h2>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Btn size="sm" onClick={onBack}>← Modifier</Btn>
          <Btn size="sm" variant="success" onClick={handleExport}>⬇️ Télécharger PDF</Btn>
          <Btn variant="primary" size="sm" onClick={onSave} disabled={saving}>
            {saving?"Enregistrement...":"✓ Enregistrer au dashboard"}
          </Btn>
        </div>
      </div>

      {/* Document preview */}
      <div id="invoice-preview" style={{background:"#fff",border:"1px solid "+T.border,borderRadius:12,padding:48,boxShadow:"0 4px 24px rgba(0,0,0,.07)",fontFamily:"Georgia,serif",color:"#111"}}>
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
          <div style={{fontWeight:700,fontSize:14,fontFamily:"system-ui"}}>{doc.client?.nom||"—"}</div>
          <div style={{fontSize:11.5,color:"#555",fontFamily:"system-ui",marginTop:4,lineHeight:1.9}}>
            {doc.client?.adresse&&<div>{doc.client.adresse}{doc.client.ville?", "+doc.client.ville:""}</div>}
            {doc.client?.email&&<div>{doc.client.email}</div>}
            {doc.client?.telephone&&<div>{doc.client.telephone}</div>}
            {doc.client?.nif&&<div>NIF : {doc.client.nif}</div>}
          </div>
        </div>

        <table style={{width:"100%",borderCollapse:"collapse",marginBottom:20}}>
          <thead>
            <tr style={{background:"#111",color:"#fff"}}>
              {["N°","Désignation","Qté","Unité",...(showPrix?["P.U. HT","Rem%",...(showTVA?["TVA%"]:[]),"Total HT"]:[])].map((h,i)=>(
                <th key={i} style={{padding:"9px 10px",textAlign:i<=1?"left":"right",fontFamily:"system-ui",fontSize:9,letterSpacing:1.2,textTransform:"uppercase",fontWeight:700}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {doc.lignes.map((l,i)=>{
              const {ht}=calcLigne(l);
              return (
                <tr key={l.id} style={{background:i%2===0?"#F8F8F6":"#fff",borderBottom:"1px solid #EEE"}}>
                  <td style={{padding:"9px 10px",fontSize:12,color:"#999",width:28}}>{i+1}</td>
                  <td style={{padding:"9px 10px",fontSize:12}}>{l.designation||"—"}</td>
                  <td style={{padding:"9px 8px",textAlign:"right",fontSize:12}}>{l.quantite}</td>
                  <td style={{padding:"9px 8px",textAlign:"right",fontSize:11,color:"#777"}}>{l.unite}</td>
                  {showPrix&&<>
                    <td style={{padding:"9px 8px",textAlign:"right",fontSize:12}}>{l.prixUnitaire.toLocaleString("fr-DZ")}</td>
                    <td style={{padding:"9px 8px",textAlign:"right",fontSize:12,color:l.remise>0?"#C8762E":"#ccc"}}>{l.remise>0?l.remise+"%":"—"}</td>
                    {showTVA&&<td style={{padding:"9px 8px",textAlign:"right",fontSize:12}}>{l.tva}%</td>}
                    <td style={{padding:"9px 10px",textAlign:"right",fontSize:12,fontWeight:600}}>{ht.toLocaleString("fr-DZ",{minimumFractionDigits:2})}</td>
                  </>}
                </tr>
              );
            })}
          </tbody>
        </table>

        {showPrix&&(
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:20}}>
            <div style={{minWidth:250}}>
              {[["Sous-total HT",fmtDA(totaux.sous)],...(doc.remiseGlobale>0?[["Remise ("+doc.remiseGlobale+"%)","-"+fmtDA(totaux.remAmt)],["Base HT",fmtDA(totaux.base)]]:[])]
                .map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #EEE",fontSize:12,color:"#666"}}><span>{l}</span><span style={{color:"#111"}}>{v}</span></div>)}
              {showTVA&&<div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #EEE",fontSize:12,color:"#666"}}><span>TVA</span><span>{fmtDA(totaux.totalTVA)}</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",fontWeight:800,fontSize:16,color:"#111",borderTop:"2px solid #111",marginTop:4}}>
                <span>TOTAL {showTVA?"TTC":"HT"}</span>
                <span style={{color:T.accent}}>{fmtDA(showTVA?totaux.ttc:totaux.base)}</span>
              </div>
            </div>
          </div>
        )}

        {(doc.conditionsPaiement||doc.notes)&&(
          <div style={{borderTop:"1px solid #EEE",paddingTop:16,marginTop:8}}>
            {showPrix&&doc.conditionsPaiement&&(
              <div style={{marginBottom:8}}>
                <div style={{fontFamily:"system-ui",fontSize:9,letterSpacing:2,color:"#aaa",textTransform:"uppercase",marginBottom:3}}>Mode de paiement</div>
                <div style={{fontSize:12}}>{doc.conditionsPaiement}</div>
              </div>
            )}
            {doc.notes&&(
              <div>
                <div style={{fontFamily:"system-ui",fontSize:9,letterSpacing:2,color:"#aaa",textTransform:"uppercase",marginBottom:3}}>Notes</div>
                <div style={{fontSize:12}}>{doc.notes}</div>
              </div>
            )}
          </div>
        )}

        <div style={{marginTop:32,textAlign:"center",fontFamily:"system-ui",fontSize:9,color:"#ccc",letterSpacing:1}}>
          Document généré via InvoiceDZ · invoicedz.dz
        </div>
      </div>

      <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:24}}>
        <Btn size="md" variant="success" onClick={handleExport}>⬇️ Télécharger en PDF</Btn>
        <Btn variant="primary" size="md" onClick={onSave} disabled={saving}>
          {saving?"Enregistrement...":"✓ Enregistrer & aller au dashboard"}
        </Btn>
      </div>
    </div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────
export default function NouveauPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [doc, setDoc] = useState(null);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push("/auth"); return; }
      setUser(data.session.user);
    });
  }, []);

  const handleChoix = type => {
    const meta = user?.user_metadata || {};
    setDoc(newDoc(type, meta.entreprise, meta.logo));
    setStep(2);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("documents").insert({
      user_id: user.id,
      type: doc.type,
      numero: doc.numero,
      statut: doc.statut,
      date: doc.date,
      data: doc,
    });
    if (error) { alert("Erreur : " + error.message); setSaving(false); return; }
    router.push("/dashboard");
  };

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"system-ui,-apple-system,sans-serif"}}>
      {/* Header */}
      <div style={{background:T.white,borderBottom:"1px solid "+T.border,height:56,display:"flex",alignItems:"center",padding:"0 24px",gap:16,position:"sticky",top:0,zIndex:100}}>
        <div style={{cursor:"pointer"}} onClick={()=>router.push("/dashboard")}><Logo/></div>
        {/* Steps indicator */}
        <div style={{display:"flex",gap:6,marginLeft:16,alignItems:"center"}}>
          {[{n:1,l:"Type"},{n:2,l:"Remplir"},{n:3,l:"Export"}].map((s,i)=>(
            <div key={s.n} style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:24,height:24,borderRadius:12,background:step>=s.n?T.accent:T.border,color:step>=s.n?"#fff":T.inkLight,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{s.n}</div>
              <span style={{fontSize:12,color:step===s.n?T.ink:T.inkLight,fontWeight:step===s.n?600:400}}>{s.l}</span>
              {i<2&&<span style={{color:T.border,fontSize:14,marginLeft:4}}>›</span>}
            </div>
          ))}
        </div>
        <div style={{marginLeft:"auto"}}>
          <Btn variant="ghost" size="sm" onClick={()=>router.push("/dashboard")}>Dashboard</Btn>
        </div>
      </div>

      {step===1&&<Step1 onChoix={handleChoix}/>}
      {step===2&&doc&&<Step2 doc={doc} onChange={setDoc} onNext={()=>setStep(3)} onBack={()=>setStep(1)}/>}
      {step===3&&doc&&<Step3 doc={doc} onBack={()=>setStep(2)} onSave={handleSave} saving={saving}/>}
    </div>
  );
}
