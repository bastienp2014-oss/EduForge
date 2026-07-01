/**
 * ApparenceScreen.jsx — Écran de personnalisation du thème
 * Mots & Blocs
 *
 * INTÉGRATION :
 *   cp ApparenceScreen.jsx src/features/apparence/ApparenceScreen.jsx
 *
 * DÉPENDANCES :
 *   - useTheme (src/store/useTheme.js) — ce paquet
 *   - GameHUD  (src/components/GameHUD.jsx) — ce paquet
 *   - lucide-react (déjà installé)
 *   - Google Fonts : Sora, Space Grotesk, Fredoka, Outfit (dans index.html)
 *
 * USAGE dans App.jsx / App.tsx :
 *   import ApparenceScreen from './features/apparence/ApparenceScreen';
 *   {currentScreen === 'apparence' && <ApparenceScreen onBack={() => navigateTo('home')} />}
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, Palette, Sliders, Clock } from 'lucide-react';
import { useTheme, useThemeTokens, PREDEFINED_THEMES } from '../../store/useTheme';

// ─── Constantes ────────────────────────────────────────────────────────────────

const PRIMARY_SWATCHES = ['#C75B39','#2D7A4F','#2B5AA0','#7C3AED','#D946EF','#E8A020','#1A6FA0','#A0522D','#C03060','#00D4FF'];
const ACCENT_SWATCHES  = ['#3E5C8A','#C75B39','#E05C2A','#EC4899','#06B6D4','#C0392B','#8B0000','#FFD700','#FF9A5C','#22C55E'];
const FONT_OPTIONS = [
  { label: 'Sora',         font: "'Sora', sans-serif" },
  { label: 'Space Grotesk',font: "'Space Grotesk', sans-serif" },
  { label: 'Outfit',       font: "'Outfit', sans-serif" },
  { label: 'Fredoka',      font: "'Fredoka', sans-serif" },
];
const SIZE_OPTIONS   = [{ id:'s', label:'Petit', v:0.9 }, { id:'m', label:'Moyen', v:1 }, { id:'l', label:'Grand', v:1.12 }];
const RADIUS_OPTIONS = [{ id:'carre', label:'Carré' }, { id:'doux', label:'Doux' }, { id:'rond', label:'Rond' }];
const SHADOW_OPTIONS = [{ id:'plat', label:'Plat' }, { id:'doux', label:'Doux' }, { id:'prononce', label:'Prononcé' }];
const CB_OPTIONS     = [
  { id:'normal', label:'Normal' }, { id:'protan', label:'Protanopie' },
  { id:'deutan', label:'Deutéranopie' }, { id:'tritan', label:'Tritanopie' }, { id:'mono', label:'Monochrome' },
];
const CB_FILTERS = {
  normal:'none', protan:'sepia(0.3) hue-rotate(35deg) saturate(0.85)',
  deutan:'sepia(0.3) saturate(0.5)', tritan:'sepia(0.3) hue-rotate(-60deg) saturate(0.7)', mono:'grayscale(1)',
};

// ─── Composant principal ───────────────────────────────────────────────────────

export default function ApparenceScreen({ onBack }) {
  const { theme, setThemeById, patchPersonal } = useTheme();
  const tokens = useThemeTokens();
  const c = theme.colors;

  const [customizing, setCustomizing]   = useState(false);
  const [previewTab,  setPreviewTab]    = useState('accueil');
  const [cbMode,      setCbMode]        = useState('normal');
  const [autoMode,    setAutoMode]      = useState(false);
  const [history,     setHistory]       = useState([]);
  const [section,     setSection]       = useState('gallery'); // 'gallery' | 'customize'

  // Applique mode auto au montage
  useEffect(() => {
    if (autoMode) {
      const dark = window.matchMedia('(prefers-color-scheme:dark)').matches;
      setThemeById(dark ? 'minuit' : 'automne');
    }
  }, [autoMode]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function applyTheme(id) {
    setThemeById(id);
    pushHistory(id);
  }

  function pushHistory(id) {
    setHistory(prev => [id, ...prev.filter(x => x !== id)].slice(0, 5));
  }

  function openCustomizer() {
    if (!useTheme.getState().personalTheme) {
      patchPersonal({}); // Clone le thème actif en thème personnel
    }
    setCustomizing(true);
    setSection('customize');
  }

  async function openEyedropper(slot) {
    if (!window.EyeDropper) {
      alert("La pipette n'est pas supportée par ce navigateur.");
      return;
    }
    try {
      const e = new EyeDropper();
      const r = await e.open();
      patchPersonal({ colors: { ...theme.colors, [slot]: r.sRGBHex } });
    } catch (err) {}
  }

  function handleHexInput(slot, value) {
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      patchPersonal({ colors: { ...theme.colors, [slot]: value } });
    }
  }

  // ── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100svh', background: c.bg, color: c.ink,
    }}>
      {/* HUD */}
      <div style={{
        background: c.header, padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.16)', display: 'grid', placeItems: 'center',
        }}>
          <ArrowLeft size={18} color="#fff" />
        </button>
        <span style={{ fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 16, color: '#fff' }}>
          Apparence
        </span>
        <div style={{ width: 38 }} />
      </div>

      {/* Tabs galerie / perso */}
      <div style={{
        display: 'flex', background: c.surface,
        borderBottom: `1px solid ${tokens.border}`, padding: '0 16px',
      }}>
        {[
          { id: 'gallery',   label: 'Thèmes',        icon: <Palette size={14} /> },
          { id: 'customize', label: 'Personnaliser',  icon: <Sliders size={14} /> },
          { id: 'history',   label: 'Récents',        icon: <Clock size={14} /> },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setSection(tab.id); if (tab.id === 'customize') openCustomizer(); }}
            style={{
              flex: 1, border: 'none', cursor: 'pointer', padding: '12px 0',
              background: 'none',
              borderBottom: section === tab.id ? `2px solid ${c.primary}` : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 12,
              color: section === tab.id ? c.primary : c.muted,
              transition: 'color 0.15s',
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* ── GALERIE ─────────────────────────────────────────────── */}
        {section === 'gallery' && (
          <>
            {/* Aperçu */}
            <PreviewCard
              theme={theme} tokens={tokens} tab={previewTab}
              setTab={setPreviewTab} cbFilter={CB_FILTERS[cbMode]}
            />

            {/* Grille de thèmes */}
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: c.muted, margin: '20px 0 10px' }}>
              Thèmes prédéfinis
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {PREDEFINED_THEMES.map(t => (
                <ThemeCard
                  key={t.id} t={t}
                  selected={theme.id === t.id}
                  onPick={() => applyTheme(t.id)}
                  displayFont={t.fonts.display}
                />
              ))}
            </div>
          </>
        )}

        {/* ── PERSONNALISER ─────────────────────────────────────── */}
        {section === 'customize' && (
          <CustomizePanel
            theme={theme} tokens={tokens}
            onPatch={patchPersonal}
            onHexInput={handleHexInput}
            onEyedropper={openEyedropper}
            cbMode={cbMode} setCbMode={setCbMode}
            autoMode={autoMode} setAutoMode={setAutoMode}
            previewTab={previewTab} setPreviewTab={setPreviewTab}
            cbFilter={CB_FILTERS[cbMode]}
          />
        )}

        {/* ── RÉCENTS ───────────────────────────────────────────── */}
        {section === 'history' && (
          <HistoryPanel
            history={history} theme={theme} tokens={tokens}
            onPick={(id) => applyTheme(id)}
          />
        )}

      </div>

      {/* Bouton Appliquer */}
      <div style={{ padding: '12px 16px', background: c.surface, borderTop: `1px solid ${tokens.border}` }}>
        <button
          onClick={() => pushHistory(theme.id)}
          style={{
            width: '100%', border: 'none', cursor: 'pointer',
            background: c.primary, color: '#fff',
            fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 15,
            padding: 14, borderRadius: tokens.radBtn,
            boxShadow: tokens.shadow,
          }}>
          Appliquer ce thème
        </button>
      </div>
    </div>
  );
}

