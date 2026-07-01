import React, { useState } from 'react';
import { useAdminTheme } from '../../store/useAdminTheme';
import { Course } from '../../types';
import { ArrowLeft, Save, Plus, Wand2, GripVertical, Trash2, BookOpen, Gamepad2, Settings } from 'lucide-react';
import AdminMarketingGenerator from './AdminMarketingGenerator';
import AdminRichTextEditor from './AdminRichTextEditor';

interface AdminCourseEditorProps {
  course: Course | null;
  onSave: (data: Partial<Course>) => Promise<void>;
  onClose: () => void;
}

interface CourseModule {
  id: string;
  title: string;
  type: 'theorie' | 'jeu';
  content?: string;
}

export default function AdminCourseEditor({ course, onSave, onClose }: AdminCourseEditorProps) {
  const { theme } = useAdminTheme();
  const [title, setTitle] = useState(course?.title || '');
  const [description, setDescription] = useState(course?.description || '');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(course?.status || 'draft');
  const [isSaving, setIsSaving] = useState(false);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  // Mock modules structure for flexibility demonstration
  const [modules, setModules] = useState<CourseModule[]>([
    { id: 'm1', title: 'Introduction', type: 'theorie', content: '<h2>Bienvenue</h2><p>Voici le contenu théorique initial.</p>' }
  ]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ title, description, status });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "w-full p-3 rounded-xl border focus:outline-none focus:ring-2";
  const inputStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: `${theme.colors.muted}30`,
    color: theme.colors.ink,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ color: theme.colors.muted }}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au Hub
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || !title}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all hover:opacity-90 text-white disabled:opacity-50"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Informations générales */}
          <div className="p-6 rounded-3xl border" style={{ backgroundColor: theme.colors.surface, borderColor: `${theme.colors.muted}20` }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: theme.colors.ink }}>
              Informations du cours
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: theme.colors.ink }}>Titre</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Maîtriser React"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: theme.colors.ink }}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez ce que l'apprenant va accomplir..."
                  rows={4}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Assemblage et Flexibilité */}
          <div className="p-6 rounded-3xl border" style={{ backgroundColor: theme.colors.surface, borderColor: `${theme.colors.muted}20` }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold" style={{ color: theme.colors.ink }}>
                  Programme & Contenu
                </h3>
                <p className="text-sm mt-1" style={{ color: theme.colors.muted }}>
                  Assemblez vos modules manuellement ou générez-les via l'IA.
                </p>
              </div>
              <button 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors hover:bg-purple-50"
                style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}
              >
                <Wand2 className="w-4 h-4" />
                Générer avec l'IA
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {modules.map((mod, index) => {
                const isExpanded = expandedModuleId === mod.id;
                
                return (
                  <div key={mod.id} className="rounded-xl border bg-white overflow-hidden transition-all" style={{ borderColor: `${theme.colors.muted}30` }}>
                    <div className="flex items-center gap-3 p-3">
                      <GripVertical className="w-5 h-5 cursor-grab" style={{ color: theme.colors.muted }} />
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}15`, color: theme.colors.primary }}>
                        {mod.type === 'theorie' ? <BookOpen className="w-4 h-4" /> : <Gamepad2 className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 font-medium" style={{ color: theme.colors.ink }}>
                        {index + 1}. {mod.title}
                      </div>
                      <button 
                        onClick={() => {
                          if (mod.type === 'theorie') {
                            setExpandedModuleId(isExpanded ? null : mod.id);
                          }
                        }}
                        className={`p-2 rounded-lg transition-colors ${mod.type === 'theorie' && isExpanded ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-500'}`}
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {isExpanded && mod.type === 'theorie' && (
                      <div className="p-4 border-t bg-slate-50" style={{ borderColor: `${theme.colors.muted}20` }}>
                        <div className="mb-2 font-bold text-sm" style={{ color: theme.colors.ink }}>Contenu théorique</div>
                        <AdminRichTextEditor 
                          content={mod.content || ''}
                          onChange={(newContent) => {
                            setModules(modules.map(m => m.id === mod.id ? { ...m, content: newContent } : m));
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed transition-colors hover:bg-gray-50" style={{ borderColor: `${theme.colors.muted}30`, color: theme.colors.ink }}>
                <BookOpen className="w-4 h-4" />
                <span className="font-medium text-sm">Ajouter une théorie</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed transition-colors hover:bg-gray-50" style={{ borderColor: `${theme.colors.muted}30`, color: theme.colors.ink }}>
                <Gamepad2 className="w-4 h-4" />
                <span className="font-medium text-sm">Ajouter un jeu</span>
              </button>
            </div>
          </div>

          <AdminMarketingGenerator 
            productName={title || 'Nouveau cours'}
            productType="course"
            description={description}
          />
        </div>

        {/* Barre latérale (Paramètres) */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border" style={{ backgroundColor: theme.colors.surface, borderColor: `${theme.colors.muted}20` }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: theme.colors.ink }}>Paramètres</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: theme.colors.ink }}>Statut de publication</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className={inputClass}
                  style={inputStyle}
                >
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                  <option value="archived">Archivé</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
