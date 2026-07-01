import React, { useState } from 'react';
import { useAdminTheme } from '../../store/useAdminTheme';
import { Bundle, Course } from '../../types';
import { ArrowLeft, Save, Plus, X, Search, BookOpen } from 'lucide-react';
import AdminMarketingGenerator from './AdminMarketingGenerator';

interface AdminBundleEditorProps {
  bundle: Bundle | null;
  availableCourses: Course[];
  onSave: (data: Partial<Bundle>) => Promise<void>;
  onClose: () => void;
}

export default function AdminBundleEditor({ bundle, availableCourses, onSave, onClose }: AdminBundleEditorProps) {
  const { theme } = useAdminTheme();
  const [title, setTitle] = useState(bundle?.title || '');
  const [description, setDescription] = useState(bundle?.description || '');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(bundle?.courseIds || []);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ title, description, courseIds: selectedCourseIds });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCourse = (courseId: string) => {
    if (selectedCourseIds.includes(courseId)) {
      setSelectedCourseIds(prev => prev.filter(id => id !== courseId));
    } else {
      setSelectedCourseIds(prev => [...prev, courseId]);
    }
  };

  const inputClass = "w-full p-3 rounded-xl border focus:outline-none focus:ring-2";
  const inputStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: `${theme.colors.muted}30`,
    color: theme.colors.ink,
  };

  const unselectedCourses = availableCourses.filter(c => !selectedCourseIds.includes(c.id) && c.title.toLowerCase().includes(searchQuery.toLowerCase()));

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
          disabled={isSaving || !title || selectedCourseIds.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all hover:opacity-90 text-white disabled:opacity-50"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border" style={{ backgroundColor: theme.colors.surface, borderColor: `${theme.colors.muted}20` }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: theme.colors.ink }}>
              Informations du Bundle
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: theme.colors.ink }}>Titre</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Pack Bootcamp Fullstack"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: theme.colors.ink }}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez ce que ce pack contient..."
                  rows={4}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl border" style={{ backgroundColor: theme.colors.surface, borderColor: `${theme.colors.muted}20` }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: theme.colors.ink }}>
              Cours inclus ({selectedCourseIds.length})
            </h3>
            <div className="space-y-3">
              {selectedCourseIds.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: theme.colors.muted }}>
                  Aucun cours sélectionné.
                </p>
              ) : (
                selectedCourseIds.map(id => {
                  const c = availableCourses.find(course => course.id === id);
                  if (!c) return null;
                  return (
                    <div key={id} className="flex items-center justify-between p-3 rounded-xl border bg-white" style={{ borderColor: `${theme.colors.muted}30` }}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}15`, color: theme.colors.primary }}>
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm" style={{ color: theme.colors.ink }}>{c.title}</span>
                      </div>
                      <button 
                        onClick={() => toggleCourse(id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <AdminMarketingGenerator 
            productName={title || 'Nouveau bundle'}
            productType="bundle"
            description={description}
          />
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-3xl border" style={{ backgroundColor: theme.colors.surface, borderColor: `${theme.colors.muted}20` }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: theme.colors.ink }}>
              Catalogue disponible
            </h3>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.colors.muted }} />
              <input
                type="text"
                placeholder="Rechercher un cours..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-xl border focus:outline-none focus:ring-2 text-sm"
                style={inputStyle}
              />
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {unselectedCourses.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: theme.colors.muted }}>
                  Tous les cours sont déjà inclus ou aucun ne correspond à la recherche.
                </p>
              ) : (
                unselectedCourses.map(course => (
                  <div key={course.id} className="flex items-center justify-between p-3 rounded-xl border bg-white hover:border-blue-300 transition-colors cursor-pointer" style={{ borderColor: `${theme.colors.muted}30` }} onClick={() => toggleCourse(course.id)}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-50 text-gray-500">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: theme.colors.ink }}>{course.title}</p>
                        <p className="text-xs line-clamp-1" style={{ color: theme.colors.muted }}>{course.description}</p>
                      </div>
                    </div>
                    <button className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-blue-600">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
