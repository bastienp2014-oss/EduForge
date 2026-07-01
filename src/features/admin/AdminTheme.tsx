import { auth } from '../../services/firebase';
import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { AppTheme, useTheme, PREDEFINED_THEMES } from '../../store/useTheme';
import { useAdminTheme } from '../../store/useAdminTheme';
import { useTenant } from '../../store/useTenant';
import { Image as ImageIcon, Upload, Wand2, Save, Loader2, Info, Check, Palette } from 'lucide-react';

export default function AdminTheme() {
  const { theme: appTheme, setPersonalTheme } = useTheme();
  const { theme: adminTheme } = useAdminTheme();
  const { currentTenant } = useTenant();
  const c = adminTheme.colors;
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(appTheme);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<Record<string, string>>({});
  const fileInputRefs = {
    logo: useRef<HTMLInputElement>(null),
    homeBanner: useRef<HTMLInputElement>(null),
    villeMapBackground: useRef<HTMLInputElement>(null)
  };

  useEffect(() => {
    setCurrentTheme(appTheme);
  }, [appTheme]);

  // Load from firestore on mount
  useEffect(() => {
    const fetchTheme = async () => {
      if (!currentTenant?.id) return;
      try {
        const docRef = doc(db, 'tenants', currentTenant.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.appTheme) {
            setCurrentTheme(data.appTheme);
            setPersonalTheme(data.appTheme);
          }
        }
      } catch (e) {
        console.error("Failed to load theme from Firestore", e);
      }
    };
    fetchTheme();
  }, [currentTenant?.id, setPersonalTheme]);

  const saveToFirestore = async () => {
    if (!currentTenant?.id) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, 'tenants', currentTenant.id);
      
      // also transform to the simpler theme format expected by marketing site
      const marketingTheme = {
        primary: currentTheme.colors.primary,
        secondary: currentTheme.colors.accent,
        background: currentTheme.colors.bg,
        text: currentTheme.colors.ink,
        fontFamily: currentTheme.fonts.display.split(',')[0].replace(/['"]/g, ''),
      };

      await setDoc(docRef, {
        appTheme: currentTheme,
        theme: marketingTheme, // for the marketing site fallback
        id: currentTenant.id,
        name: currentTenant.name,
        domain: currentTenant.id
      }, { merge: true });
      
      setPersonalTheme(currentTheme);
      alert('Thème sauvegardé avec succès et appliqué à tous les utilisateurs !');
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la sauvegarde du thème.');
    } finally {
      setIsSaving(false);
    }
  };

  const applyPresetTheme = (presetId: string) => {
    const preset = PREDEFINED_THEMES.find(t => t.id === presetId);
    if (!preset) return;
    
    // Merge while preserving images
    setCurrentTheme(prev => ({
      ...preset,
      images: prev.images
    }));
  };

  const handleUpdateColor = (key: keyof AppTheme['colors'], value: string) => {
    setCurrentTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: value
      }
    }));
  };

  const handleUpdateStyle = <K extends keyof AppTheme>(key: K, value: AppTheme[K]) => {
    setCurrentTheme(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resizeAndCompressImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        } else {
          reject(new Error("Failed to get canvas context"));
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: keyof AppTheme['images']) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // 1200px max width/height to keep Base64 size under 1MB for Firestore
      const base64Str = await resizeAndCompressImage(file, 1200, 1200);
      setCurrentTheme(prev => ({
        ...prev,
        images: {
          ...prev.images,
          [key]: base64Str
        }
      }));
    } catch (err) {
      console.error(err);
      alert('Erreur lors du traitement de l\'image.');
    }
  };

  const generateWithAI = async (key: keyof AppTheme['images']) => {
    if (!prompt[key]) {
      alert("Veuillez entrer une description pour l'IA.");
      return;
    }
    setIsGenerating(key);
    try {
      let contextualPrompt = "";
      if (key === 'homeBanner') {
        contextualPrompt = "Il s'agit d'une image pour une bannière d'accueil (header). IMPORTANT: Place les éléments visuels importants sur la DROITE de l'image. Garde la moitié GAUCHE très épurée, unie ou avec un fond très doux, pour qu'on puisse y superposer du texte blanc de manière lisible.";
      } else if (key === 'villeMapBackground') {
        contextualPrompt = "Il s'agit d'une image d'arrière-plan pour une carte interactive. Le style doit être de type 'carte de jeu' ou 'illustration isométrique' avec différents points d'intérêts discrets.";
      } else if (key === 'logo') {
        contextualPrompt = "C'est un logo d'application. Le style doit être minimaliste, vectoriel, emblématique, sur fond uni, très lisible à petite taille. Un seul symbole central.";
      }

      let globalStyle = currentTheme.visualStyle?.description ? `STYLE VISUEL GLOBAL À RESPECTER ABSOLUMENT: ${currentTheme.visualStyle.description}` : '';
      let aiContextPrompt = currentTheme.aiContext ? `
        CONTEXTE ADDITIONNEL:
        Public Cible: ${currentTheme.aiContext.targetAudience || 'non spécifié'}
        Ton: ${currentTheme.aiContext.tone || 'neutre'}
        Style Artistique: ${currentTheme.aiContext.artisticStyle || 'non spécifié'}
      ` : '';
      
      const aiPrompt = `Génère une image de style application mobile. Description de l'utilisateur: ${prompt[key]}. Contexte UI: ${contextualPrompt} Utilise prioritairement ces couleurs (Palette de l'app): ${currentTheme.colors.primary}, ${currentTheme.colors.accent}, ${currentTheme.colors.bg}. ${globalStyle} ${aiContextPrompt} Pas de texte, pas de mots sur l'image.`;
      
      const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}` },
        body: JSON.stringify({ 
          prompt: aiPrompt,
          aspectRatio: key === 'homeBanner' ? "16:9" : (key === 'logo' ? "1:1" : "3:4"),
          imageReference: currentTheme.aiContext?.styleReferenceImage // Optional reference
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error("Erreur serveur: " + (data.details || data.error || response.statusText));
      
      const base64Str = `data:${data.mimeType};base64,${data.base64}`;
      setCurrentTheme(prev => ({
        ...prev,
        images: {
          ...prev.images,
          [key]: base64Str
        }
      }));
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération avec l\'IA.');
    } finally {
      setIsGenerating(null);
    }
  };

  const FONT_OPTIONS = [
    { label: 'Sora',         font: "'Sora', sans-serif" },
    { label: 'Space Grotesk',font: "'Space Grotesk', sans-serif" },
    { label: 'Outfit',       font: "'Outfit', sans-serif" },
    { label: 'Fredoka',      font: "'Fredoka', sans-serif" },
  ];
  const SIZE_OPTIONS   = [{ id:'s', label:'Petit', v:0.9 }, { id:'m', label:'Moyen', v:1 }, { id:'l', label:'Grand', v:1.12 }];
  const RADIUS_OPTIONS = [{ id:'carre', label:'Carré' }, { id:'doux', label:'Doux' }, { id:'rond', label:'Rond' }];
  const SHADOW_OPTIONS = [{ id:'plat', label:'Plat' }, { id:'doux', label:'Doux' }, { id:'prononce', label:'Prononcé' }];

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-4xl mx-auto pb-24" style={{ color: c.ink }}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: c.ink }}>Personnalisation du Thème</h2>
          <p className="text-sm" style={{ color: c.muted }}>Configurez le design global de l'application.</p>
        </div>
        <button
          onClick={saveToFirestore}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: c.primary, color: c.surface }}
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Sauvegarder Globalement
        </button>
      </div>

      {/* Themes Predéfinis */}
      <div className="p-6 rounded-2xl border shadow-sm space-y-6" style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
        <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: c.ink }}>
          <Palette className="w-5 h-5" style={{ color: c.accent }} />
          Thèmes Prédéfinis
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {PREDEFINED_THEMES.map(t => {
            const isSelected = currentTheme.id === t.id && currentTheme.name === t.name;
            return (
              <button key={t.id} onClick={() => applyPresetTheme(t.id)} className={`text-left rounded-xl overflow-hidden border-2 transition-all relative ${isSelected ? 'shadow-md scale-[1.02]' : ''}`} style={{ borderColor: isSelected ? c.primary : `color-mix(in srgb, ${c.ink} 15%, transparent)` }}>
                <div className="flex h-12">
                  <div style={{ background: t.colors.header, flex: 3 }}></div>
                  <div style={{ background: t.colors.primary, flex: 2 }}></div>
                  <div style={{ background: t.colors.accent, flex: 1 }}></div>
                </div>
                <div style={{ background: t.colors.bg, color: t.colors.ink }} className="p-3">
                  <div style={{ fontFamily: t.fonts.display }} className="font-bold text-sm truncate">{t.name}</div>
                  <div style={{ color: t.colors.muted }} className="text-xs mt-1">{t.dark ? '🌙 Sombre' : '☀️ Clair'}</div>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 rounded-full p-1 shadow-sm" style={{ backgroundColor: c.primary }}>
                    <Check className="w-3 h-3" style={{ color: c.surface }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 rounded-2xl border shadow-sm space-y-6" style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
        <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: c.ink }}>
          <Wand2 className="w-5 h-5" style={{ color: c.accent }} />
          Configuration IA & Style Visuel
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: c.ink }}>Style Visuel Global</label>
            <textarea
              value={currentTheme.visualStyle?.description || ''}
              onChange={(e) => setCurrentTheme({ ...currentTheme, visualStyle: { ...currentTheme.visualStyle, description: e.target.value } })}
              placeholder="Ex: Style 3D isométrique mignon..."
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none"
              style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 20%, transparent)`, color: c.ink }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-bold mb-1" style={{ color: c.ink }}>Public Cible</label>
               <select 
                 value={currentTheme.aiContext?.targetAudience || ''}
                 onChange={(e) => setCurrentTheme({...currentTheme, aiContext: {...currentTheme.aiContext, targetAudience: e.target.value}})}
                 className="w-full border rounded-xl px-4 py-2 text-sm outline-none"
                 style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 20%, transparent)`, color: c.ink }}
               >
                 <option value="">Choisir...</option>
                 <option value="primaire">Enfants (Primaire)</option>
                 <option value="ados">Adolescents</option>
                 <option value="adultes">Adultes</option>
                 <option value="professionnels">Professionnels</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-bold mb-1" style={{ color: c.ink }}>Style Artistique</label>
               <select 
                 value={currentTheme.aiContext?.artisticStyle || ''}
                 onChange={(e) => setCurrentTheme({...currentTheme, aiContext: {...currentTheme.aiContext, artisticStyle: e.target.value}})}
                 className="w-full border rounded-xl px-4 py-2 text-sm outline-none"
                 style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 20%, transparent)`, color: c.ink }}
               >
                 <option value="">Choisir...</option>
                 <option value="pixar">Pixar 3D</option>
                 <option value="aquarelle">Aquarelle</option>
                 <option value="flat">2D Flat Design</option>
                 <option value="pixel">Pixel Art</option>
               </select>
             </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: c.ink }}>Image de référence (pour le style)</label>
            <input 
              type="file" accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if(file) {
                  const base64 = await resizeAndCompressImage(file, 256, 256);
                  setCurrentTheme({...currentTheme, aiContext: {...currentTheme.aiContext, styleReferenceImage: base64}});
                }
              }}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {currentTheme.aiContext?.styleReferenceImage && <img src={currentTheme.aiContext.styleReferenceImage} className="w-16 h-16 mt-2 rounded-lg" />}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl border shadow-sm space-y-6" style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
        <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: c.ink }}>
          <ImageIcon className="w-5 h-5" style={{ color: c.primary }} />
          Images de fond
        </h3>

        {/* Logo */}
        <div className="space-y-4 pb-6 border-b" style={{ borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
          <div>
            <h4 className="font-bold" style={{ color: c.ink }}>Logo de l'application (logo)</h4>
            <p className="text-sm mb-2" style={{ color: c.muted }}>Image affichée dans la navigation et l'écran de chargement. Format recommandé: 1:1, Max 1 Mo (JPG/PNG/WebP).</p>
            {currentTheme.images?.logo && (
              <img src={currentTheme.images.logo} alt="Logo" className="w-24 h-24 object-cover rounded-xl mb-4 border" style={{ borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }} />
            )}
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden"
                  ref={fileInputRefs.logo}
                  onChange={(e) => handleFileUpload(e, 'logo')}
                />
                <button
                  onClick={() => fileInputRefs.logo.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-opacity hover:opacity-80"
                  style={{ backgroundColor: c.bg, color: c.ink }}
                >
                  <Upload className="w-4 h-4" />
                  Uploader
                </button>
              </div>
              
              <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: `color-mix(in srgb, ${c.accent} 10%, transparent)` }}>
                <div className="flex items-center gap-2 font-bold mb-1" style={{ color: c.accent }}>
                  <Wand2 className="w-4 h-4" />
                  Générer avec l'IA
                </div>
                <input
                  type="text"
                  placeholder="Ex: Un hibou minimaliste lisant un livre..."
                  value={prompt.logo || ''}
                  onChange={(e) => setPrompt({ ...prompt, logo: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.accent} 30%, transparent)`, color: c.ink }}
                />
                <button
                  onClick={() => generateWithAI('logo')}
                  disabled={isGenerating === 'logo'}
                  className="w-full flex justify-center items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: c.accent, color: c.surface }}
                >
                  {isGenerating === 'logo' ? <Loader2 className="w-4 h-4 animate-spin" /> : "Générer le logo"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Home Banner */}
        <div className="space-y-4 pb-6 border-b" style={{ borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
          <div>
            <h4 className="font-bold" style={{ color: c.ink }}>Bannière d'accueil (homeBanner)</h4>
            <p className="text-sm mb-2" style={{ color: c.muted }}>Image affichée dans le haut de l'écran principal. Format recommandé: 16:9, Max 1 Mo (JPG/PNG/WebP).</p>
            {currentTheme.images?.homeBanner && (
              <img src={currentTheme.images.homeBanner} alt="Home Banner" className="w-full h-48 object-cover rounded-xl mb-4 border" style={{ borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }} />
            )}
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden"
                  ref={fileInputRefs.homeBanner}
                  onChange={(e) => handleFileUpload(e, 'homeBanner')}
                />
                <button
                  onClick={() => fileInputRefs.homeBanner.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-opacity hover:opacity-80"
                  style={{ backgroundColor: c.bg, color: c.ink }}
                >
                  <Upload className="w-4 h-4" />
                  Uploader
                </button>
              </div>
              
              <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: `color-mix(in srgb, ${c.accent} 10%, transparent)` }}>
                <div className="flex items-center gap-2 font-bold mb-1" style={{ color: c.accent }}>
                  <Wand2 className="w-4 h-4" />
                  Générer avec l'IA
                </div>
                <input
                  type="text"
                  placeholder="Ex: Une forêt boréale en hiver au coucher du soleil..."
                  value={prompt.homeBanner || ''}
                  onChange={(e) => setPrompt({ ...prompt, homeBanner: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.accent} 30%, transparent)`, color: c.ink }}
                />
                <button
                  onClick={() => generateWithAI('homeBanner')}
                  disabled={isGenerating === 'homeBanner'}
                  className="w-full flex justify-center items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: c.accent, color: c.surface }}
                >
                  {isGenerating === 'homeBanner' ? <Loader2 className="w-4 h-4 animate-spin" /> : "Générer l'image"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Ville Map Background */}
        <div className="space-y-4">
          <div>
            <h4 className="font-bold" style={{ color: c.ink }}>Fond de la carte (villeMapBackground)</h4>
            <p className="text-sm mb-2" style={{ color: c.muted }}>Image de fond pour l'écran "Ma Ville". Format recommandé: Portrait, Max 1 Mo (JPG/PNG/WebP).</p>
            {currentTheme.images?.villeMapBackground && (
              <img src={currentTheme.images.villeMapBackground} alt="Ville Map" className="w-full sm:w-64 h-80 object-cover rounded-xl mb-4 border" style={{ borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }} />
            )}
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden"
                  ref={fileInputRefs.villeMapBackground}
                  onChange={(e) => handleFileUpload(e, 'villeMapBackground')}
                />
                <button
                  onClick={() => fileInputRefs.villeMapBackground.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-opacity hover:opacity-80"
                  style={{ backgroundColor: c.bg, color: c.ink }}
                >
                  <Upload className="w-4 h-4" />
                  Uploader
                </button>
              </div>
              
              <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: `color-mix(in srgb, ${c.accent} 10%, transparent)` }}>
                <div className="flex items-center gap-2 font-bold mb-1" style={{ color: c.accent }}>
                  <Wand2 className="w-4 h-4" />
                  Générer avec l'IA
                </div>
                <input
                  type="text"
                  placeholder="Ex: Une carte illustrée stylisée d'une petite ville d'automne..."
                  value={prompt.villeMapBackground || ''}
                  onChange={(e) => setPrompt({ ...prompt, villeMapBackground: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.accent} 30%, transparent)`, color: c.ink }}
                />
                <button
                  onClick={() => generateWithAI('villeMapBackground')}
                  disabled={isGenerating === 'villeMapBackground'}
                  className="w-full flex justify-center items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: c.accent, color: c.surface }}
                >
                  {isGenerating === 'villeMapBackground' ? <Loader2 className="w-4 h-4 animate-spin" /> : "Générer l'image"}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="p-6 rounded-2xl border shadow-sm space-y-6" style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
        <h3 className="text-xl font-bold" style={{ color: c.ink }}>Couleurs Principales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(currentTheme.colors).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-bold uppercase" style={{ color: c.muted }}>{key}</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={value as string}
                  onChange={(e) => handleUpdateColor(key as keyof AppTheme['colors'], e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer"
                  style={{ borderColor: `color-mix(in srgb, ${c.ink} 15%, transparent)` }}
                />
                <input
                  type="text"
                  value={value as string}
                  onChange={(e) => handleUpdateColor(key as keyof AppTheme['colors'], e.target.value)}
                  className="flex-1 border rounded px-2 text-sm font-mono uppercase outline-none"
                  style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 15%, transparent)`, color: c.ink }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-2xl border shadow-sm space-y-6" style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
        <h3 className="text-xl font-bold" style={{ color: c.ink }}>Style Visuel</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-sm font-bold" style={{ color: c.ink }}>Police des titres</label>
            <div className="flex flex-wrap gap-2">
              {FONT_OPTIONS.map(o => (
                <button 
                  key={o.label} 
                  onClick={() => setCurrentTheme(prev => ({ ...prev, fonts: { ...prev.fonts, display: o.font } }))}
                  className={`px-3 py-2 rounded-lg text-sm border-2 transition-colors`}
                  style={{ 
                    fontFamily: o.font,
                    borderColor: currentTheme.fonts?.display === o.font ? c.primary : `color-mix(in srgb, ${c.ink} 15%, transparent)`,
                    backgroundColor: currentTheme.fonts?.display === o.font ? `color-mix(in srgb, ${c.primary} 10%, transparent)` : 'transparent',
                    color: currentTheme.fonts?.display === o.font ? c.primary : c.ink,
                    fontWeight: currentTheme.fonts?.display === o.font ? 'bold' : 'normal'
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold" style={{ color: c.ink }}>Taille du texte</label>
            <div className="flex gap-2">
              {SIZE_OPTIONS.map(o => (
                <button 
                  key={o.id} 
                  onClick={() => handleUpdateStyle('scale', o.v)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold border-2 transition-colors`}
                  style={{ 
                    borderColor: currentTheme.scale === o.v ? c.primary : `color-mix(in srgb, ${c.ink} 15%, transparent)`,
                    backgroundColor: currentTheme.scale === o.v ? `color-mix(in srgb, ${c.primary} 10%, transparent)` : 'transparent',
                    color: currentTheme.scale === o.v ? c.primary : c.ink
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold" style={{ color: c.ink }}>Coins</label>
            <div className="flex gap-2">
              {RADIUS_OPTIONS.map(o => (
                <button 
                  key={o.id} 
                  onClick={() => handleUpdateStyle('radius', o.id as any)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold border-2 transition-colors`}
                  style={{ 
                    borderColor: currentTheme.radius === o.id ? c.primary : `color-mix(in srgb, ${c.ink} 15%, transparent)`,
                    backgroundColor: currentTheme.radius === o.id ? `color-mix(in srgb, ${c.primary} 10%, transparent)` : 'transparent',
                    color: currentTheme.radius === o.id ? c.primary : c.ink
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold" style={{ color: c.ink }}>Ombrage</label>
            <div className="flex gap-2">
              {SHADOW_OPTIONS.map(o => (
                <button 
                  key={o.id} 
                  onClick={() => handleUpdateStyle('shadow', o.id as any)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold border-2 transition-colors`}
                  style={{ 
                    borderColor: currentTheme.shadow === o.id ? c.primary : `color-mix(in srgb, ${c.ink} 15%, transparent)`,
                    backgroundColor: currentTheme.shadow === o.id ? `color-mix(in srgb, ${c.primary} 10%, transparent)` : 'transparent',
                    color: currentTheme.shadow === o.id ? c.primary : c.ink
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t flex flex-col gap-4" style={{ borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold" style={{ color: c.ink }}>Mode sombre par défaut</div>
              <div className="text-xs" style={{ color: c.muted }}>Si activé, le thème de base sera considéré sombre.</div>
            </div>
            <button 
              onClick={() => handleUpdateStyle('dark', !currentTheme.dark)}
              className={`px-4 py-2 rounded-lg font-bold text-sm border-2`}
              style={{ 
                borderColor: currentTheme.dark ? c.primary : `color-mix(in srgb, ${c.ink} 15%, transparent)`,
                backgroundColor: currentTheme.dark ? `color-mix(in srgb, ${c.primary} 10%, transparent)` : 'transparent',
                color: currentTheme.dark ? c.primary : c.ink
              }}
            >
              {currentTheme.dark ? 'Activé' : 'Désactivé'}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold" style={{ color: c.ink }}>Mode contrasté</div>
              <div className="text-xs" style={{ color: c.muted }}>Bordures renforcées pour plus d'accessibilité.</div>
            </div>
            <button 
              onClick={() => handleUpdateStyle('contrast', !currentTheme.contrast)}
              className={`px-4 py-2 rounded-lg font-bold text-sm border-2`}
              style={{ 
                borderColor: currentTheme.contrast ? c.primary : `color-mix(in srgb, ${c.ink} 15%, transparent)`,
                backgroundColor: currentTheme.contrast ? `color-mix(in srgb, ${c.primary} 10%, transparent)` : 'transparent',
                color: currentTheme.contrast ? c.primary : c.ink
              }}
            >
              {currentTheme.contrast ? 'Activé' : 'Désactivé'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
