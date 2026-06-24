"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { T } from "../../lib/constants";
import { Btn, Input, Card, Logo } from "../../components/ui";

export default function AuthPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "login");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    // If already logged in, redirect to dashboard
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push("/dashboard");
    });
  }, []);

  const handleSubmit = async () => {
    setErr(""); setMsg("");
    if (mode === "signup" && !nom.trim()) { setErr("Entrez votre nom"); return; }
    if (!email.includes("@")) { setErr("Email invalide"); return; }
    if (pass.length < 6) { setErr("Mot de passe : min. 6 caractères"); return; }

    setLoading(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email, password: pass,
        options: { data: { nom, entreprise: { nom:"", adresse:"", ville:"", telephone:"", email:"", nif:"", rc:"", ai:"", idFiscal:"", code:"" }, logo: null } }
      });
      if (error) { setErr(error.message); setLoading(false); return; }
      setMsg("Compte créé ! Vérifiez votre email pour confirmer, ou connectez-vous directement.");
      setMode("login");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) { setErr("Email ou mot de passe incorrect"); setLoading(false); return; }
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{cursor:"pointer"}} onClick={()=>router.push("/")}><Logo/></div>
          <div style={{marginTop:24,fontSize:22,fontWeight:800,letterSpacing:-.5,color:T.ink}}>
            {mode==="signup"?"Créer votre compte":"Bon retour 👋"}
          </div>
          <div style={{color:T.inkLight,fontSize:14,marginTop:6}}>
            {mode==="signup"?"Gratuit · Aucune carte requise":"Connectez-vous à votre espace"}
          </div>
        </div>

        <Card style={{padding:32}}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {mode==="signup"&&(
              <div>
                <div style={{color:T.inkLight,fontSize:11,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>Votre nom</div>
                <Input value={nom} onChange={setNom} placeholder="Mohamed Yakoubi"/>
              </div>
            )}
            <div>
              <div style={{color:T.inkLight,fontSize:11,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>Email</div>
              <Input value={email} onChange={setEmail} placeholder="vous@email.dz" type="email"/>
            </div>
            <div>
              <div style={{color:T.inkLight,fontSize:11,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>Mot de passe</div>
              <Input value={pass} onChange={setPass} placeholder="Min. 6 caractères" type="password"/>
            </div>
            {err&&(
              <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",fontSize:13,color:T.danger}}>{err}</div>
            )}
            {msg&&(
              <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,padding:"10px 14px",fontSize:13,color:T.success}}>{msg}</div>
            )}
            <Btn variant="primary" size="lg" onClick={handleSubmit} disabled={loading} style={{width:"100%",marginTop:4}}>
              {loading?"..." : mode==="signup"?"Créer mon compte →":"Se connecter →"}
            </Btn>
          </div>
        </Card>

        <div style={{textAlign:"center",marginTop:20,fontSize:13,color:T.inkLight}}>
          {mode==="signup"?"Déjà un compte ?":"Pas encore de compte ?"}{" "}
          <button onClick={()=>{setMode(m=>m==="signup"?"login":"signup");setErr("");setMsg("");}}
            style={{background:"none",border:"none",color:T.accent,fontWeight:600,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>
            {mode==="signup"?"Se connecter":"Créer un compte"}
          </button>
        </div>
      </div>
    </div>
  );
}
