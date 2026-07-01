import { useTheme } from '../store/useTheme';
import React, { useState, useCallback } from 'react';
import { BaseGameProps } from '../types';
import { AnagramData } from '../types/mechanics';

import { shuffle } from '../utils/array';

function shuffleStr(str: string): string[] {
  const arr = str.split('');
  const shuffled = shuffle(arr);
  return shuffled.join('') === str ? shuffleStr(str) : shuffled;
}

interface Tile {
  id: number;
  letter: string;
  used: boolean;
}

export default function Anagram({ items, data, onBack, onComplete, onResponse }: BaseGameProps & { data?: AnagramData }) {
  const { theme } = useTheme();
  const C = theme.colors;

  const { words = [] } = data || {};
  
  const [idx, setIdx] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>(() => {
    if (!words || words.length === 0) return [];
    return shuffleStr(words[0].word).map((l,i) => ({ id:i, letter:l, used:false }));
  });
  const [answer, setAnswer] = useState<Tile[]>([]);
  const [result, setResult] = useState<'correct'|'wrong'|null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (!words || words.length === 0) {
    return <div style={{ color: 'white', padding: 20 }}>No anagram data found.</div>;
  }

  const word = words[idx];

  const pickTile = useCallback((tile: Tile) => {
    if (tile.used || result) return;
    setTiles(ts => ts.map(t => t.id===tile.id ? {...t, used:true} : t));
    setAnswer(a => [...a, tile]);
  }, [result]);

  const removeLast = useCallback(() => {
    if (!answer.length || result) return;
    const last = answer[answer.length-1];
    setAnswer(a => a.slice(0,-1));
    setTiles(ts => ts.map(t => t.id===last.id ? {...t, used:false} : t));
  }, [answer, result]);

  const validate = useCallback(() => {
    const ans = answer.map(t=>t.letter).join('');
    const correct = ans === word.word;
    setResult(correct ? 'correct' : 'wrong');
    if (correct) setScore(s => s+40);
    
    // Notify response if available
    const currentItem = items?.[idx];
    if (currentItem && onResponse) {
      onResponse(currentItem.id, correct ? 3 : 1);
    }

    setTimeout(() => {
      setResult(null);
      if (idx+1 >= words.length) { setDone(true); onComplete?.(score + (correct?40:0)); }
      else {
        const ni = idx+1;
        setIdx(ni);
        setTiles(shuffleStr(words[ni].word).map((l,i)=>({id:i,letter:l,used:false})));
        setAnswer([]);
      }
    }, 1200);
  }, [answer, word, idx, words, score, onComplete, items, onResponse]);

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🔤</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Bravo !</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{score} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Anagramme</span>
        <span style={{ fontSize:12, color:C.muted }}>{idx+1}/{words.length}</span>
      </div>
      <div style={{ flex:1, padding:'24px 16px', display:'flex', flexDirection:'column', gap:20, alignItems:'center' }}>
        {/* Indice */}
        <div style={{ background:C.surface, borderRadius:14, padding:'10px 16px', border:`1px solid ${C.border}`, fontSize:12, color:C.muted, textAlign:'center', width:'100%', maxWidth:340 }}>
          💡 {word.hint}
        </div>
        {/* Réponse slots */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', minHeight:52 }}>
          {answer.map((t,i) => (
            <div key={i} style={{ width:40, height:48, borderRadius:10, background:C.surface, border:`2px solid ${result==='correct'?C.success:result==='wrong'?C.danger:C.primary}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:18, color:C.ink }}>
              {t.letter}
            </div>
          ))}
          {Array.from({length: word.word.length - answer.length}).map((_,i) => (
            <div key={'empty'+i} style={{ width:40, height:48, borderRadius:10, border:`2px dashed rgba(255,255,255,.15)`, display:'flex', alignItems:'center', justifyContent:'center' }} />
          ))}
        </div>
        {/* Tuiles source */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center', maxWidth:340 }}>
          {tiles.map(t => (
            <button key={t.id} onClick={() => pickTile(t)} disabled={t.used} style={{
              width:44, height:48, borderRadius:10, cursor:t.used?'default':'pointer',
              background:t.used?'rgba(255,255,255,.05)':C.surface,
              border:`2px solid ${t.used?'transparent':C.border}`,
              fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:18, color:t.used?'transparent':C.ink,
              transition:'all .15s'
            }}>{t.used?'':t.letter}</button>
          ))}
        </div>
        {/* Actions */}
        <div style={{ display:'flex', gap:10, width:'100%', maxWidth:340 }}>
          <button onClick={removeLast} disabled={!answer.length} style={{ flex:1, background:C.surface, color:C.ink, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer' }}>⌫ Effacer</button>
          <button onClick={validate} disabled={answer.length!==word.word.length || !!result} style={{
            flex:2, background: answer.length===word.word.length ? C.primary : 'rgba(255,255,255,.08)',
            color:'#fff', border:'none', borderRadius:12, padding:'12px 0',
            fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer'
          }}>Valider ✓</button>
        </div>
        {result && (
          <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:16, color: result==='correct'?C.success:C.danger }}>
            {result==='correct' ? '✓ Correct !' : `✗ C'était : ${word.word}`}
          </div>
        )}
      </div>
    </div>
  );
}