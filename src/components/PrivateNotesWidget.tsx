import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, ChevronDown, ChevronUp, Save, Loader2, CheckCircle, Edit3, AlertCircle, X } from 'lucide-react';
import { useNotes } from '../store/useNotes';
import { useColors, useThemeTokens } from '../store/useTheme';

export default function PrivateNotesWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const colors = useColors();
  const tokens = useThemeTokens();

  const {
    noteText,
    chargerNotes,
    setNoteTextLocally,
    sauvegarderNotes,
    isSaving,
    lastUpdated,
    isLoading,
    error,
    clearError
  } = useNotes();

  const [localText, setLocalText] = useState(noteText);
  const lastSavedText = useRef(noteText);

  // Charger les notes au montage du composant
  useEffect(() => {
    chargerNotes();
  }, []);

  // Synchroniser la valeur locale quand le store est chargé (si mis à jour de l'extérieur)
  useEffect(() => {
    if (noteText !== lastSavedText.current) {
      setLocalText(noteText);
      lastSavedText.current = noteText;
    }
  }, [noteText]);

  // Sauvegarde debouncée de 1000ms
  useEffect(() => {
    if (localText === noteText) return;

    const timer = setTimeout(() => {
      lastSavedText.current = localText;
      setNoteTextLocally(localText);
      sauvegarderNotes(localText);
    }, 1000);

    return () => clearTimeout(timer);
  }, [localText, noteText, sauvegarderNotes, setNoteTextLocally]);

  // Formatter la date de dernière mise à jour
  const formatTime = (isoString: string | null) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="notes-panel-container"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-80 md:w-96 shadow-2xl border flex flex-col mb-4 overflow-hidden pointer-events-auto"
            style={{
              backgroundColor: colors.surface,
              borderColor: tokens.border,
              borderRadius: tokens.radCard,
              boxShadow: tokens.shadow,
            }}
          >
            {/* Header du widget */}
            <div
              id="notes-panel-header"
              className="px-4 py-3 flex items-center justify-between border-b"
              style={{
                backgroundColor: colors.header,
                borderColor: tokens.border,
                color: colors.surface,
              }}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 opacity-90" style={{ color: colors.primary }} />
                <span className="font-bold tracking-tight text-[15px]" style={{ fontFamily: 'var(--font-display)' }}>
                  Notes de cours
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Indicateur de sauvegarde */}
                <div className="text-xs flex items-center gap-1.5 opacity-90">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Chargement...</span>
                    </>
                  ) : isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Sauvegarde...</span>
                    </>
                  ) : lastUpdated ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] opacity-80">Enregistré à {formatTime(lastUpdated)}</span>
                    </>
                  ) : (
                    <span className="text-[10px] opacity-70">Prêt</span>
                  )}
                </div>

                <button
                  id="btn-collapse-notes"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Réduire"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Corps du widget / Textarea */}
            <div id="notes-panel-body" className="p-3 flex flex-col gap-2 relative">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-2 rounded-md text-xs mb-1"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="flex-1 leading-snug">{error}</span>
                    <button onClick={clearError} className="p-0.5 hover:bg-red-500/20 rounded-md transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <textarea
                id="textarea-student-notes"
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                placeholder="Prends des annotations sur tes cours ici... (sauvegarde automatique active)"
                className="w-full h-44 resize-none p-3 text-sm focus:outline-none transition-all leading-relaxed"
                style={{
                  backgroundColor: colors.bg,
                  color: colors.ink,
                  borderRadius: tokens.radBtn,
                  border: `1px solid ${tokens.border}`,
                  fontFamily: 'var(--font-body)',
                }}
                disabled={isLoading}
              />
              <div className="flex items-center justify-between text-[10px] px-1" style={{ color: colors.muted }}>
                <span>{localText.length} caractères</span>
                <span className="flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> Espace Privé
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton flotteur de déclenchement */}
      <motion.button
        id="btn-toggle-notes-trigger"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="pointer-events-auto p-4 rounded-full shadow-lg flex items-center justify-center relative cursor-pointer group transition-all"
        style={{
          backgroundColor: colors.primary,
          color: colors.surface,
          boxShadow: tokens.shadow,
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="open-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="closed-icon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <FileText className="w-6 h-6" />
              {/* Badge si notes existantes */}
              {noteText.trim() && (
                <span
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white"
                  style={{ backgroundColor: colors.success }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tooltip on hover (uncollapsed only) */}
        {!isOpen && (
          <span
            className="absolute right-16 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md border pointer-events-none"
            style={{
              backgroundColor: colors.surface,
              color: colors.ink,
              borderColor: tokens.border,
            }}
          >
            Prendre des notes
          </span>
        )}
      </motion.button>
    </div>
  );
}