// ─── Aperçu en direct ──────────────────────────────────────────────────────────

function PreviewCard({ theme, tokens, tab, setTab, cbFilter }) {
  const c = theme.colors;
  const tabs = [
    { id: 'accueil', label: 'Accueil' },
    { id: 'jeu',     label: 'Jeu' },
    { id: 'commerce',label: 'Commerce' },
  ];
  return (
    <div>
      {/* Tabs aperçu */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: c.muted, letterSpacing: '.05em', textTransform: 'uppercase' }}>Aperçu</span>
        <div style={{ display: 'flex', gap: 5 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              border: `1px solid ${tokens.border}`, cursor: 'pointer',
              background: tab === t.id ? c.primary : c.surface,
              color: tab === t.id ? '#fff' : c.muted,
              borderRadius: 999, padding: '4px 10px',
              fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 10,
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Cadre mobile */}
      <div style={{
        borderRadius: 22, overflow: 'hidden', border: `1px solid ${tokens.border}`,
        boxShadow: '0 8px 24px rgba(0,0,0,.12)', filter: cbFilter,
      }}>
        {/* HUD mini */}
        <div style={{ background: c.header, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'grid', placeItems: 'center' }}>
            <span style={{ color: '#fff', fontSize: 12 }}>←</span>
          </div>
          <span style={{ fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 13, color: '#fff' }}>Mots & Blocs</span>
          <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 999, padding: '3px 9px', display: 'flex', gap: 4 }}>
            <span style={{ fontSize: 11 }}>⚜️</span>
            <span style={{ fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 11, color: c.gold }}>320</span>
          </div>
        </div>

        {/* Contenu selon tab */}
        <div style={{ background: c.bg, padding: 14 }}>
          {tab === 'accueil' && (
            <div style={{
              background: c.surface, border: `1px solid ${tokens.border}`,
              borderRadius: tokens.radCard, padding: 14, boxShadow: tokens.shadow,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 15, color: c.ink }}>Mots du Québec</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: c.accent, padding: '3px 8px', borderRadius: 999 }}>NIV 4</span>
              </div>
              <p style={{ fontFamily: theme.fonts.body, fontSize: 12, color: c.muted, margin: '0 0 12px', lineHeight: 1.4 }}>
                Relie les expressions typiques d'icitte pis gagne des piasses.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ flex: 1, border: 'none', background: c.primary, color: '#fff', fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 12, padding: 10, borderRadius: tokens.radBtn, cursor: 'pointer' }}>Jouer</button>
                <button style={{ border: `1px solid ${tokens.border}`, background: c.surface, color: c.ink, fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 12, padding: '10px 14px', borderRadius: tokens.radBtn, cursor: 'pointer' }}>Infos</button>
              </div>
            </div>
          )}
          {tab === 'jeu' && (
            <div style={{ background: c.surface, border: `1px solid ${tokens.border}`, borderRadius: tokens.radCard, padding: 14, boxShadow: tokens.shadow }}>
              <div style={{ fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 14, color: c.ink, marginBottom: 4 }}>Le Pendu</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 20, color: c.ink, margin: '10px 0', letterSpacing: '.06em' }}>
                <span>C</span><span style={{color:c.muted}}>_</span><span>P</span><span style={{color:c.muted}}>_</span><span>T</span><span style={{color:c.muted}}>_</span><span>R</span>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                {['C','D','F','G'].map((l,i) => (
                  <span key={l} style={{
                    width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center',
                    fontWeight: 700, fontSize: 11,
                    background: i===0 ? c.success : i===2 ? c.danger : c.surface,
                    border: i===0||i===2 ? 'none' : `1px solid ${tokens.border}`,
                    color: i===0||i===2 ? '#fff' : c.ink,
                  }}>{l}</span>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>❤️❤️🤍</div>
                <span style={{ fontFamily: theme.fonts.display, fontSize: 11, fontWeight: 700, color: c.muted }}>320 XP</span>
              </div>
            </div>
          )}
          {tab === 'commerce' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['🥛','Pinte de lait','3,50 $'],['🍞','Miche de pain','4,50 $']].map(([emoji,name,price]) => (
                <div key={name} style={{
                  background: c.surface, border: `1px solid ${tokens.border}`,
                  borderRadius: tokens.radCard, padding: '10px 12px', boxShadow: tokens.shadow,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 24 }}>{emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 12, color: c.ink }}>{name}</div>
                    <div style={{ fontSize: 10, color: c.muted }}>Dépanneur</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: c.muted, fontWeight: 600 }}>{price}</div>
                    <button style={{ border: 'none', background: c.primary, color: '#fff', fontWeight: 700, fontSize: 9, padding: '4px 8px', borderRadius: 7, cursor: 'pointer', marginTop: 3 }}>Acheter</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Carte de thème ────────────────────────────────────────────────────────────

