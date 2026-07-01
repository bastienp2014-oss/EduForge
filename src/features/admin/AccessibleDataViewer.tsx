import React from 'react';

interface AccessibleDataViewerProps {
  data: Record<string, any>;
}

export default function AccessibleDataViewer({ data }: AccessibleDataViewerProps) {
  const renderValue = (val: any): React.ReactNode => {
    if (Array.isArray(val)) {
      return (
        <ul className="list-disc list-inside space-y-1 ml-2">
          {val.map((item, idx) => (
            <li key={idx} className="text-slate-700">{renderValue(item)}</li>
          ))}
        </ul>
      );
    }
    
    if (val !== null && typeof val === 'object') {
      return (
        <div className="space-y-2 ml-2 border-l-2 border-slate-200 pl-3">
          {Object.entries(val).map(([k, v]) => (
            <div key={k}>
              <span className="font-semibold text-slate-800 mr-2">{k}:</span>
              {renderValue(v)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof val === 'boolean') {
      return <span className={`font-mono px-1.5 py-0.5 rounded text-xs ${val ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{val ? 'Vrai' : 'Faux'}</span>;
    }

    return <span className="text-slate-600 break-words">{String(val)}</span>;
  };

  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([k]) => k !== "_originalIndex" && k !== "niveau" && k !== "tags" && k !== "audioUrl")
  );

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm space-y-3">
      {Object.entries(cleanData).map(([key, value]) => {
        // Formatter le nom de la clé pour être plus lisible (ex: bonne_reponse -> Bonne Réponse)
        const displayKey = key
          .replace(/_/g, ' ')
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());

        return (
          <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
            <span className="font-bold text-slate-700 min-w-[120px] shrink-0">{displayKey}</span>
            <div className="flex-1">{renderValue(value)}</div>
          </div>
        );
      })}
    </div>
  );
}
