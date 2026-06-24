"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { T, DOC_TYPES, STATUTS, calcLigne, calcTotaux, fmtDA } from "../../../lib/constants";
import { Btn, Badge, Logo, Spinner } from "../../../components/ui";

export default function DocumentPage() {
  const router = useRouter();
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/auth"); return; }
      const { data: row } = await supabase.from("documents").select("*").eq("id", id).single();
      if (row) setDoc(row);
      setLoading(false);
    });
  }, [id]);

  const handleExport = () => {
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
  </style>
</head>
<body>${docHtml}</body>
</html>`);
    printWin.document.close();
    printWin.addEventListener("load", () => { printWin.focus(); printWin.print(); });
  };

  if (loading) return <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><Spinner/></div>;
  if (!doc) return <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",color:T.inkLight}}>Document introuvable</div>;

  const data = doc.data || {};
  const ti = DOC_TYPES[doc.type] || DOC_TYPES.FACTURE;
  const si = STATUTS[doc.statut] || STATUTS.BROUILLON;
  const totaux = calcTotaux(data.lignes||[], data.remiseGlobale||0, data.tvaActive!==false);
  const showPrix = doc.type !== "BON_LIVRAISON";
  const showTVA = (data.tvaActive!==false) && showPrix;
  const ent = data.entreprise || {};

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"system-ui,-apple-system,sans-serif"}}>
      <div style={{background:T.white,borderBottom:"1px solid "+T.border,height:56,display:"flex",alignItems:"center",padding:"0 24px",gap:12,position:"sticky",top:0,zIndex:100}}>
        <div style={{cursor:"pointer"}} onClick={()=>router.push("/dashboard")}><Logo/></div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:8}}>
          <span style={{color:T.border}}>›</span>
          <span style={{color:T.inkLight,fontSize:13}}>{ti.label}</span>
          <span style={{color:T.border}}>›</span>
          <span style={{fontWeight:600,fontSize:13}}>{doc.numero}</span>
          <Badge label={si.label} color={si.color}/>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:8}}>
          <Btn size="sm" onClick={()=>router.push("/dashboard")}>← Dashboard</Btn>
          <Btn size="sm" variant="success" onClick={handleExport}>⬇️ Télécharger PDF</Btn>
        </div>
      </div>

      <div style={{maxWidth:880,margin:"0 auto",padding:"32px 24px"}}>
        <div id="invoice-preview" style={{background:"#fff",border:"1px solid "+T.border,borderRadius:12,padding:48,boxShadow:"0 4px 24px rgba(0,0,0,.07)",fontFamily:"Georgia,serif",color:"#111"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:32}}>
            <div>
              {data.logo&&<img src={data.logo} alt="logo" style={{height:56,maxWidth:160,objectFit:"contain",marginBottom:12,display:"block"}}/>}
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
              {data.dateEcheance&&<div style={{fontSize:11.5,color:"#777",fontFamily:"system-ui"}}>Échéance : {data.dateEcheance}</div>}
            </div>
          </div>

          <div style={{borderTop:"2px solid #111",marginBottom:24}}/>

          <div style={{marginBottom:24}}>
            <div style={{fontFamily:"system-ui",fontSize:9,letterSpacing:2.5,color:"#aaa",textTransform:"uppercase",marginBottom:6}}>Destinataire</div>
            <div style={{fontWeight:700,fontSize:14,fontFamily:"system-ui"}}>{data.client?.nom||"—"}</div>
            <div style={{fontSize:11.5,color:"#555",fontFamily:"system-ui",marginTop:4,lineHeight:1.9}}>
              {data.client?.adresse&&<div>{data.client.adresse}{data.client.ville?", "+data.client.ville:""}</div>}
              {data.client?.email&&<div>{data.client.email}</div>}
              {data.client?.telephone&&<div>{data.client.telephone}</div>}
              {data.client?.nif&&<div>NIF : {data.client.nif}</div>}
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
              {(data.lignes||[]).map((l,i)=>{
                const {ht}=calcLigne(l);
                return (
                  <tr key={l.id||i} style={{background:i%2===0?"#F8F8F6":"#fff",borderBottom:"1px solid #EEE"}}>
                    <td style={{padding:"9px 10px",fontSize:12,color:"#999",width:28}}>{i+1}</td>
                    <td style={{padding:"9px 10px",fontSize:12}}>{l.designation||"—"}</td>
                    <td style={{padding:"9px 8px",textAlign:"right",fontSize:12}}>{l.quantite}</td>
                    <td style={{padding:"9px 8px",textAlign:"right",fontSize:11,color:"#777"}}>{l.unite}</td>
                    {showPrix&&<>
                      <td style={{padding:"9px 8px",textAlign:"right",fontSize:12}}>{(l.prixUnitaire||0).toLocaleString("fr-DZ")}</td>
                      <td style={{padding:"9px 8px",textAlign:"right",fontSize:12,color:(l.remise||0)>0?"#C8762E":"#ccc"}}>{(l.remise||0)>0?l.remise+"%":"—"}</td>
                      {showTVA&&<td style={{padding:"9px 8px",textAlign:"right",fontSize:12}}>{l.tva||19}%</td>}
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
                {[["Sous-total HT",fmtDA(totaux.sous)],...((data.remiseGlobale||0)>0?[["Remise ("+(data.remiseGlobale||0)+"%)","-"+fmtDA(totaux.remAmt)],["Base HT",fmtDA(totaux.base)]]:[])]
                  .map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #EEE",fontSize:12,color:"#666"}}><span>{l}</span><span>{v}</span></div>)}
                {showTVA&&<div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #EEE",fontSize:12,color:"#666"}}><span>TVA</span><span>{fmtDA(totaux.totalTVA)}</span></div>}
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",fontWeight:800,fontSize:16,color:"#111",borderTop:"2px solid #111",marginTop:4}}>
                  <span>TOTAL {showTVA?"TTC":"HT"}</span>
                  <span style={{color:T.accent}}>{fmtDA(showTVA?totaux.ttc:totaux.base)}</span>
                </div>
              </div>
            </div>
          )}

          {(data.conditionsPaiement||data.notes)&&(
            <div style={{borderTop:"1px solid #EEE",paddingTop:16,marginTop:8}}>
              {showPrix&&data.conditionsPaiement&&(
                <div style={{marginBottom:8}}>
                  <div style={{fontFamily:"system-ui",fontSize:9,letterSpacing:2,color:"#aaa",textTransform:"uppercase",marginBottom:3}}>Mode de paiement</div>
                  <div style={{fontSize:12}}>{data.conditionsPaiement}</div>
                </div>
              )}
              {data.notes&&(
                <div>
                  <div style={{fontFamily:"system-ui",fontSize:9,letterSpacing:2,color:"#aaa",textTransform:"uppercase",marginBottom:3}}>Notes</div>
                  <div style={{fontSize:12}}>{data.notes}</div>
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
          <Btn size="md" onClick={()=>router.push("/dashboard")}>← Retour au dashboard</Btn>
        </div>
      </div>
    </div>
  );
}