function ThemeCard({ t, selected, onPick, displayFont }) {
  return (
    <button onClick={onPick} style={{
      border: selected ? `2px solid ${t.colors.primary}` : '1px solid rgba(0,0,0,0.08)',
      borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
      background: '#fff', textAlign: 'left', padding: 0, position: 'relative',
    }}>
      {/* Bande de couleurs */}
      <div style={{ height: 36, display: 'flex' }}>
        <div style={{ flex: 3, background: t.colors.header }} />
        <div style={{ flex: 2, background: t.colors.primary }} />
        <div style={{ flex: 1, background: t.colors.accent }} />
      </div>
      <div style={{ padding: '8px 10px', background: t.colors.bg }}>
        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 12, color: t.colors.ink }}>{t.name}</div>
        <div style={{ fontSize: 10, color: t.colors.muted, marginTop: 2 }}>{t.dark ? '🌙 Sombre' : '☀️ Clair'}</div>
      </div>
      {selected && (
        <div style={{
          position: 'absolute', top: 6, right: 6, width: 20, height: 20,
          borderRadius: '50%', background: t.colors.primary,
          display: 'grid', placeItems: 'center',
        }}>
          <Check size={12} color="#fff" />
        </div>
      )}
    </button>
  );
}

// ─── Panneau personnalisation ─────────────────────────────────────────────────

