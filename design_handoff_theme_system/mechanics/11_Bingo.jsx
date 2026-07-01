import React, { useState, useEffect, useCallback } from 'react';

const SAMPLE = {
  config: { gridSize:4, callerMode:'auto', callerInterval:5000, winCondition:'line' },
  items: [
    { id:'b1',  term:'Achaler',      clue:'Agacer quelqu'un' },
    { id:'b2',  term:'Tuque',         clue:'Bonnet de laine hivernal' },
    { id:'b3',  term:'Magasiner',     clue:'Faire du shopping' },
    { id:'b4',  term:'Chum',          clue:'Ami ou copain' },
    { id:'b5',  term:'Pogner',        clue:'Attraper quelque chose' },
    { id:'b6',  term:'Débarbouillette',clue:'Gant de toilette' },
    { id:'b7',  term:'Pitoune',       clue:'Belle fille (familier)' },
    { id:'b8',  term:'Câlice',        clue:'Exclamation forte' },
    { id:'b9',  term:'Checker',       clue:'Vérifier (anglicisme)' },
    { id:'b10', term:'Frette',        clue:'Très froid' },
    { id:'b11', term:'Ostie',         clue:'Exclamation vive' },
    { id:'b12', term:'Tabarnac',      clue:'Exclamation populaire' },
    { id:'b13', term:'Coudon',        clue:'Donc / alors (exclamatif)' },
    { id:'b14', term:'Aweille',       clue:'Allez ! Dépêche-toi !' },
    { id:'b15', term:'Tiguidou',      clue:'Parfait, d'accord' },
    { id:'b16', term:'Patente',       clue:'Chose, truc, bidule' },
  ]
};

const C = { bg:'#0f1117', card:'#1a1d2e', surface:'#232640', ink:'#fff', muted:'rgba(255,255,255,.45)', border:'rgba(255,255,255,.1)', primary:'#C75B39', success:'#2D7A4F', danger:'#c0392b' };
function shuffle(arr) { return [...arr].sort(()=>Math.random()-.5); }
function checkBingo(marked, size) {
  const grid = Array.from({length:size}, (_,r) => Array.from({length:size}, (_,c) => marked.has(r*size+c)));
  for(let r=0;r<size;r++) if(grid[r].every(Boolean)) return true;
  for(let c=0;c<size;c++) if(grid.every(row=>row[c])) return true;
  if(grid.every((row,i)=>row[i])) return true;
  if(grid.every((row,i)=>row[size-1-i])) return true;
  return false;
}

export default function Bingo({ data = SAMPLE, onBack, onComplete }) {
  const size = data.config?.gridSize || 4;
  const [grid] = useState(() => shuffle(data.items).slice(0, size*size));
  const [called, setCalled] = useState([]);
  const [marked, setMarked] = useState(new Set());
  const [bingo, setBingo] = useState(false);
  const [callerIdx, setCallerIdx] = useState(-1);
  const [started, setStarted] = useState(false);
  const callQueue = useRef(shuffle(data.items));
  const callRef = useRef(null);

  const callNext = useCallback(() => {
    setCallerIdx(i => {
      const ni = i+1;
      if (ni >= callQueue.current.length) return i;
      const item = callQueue.current[ni];
      setCalled(c => [...c, item]);
      return ni;
    });
  }, []);

  useEffect(() => {
    if (!started || bingo) return;
    if (data.config?.callerMode === 'auto') {
      callRef.current = setInterval(callNext, data.config?.callerInterval||5000);
      callNext();
      return () => clearInterval(callRef.current);
    }
  }, [started, bingo, callNext, data.config]);

  const markCell = (idx) => {
    if (!started || bingo) return;
    const item = grid[idx];
    const lastCall = called[called.length-1];
    if (!lastCall || item.id !== lastCall.id) return; // must match last called
    const newMarked = new Set(marked);
    newMarked.add(idx);
    setMarked(newMarked);
    if (checkBingo(newMarked, size)) { setBingo(true); clearInterval(callRef.current); onComplete?.(100); }
  };

  const currentCall = called[called.length-1];

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Bingo Québécois</span>
        <span style={{ fontSize:12, color:C.muted }}>{marked.size} cochés</span>
      </div>
      <div style={{ flex:1, padding:'16px', display:'flex', flexDirection:'column', gap:14 }}>
        {/* Caleur */}
        <div style={{ background:C.card, borderRadius:16, padding:16, border:`1px solid ${currentCall?C.primary:C.border}`, textAlign:'center', minHeight:80, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          {!started ? (
            <button onClick={() => setStarted(true)} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:12, padding:'12px 28px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, cursor:'pointer' }}>▶ Commencer</button>
          ) : currentCall ? (
            <>
              <div style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>Le caleur dit…</div>
              <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:15, color:C.ink }}>{currentCall.clue}</div>
            </>
          ) : <div style={{ fontSize:13, color:C.muted }}>En attente du premier appel…</div>}
        </div>
        {/* Grille */}
        {bingo && <div style={{ textAlign:'center', fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:22, color:C.success }}>🎉 BINGO !</div>}
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${size},1fr)`, gap:6, flex:1 }}>
          {grid.map((item, i) => {
            const isMarked = marked.has(i);
            const isCurrentCall = currentCall && item.id===currentCall.id && !isMarked;
            return (
              <button key={item.id} onClick={() => markCell(i)} style={{
                background: isMarked ? C.success : isCurrentCall ? 'rgba(199,91,57,.2)' : C.card,
                border: `1px solid ${isMarked?C.success:isCurrentCall?C.primary:C.border}`,
                borderRadius:10, padding:'8px 4px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:11,
                color: isMarked?'#fff':C.ink, cursor:'pointer', textAlign:'center', lineHeight:1.3, transition:'all .2s',
                opacity: isMarked?0.7:1
              }}>{item.term}</button>
            );
          })}
        </div>
        {data.config?.callerMode==='manual' && started && !bingo && (
          <button onClick={callNext} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Appel suivant →</button>
        )}
      </div>
    </div>
  );
}

Bingo.defaultProps = {};
const ref = { current: null };