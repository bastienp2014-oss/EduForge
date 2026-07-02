import React, { useState, useCallback } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { SituationalChoiceData } from '../types/mechanics';
import GameResult from '../components/GameResult';

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

export default function SituationalChoice({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: SituationalChoiceData }) {
  const { theme } = useTheme();
  const { border, radCard, radBtn, shadow } = useThemeTokens();

  const REGISTER_COLORS: Record<Choice['register'], string> = { 
    formal: '#2B5AA0', 
    casual: theme.colors.success, 
    wrong: theme.colors.danger 
  };

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
    return <div className="p-4" style={{ color: theme.colors.ink }}>No scenarios found.</div>;
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
    if (!answered) return theme.colors.surface;
    if (c.correct) return `${theme.colors.success}33`;
    if (c.id === picked) return `${theme.colors.danger}26`;
    return `${theme.colors.ink}08`;
  };
  
  const choiceBorder = (c: Choice): string => {
    if (!answered) return border;
    if (c.correct) return theme.colors.success;
    if (c.id === picked && !c.correct) return theme.colors.danger;
    return `${theme.colors.ink}14`;
  };

  if (done) {
    return (
      <GameResult 
        state="win"
        title="Scénarios terminés !"
        points={score}
        onBack={onBack}
      />
    );
  }

  return (
    <div className={`${isEmbedded ? 'min-h-full h-full' : 'min-h-screen'} flex flex-col`} style={{ backgroundColor: theme.colors.bg }}>
      {/* HUD */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ 
          backgroundColor: theme.colors.header, 
          borderColor: border 
        }}
      >
        <button 
          onClick={onBack} 
          className="rounded-lg px-3 py-1.5 text-base cursor-pointer"
          style={{ backgroundColor: border, color: theme.colors.ink }}
        >
          ←
        </button>
        <span className="font-bold text-sm" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
          Situation
        </span>
        <span className="text-xs" style={{ color: theme.colors.muted }}>
          {idx + 1}/{scenarios.length}
        </span>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-4 max-w-md mx-auto w-full">
        {/* Situation Card */}
        <div 
          className="p-5"
          style={{ 
            backgroundColor: theme.colors.surface, 
            borderRadius: radCard, 
            border: `1px solid ${border}`,
            boxShadow: shadow
          }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: theme.colors.muted }}>
            🎭 Situation
          </div>
          <p className="text-sm leading-relaxed mb-3" style={{ color: theme.colors.ink }}>
            {sc.situation}
          </p>
          <p className="text-[13px] font-bold m-0" style={{ color: theme.colors.primary }}>
            {sc.question}
          </p>
        </div>

        {/* Choices */}
        <div className="flex flex-col gap-3">
          {sc.choices.map((c: Choice) => (
            <button 
              key={c.id} 
              onClick={() => pick(c)} 
              className={`p-4 text-left border-2 transition-all ${answered ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}`}
              style={{
                backgroundColor: choiceBg(c), 
                borderColor: choiceBorder(c),
                borderRadius: radCard, 
              }}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="font-semibold text-sm leading-snug" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
                  {c.text}
                </div>
                <div 
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0"
                  style={{ 
                    backgroundColor: `${REGISTER_COLORS[c.register]}33`, 
                    color: REGISTER_COLORS[c.register] 
                  }}
                >
                  {c.register}
                </div>
              </div>
              
              {/* Feedback Section */}
              {answered && c.id === picked && (
                <div 
                  className="mt-3 text-xs leading-relaxed animate-in slide-in-from-top-1" 
                  style={{ color: c.correct ? theme.colors.success : theme.colors.danger }}
                >
                  {c.feedback}
                </div>
              )}
              {answered && c.correct && c.id !== picked && (
                <div 
                  className="mt-3 text-xs leading-relaxed animate-in slide-in-from-top-1" 
                  style={{ color: theme.colors.success }}
                >
                  ✓ {c.feedback}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Next Button */}
        {answered && (
          <button 
            onClick={next} 
            className="w-full py-3.5 border-none cursor-pointer font-bold text-[15px] active:scale-95 transition-transform mt-2 animate-in slide-in-from-bottom-2"
            style={{ 
              backgroundColor: theme.colors.primary, 
              color: '#fff', 
              borderRadius: radBtn, 
              fontFamily: theme.fonts.display 
            }}
          >
            {idx + 1 < scenarios.length ? 'Scénario suivant →' : 'Voir résultats'}
          </button>
        )}
      </div>
    </div>
  );
}