function CustomizePanel({
  theme, tokens, onPatch, onHexInput, onEyedropper,
  cbMode, setCbMode, autoMode, setAutoMode,
  previewTab, setPreviewTab, cbFilter,
}) {
  const c = theme.colors;

  function patch(field, value) {
    if (field === 'colors') onPatch({ colors: { ...c, ...value } });
    else onPatch({ [field]: value });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Aperçu */}
      <PreviewCard theme={theme} tokens={tokens} tab={previewTab} setTab={setPreviewTab} cbFilter={cbFilter} />

      <div style={{
        marginTop: 16, background: c.surface, borderRadius: 18,
        border: `1px solid ${tokens.border}`, padding: 18,
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>

        {/* Info thème de base */}
        {theme.baseName && (
          <div style={{ fontSize: 11, color: c.muted, fontWeight: 500, fontStyle: 'italic' }}>
            Basé sur {theme.baseName} · Mon thème personnel
          </div>
        )}

        {/* Couleur principale */}
        <Section label="Couleur principale">
          <SwatchRow swatches={PRIMARY_SWATCHES} current={c.primary} onPick={v => patch('colors', { primary: v })} />
          <HexPicker value={c.primary} slot="primary" onInput={onHexInput} onEyedropper={onEyedropper} theme={theme} tokens={tokens} />
        </Section>

        {/* Couleur accent */}
        <Section label="Couleur d'accent">
          <SwatchRow swatches={ACCENT_SWATCHES} current={c.accent} onPick={v => patch('colors', { accent: v })} />
          <HexPicker value={c.accent} slot="accent" onInput={onHexInput} onEyedropper={onEyedropper} theme={theme} tokens={tokens} />
        </Section>

        {/* Police */}
        <Section label="Police des titres">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FONT_OPTIONS.map(o => (
              <button key={o.label} onClick={() => patch('fonts', { ...theme.fonts, display: o.font })} style={{
                border: `2px solid ${theme.fonts.display === o.font ? c.primary : tokens.border}`,
                background: theme.fonts.display === o.font ? '#f0f0f4' : c.surface,
                borderRadius: 10, padding: '7px 12px', cursor: 'pointer',
                fontFamily: o.font, fontWeight: 700, fontSize: 13, color: c.ink,
              }}>{o.label}</button>
            ))}
          </div>
        </Section>

        {/* Taille du texte */}
        <Section label="Taille du texte">
          <SegmentedButtons
            options={SIZE_OPTIONS} current={theme.scale}
            getId={o => o.v} getLabel={o => o.label}
            onPick={o => patch('scale', o.v)}
            c={c} tokens={tokens} theme={theme}
          />
        </Section>

        {/* Coins */}
        <Section label="Coins">
          <SegmentedButtons
            options={RADIUS_OPTIONS} current={theme.radius}
            getId={o => o.id} getLabel={o => o.label}
            onPick={o => patch('radius', o.id)}
            c={c} tokens={tokens} theme={theme}
          />
        </Section>

        {/* Ombrage */}
        <Section label="Ombrage">
          <SegmentedButtons
            options={SHADOW_OPTIONS} current={theme.shadow}
            getId={o => o.id} getLabel={o => o.label}
            onPick={o => patch('shadow', o.id)}
            c={c} tokens={tokens} theme={theme}
          />
        </Section>

        {/* Ambiance */}
        <Section label="Ambiance">
          <SegmentedButtons
            options={[{id:false,label:'Clair'},{id:true,label:'Sombre'}]}
            current={theme.dark}
            getId={o => o.id} getLabel={o => o.label}
            onPick={o => patch('dark', o.id)}
            c={c} tokens={tokens} theme={theme}
          />
        </Section>

        {/* Mode contrasté */}
        <ToggleRow
          label="Mode contrasté"
          subtitle="Bordures renforcées (accessibilité)"
          value={theme.contrast}
          onToggle={() => patch('contrast', !theme.contrast)}
          c={c} tokens={tokens} theme={theme}
        />

        {/* Simulation daltonisme */}
        <div style={{ paddingTop: 14, borderTop: `1px solid ${tokens.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: c.muted, marginBottom: 8 }}>
            Simulation daltonisme <span style={{ fontWeight: 500, fontStyle: 'italic' }}>(aperçu uniquement)</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {CB_OPTIONS.map(o => (
              <button key={o.id} onClick={() => setCbMode(o.id)} style={{
                cursor: 'pointer',
                border: `2px solid ${cbMode === o.id ? c.primary : tokens.border}`,
                borderRadius: 10, padding: '6px 10px',
                background: cbMode === o.id ? '#f0f0f4' : c.surface,
                color: c.ink, fontWeight: 700, fontSize: 11,
              }}>{o.label}</button>
            ))}
          </div>
        </div>

        {/* Mode auto jour/nuit */}
        <ToggleRow
          label="Mode auto Jour/Nuit"
          subtitle="Suit les préférences système (clair/sombre)"
          value={autoMode}
          onToggle={() => setAutoMode(v => !v)}
          c={c} tokens={tokens} theme={theme}
        />
      </div>
    </div>
  );
}

// ─── Panneau historique ────────────────────────────────────────────────────────

function HistoryPanel({ history, theme, tokens, onPick }) {
  const c = theme.colors;
  if (history.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: c.muted }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🕐</div>
        <div style={{ fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 14 }}>Aucun historique</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Applique un thème pour le voir apparaître ici.</div>
      </div>
    );
  }
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: c.muted, marginBottom: 10 }}>
        Récemment utilisés
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {history.map(id => {
          const t = PREDEFINED_THEMES.find(x => x.id === id);
          if (!t) return null;
          return (
            <button key={id} onClick={() => onPick(id)} style={{
              border: `1px solid ${tokens.border}`, borderRadius: 14, overflow: 'hidden',
              cursor: 'pointer', background: c.surface, textAlign: 'left', padding: 0,
              display: 'flex', alignItems: 'stretch',
            }}>
              <div style={{ width: 48, background: t.colors.header }} />
              <div style={{ flex: 1, padding: '10px 14px' }}>
                <div style={{ fontFamily: t.fonts.display, fontWeight: 700, fontSize: 13, color: c.ink }}>{t.name}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
                  {[t.colors.primary, t.colors.accent, t.colors.success].map((col,i) => (
                    <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: col }} />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sous-composants utilitaires ───────────────────────────────────────────────

function Section({ label, children }) {
  return (
    <div style={{ paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function SwatchRow({ swatches, current, onPick }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 8 }}>
      {swatches.map(color => (
        <button key={color} onClick={() => onPick(color)} style={{
          width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
          background: color,
          border: `3px solid ${current === color ? '#1d1d24' : 'transparent'}`,
          boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        }} />
      ))}
    </div>
  );
}

function HexPicker({ value, slot, onInput, onEyedropper, theme, tokens }) {
  const inputRef = useRef(null);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="color"
        defaultValue={value}
        onChange={e => onInput(slot, e.target.value)}
        style={{ width: 34, height: 34, borderRadius: '50%', border: `2px solid ${tokens.border}`, cursor: 'pointer', padding: 2, background: 'none', flexShrink: 0 }}
      />
      <input
        ref={inputRef}
        type="text"
        placeholder={value}
        defaultValue={value}
        onKeyDown={e => e.key === 'Enter' && onInput(slot, e.target.value)}
        onBlur={e => onInput(slot, e.target.value)}
        style={{
          flex: 1, border: `1px solid ${tokens.border}`, borderRadius: 9,
          padding: '7px 10px', fontSize: 12, fontFamily: 'monospace',
          color: theme.colors.ink, background: theme.colors.surface,
        }}
      />
      <button
        onClick={() => onEyedropper(slot)}
        title="Pipette — sélectionne une couleur à l'écran"
        style={{
          width: 34, height: 34, border: `1px solid ${tokens.border}`,
          borderRadius: 9, background: theme.colors.surface,
          cursor: 'pointer', fontSize: 16, display: 'grid', placeItems: 'center',
        }}>
        🔬
      </button>
    </div>
  );
}

function SegmentedButtons({ options, current, getId, getLabel, onPick, c, tokens, theme }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map(o => {
        const active = getId(o) === current;
        return (
          <button key={String(getId(o))} onClick={() => onPick(o)} style={{
            flex: 1, cursor: 'pointer',
            border: `2px solid ${active ? '#1d1d24' : tokens.border}`,
            borderRadius: 12, padding: '8px 4px',
            background: active ? '#f0f0f4' : c.surface,
            color: c.ink, fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 12,
          }}>
            {getLabel(o)}
          </button>
        );
      })}
    </div>
  );
}

function ToggleRow({ label, subtitle, value, onToggle, c, tokens, theme }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      paddingTop: 14, borderTop: `1px solid ${tokens.border}`,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: c.ink }}>{label}</div>
        {subtitle && <div style={{ fontSize: 10.5, color: c.muted, marginTop: 2 }}>{subtitle}</div>}
      </div>
      <button onClick={onToggle} style={{
        cursor: 'pointer',
        border: `2px solid ${value ? '#1d1d24' : tokens.border}`,
        background: value ? c.primary : c.surface,
        color: value ? '#fff' : c.ink,
        borderRadius: 11, padding: '8px 14px',
        fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 12,
      }}>
        {value ? 'Activé' : 'Désactivé'}
      </button>
    </div>
  );
}
