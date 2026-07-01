import { useTheme, AppColors } from '../store/useTheme';
import React, { useState, useCallback } from 'react';
import { BaseGameProps } from '../types';
import { SituationalChoiceData } from '../types/mechanics';

type Choice = {
  id: string;
  text: string;
  register: 'formal' | 'casual' | 'wrong';
  correct: boolean;
  feedback: string;
};

type Scenario = {
  id: string;
  situation: string;
  question: string;
  choices: Choice[];
};

const REGISTER_COLORS: Record<Choice['register'], string> = { formal: '#2B5AA0', casual: '#2D7A4F', wrong: '#c0392b' };

export default function SituationalChoice({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: SituationalChoiceData }) {
  const { theme } = useTheme();
  const C: AppColors = theme.colors;

  const scenarios: Scenario[] = items && items.length > 0 ? items.map((i, index) => ({
    id: i.id,
    situation: i.payload.question || "",
    question: "Que dites-vous ?",
    choices: [
      { id: `c1-${index}`, text: i.payload.answer || "Oui", register: 'formal', correct: true, feedback: i.payload.exemple || 'Parfait.' },
      { id: `c2-${index}`, text: (i.payload.answer || "Oui").toLowerCase(), register: 'casual', correct: true, feedback: 'Un peu familier, mais correct.' },
      { id: `c3-${index}`, text: 'Je ne sais pas', register: 'wrong', correct: false, feedback: 'Mauvaise réponse.' }
    ]
  })) : [
    {
      id: 's1',
      situation: 'Vous arrivez à un entretien d\'embauche et rencontrez le recruteur.',
      question: 'Que dites-vous ?',
      choices: [
        { id: 'c1', text: 'Enchanté de vous rencontrer.', register: 'formal', correct: true, feedback: 'Parfait pour un contexte professionnel.' },
        { id: 'c2', text: 'Salut, ça va ?', register: 'casual', correct: false, feedback: 'Trop familier pour un entretien.' },
        { id: 'c3', text: 'Quoi de neuf ?', register: 'wrong', correct: false, feedback: 'Totalement inadapté.' }
      ]
    }
  ];

  const [idx, setIdx] = useState<number>(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [done, setDone] = useState<boolean>(false);

  if (!scenarios || scenarios.length === 0) {
    return <div style={{ color: 'white', padding: 20 }}>No scenarios found.</div>;
  }

  const sc: Scenario = scenarios[idx];
  const answered = picked !== null;

  const pick = useCallback((choice: Choice) => {
    if (answered) return;
    setPicked(choice.id);
    if (choice.correct) setScore(s => s + 30);

    if (onResponse && sc.id) {
      onResponse(sc.id, choice.correct ? 3 : 1);
    }
  }, [answered, onResponse, sc.id]);

  const next = () => {
    if (idx + 1 >= scenarios.length) { 
      setDone(true); 
      onComplete?.(score); 
    } else { 
      setIdx(i => i + 1); 
      setPicked(null); 
    }
  };

  const choiceBg = (c: Choice): string => {
    if (!answered) return C.surface;
    if (c.correct) return 'rgba(45,122,79,.2)';
    if (c.id === picked) return 'rgba(192,57,43,.15)';
    return 'rgba(255,255,255,.03)';
  };
  
  const choiceBorder = (c: Choice): string => {
    if (!answered) return C.border;
    if (c.correct) return C.success;
    if (c.id === picked && !c.correct) return C.danger;
    return 'rgba(255,255,255,.05)';
  };

  if (done) return (
    <div style={{ background: C.bg, minHeight: isEmbedded ? '100%' : '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎭</div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 24, color: C.ink, marginBottom: 8 }}>Scénarios terminés !</div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 32 }}>+{score} pts</div>
      <button onClick={onBack} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 32px', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: isEmbedded ? '100%' : '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#131629', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,.08)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 16 }}>←</button>
        <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, color: C.ink }}>Situation</span>
        <span style={{ fontSize: 12, color: C.muted }}>{idx + 1}/{scenarios.length}</span>
      </div>
      <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Situation */}
        <div style={{ background: C.surface, borderRadius: 16, padding: 18, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>🎭 Situation</div>
          <p style={{ fontSize: 14, color: C.ink, lineHeight: 1.65, margin: '0 0 10px' }}>{sc.situation}</p>
          <p style={{ fontSize: 13, color: C.primary, fontWeight: 700, margin: 0 }}>{sc.question}</p>
        </div>
        {/* Choix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sc.choices.map((c: Choice) => (
            <button key={c.id} onClick={() => pick(c)} style={{
              background: choiceBg(c), border: `2px solid ${choiceBorder(c)}`,
              borderRadius: 14, padding: '14px 16px', textAlign: 'left', cursor: answered ? 'default' : 'pointer',
              transition: 'all .2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 14, color: C.ink, lineHeight: 1.5 }}>{c.text}</div>
                <div style={{ background: `${REGISTER_COLORS[c.register]}33`, color: REGISTER_COLORS[c.register], borderRadius: 999, padding: '2px 8px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>{c.register}</div>
              </div>
              {answered && c.id === picked && (
                <div style={{ marginTop: 8, fontSize: 12, color: c.correct ? C.success : C.danger, lineHeight: 1.5 }}>{c.feedback}</div>
              )}
              {answered && c.correct && c.id !== picked && (
                <div style={{ marginTop: 8, fontSize: 12, color: C.success, lineHeight: 1.5 }}>✓ {c.feedback}</div>
              )}
            </button>
          ))}
        </div>
        {answered && (
          <button onClick={next} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 0', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            {idx + 1 < scenarios.length ? 'Scénario suivant →' : 'Voir résultats'}
          </button>
        )}
      </div>
    </div>
  );
}
