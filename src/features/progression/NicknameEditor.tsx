import { useState } from 'react';
import { Edit2, Shuffle, Check } from 'lucide-react';
import { useProgression } from '../../store/useProgression';

const ADJECTIFS = [
  'Frette', 'Ben Raide', 'Fin Fin', 'En Tabarnouche', 'Baveux',
  'En Siboire', 'De Région', 'Mal Pris', 'En Titi', 'Gêné',
  'Smatte', 'Pogné', 'Bien Gras', 'Magasiné'
];
const NOMS = [
  'Castor', 'Caribou', 'Orignal', 'Sirop', 'Poutine',
  'Huard', 'Dépanneur', 'SkiDoo', 'Canot', 'Polo',
  'Chum', 'Bûcheron', 'Bécosse'
];

export default function NicknameEditor() {
  const { surnom, setSurnom } = useProgression();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(surnom);

  const handleGenerate = () => {
    const adj = ADJECTIFS[Math.floor(Math.random() * ADJECTIFS.length)];
    const nom = NOMS[Math.floor(Math.random() * NOMS.length)];
    const newName = `Le ${nom} ${adj}`;
    setTempName(newName);
    setSurnom(newName);
  };

  const handleSave = () => {
    if (tempName.trim()) {
      setSurnom(tempName.trim());
    } else {
      setTempName(surnom);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 mb-4 bg-white/50 p-2 rounded-xl">
        <input 
          autoFocus
          className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors"
          value={tempName}
          onChange={e => setTempName(e.target.value)}
          maxLength={25}
        />
        <button 
          onClick={handleGenerate}
          className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors"
          title="Générer un surnom aléatoire"
        >
          <Shuffle className="w-5 h-5" />
        </button>
        <button 
          onClick={handleSave}
          className="p-1.5 text-green-600 hover:bg-green-100 rounded-md transition-colors"
          title="Sauvegarder"
        >
          <Check className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex justify-center items-center gap-2 mb-4">
      <div className="font-extrabold font-display text-xl text-slate-800 tracking-tight">
        {surnom}
      </div>
      <button 
        onClick={() => {
          setTempName(surnom);
          setIsEditing(true);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-all rounded-md hover:bg-slate-100 focus:opacity-100"
        title="Modifier le surnom"
      >
        <Edit2 className="w-4 h-4" />
      </button>
    </div>
  );
}
