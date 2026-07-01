import { useTheme } from '../store/useTheme';
import React, { useState, useEffect, useCallback } from 'react';



import { BaseGameProps } from '../types';
import { MemoryMatchData } from '../types/mechanics';

import { shuffle } from '../utils/array';

interface MemoryCard {
  uid: string;
  pairId: string;
  text: string;
  image?: string;
}

function buildCards(pairs: MemoryMatchData['pairs']): MemoryCard[] {
  return shuffle(pairs.flatMap(p => [
    { uid: p.id+'A', pairId: p.id, text: p.cardA.text, image: p.cardA.image },
    { uid: p.id+'B', pairId: p.id, text: p.cardB.text, image: p.cardB.image },
  ]));
}

export default function MemoryMatch({ data, items, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: MemoryMatchData }) {
  const { theme } = useTheme();
  const C = theme.colors;

  const { pairs = [], config } = data || {};

  const [cards] = useState<MemoryCard[]>(() => buildCards(pairs));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  const cols = config?.gridCols || 4;

  const flip = useCallback((uid: string) => {
    if (locked || flipped.includes(uid) || matched.includes(uid)) return;
    const next = [...flipped, uid];
    setFlipped(next);
    if (next.length === 2) {
      setMoves(m => m+1);
      setLocked(true);
      const [a, b] = next.map(id => cards.find(c => c.uid===id));
      if (a && b && a.pairId === b.pairId) {
        const newMatched = [...matched, a.uid, b.uid];
        setMatched(newMatched);
        setFlipped([]);
        setLocked(false);
        if (newMatched.length === cards.length) { setDone(true); onComplete?.(Math.max(100-moves*5,20)); }
      } else {
        setTimeout(() => { setFlipped([]); setLocked(false); }, config?.flipBackDelay || 1100);
      }
    }
  }, [locked, flipped, matched, cards, moves, config, onComplete]);

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🃏</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Toutes les paires !</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>{moves} coups · +{Math.max(100-moves*5,20)} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Memory</span>
        <span style={{ fontSize:12, color:C.muted }}>{matched.length/2}/{pairs.length} paires · {moves} coups</span>
      </div>
      <div style={{ flex:1, padding:16, display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:10, alignContent:'start', paddingTop:20 }}>
        {cards.map(card => {
          const isFlipped = flipped.includes(card.uid);
          const isMatched = matched.includes(card.uid);
          return (
            <div key={card.uid} onClick={() => flip(card.uid)} style={{
              aspectRatio:'1', borderRadius:14, cursor: isMatched ? 'default' : 'pointer',
              background: isMatched ? C.success : isFlipped ? C.surface : C.surface,
              border:`1px solid ${isMatched ? C.success : 'rgba(255,255,255,.1)'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:13, color:C.ink,
              transition:'background .2s, transform .15s', textAlign:'center', padding:6,
              transform: isFlipped || isMatched ? 'scale(1)' : 'scale(0.97)',
              opacity: isMatched ? 0.6 : 1,
            }}>
              {isFlipped || isMatched ? card.text : '?'}
            </div>
          );
        })}
      </div>
    </div>
  );
}