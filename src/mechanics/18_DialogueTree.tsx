import { useTheme } from '../store/useTheme';
import React, { useState } from 'react';
import { BaseGameProps } from '../types';
import { DialogueTreeData } from '../types/mechanics';

export default function DialogueTree({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: DialogueTreeData }) {
  const { theme } = useTheme();
  const C = theme.colors;

  const { config = { character: { name: 'PNJ', avatar: '🤖' } }, startNode = 'n1', nodes = {} } = data || {};

  const char = config?.character || { name:'PNJ', avatar:'🤖' };
  const [nodeId, setNodeId] = useState(startNode);
  const [score, setScore] = useState(0);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [history, setHistory] = useState([]);
  const [done, setDone] = useState(false);
  const [outcome, setOutcome] = useState(null);

  const node = nodes[nodeId];

  const pick = (choice) => {
    const newScore = score + (choice.points||0);
    setScore(newScore);
    setLastFeedback({ text: choice.feedback, good: (choice.points||0) > 0 });
    setHistory(h => [...h, { npc: node.npc, player: choice.text }]);
    setTimeout(() => {
      setLastFeedback(null);
      const nextNode = nodes[choice.next];
      if (nextNode?.isEnd) {
        setOutcome(nextNode.outcome);
        setHistory(h => [...h, { npc: nextNode.npc }]);
        setDone(true);
        if (items?.[0] && onResponse) {
           onResponse(items[0].id, (choice.points || 0) > 0 ? 5 : 1);
        }
        onComplete?.(newScore);
      } else {
        setNodeId(choice.next);
      }
    }, 1600);
  };

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', padding:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:16, color:C.ink }}>Dialogue terminé</span>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
        {history.map((h, i) => (
          <React.Fragment key={i}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:24, flexShrink:0 }}>{char.avatar}</span>
              <div style={{ background:C.surface, borderRadius:14, borderTopLeftRadius:4, padding:'10px 14px', maxWidth:'75%', fontSize:13, color:C.ink, lineHeight:1.5 }}>{h.npc}</div>
            </div>
            {h.player && (
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <div style={{ background:'rgba(199,91,57,.2)', border:'1px solid rgba(199,91,57,.4)', borderRadius:14, borderTopRightRadius:4, padding:'10px 14px', maxWidth:'75%', fontSize:13, color:C.ink, lineHeight:1.5 }}>{h.player}</div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div style={{ textAlign:'center', marginBottom:16 }}>
        <div style={{ fontSize:36, marginBottom:8 }}>{outcome==='win'?'🎉':outcome==='neutral'?'😐':'😕'}</div>
        <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:18, color:C.ink, marginBottom:4 }}>Score : {score} pts</div>
      </div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}><span style={{ fontSize:20 }}>{char.avatar}</span><span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:13, color:C.ink }}>{char.name}</span></div>
        <span style={{ fontSize:12, color:C.muted }}>⭐ {score}</span>
      </div>
      <div style={{ flex:1, padding:'20px 16px', display:'flex', flexDirection:'column', gap:16 }}>
        {/* Historique compact */}
        {history.slice(-2).map((h,i) => (
          <React.Fragment key={i}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:20, flexShrink:0 }}>{char.avatar}</span>
              <div style={{ background:C.surface, borderRadius:12, borderTopLeftRadius:4, padding:'8px 12px', fontSize:12, color:C.muted, lineHeight:1.5 }}>{h.npc}</div>
            </div>
            {h.player && <div style={{ display:'flex', justifyContent:'flex-end' }}><div style={{ background:'rgba(199,91,57,.15)', borderRadius:12, borderTopRightRadius:4, padding:'8px 12px', fontSize:12, color:C.muted }}>{h.player}</div></div>}
          </React.Fragment>
        ))}
        {/* Message actuel */}
        <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
          <span style={{ fontSize:24, flexShrink:0 }}>{char.avatar}</span>
          <div style={{ background:C.surface, borderRadius:14, borderTopLeftRadius:4, padding:'14px 16px', flex:1, fontSize:14, color:C.ink, lineHeight:1.6, border:`1px solid ${C.border}` }}>{node.npc}</div>
        </div>
        {lastFeedback && (
          <div style={{ background: lastFeedback.good?'rgba(45,122,79,.15)':'rgba(192,57,43,.12)', borderRadius:12, padding:'10px 14px', fontSize:12, color:lastFeedback.good?C.success:C.danger, border:`1px solid ${lastFeedback.good?C.success:C.danger}` }}>
            💬 {lastFeedback.text}
          </div>
        )}
        {/* Choix */}
        {!lastFeedback && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {node.choices?.map((c,i) => (
              <button key={i} onClick={() => pick(c)} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:'13px 16px', textAlign:'left', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:13, color:C.ink, cursor:'pointer' }}>
                {c.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}