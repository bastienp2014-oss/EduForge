import React, { useState } from 'react';
import { useAdminTheme } from '../../store/useAdminTheme';
import { useAppConfig, TagConfig } from '../../store/useAppConfig';
import { Plus, X, Edit2, Save, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminTags() {
  const { theme } = useAdminTheme();
  const { tags, addTag, removeTag, updateTag, isLoaded } = useAppConfig();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState('');
  
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');

  const handleAdd = () => {
    if (!newTagLabel.trim()) return;
    
    const id = newTagLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    addTag({ id, label: newTagLabel.trim(), color: newTagColor });
    setNewTagLabel('');
    setNewTagColor('#3b82f6');
  };

  const handleEdit = (tag: TagConfig) => {
    setEditingId(tag.id);
    setEditLabel(tag.label);
    setEditColor(tag.color || '#3b82f6');
  };

  const handleSave = () => {
    if (editingId && editLabel.trim()) {
      updateTag(editingId, { label: editLabel.trim(), color: editColor });
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  if (!isLoaded) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6 font-display" style={{ color: theme.colors.ink }}>
        Gestion des Tags & Taxonomie
      </h2>
      
      <p className="text-sm mb-6" style={{ color: theme.colors.muted }}>
        Créez des tags pour classifier votre contenu (ex: "Vocabulaire", "Leçon 1", "Urgence").
        Ces tags remplaceront les anciennes catégories fixes et permettront de créer des parcours sur-mesure.
      </p>

      {/* Ajouter un tag */}
      <div className="p-4 rounded-xl mb-8 flex flex-wrap gap-4 items-end shadow-sm" style={{ backgroundColor: theme.colors.surface, border: `1px solid color-mix(in srgb, ${theme.colors.ink} 10%, transparent)` }}>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold mb-1" style={{ color: theme.colors.muted }}>Nouveau Tag</label>
          <input
            type="text"
            value={newTagLabel}
            onChange={(e) => setNewTagLabel(e.target.value)}
            placeholder="Ex: Hiver 2024"
            className="w-full p-2 rounded-lg text-sm border focus:outline-none"
            style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.surface} 95%, black)`, borderColor: `color-mix(in srgb, ${theme.colors.ink} 20%, transparent)`, color: theme.colors.ink }}
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1" style={{ color: theme.colors.muted }}>Couleur</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0 p-0"
            />
            <button 
              onClick={handleAdd}
              className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-transform active:scale-95"
              style={{ backgroundColor: theme.colors.primary, color: '#fff' }}
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* Liste des tags */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: theme.colors.muted }}>Tags existants</h3>
        
        {tags.length === 0 ? (
          <p className="text-sm italic opacity-70">Aucun tag n'a été créé.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map(tag => (
              <div 
                key={tag.id}
                className="p-3 rounded-lg flex items-center justify-between border"
                style={{ 
                  backgroundColor: theme.colors.surface, 
                  borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)`
                }}
              >
                {editingId === tag.id ? (
                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="w-full p-1 rounded border text-sm"
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                      />
                      <div className="flex items-center gap-2">
                        <button onClick={handleCancelEdit} className="p-1 rounded-full text-red-500 hover:bg-red-50">
                          <X className="w-4 h-4" />
                        </button>
                        <button onClick={handleSave} className="p-1 rounded-full text-green-500 hover:bg-green-50">
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color || theme.colors.primary }} />
                      <div className="flex flex-col">
                        <span className="font-bold text-sm" style={{ color: theme.colors.ink }}>{tag.label}</span>
                        <span className="text-xs opacity-50 font-mono">{tag.id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleEdit(tag)}
                        className="p-1.5 rounded-md hover:opacity-70 transition-opacity"
                        style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.ink} 5%, transparent)` }}
                      >
                        <Edit2 className="w-3.5 h-3.5" style={{ color: theme.colors.ink }} />
                      </button>
                      <button 
                        onClick={() => removeTag(tag.id)}
                        className="p-1.5 rounded-md hover:bg-red-50 transition-colors text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
