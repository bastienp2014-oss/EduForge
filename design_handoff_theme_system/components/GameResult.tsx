/**
 * GameResult — Modale de fin de jeu universelle
 *
 * RÈGLE : Toujours utiliser ce composant pour l'écran de fin.
 * Ne jamais créer un écran de fin custom par jeu.
 *
 * Usage :
 *   <GameResult
 *     state="win"
 *     title="Bravo !"
 *     subtitle="Tu as trouvé tous les mots"
 *     points={150}
 *     streak={5}
 *     onReplay={() => restart()}
 *     onBack={onBack}
 *     nextLabel="Prochain défi"
 *     onNext={() => goNext()}
 *   />
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme, useThemeTokens } from '../../store/useTheme';
import GameButton from './GameButton';

interface GameResultProps {
  state: 'win' | 'lose';
  title?: string;
  subtitle?: string;
  /** Piasses / XP gagnés */
  points?: number;
  /** Série actuelle */
  streak?: number;
  onReplay: () => void;
  onBack: () => void;
  nextLabel?: string;
  onNext?: () => void;
}

export default function GameResult({
  state, title, subtitle, points, streak,
  onReplay, onBack, nextLabel, onNext,
}: GameResultProps) {
  const { theme } = useTheme();
  const { radCard, shadow, border } = useThemeTokens();
  const c = theme.colors;

  const isWin = state === 'win';
  const defaultTitle    = isWin ? 'Bravo !' : 'Pas de chance…';
  const defaultSubtitle = isWin ? 'Continue comme ça !' : 'Réessaie, tu vas y arriver !';
  const emoji           = isWin ? '🎉' : '😅';
  const accentColor     = isWin ? c.success : c.danger;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          padding: '0 16px 24px',
        }}
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          style={{
            width: '100%', maxWidth: 440,
            background: c.surface,
            borderRadius: radCard,
            boxShadow: shadow,
            border: `1px solid ${border}`,
            padding: 24, overflow: 'hidden',
          }}
        >
          {/* Bande colorée */}
          <div style={{ height: 5, background: accentColor, margin: '-24px -24px 20px', borderRadius: `${radCard} ${radCard} 0 0` }} />

          {/* Emoji + titre */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 8 }}>{emoji}</div>
            <div style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: `${22 * theme.scale}px`, color: c.ink }}>
              {title || defaultTitle}
            </div>
            <div style={{ fontFamily: theme.fonts.body, fontSize: `${13 * theme.scale}px`, color: c.muted, marginTop: 4 }}>
              {subtitle || defaultSubtitle}
            </div>
          </div>

          {/* Stats */}
          {(points != null || streak != null) && (
            <div style={{
              display: 'flex', gap: 12, marginBottom: 20,
              background: c.bg, borderRadius: 12, padding: '12px 16px',
              border: `1px solid ${border}`,
            }}>
              {points != null && (
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 22, color: c.gold }}>
                    +{points}
                  </div>
                  <div style={{ fontSize: 11, color: c.muted, fontWeight: 600 }}>piasses</div>
                </div>
              )}
              {streak != null && streak > 0 && (
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 22, color: c.primary }}>
                    🔥 {streak}
                  </div>
                  <div style={{ fontSize: 11, color: c.muted, fontWeight: 600 }}>série</div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {onNext && nextLabel && (
              <GameButton variant="primary" size="lg" fullWidth onPress={onNext}>
                {nextLabel}
              </GameButton>
            )}
            <GameButton variant="secondary" size="md" fullWidth onPress={onReplay}>
              Rejouer
            </GameButton>
            <GameButton variant="ghost" size="sm" fullWidth onPress={onBack}>
              Retour à l'accueil
            </GameButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
