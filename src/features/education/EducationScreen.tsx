import React from 'react';
import { ArrowLeft, GraduationCap, BookOpen, School, University } from 'lucide-react';
import { useProgression } from '../../store/useProgression';

type EducationProps = {
  onBack: () => void;
};

const SCHOOL_LEVELS = [
  {
    id: 'primaire',
    name: 'École Primaire',
    ages: '5 à 11 ans',
    desc: 'Maternelle à la 6e année.',
    icon: <BookOpen className="w-8 h-8 text-sky-500" />,
    color: 'bg-sky-50',
    borderColor: 'border-sky-200'
  },
  {
    id: 'secondaire',
    name: 'École Secondaire',
    ages: '12 à 16 ans',
    desc: 'Secondaire 1 à 5. Obtention du DES.',
    icon: <School className="w-8 h-8 text-emerald-500" />,
    color: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  {
    id: 'cfp',
    name: 'C.F.P.',
    ages: '16 ans et +',
    desc: 'Centre de Formation Professionnelle (DEP).',
    icon: <School className="w-8 h-8 text-amber-500" />,
    color: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  {
    id: 'cegep',
    name: 'Cégep',
    ages: '17 à 19 ans',
    desc: 'Préuniversitaire (2 ans) ou technique (3 ans).',
    icon: <GraduationCap className="w-8 h-8 text-indigo-500" />,
    color: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  {
    id: 'universite',
    name: 'Université',
    ages: '19 ans et +',
    desc: 'Baccalauréat, Maîtrise, Doctorat.',
    icon: <University className="w-8 h-8 text-rose-500" />,
    color: 'bg-rose-50',
    borderColor: 'border-rose-200'
  }
];

export default function EducationScreen({ onBack }: EducationProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-6 pb-12 overflow-y-auto w-full font-sans text-slate-900 relative">
      <div className="w-full max-w-[500px] px-6 mb-6 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-3 bg-white text-slate-700 shadow-sm border border-slate-200 flex items-center justify-center rounded-2xl active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full max-w-[500px] px-6">
        <div className="bg-yellow-500 rounded-[2rem] p-6 shadow-lg text-white mb-8 flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-2xl shrink-0">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-display tracking-tight leading-none mb-2">Système Scolaire</h1>
            <p className="text-yellow-50 text-[13px] leading-relaxed">
              Découvre le cheminement éducatif unique au Québec, de la maternelle à l'université.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {SCHOOL_LEVELS.map((level, index) => (
            <div key={level.id} className="relative">
              {index !== SCHOOL_LEVELS.length - 1 && (
                <div className="absolute left-[39px] top-[60px] bottom-[-30px] w-1 bg-slate-200 rounded-full z-0"></div>
              )}
              <div className={`relative z-10 bg-white p-5 rounded-3xl shadow-sm border ${level.borderColor} flex gap-5 items-start transition-all hover:shadow-md`}>
                <div className={`${level.color} p-4 rounded-2xl shrink-0 shadow-inner`}>
                  {level.icon}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{level.name}</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                      {level.ages}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm leading-snug">{level.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
