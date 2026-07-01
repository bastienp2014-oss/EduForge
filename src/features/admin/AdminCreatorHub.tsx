import React, { useState, useEffect } from 'react';
import { useAdminTheme } from '../../store/useAdminTheme';
import { useTenant } from '../../store/useTenant';
import { useCreatorHub } from '../../store/useCreatorHub';
import { Course, Bundle } from '../../types';
import { BookOpen, Package, Plus, Edit2, Trash2, Tag, Layers, Search } from 'lucide-react';
import AdminCourseEditor from './AdminCourseEditor';
import AdminBundleEditor from './AdminBundleEditor';

export default function AdminCreatorHub() {
  const { theme } = useAdminTheme();
  const { currentTenant } = useTenant();
  
  const courses = useCreatorHub(s => s.courses);
  const bundles = useCreatorHub(s => s.bundles);
  const isLoading = useCreatorHub(s => s.isLoading);
  const fetchData = useCreatorHub(s => s.fetchData);
  const createCourse = useCreatorHub(s => s.createCourse);
  const updateCourse = useCreatorHub(s => s.updateCourse);
  const deleteCourse = useCreatorHub(s => s.deleteCourse);
  const createBundle = useCreatorHub(s => s.createBundle);
  const updateBundle = useCreatorHub(s => s.updateBundle);
  const deleteBundle = useCreatorHub(s => s.deleteBundle);
  
  const [activeTab, setActiveTab] = useState<'courses' | 'bundles'>('courses');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingCourse, setEditingCourse] = useState<Course | 'new' | null>(null);
  const [editingBundle, setEditingBundle] = useState<Bundle | 'new' | null>(null);

  useEffect(() => {
    if (currentTenant?.id) {
      fetchData(currentTenant.id);
    }
  }, [currentTenant?.id, fetchData]);

  const cardStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.surface,
  };

  const filteredCourses = courses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredBundles = bundles.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (editingCourse) {
    return (
      <AdminCourseEditor 
        course={editingCourse === 'new' ? null : editingCourse} 
        onSave={async (data) => {
          if (editingCourse === 'new') {
            if (!currentTenant?.id) return;
            await createCourse({ ...data, tenantId: currentTenant.id } as any);
          } else {
            await updateCourse(editingCourse.id, data);
          }
        }}
        onClose={() => setEditingCourse(null)} 
      />
    );
  }

  if (editingBundle) {
    return (
      <AdminBundleEditor 
        bundle={editingBundle === 'new' ? null : editingBundle} 
        availableCourses={courses}
        onSave={async (data) => {
          if (editingBundle === 'new') {
            if (!currentTenant?.id) return;
            await createBundle({ ...data, tenantId: currentTenant.id } as any);
          } else {
            await updateBundle(editingBundle.id, data);
          }
        }}
        onClose={() => setEditingBundle(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: theme.colors.ink }}>
            Espace Créateur
          </h2>
          <p className="text-sm" style={{ color: theme.colors.muted }}>
            Créez vos cours et assemblez-les en packs (bundles) pour vos apprenants.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => activeTab === 'courses' ? setEditingCourse('new') : setEditingBundle('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all hover:opacity-90 text-white"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Plus className="w-5 h-5" />
            Nouveau {activeTab === 'courses' ? 'Cours' : 'Bundle'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit" style={{ backgroundColor: theme.colors.surface }}>
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'courses' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
            }`}
            style={{ 
              backgroundColor: activeTab === 'courses' ? theme.colors.surface : 'transparent',
              color: theme.colors.ink
            }}
          >
            <BookOpen className="w-4 h-4" />
            Mes Cours ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('bundles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'bundles' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
            }`}
            style={{ 
              backgroundColor: activeTab === 'bundles' ? theme.colors.surface : 'transparent',
              color: theme.colors.ink
            }}
          >
            <Package className="w-4 h-4" />
            Mes Bundles ({bundles.length})
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.colors.muted }} />
          <input
            type="text"
            placeholder={`Rechercher un ${activeTab === 'courses' ? 'cours' : 'bundle'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.surface,
              color: theme.colors.ink
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'courses' && filteredCourses.map((course) => (
            <div key={course.id} className="rounded-3xl p-6 border flex flex-col group relative overflow-hidden" style={cardStyle}>
              <div className="flex justify-between items-start mb-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: `${theme.colors.primary}15`, color: theme.colors.primary }}
                >
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                  course.status === 'published' 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                }`}>
                  {course.status === 'published' ? 'Publié' : 'Brouillon'}
                </span>
              </div>
              
              <h3 className="text-lg font-bold mb-2 line-clamp-1" style={{ color: theme.colors.ink }}>
                {course.title}
              </h3>
              <p className="text-sm mb-6 flex-1 line-clamp-2" style={{ color: theme.colors.muted }}>
                {course.description}
              </p>

              <div className="pt-4 border-t flex justify-between items-center" style={{ borderColor: theme.colors.surface }}>
                <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: theme.colors.muted }}>
                  <Layers className="w-4 h-4" />
                  Dernière modif: {new Date(course.updatedAt).toLocaleDateString()}
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingCourse(course)}
                    className="p-2 rounded-lg hover:bg-black/5 transition-colors" 
                    style={{ color: theme.colors.primary }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('Confirmer la suppression ?')) {
                        deleteCourse(course.id);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'bundles' && filteredBundles.map((bundle) => (
            <div key={bundle.id} className="rounded-3xl p-6 border flex flex-col group relative overflow-hidden" style={cardStyle}>
              <div className="flex justify-between items-start mb-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: `${theme.colors.secondary || '#8b5cf6'}15`, color: theme.colors.secondary || '#8b5cf6' }}
                >
                  <Package className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {bundle.courseIds.length} Cours
                </span>
              </div>
              
              <h3 className="text-lg font-bold mb-2 line-clamp-1" style={{ color: theme.colors.ink }}>
                {bundle.title}
              </h3>
              <p className="text-sm mb-6 flex-1 line-clamp-2" style={{ color: theme.colors.muted }}>
                {bundle.description}
              </p>

              <div className="pt-4 border-t flex justify-between items-center" style={{ borderColor: theme.colors.surface }}>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingBundle(bundle)}
                    className="p-2 rounded-lg hover:bg-black/5 transition-colors" 
                    style={{ color: theme.colors.primary }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('Confirmer la suppression ?')) {
                        deleteBundle(bundle.id);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Card for creation */}
          <button
            onClick={() => activeTab === 'courses' ? setEditingCourse('new') : setEditingBundle('new')}
            className="rounded-3xl p-6 border-2 border-dashed flex flex-col items-center justify-center text-center gap-4 transition-all hover:border-solid hover:shadow-md"
            style={{ 
              borderColor: theme.colors.surface,
              backgroundColor: `${theme.colors.surface}30`,
            }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${theme.colors.primary}15`, color: theme.colors.primary }}
            >
              <Plus className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold mb-1" style={{ color: theme.colors.ink }}>
                Créer un {activeTab === 'courses' ? 'nouveau cours' : 'nouveau bundle'}
              </h3>
              <p className="text-xs" style={{ color: theme.colors.muted }}>
                {activeTab === 'courses' 
                  ? 'Assemblez des modules et leçons.'
                  : 'Regroupez plusieurs cours en un seul produit.'}
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
