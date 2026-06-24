"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { T, DOC_TYPES, STATUTS, calcTotaux, fmtDA } from "../../lib/constants";
import { Btn, Badge, Card, Logo, Spinner } from "../../components/ui";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/auth"); return; }
      setUser(data.session.user);
      await loadDocs(data.session.user.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") router.push("/");
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadDocs = async (userId) => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setDocs(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const filtered = docs.filter(d => {
    if (filter !== "ALL" && d.type !== filter) return false;
    const content = d.data || {};
    if (search && !d.numero.toLowerCase().includes(search.toLowerCase()) &&
        !(content.client?.nom||"").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const tot = docs.reduce((acc, d) => {
    const data = d.data || {};
    const t = calcTotaux(data.lignes||[], data.remiseGlobale||0, data.tvaActive!==false);
    acc.total += t.ttc;
    if (d.statut === "PAYE") acc.paye += t.ttc;
    if (d.statut === "ENVOYE" || d.statut === "EN_ATTENTE") acc.attente += t.ttc;
    return acc;
  }, { total:0, paye:0, attente:0 });

  if (loading) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <Spinner/>
    </div>
  );

  const nom = user?.user_metadata?.nom || user?.email?.split("@")[0] || "Utilisateur";

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"system-ui,-apple-system,sans-serif",color:T.ink}}>
      {/* Topbar */}
      <div style={{background:T.white,borderBottom:"1px solid "+T.border,height:56,display:"flex",alignItems:"center",padding:"0 24px",gap:12,position:"sticky",top:0,zIndex:100}}>
        <Logo/>
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:13,color:T.inkLight,display:"none"}}>Bonjour, {nom} 👋</span>
          <Btn variant="primary" size="sm" onClick={()=>router.push("/nouveau")}>+ Nouveau document</Btn>
          <Btn variant="ghost" size="sm" onClick={handleLogout}>Déconnexion</Btn>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:24}}>
        {/* Welcome */}
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:22,fontWeight:800,letterSpacing:-.5,marginBottom:4}}>Bonjour, {nom} 👋</h1>
          <div style={{color:T.inkLight,fontSize:14}}>Gérez tous vos documents depuis ici</div>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:28}}>
          {[
            {label:"Total documents",value:docs.length,color:T.ink,icon:"📄"},
            {label:"Total facturé",value:fmtDA(tot.total),color:T.accent,icon:"💰"},
            {label:"Payé",value:fmtDA(tot.paye),color:T.success,icon:"✅"},
            {label:"En attente",value:fmtDA(tot.attente),color:T.warning,icon:"⏳"},
          ].map(s=>(
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

        {/* Filtres */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..."
              style={{background:T.white,border:"1px solid "+T.border,borderRadius:8,color:T.ink,padding:"9px 14px",fontSize:14,width:200,fontFamily:"inherit",outline:"none"}}
              onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[["ALL","Tous"],...Object.entries(DOC_TYPES).map(([k,v])=>[k,v.label])].map(([k,l])=>(
                <button key={k} onClick={()=>setFilter(k)} style={{padding:"7px 12px",fontSize:12,fontWeight:600,borderRadius:7,border:"1px solid "+(filter===k?T.accent:T.border),background:filter===k?"#EEF4FF":"transparent",color:filter===k?T.accent:T.inkLight,cursor:"pointer",fontFamily:"inherit"}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <Btn variant="primary" size="sm" onClick={()=>router.push("/nouveau")}>+ Nouveau</Btn>
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <Card style={{textAlign:"center",padding:60}}>
            <div style={{fontSize:40,marginBottom:14}}>📄</div>
            <div style={{color:T.inkLight,fontSize:15,marginBottom:20}}>
              {docs.length===0?"Aucun document pour l'instant":"Aucun résultat"}
            </div>
            {docs.length===0&&<Btn variant="primary" onClick={()=>router.push("/nouveau")}>Créer mon premier document →</Btn>}
          </Card>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filtered.map(doc=>{
              const ti = DOC_TYPES[doc.type] || DOC_TYPES.FACTURE;
              const si = STATUTS[doc.statut] || STATUTS.BROUILLON;
              const data = doc.data || {};
              const t = calcTotaux(data.lignes||[], data.remiseGlobale||0, data.tvaActive!==false);
              const showPrix = doc.type !== "BON_LIVRAISON";
              return (
                <Card key={doc.id} style={{padding:"14px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,transition:"border-color .15s,box-shadow .15s"}}
                  onClick={()=>router.push("/document/"+doc.id)}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.06)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow="none";}}>
                  <div style={{fontSize:18,flexShrink:0}}>{ti.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                      <span style={{fontSize:10,fontWeight:700,color:ti.color,textTransform:"uppercase",letterSpacing:.5}}>{ti.label}</span>
                      <span style={{fontWeight:700,fontSize:14}}>{doc.numero}</span>
                      <Badge label={si.label} color={si.color}/>
                    </div>
                    <div style={{color:T.inkLight,fontSize:12}}>
                      {data.client?.nom||"Client non défini"} · {doc.date}
                    </div>
                  </div>
                  {showPrix&&(
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontWeight:700,fontSize:14}}>{fmtDA(data.tvaActive!==false?t.ttc:t.base)}</div>
                      <div style={{color:T.inkLight,fontSize:11}}>{(data.lignes||[]).length} ligne{(data.lignes||[]).length>1?"s":""}</div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
