import { useState, useEffect, useRef } from "react";

// ─── DESIGN SYSTEM (mirrors constants/theme.ts) ───────────────────────────────
const THEMES = {
  dark:    { label:"Sombre",  emoji:"🌑", primary:"#00BFA5", bg:"#0A0E1A", surface:"#12172A", surface2:"#1A2035", surface3:"#222840", text:"#E8EAF0", textSec:"#B0B8D0", textMuted:"#6B7494", border:"#252B45", sent:"#00695C", chatBg:"#080C18" },
  midnight:{ label:"Minuit",  emoji:"🌙", primary:"#7C4DFF", bg:"#08070F", surface:"#100F1E", surface2:"#17162A", surface3:"#1E1C36", text:"#E0DEFF", textSec:"#A09CC0", textMuted:"#5C587A", border:"#201E38", sent:"#4527A0", chatBg:"#060510" },
  ocean:   { label:"Océan",   emoji:"🌊", primary:"#0288D1", bg:"#011825", surface:"#031E2F", surface2:"#042A40", surface3:"#063550", text:"#E1F5FE", textSec:"#90CAF9", textMuted:"#4A7A9B", border:"#0A3550", sent:"#01579B", chatBg:"#01111B" },
  forest:  { label:"Forêt",   emoji:"🌿", primary:"#2E7D32", bg:"#071209", surface:"#0C1E0E", surface2:"#112914", surface3:"#163318", text:"#E8F5E9", textSec:"#A5D6A7", textMuted:"#4A7A4C", border:"#1B3D1E", sent:"#1B5E20", chatBg:"#050E06" },
  sunset:  { label:"Coucher", emoji:"🌅", primary:"#F4511E", bg:"#1A0A05", surface:"#271108", surface2:"#32180C", surface3:"#3D1F10", text:"#FBE9E7", textSec:"#FFAB91", textMuted:"#8B4A35", border:"#4A2010", sent:"#BF360C", chatBg:"#130704" },
  rose:    { label:"Rose",    emoji:"🌸", primary:"#E91E8C", bg:"#1A0510", surface:"#27081A", surface2:"#320A22", surface3:"#3D0C2A", text:"#FCE4EC", textSec:"#F48FB1", textMuted:"#8B3A5A", border:"#4A0E2E", sent:"#880E4F", chatBg:"#130308" },
  light:   { label:"Clair",   emoji:"☀️", primary:"#00897B", bg:"#F5F7FA", surface:"#FFFFFF", surface2:"#EEF1F6", surface3:"#E3E8F0", text:"#1A1F2E", textSec:"#4A5270", textMuted:"#8A93B0", border:"#D5DAE8", sent:"#00796B", chatBg:"#EAF0F8" },
  carbon:  { label:"Carbon",  emoji:"⚫", primary:"#FF6D00", bg:"#0D0D0D", surface:"#161616", surface2:"#1E1E1E", surface3:"#252525", text:"#F0F0F0", textSec:"#A0A0A0", textMuted:"#585858", border:"#2A2A2A", sent:"#BF360C", chatBg:"#090909" },
  royal:   { label:"Royal",   emoji:"👑", primary:"#FFD700", bg:"#0A0810", surface:"#110E1E", surface2:"#181428", surface3:"#1F1A32", text:"#FFF8E1", textSec:"#FFE082", textMuted:"#7A6A30", border:"#281E40", sent:"#4A3800", chatBg:"#070510" },
  purple:  { label:"Violet",  emoji:"💜", primary:"#9C27B0", bg:"#0E0514", surface:"#16082A", surface2:"#1E0C38", surface3:"#260E44", text:"#EDE7F6", textSec:"#CE93D8", textMuted:"#6A4080", border:"#2E1050", sent:"#6A1B9A", chatBg:"#0A0310" },
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const CONTACTS = [
  { id:"1", name:"Sophia Martin",   initials:"SM", color:"#E91E8C", status:"online",  lastMsg:"Tu as vu le film hier soir ?",   time:"14:32", unread:3 },
  { id:"2", name:"Lucas Dubois",    initials:"LD", color:"#2196F3", status:"online",  lastMsg:"Le projet est prêt 🚀",           time:"13:15", unread:0 },
  { id:"3", name:"Amara Koné",      initials:"AK", color:"#FF9800", status:"away",    lastMsg:"Je t'envoie ça demain",           time:"11:48", unread:1 },
  { id:"4", name:"Tom Petit",       initials:"TP", color:"#4CAF50", status:"offline", lastMsg:"Ok merci !",                      time:"Hier",  unread:0 },
  { id:"5", name:"Inès Boulanger",  initials:"IB", color:"#9C27B0", status:"online",  lastMsg:"Appel de 15min ?",               time:"Hier",  unread:2 },
  { id:"6", name:"Équipe Design",   initials:"🎨", color:"#00BFA5", status:"group",   lastMsg:"David : Le mock est validé ✅",   time:"Lun",   unread:0 },
  { id:"7", name:"Famille 🏠",      initials:"🏠", color:"#F44336", status:"group",   lastMsg:"Maman : Dîner dimanche !",        time:"Dim",   unread:4 },
];

const MESSAGES_MAP = {
  "1": [
    { id:"m1", text:"Salut ! T'as regardé la série dont on parlait ?", isMine:false, time:"14:20", status:"read", reactions:{"❤️":1} },
    { id:"m2", text:"Pas encore, j'avais trop de boulot hier soir 😅", isMine:true,  time:"14:22", status:"read" },
    { id:"m3", text:"No spoil alors ! Mais c'est vraiment bien", isMine:false, time:"14:24", status:"read" },
    { id:"m4", text:"Tu as vu le film hier soir ?", isMine:false, time:"14:32", status:"delivered", reactions:{"😂":2,"👍":1} },
    { id:"m5", text:"C'était lequel ?", isMine:true,  time:"14:33", status:"sent" },
  ],
  "2": [
    { id:"m1", text:"Alors t'as fini la maquette ?", isMine:false, time:"13:00", status:"read" },
    { id:"m2", text:"Oui ! Je viens de push sur la branche main", isMine:true, time:"13:05", status:"read", reactions:{"🔥":1} },
    { id:"m3", text:"Le projet est prêt 🚀", isMine:false, time:"13:15", status:"delivered" },
  ],
  "3": [
    { id:"m1", text:"Tu peux m'envoyer le rapport ?", isMine:true, time:"11:30", status:"read" },
    { id:"m2", text:"Oui bien sûr, je le finalise", isMine:false, time:"11:40", status:"read" },
    { id:"m3", text:"Je t'envoie ça demain", isMine:false, time:"11:48", status:"delivered" },
  ],
};

const STATUSES = [
  { id:"s1", name:"Sophia", initials:"SM", color:"#E91E8C", viewed:false, time:"Il y a 2h",  bg:"linear-gradient(135deg,#E91E8C,#9C27B0)", emoji:"✨", caption:"Belle journée !" },
  { id:"s2", name:"Lucas",  initials:"LD", color:"#2196F3", viewed:false, time:"Il y a 4h",  bg:"linear-gradient(135deg,#1565C0,#0288D1)", emoji:"🚀", caption:"Projet lancé !" },
  { id:"s3", name:"Amara",  initials:"AK", color:"#FF9800", viewed:true,  time:"Il y a 8h",  bg:"linear-gradient(135deg,#E65100,#FF9800)", emoji:"🌅", caption:"Sunset du soir" },
  { id:"s4", name:"Tom",    initials:"TP", color:"#4CAF50", viewed:true,  time:"Il y a 10h", bg:"linear-gradient(135deg,#1B5E20,#4CAF50)", emoji:"🌿", caption:"Nature walk" },
  { id:"s5", name:"Inès",   initials:"IB", color:"#9C27B0", viewed:false, time:"Il y a 1h",  bg:"linear-gradient(135deg,#4A148C,#9C27B0)", emoji:"💜", caption:"Good vibes" },
];

const QUICK_EMOJIS = ["❤️","😂","😮","😢","👍","🔥"];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const Avatar = ({ contact, size = 42, t }) => (
  <div style={{
    width:size, height:size, borderRadius:"50%",
    background:contact.color, display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:size*0.38, fontWeight:700, color:"#fff", flexShrink:0,
    boxShadow:`0 0 0 2px ${t.border}`,
    fontFamily:"system-ui"
  }}>
    {contact.initials}
  </div>
);

const StatusDot = ({ status, t }) => {
  const colors = { online:"#4CAF50", away:"#FF9800", offline:t.textMuted, group:t.primary };
  return status !== "group" ? (
    <div style={{
      width:10, height:10, borderRadius:"50%",
      background:colors[status]||t.textMuted,
      border:`2px solid ${t.surface}`,
      position:"absolute", bottom:1, right:1
    }}/>
  ) : null;
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function LinkChat() {
  const [themeName, setThemeName] = useState("dark");
  const t = THEMES[themeName];

  const [view, setView] = useState("chats"); // chats | status | calls | settings
  const [activeConv, setActiveConv] = useState(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showStatus, setShowStatus] = useState(null);
  const [showCall, setShowCall] = useState(null);
  const [messages, setMessages] = useState(MESSAGES_MAP);
  const [inputVal, setInputVal] = useState("");
  const [searchVal, setSearchVal] = useState("");
  const [reacting, setReacting] = useState(null); // message id
  const [replyTo, setReplyTo] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const msgEndRef = useRef(null);

  useEffect(() => {
    if (msgEndRef.current) msgEndRef.current.scrollIntoView({ behavior:"smooth" });
  }, [activeConv, messages]);

  const sendMsg = () => {
    if (!inputVal.trim() || !activeConv) return;
    const newMsg = {
      id: "m_" + Date.now(),
      text: inputVal.trim(),
      isMine: true,
      time: new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}),
      status: "sent",
      replyTo: replyTo || undefined,
    };
    setMessages(prev => ({
      ...prev,
      [activeConv]: [...(prev[activeConv]||[]), newMsg]
    }));
    setInputVal("");
    setReplyTo(null);
  };

  const addReaction = (convId, msgId, emoji) => {
    setMessages(prev => ({
      ...prev,
      [convId]: (prev[convId]||[]).map(m =>
        m.id === msgId
          ? { ...m, reactions: { ...(m.reactions||{}), [emoji]: ((m.reactions||{})[emoji]||0)+1 } }
          : m
      )
    }));
    setReacting(null);
  };

  const filtered = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(searchVal.toLowerCase())
  );

  const conv = CONTACTS.find(c => c.id === activeConv);
  const convMsgs = messages[activeConv] || [];

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'DM Sans',sans-serif; }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:${t.border}; border-radius:4px; }
    .bubble-hover:hover { filter:brightness(1.08); }
    .nav-btn { transition: all 0.18s; }
    .nav-btn:hover { transform:scale(1.08); }
    .send-btn:hover { transform:scale(1.06); box-shadow:0 0 18px ${t.primary}60; }
    .contact-row:hover { background:${t.surface2}; }
    .contact-row { transition:background 0.15s; cursor:pointer; }
    .theme-pill:hover { transform:scale(1.12); }
    input:focus { outline:none; }
    textarea:focus { outline:none; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slideIn { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
    @keyframes popIn { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    .msg-anim { animation:fadeIn 0.2s ease; }
    .sidebar-anim { animation:slideIn 0.22s ease; }
    .pop-anim { animation:popIn 0.18s ease; }
    .status-ring { background:conic-gradient(${t.primary} 0%,${t.border} 100%); }
    .status-ring-viewed { background:conic-gradient(${t.textMuted} 0%,${t.border} 100%); }
  `;

  // ── STATUS VIEWER ──────────────────────────────────────────────────────────
  if (showStatus) {
    const s = STATUSES.find(x=>x.id===showStatus);
    return (
      <>
        <style>{css}</style>
        <div style={{ width:"100%", height:"100vh", background:s.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", fontFamily:"'DM Sans',sans-serif" }}>
          <div style={{ position:"absolute", top:24, left:24, right:24, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <button onClick={()=>setShowStatus(null)} style={{ background:"#0006", border:"none", color:"#fff", borderRadius:999, padding:"8px 16px", cursor:"pointer", fontSize:14, fontFamily:"'DM Sans',sans-serif" }}>← Retour</button>
            <span style={{ color:"#ffffffb0", fontSize:13 }}>{s.time}</span>
          </div>
          <div style={{ fontSize:80, marginBottom:16 }}>{s.emoji}</div>
          <div style={{ fontSize:22, fontWeight:700, color:"#fff", fontFamily:"'Syne',sans-serif" }}>{s.name}</div>
          <div style={{ fontSize:16, color:"#ffffffcc", marginTop:8 }}>{s.caption}</div>
        </div>
      </>
    );
  }

  // ── CALL SCREEN ────────────────────────────────────────────────────────────
  if (showCall) {
    const c = CONTACTS.find(x=>x.id===showCall.id);
    return (
      <>
        <style>{css}</style>
        <div style={{ width:"100%", height:"100vh", background:`radial-gradient(ellipse at center, ${c.color}30, ${t.bg})`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:24, fontFamily:"'DM Sans',sans-serif" }}>
          <div style={{ width:100, height:100, borderRadius:"50%", background:c.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, animation:"pulse 2s infinite", boxShadow:`0 0 40px ${c.color}60` }}>{c.initials}</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:700, color:t.text }}>{c.name}</div>
          <div style={{ color:t.primary, fontSize:15, animation:"pulse 2s infinite" }}>
            {showCall.type==="video" ? "📹 Appel vidéo en cours..." : "📞 Appel audio en cours..."}
          </div>
          <div style={{ display:"flex", gap:20, marginTop:20 }}>
            {["🔇","📷","🔊"].map(icon=>(
              <button key={icon} style={{ width:56, height:56, borderRadius:"50%", background:t.surface2, border:`1px solid ${t.border}`, fontSize:22, cursor:"pointer" }}>{icon}</button>
            ))}
            <button onClick={()=>setShowCall(null)} style={{ width:56, height:56, borderRadius:"50%", background:"#F44336", border:"none", fontSize:22, cursor:"pointer" }}>📵</button>
          </div>
        </div>
      </>
    );
  }

  // ── MAIN LAYOUT ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div style={{ display:"flex", height:"100vh", background:t.bg, fontFamily:"'DM Sans',sans-serif", overflow:"hidden" }}>

        {/* ── NAV RAIL (left, narrow) */}
        <div style={{ width:72, background:t.surface, borderRight:`1px solid ${t.border}`, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:16, paddingBottom:16, gap:8, zIndex:10 }}>
          {/* Logo */}
          <div style={{ width:42, height:42, borderRadius:14, background:t.primary, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, boxShadow:`0 0 20px ${t.primary}50` }}>
            <span style={{ fontSize:22 }}>💬</span>
          </div>
          {[
            { id:"chats", icon:"💬", label:"Chats" },
            { id:"status", icon:"⭕", label:"Statuts" },
            { id:"calls", icon:"📞", label:"Appels" },
            { id:"settings", icon:"⚙️", label:"Réglages" },
          ].map(({id,icon,label})=>(
            <button key={id} className="nav-btn" onClick={()=>setView(id)} title={label} style={{
              width:48, height:48, borderRadius:14, border:"none", cursor:"pointer",
              background: view===id ? `${t.primary}25` : "transparent",
              fontSize:20, display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow: view===id ? `inset 0 0 0 2px ${t.primary}60` : "none",
              transition:"all 0.18s"
            }}>{icon}</button>
          ))}
          <div style={{ flex:1 }}/>
          {/* My avatar */}
          <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#00BFA5,#0288D1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:"#fff", cursor:"pointer", boxShadow:`0 0 0 2px ${t.primary}` }}>D</div>
        </div>

        {/* ── SIDEBAR */}
        <div style={{ width:320, background:t.surface, borderRight:`1px solid ${t.border}`, display:"flex", flexDirection:"column" }}>

          {/* Sidebar Header */}
          <div style={{ padding:"20px 16px 12px", borderBottom:`1px solid ${t.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:t.text, letterSpacing:"-0.5px" }}>
                Link<span style={{color:t.primary}}>Chat!</span>
              </h1>
              <button onClick={()=>setShowNewChat(!showNewChat)} style={{ width:34, height:34, borderRadius:10, background:`${t.primary}20`, border:`1px solid ${t.primary}40`, color:t.primary, fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
            </div>
            {/* Search */}
            <div style={{ display:"flex", alignItems:"center", gap:8, background:t.surface2, borderRadius:12, padding:"8px 12px", border:`1px solid ${t.border}` }}>
              <span style={{ color:t.textMuted, fontSize:15 }}>🔍</span>
              <input value={searchVal} onChange={e=>setSearchVal(e.target.value)} placeholder="Rechercher..." style={{ flex:1, background:"transparent", border:"none", color:t.text, fontSize:14, fontFamily:"'DM Sans',sans-serif" }} />
            </div>
          </div>

          {/* Content based on view */}
          <div style={{ flex:1, overflowY:"auto" }}>
            {view === "chats" && (
              <>
                {/* Stories strip */}
                <div style={{ padding:"12px 16px 8px", borderBottom:`1px solid ${t.border}` }}>
                  <div style={{ fontSize:11, color:t.textMuted, fontWeight:600, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Statuts</div>
                  <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:4 }}>
                    {/* Add status */}
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
                      <div style={{ width:46, height:46, borderRadius:"50%", background:t.surface3, border:`2px dashed ${t.primary}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:t.primary }}>+</div>
                      <span style={{ fontSize:10, color:t.textMuted, whiteSpace:"nowrap" }}>Ajouter</span>
                    </div>
                    {STATUSES.map(s=>(
                      <div key={s.id} onClick={()=>setShowStatus(s.id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
                        <div style={{ width:50, height:50, borderRadius:"50%", padding:2, background: s.viewed ? `conic-gradient(${t.textMuted} 0%,${t.border} 100%)` : `conic-gradient(${t.primary},#4DD0E1,${t.primary})` }}>
                          <div style={{ width:"100%", height:"100%", borderRadius:"50%", background:s.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, border:`2px solid ${t.surface}` }}>{s.initials}</div>
                        </div>
                        <span style={{ fontSize:10, color: s.viewed ? t.textMuted : t.text, whiteSpace:"nowrap", fontWeight: s.viewed ? 400 : 600 }}>{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Conversations */}
                <div>
                  {filtered.map(c=>(
                    <div key={c.id} className="contact-row" onClick={()=>setActiveConv(c.id)} style={{ padding:"12px 16px", display:"flex", gap:12, alignItems:"center", background: activeConv===c.id ? `${t.primary}15` : "transparent", borderLeft: activeConv===c.id ? `3px solid ${t.primary}` : "3px solid transparent" }}>
                      <div style={{ position:"relative" }}>
                        <Avatar contact={c} t={t} />
                        <StatusDot status={c.status} t={t}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", justifyContent:"space-between" }}>
                          <span style={{ fontWeight:600, color:t.text, fontSize:14 }}>{c.name}</span>
                          <span style={{ fontSize:11, color:t.textMuted }}>{c.time}</span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:13, color:t.textSec, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:160 }}>{c.lastMsg}</span>
                          {c.unread > 0 && <span style={{ minWidth:18, height:18, borderRadius:999, background:t.primary, color:"#fff", fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 5px" }}>{c.unread}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {view === "status" && (
              <div style={{ padding:16 }}>
                <div style={{ fontSize:11, color:t.textMuted, fontWeight:600, letterSpacing:1, textTransform:"uppercase", marginBottom:12 }}>Statuts des contacts</div>
                {STATUSES.map(s=>(
                  <div key={s.id} onClick={()=>setShowStatus(s.id)} className="contact-row" style={{ display:"flex", gap:12, alignItems:"center", padding:"10px 8px", borderRadius:12, marginBottom:4 }}>
                    <div style={{ width:52, height:52, borderRadius:"50%", padding:2, background: s.viewed ? `${t.textMuted}60` : `conic-gradient(${t.primary},#4DD0E1,${t.primary})` }}>
                      <div style={{ width:"100%", height:"100%", borderRadius:"50%", background:s.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, border:`2px solid ${t.surface}` }}>{s.initials}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight:600, color:t.text, fontSize:14 }}>{s.name}</div>
                      <div style={{ fontSize:12, color: s.viewed ? t.textMuted : t.primary }}>{s.viewed?"Vu · ":""}{s.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {view === "calls" && (
              <div style={{ padding:16 }}>
                <div style={{ fontSize:11, color:t.textMuted, fontWeight:600, letterSpacing:1, textTransform:"uppercase", marginBottom:12 }}>Récents</div>
                {CONTACTS.slice(0,5).map((c,i)=>(
                  <div key={c.id} className="contact-row" style={{ display:"flex", gap:12, alignItems:"center", padding:"10px 8px", borderRadius:12, marginBottom:4 }}>
                    <Avatar contact={c} size={44} t={t}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, color:t.text, fontSize:14 }}>{c.name}</div>
                      <div style={{ fontSize:12, color: i%3===0 ? "#F44336" : t.textSec }}>{i%3===0?"📞 Manqué":"📞 Émis"} · Hier {10+i}:30</div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={()=>setShowCall({id:c.id,type:"audio"})} style={{ width:34, height:34, borderRadius:"50%", background:`${t.primary}20`, border:"none", fontSize:16, cursor:"pointer" }}>📞</button>
                      <button onClick={()=>setShowCall({id:c.id,type:"video"})} style={{ width:34, height:34, borderRadius:"50%", background:`${t.primary}20`, border:"none", fontSize:16, cursor:"pointer" }}>📹</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {view === "settings" && (
              <div style={{ padding:16 }}>
                <div style={{ textAlign:"center", marginBottom:20, paddingTop:8 }}>
                  <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#00BFA5,#0288D1)", margin:"0 auto 12px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, fontWeight:700, color:"#fff" }}>D</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:t.text, fontSize:18 }}>David Laurens</div>
                  <div style={{ color:t.textMuted, fontSize:13 }}>@davieslay · En ligne</div>
                </div>
                <div style={{ fontSize:11, color:t.textMuted, fontWeight:600, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Thème</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {Object.entries(THEMES).map(([k,v])=>(
                    <button key={k} className="theme-pill" onClick={()=>setThemeName(k)} style={{ padding:"6px 12px", borderRadius:999, border:`1px solid ${themeName===k ? v.primary : t.border}`, background: themeName===k ? `${v.primary}25` : t.surface2, color: themeName===k ? v.primary : t.textSec, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.18s", fontWeight: themeName===k ? 600 : 400 }}>
                      {v.emoji} {v.label}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop:20, fontSize:11, color:t.textMuted, fontWeight:600, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Compte</div>
                {["👤 Profil","🔔 Notifications","🔒 Confidentialité","💾 Stockage","ℹ️ À propos"].map(item=>(
                  <div key={item} style={{ padding:"12px 0", borderBottom:`1px solid ${t.border}`, color:t.text, fontSize:14, cursor:"pointer" }}>{item}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── CHAT AREA */}
        {activeConv && conv ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column", background:t.chatBg, position:"relative" }}>
            {/* Chat header */}
            <div style={{ padding:"14px 20px", background:t.surface, borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ position:"relative" }}>
                <Avatar contact={conv} t={t}/>
                <StatusDot status={conv.status} t={t}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:t.text, fontSize:16 }}>{conv.name}</div>
                <div style={{ fontSize:12, color: conv.status==="online" ? "#4CAF50" : t.textMuted }}>
                  {conv.status==="online"?"En ligne":conv.status==="away"?"Absent":"Hors ligne"}
                </div>
              </div>
              <button onClick={()=>setShowCall({id:conv.id,type:"audio"})} style={{ width:36, height:36, borderRadius:"50%", background:`${t.primary}20`, border:"none", fontSize:18, cursor:"pointer" }}>📞</button>
              <button onClick={()=>setShowCall({id:conv.id,type:"video"})} style={{ width:36, height:36, borderRadius:"50%", background:`${t.primary}20`, border:"none", fontSize:18, cursor:"pointer" }}>📹</button>
              <button style={{ width:36, height:36, borderRadius:"50%", background:"transparent", border:"none", fontSize:18, cursor:"pointer" }}>⋯</button>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:"auto", padding:"20px 24px", display:"flex", flexDirection:"column", gap:10 }}>
              {/* Date separator */}
              <div style={{ textAlign:"center", marginBottom:8 }}>
                <span style={{ background:t.surface, padding:"4px 12px", borderRadius:999, fontSize:11, color:t.textMuted, border:`1px solid ${t.border}` }}>Aujourd'hui</span>
              </div>

              {convMsgs.map((m,i)=>(
                <div key={m.id} className="msg-anim" style={{ display:"flex", justifyContent: m.isMine?"flex-end":"flex-start", alignItems:"flex-end", gap:8, position:"relative" }}>
                  {!m.isMine && <div style={{ width:28, height:28, borderRadius:"50%", background:conv.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff", flexShrink:0, marginBottom:4 }}>{conv.initials.slice(0,1)}</div>}

                  <div style={{ maxWidth:"68%", position:"relative" }}>
                    {/* Reply preview */}
                    {m.replyTo && (
                      <div style={{ background:`${t.primary}20`, border:`1px solid ${t.primary}40`, borderRadius:"10px 10px 0 0", padding:"6px 10px", fontSize:12, color:t.primary, borderLeft:`3px solid ${t.primary}` }}>
                        ↩ {m.replyTo.text?.slice(0,40)}{m.replyTo.text?.length>40?"...":""}
                      </div>
                    )}
                    {/* Bubble */}
                    <div
                      className="bubble-hover"
                      onDoubleClick={()=>setReacting(reacting===m.id?null:m.id)}
                      onContextMenu={e=>{e.preventDefault();setReplyTo({id:m.id,text:m.text});}}
                      style={{
                        background: m.isMine ? t.sent : t.surface,
                        border: `1px solid ${m.isMine ? t.sent+"80" : t.border}`,
                        borderRadius: m.isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        padding:"10px 14px",
                        cursor:"pointer",
                        position:"relative",
                      }}>
                      <p style={{ color:t.text, fontSize:14, lineHeight:1.5 }}>{m.text}</p>
                      <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", gap:6, marginTop:4 }}>
                        <span style={{ fontSize:11, color:t.textMuted }}>{m.time}</span>
                        {m.isMine && <span style={{ fontSize:11, color: m.status==="read" ? t.primary : t.textMuted }}>
                          {m.status==="sent"?"✓":m.status==="delivered"?"✓✓":"✓✓"}
                        </span>}
                      </div>
                    </div>

                    {/* Reactions display */}
                    {m.reactions && Object.keys(m.reactions).length > 0 && (
                      <div style={{ display:"flex", gap:4, marginTop:4, flexWrap:"wrap", justifyContent: m.isMine ? "flex-end" : "flex-start" }}>
                        {Object.entries(m.reactions).map(([e,n])=>(
                          <span key={e} style={{ background:t.surface2, border:`1px solid ${t.border}`, borderRadius:999, padding:"2px 8px", fontSize:12 }}>{e} {n}</span>
                        ))}
                      </div>
                    )}

                    {/* Reaction picker */}
                    {reacting===m.id && (
                      <div className="pop-anim" style={{ position:"absolute", [m.isMine?"right":"left"]:0, bottom:"110%", background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, padding:"8px 12px", display:"flex", gap:8, boxShadow:"0 8px 32px #0008", zIndex:10 }}>
                        {QUICK_EMOJIS.map(e=>(
                          <button key={e} onClick={()=>addReaction(activeConv,m.id,e)} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", transition:"transform 0.12s" }}
                            onMouseEnter={ev=>ev.target.style.transform="scale(1.3)"}
                            onMouseLeave={ev=>ev.target.style.transform="scale(1)"}>
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={msgEndRef}/>
            </div>

            {/* Reply bar */}
            {replyTo && (
              <div style={{ margin:"0 20px", padding:"8px 12px", background:t.surface, border:`1px solid ${t.border}`, borderRadius:"12px 12px 0 0", display:"flex", alignItems:"center", justifyContent:"space-between", borderLeft:`3px solid ${t.primary}` }}>
                <span style={{ fontSize:13, color:t.primary }}>↩ Réponse : <span style={{color:t.textSec}}>{replyTo.text?.slice(0,50)}</span></span>
                <button onClick={()=>setReplyTo(null)} style={{ background:"none", border:"none", color:t.textMuted, cursor:"pointer", fontSize:18 }}>✕</button>
              </div>
            )}

            {/* Input bar */}
            <div style={{ padding:"14px 20px", background:t.surface, borderTop:`1px solid ${t.border}`, display:"flex", gap:10, alignItems:"center" }}>
              <button style={{ width:36, height:36, borderRadius:"50%", background:t.surface2, border:`1px solid ${t.border}`, fontSize:18, cursor:"pointer" }}>📎</button>
              <button style={{ width:36, height:36, borderRadius:"50%", background:t.surface2, border:`1px solid ${t.border}`, fontSize:18, cursor:"pointer" }}>😊</button>
              <input
                value={inputVal}
                onChange={e=>setInputVal(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}}
                placeholder="Écrire un message..."
                style={{ flex:1, background:t.surface2, border:`1px solid ${t.border}`, borderRadius:999, padding:"10px 16px", color:t.text, fontSize:14, fontFamily:"'DM Sans',sans-serif" }}
              />
              <button style={{ width:36, height:36, borderRadius:"50%", background:t.surface2, border:`1px solid ${t.border}`, fontSize:18, cursor:"pointer" }}>🎤</button>
              <button
                className="send-btn"
                onClick={sendMsg}
                style={{ width:44, height:44, borderRadius:"50%", background: inputVal.trim() ? t.primary : t.surface2, border:"none", fontSize:20, cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center" }}>
                ➤
              </button>
            </div>
          </div>
        ) : (
          // Empty state
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:t.chatBg, gap:16 }}>
            <div style={{ fontSize:72, filter:`drop-shadow(0 0 24px ${t.primary}60)` }}>💬</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:t.text }}>Link<span style={{color:t.primary}}>Chat!</span></div>
            <div style={{ color:t.textMuted, fontSize:15, textAlign:"center", maxWidth:300 }}>Sélectionne une conversation pour commencer à chatter</div>
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              {Object.entries(THEMES).slice(0,5).map(([k,v])=>(
                <button key={k} onClick={()=>setThemeName(k)} className="theme-pill" title={v.label} style={{ width:28, height:28, borderRadius:"50%", background:v.primary, border: themeName===k ? `3px solid #fff` : "none", cursor:"pointer", transition:"all 0.18s", transform: themeName===k?"scale(1.2)":"scale(1)" }}/>
              ))}
            </div>
            <div style={{ color:t.textMuted, fontSize:12 }}>Clique sur un thème pour changer l'ambiance</div>
          </div>
        )}
      </div>
    </>
  );
}
