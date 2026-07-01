import React, { useState, useRef, useCallback, useEffect } from 'react';

const SAMPLE = {
  config: { scoringMode:'self', maxAttempts:3, visualization:'waveform' },
  items: [
    { id:'v1', text:'Aweille, on s'en va !',       referenceAudio:'', phonetic:'a.wɛj, ɔ̃.s‿ɑ̃.va', difficulty:1 },
    { id:'v2', text:'Pantoute, j'veux pas y aller', referenceAudio:'', phonetic:'pɑ̃.tut, ʒvø.pa.i.a.le', difficulty:2 },
    { id:'v3', text:'C'est tiguidou !',              referenceAudio:'', phonetic:'sɛ.ti.gi.du', difficulty:1 },
  ]
};

const C = { bg:'#0f1117', card:'#1a1d2e', surface:'#232640', ink:'#fff', muted:'rgba(255,255,255,.45)', border:'rgba(255,255,255,.1)', primary:'#C75B39', success:'#2D7A4F', danger:'#c0392b' };

function WaveBar({ active, idx }) {
  const height = active ? (Math.sin(idx*0.8 + Date.now()*0.003)*30+40) : 4;
  return <div style={{ width:3, borderRadius:999, background:active?C.primary:'rgba(255,255,255,.15)', height, transition:'height .1s', flexShrink:0 }} />;
}

export default function VoiceRecording({ data = SAMPLE, onBack, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | playing_ref | recording | reviewing | rated
  const [attempts, setAttempts] = useState(0);
  const [selfScore, setSelfScore] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [tick, setTick] = useState(0);
  const mediaStream = useRef(null);
  const mediaRecorder = useRef(null);
  const recordedBlob = useRef(null);
  const audioRef = useRef(null);
  const recAudioRef = useRef(null);
  const timerRef = useRef(null);

  const item = data.items[idx];
  const maxAttempts = data.config?.maxAttempts || 3;

  useEffect(() => {
    if (phase==='recording') {
      timerRef.current = setInterval(() => setTick(t=>t+1), 100);
      return () => clearInterval(timerRef.current);
    }
    clearInterval(timerRef.current);
  }, [phase]);

  const playRef = () => {
    setPhase('playing_ref');
    if (item.referenceAudio && audioRef.current) {
      audioRef.current.play();
      audioRef.current.onended = () => setPhase('idle');
    } else {
      setTimeout(() => setPhase('idle'), 2000);
    }
  };

  const startRec = useCallback(async () => {
    if (attempts >= maxAttempts) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      mediaStream.current = stream;
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        recordedBlob.current = new Blob(chunks, { type:'audio/webm' });
        if (recAudioRef.current) recAudioRef.current.src = URL.createObjectURL(recordedBlob.current);
        setPhase('reviewing');
        stream.getTracks().forEach(t=>t.stop());
      };
      mediaRecorder.current = mr;
      mr.start();
      setPhase('recording');
      setAttempts(a=>a+1);
    } catch {
      alert('Microphone non autorisé. Cette fonctionnalité requiert l'accès au micro.');
      setPhase('idle');
    }
  }, [attempts, maxAttempts]);

  const stopRec = () => { mediaRecorder.current?.stop(); };

  const playRecording = () => { recAudioRef.current?.play(); };

  const rate = (r) => {
    setSelfScore(r);
    const pts = r * 15;
    setScore(s=>s+pts);
    setPhase('rated');
  };

  const next = () => {
    setSelfScore(null); setAttempts(0); recordedBlob.current=null; setPhase('idle');
    if (idx+1 >= data.items.length) { setDone(true); onComplete?.(score); }
    else setIdx(i=>i+1);
  };

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🎤</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Session terminée !</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{score} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Prononciation</span>
        <span style={{ fontSize:12, color:C.muted }}>{idx+1}/{data.items.length}</span>
      </div>
      <div style={{ flex:1, padding:'24px 16px', display:'flex', flexDirection:'column', gap:20 }}>
        {/* Texte à prononcer */}
        <div style={{ background:C.card, borderRadius:18, padding:20, border:`1px solid ${C.border}`, textAlign:'center' }}>
          <div style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 }}>PRONONCE CETTE PHRASE</div>
          <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:22, color:C.ink, marginBottom:8, lineHeight:1.4 }}>{item.text}</div>
          {item.phonetic && <div style={{ fontSize:13, color:C.muted, fontFamily:'serif', fontStyle:'italic' }}>/{item.phonetic}/</div>}
          <div style={{ display:'flex', gap:4, marginTop:4, justifyContent:'center' }}>
            {Array.from({length:item.difficulty}).map((_,i)=><span key={i} style={{ fontSize:12 }}>⭐</span>)}
          </div>
        </div>

        {/* Waveform */}
        <div style={{ background:C.surface, borderRadius:14, padding:'14px', border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', gap:3, height:64, overflow:'hidden' }}>
          {Array.from({length:40}).map((_,i)=><WaveBar key={i} active={phase==='recording'} idx={i} />)}
        </div>

        {/* Contrôles */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {item.referenceAudio && <audio ref={audioRef} src={item.referenceAudio} />}
          <audio ref={recAudioRef} />

          <button onClick={playRef} disabled={phase==='recording'} style={{ background:'rgba(43,90,160,.25)', border:'1px solid rgba(43,90,160,.5)', color:'#93c5fd', borderRadius:12, padding:'12px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, cursor:'pointer' }}>
            {phase==='playing_ref'?'▶ Référence en cours…':'▶ Écouter la référence'}
          </button>

          {phase==='idle' && (
            <button onClick={startRec} disabled={attempts>=maxAttempts} style={{ background: attempts<maxAttempts?'rgba(192,57,43,.25)':'rgba(255,255,255,.05)', border:`1px solid ${attempts<maxAttempts?C.danger:'rgba(255,255,255,.1)'}`, color:attempts<maxAttempts?'#fca5a5':C.muted, borderRadius:12, padding:'14px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, cursor:attempts<maxAttempts?'pointer':'default' }}>
              🎙️ {attempts<maxAttempts?`Enregistrer (essai ${attempts+1}/${maxAttempts})`:'Tentatives épuisées'}
            </button>
          )}
          {phase==='recording' && (
            <button onClick={stopRec} style={{ background:'rgba(192,57,43,.3)', border:`1px solid ${C.danger}`, color:'#fca5a5', borderRadius:12, padding:'14px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, cursor:'pointer', animation:'pulse 1s infinite' }}>
              ⏹ Arrêter l'enregistrement
            </button>
          )}
          {(phase==='reviewing'||phase==='rated') && (
            <button onClick={playRecording} style={{ background:'rgba(45,122,79,.2)', border:`1px solid ${C.success}`, color:'#4ade80', borderRadius:12, padding:'12px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, cursor:'pointer' }}>
              ▶ Réécouter mon enregistrement
            </button>
          )}
        </div>

        {/* Auto-évaluation */}
        {phase==='reviewing' && (
          <div>
            <div style={{ fontSize:12, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10, textAlign:'center' }}>Comment était ta prononciation ?</div>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              {[{r:1,label:'😬 Difficile'},{r:2,label:'🙂 Passable'},{r:3,label:'😊 Bon'},{r:4,label:'🤩 Excellent'}].map(({r,label})=>(
                <button key={r} onClick={()=>rate(r)} style={{ flex:1, background:'rgba(255,255,255,.06)', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 4px', fontSize:10, fontWeight:700, color:C.ink, cursor:'pointer', textAlign:'center', lineHeight:1.4 }}>{label}</button>
              ))}
            </div>
          </div>
        )}
        {phase==='rated' && (
          <>
            <div style={{ textAlign:'center', fontSize:14, color:C.success, fontWeight:700 }}>✓ Auto-évaluation enregistrée · +{selfScore*15} pts</div>
            <button onClick={next} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>
              {idx+1<data.items.length?'Phrase suivante →':'Voir résultats'}
            </button>
          </>
        )}
        <div style={{ fontSize:11, color:C.muted, textAlign:'center' }}>Note : requiert un navigateur avec accès au microphone (Chrome/Edge)</div>
      </div>
    </div>
  );
}