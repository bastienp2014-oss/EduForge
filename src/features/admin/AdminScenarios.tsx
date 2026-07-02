import { auth } from '../../services/firebase';
import { secureFetch } from '../../utils/secureFetch';
/**
 * ADMIN SCENARIOS — Mots & Blocs (Phase 13)
 * Éditeur visuel de scénarios style n8n.
 * Sauvegarde dans Firestore /scenarios/{id}
 */
import React, { useState, useRef, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Plus, ArrowLeft, Save, Trash2, Edit2, Download, Upload, Zap } from 'lucide-react';
import type { Scenario, Noeud } from '../scenarios/scenarioEngine';
import { validerScenario } from '../scenarios/scenarioEngine';
import scenariosDefaut from '../../data/scenarios.json';
import { useSettings } from '../../store/useSettings';
import { useAdminTheme } from '../../store/useAdminTheme';
import { useTenant } from '../../store/useTenant';

// ─── Config visuelle des types de nœuds ──────────────────────────
const NODE_W = 240;
const NODE_H = 105;

const TYPES_NOEUDS: Record<string, { label: string; color: string; bg: string; text: string }> = {
  proprio: { label: 'PROPRIO', color: '#f59e0b', bg: '#1c1107', text: '#fcd34d' },
  vous: { label: 'VOUS', color: '#6366f1', bg: '#1e1b4b', text: '#a5b4fc' },
  systeme: { label: 'SYSTÈME', color: '#64748b', bg: '#0f172a', text: '#94a3b8' },
  succes: { label: '✅ SUCCÈS', color: '#10b981', bg: '#022c22', text: '#6ee7b7' },
  echec: { label: '❌ ÉCHEC', color: '#ef4444', bg: '#1f0000', text: '#fca5a5' },
  neutre: { label: '⚪ NEUTRE', color: '#6b7280', bg: '#111827', text: '#9ca3af' },
};

type NoeudEditeur = Noeud & { type: string; x: number; y: number };
type Arete = { id: string; src: string; dst: string; choixId: string; label: string; piasses: number; xp: number };

// ─── Helpers bezier ──────────────────────────────────────────────
function bezier(sx: number, sy: number, tx: number, ty: number) {
  const dx = Math.abs(tx - sx) * 0.55;
  return `M${sx},${sy} C${sx+dx},${sy} ${tx-dx},${ty} ${tx},${ty}`;
}

// ─── Conversion Scenario ↔ Éditeur ───────────────────────────────
function scenarioVersEditeur(scenario: Scenario): { noeuds: NoeudEditeur[]; aretes: Arete[] } {
  const noeuds: NoeudEditeur[] = scenario.noeuds.map((n, i) => ({
    ...n,
    type: n.outcome ? (n.outcome.type === 'succes' ? 'succes' : n.outcome.type === 'echec' ? 'echec' : 'neutre') : (n.locuteur === 'proprio' ? 'proprio' : n.locuteur === 'vous' ? 'vous' : 'systeme'),
    x: 80 + (i % 3) * 300,
    y: 80 + Math.floor(i / 3) * 180,
  }));

  const aretes: Arete[] = [];
  for (const noeud of scenario.noeuds) {
    for (const choix of noeud.choix) {
      aretes.push({
        id: `${noeud.id}-${choix.id}`,
        src: noeud.id,
        dst: choix.noeudSuivant,
        choixId: choix.id,
        label: choix.texte,
        piasses: choix.effets?.piasses ?? 0,
        xp: choix.effets?.xp ?? 0,
      });
    }
  }
  return { noeuds, aretes };
}

function editeurVersScenario(meta: Partial<Scenario>, noeuds: NoeudEditeur[], aretes: Arete[]): Scenario {
  return {
    id: meta.id ?? `scenario_${Date.now()}`,
    titre: meta.titre ?? 'Nouveau scénario',
    description: meta.description ?? '',
    lieu: meta.lieu ?? '',
    rue_id: meta.rue_id ?? 'principale',
    statut: meta.statut ?? 'brouillon',
    categorie: meta.categorie ?? 'logement',
    niveauMin: meta.niveauMin ?? 0,
    planRequis: meta.planRequis ?? 'free',
    declencheur: meta.declencheur ?? 'entree_rue',
    repetable: meta.repetable ?? false,
    noeudInitial: noeuds[0]?.id ?? '',
    noeuds: noeuds.map(n => ({
      id: n.id,
      locuteur: n.locuteur,
      avatar: n.avatar,
      texte: n.texte,
      audioUrl: n.audioUrl,
      choix: aretes
        .filter(a => a.src === n.id)
        .map(a => ({
          id: a.choixId,
          texte: a.label,
          noeudSuivant: a.dst,
          effets: { piasses: a.piasses, xp: a.xp },
        })),
      ...(n.outcome ? { outcome: n.outcome } : {}),
    })),
  };
}

// ─── ÉDITEUR VISUEL ──────────────────────────────────────────────
function EditeurVisuel({ scenario, onSave, onBack }: {
  scenario: Scenario | null;
  onSave: (s: Scenario) => void;
  onBack: () => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [meta, setMeta] = useState<Partial<Scenario>>(scenario ?? {
    titre: 'Nouveau scénario', lieu: 'Rue Principale', rue_id: 'principale', statut: 'brouillon',
  });
  
  const init = scenario ? scenarioVersEditeur(scenario) : { noeuds: [], aretes: [] };
  const [noeuds, setNoeuds] = useState<NoeudEditeur[]>(init.noeuds);
  const [aretes, setAretes] = useState<Arete[]>(init.aretes);
  const [drag, setDrag] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [editNoeud, setEditNoeud] = useState<NoeudEditeur | null>(null);
  const [nouvelleArete, setNouvelleArete] = useState<{ src: string; dst: string } | null>(null);
  const [labelArete, setLabelArete] = useState('');
  const [piassesArete, setPiassesArete] = useState(0);
  const [xpArete, setXpArete] = useState(0);
  const [erreurs, setErreurs] = useState<string[]>([]);

  const onNodeDown = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    if ('button' in e && e.button !== 0) return;
    e.stopPropagation();
    if (connecting) { connecterVers(id); return; }
    const rect = canvasRef.current!.getBoundingClientRect();
    const n = noeuds.find(x => x.id === id)!;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDrag({ id, ox: clientX - rect.left - n.x, oy: clientY - rect.top - n.y });
    setSelected(id);
  };

  const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drag) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setNoeuds(ns => ns.map(n => n.id === drag.id
      ? { ...n, x: clientX - rect.left - drag.ox, y: clientY - rect.top - drag.oy }
      : n));
  };

  const connecterVers = (dst: string) => {
    if (!connecting || connecting === dst) { setConnecting(null); return; }
    setNouvelleArete({ src: connecting, dst });
    setLabelArete(''); setPiassesArete(0); setXpArete(0);
    setConnecting(null);
  };

  const ajouterNoeud = (type: string) => {
    const id = `n_${Date.now()}`;
    setNoeuds(ns => [...ns, {
      id, type,
      locuteur: ['succes','echec','neutre'].includes(type) ? 'systeme' : type,
      avatar: type === 'proprio' ? '🏠' : type === 'succes' ? '✅' : type === 'echec' ? '❌' : '⚙️',
      texte: 'Nouveau message...',
      choix: [],
      x: 200 + Math.random() * 200,
      y: 150 + Math.random() * 200,
      ...((['succes','echec','neutre'].includes(type)) ? {
        outcome: { type: type as 'succes' | 'echec' | 'neutre', message: '', recompense: 0 }
      } : {}),
    }]);
  };

  const supprimerNoeud = (id: string) => {
    setNoeuds(ns => ns.filter(n => n.id !== id));
    setAretes(as => as.filter(a => a.src !== id && a.dst !== id));
    if (editNoeud?.id === id) setEditNoeud(null);
  };

  const sauvegarderNoeud = () => {
    if (!editNoeud) return;
    setNoeuds(ns => ns.map(n => n.id === editNoeud.id ? editNoeud : n));
    setEditNoeud(null);
  };

  const confirmerArete = () => {
    if (!nouvelleArete || !labelArete.trim()) return;
    const choixId = `c_${Date.now()}`;
    setAretes(as => [...as, {
      id: `${nouvelleArete.src}-${choixId}`,
      src: nouvelleArete.src, dst: nouvelleArete.dst,
      choixId, label: labelArete,
      piasses: Number(piassesArete), xp: Number(xpArete),
    }]);
    setNouvelleArete(null);
  };

  const sauvegarder = () => {
    const s = editeurVersScenario(meta, noeuds, aretes);
    const errs = validerScenario(s);
    if (errs.length > 0) { setErreurs(errs); return; }
    setErreurs([]);
    onSave(s);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0f172a', color: '#f8fafc' }}>
      {/* Toolbar */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={btnSec}><ArrowLeft size={14} /> Retour</button>
        <input value={meta.titre ?? ''} onChange={e => setMeta(p => ({ ...p, titre: e.target.value }))} style={{ background: 'transparent', border: 'none', color: '#f8fafc', fontWeight: 900, fontSize: 14, outline: 'none', flex: 1, minWidth: 180 }} />
        <div style={{ flex: 1 }} />
        
        {Object.entries(TYPES_NOEUDS).map(([type, cfg]) => (
          <button key={type} onClick={() => ajouterNoeud(type)} style={{ background: cfg.bg, border: `1px solid ${cfg.color}`, color: cfg.text, borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            + {cfg.label}
          </button>
        ))}

        {connecting && (
          <div style={{ background: '#fbbf24', color: '#000', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 900 }}>
            🔗 Cliquez le nœud cible
            <button onClick={() => setConnecting(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 6 }}>✕</button>
          </div>
        )}
        <button onClick={sauvegarder} style={btnGreen}><Save size={14} /> Sauvegarder</button>
      </div>

      {/* Erreurs */}
      {erreurs.length > 0 && (
        <div style={{ background: '#450a0a', color: '#fca5a5', padding: '8px 16px', fontSize: 12 }}>
          {erreurs.map((e, i) => <div key={i}>⚠️ {e}</div>)}
        </div>
      )}

      {/* Méta */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '8px 16px', display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
        <input placeholder="Lieu (ex: Téléphone)" value={meta.lieu ?? ''} onChange={e => setMeta(p => ({ ...p, lieu: e.target.value }))} style={{ ...inpDark, flex: 1, minWidth: 150 }} />
        <select value={meta.rue_id ?? 'principale'} onChange={e => setMeta(p => ({ ...p, rue_id: e.target.value }))} style={{ ...inpDark, width: 140 }}>
          <option value="principale">Rue Principale</option>
          <option value="logement">Rue du Logement</option>
          <option value="travail">Rue du Travail</option>
          <option value="services">Rue des Services</option>
          <option value="etudes">Rue des Études</option>
        </select>
        
        {/* Nouveaux champs Phase 1 */}
        <select value={meta.categorie ?? 'logement'} onChange={e => setMeta(p => ({ ...p, categorie: e.target.value }))} style={{ ...inpDark, width: 140 }}>
          <option value="logement">Logement</option>
          <option value="travail">Travail</option>
          <option value="services">Services</option>
          <option value="etudes">Études</option>
          <option value="sante">Santé</option>
          <option value="quotidien">Quotidien</option>
          <option value="social">Social</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>Niv.</span>
          <input type="number" min="0" value={meta.niveauMin ?? 0} onChange={e => setMeta(p => ({ ...p, niveauMin: Number(e.target.value) }))} style={{ ...inpDark, width: 60 }} />
        </div>
        <select value={meta.planRequis ?? 'free'} onChange={e => setMeta(p => ({ ...p, planRequis: e.target.value as 'free' | 'basic' | 'premium' }))} style={{ ...inpDark, width: 110 }}>
          <option value="free">Gratuit</option>
          <option value="basic">Basic</option>
          <option value="premium">Premium</option>
        </select>

        <select value={meta.declencheur ?? 'entree_rue'} onChange={e => setMeta(p => ({ ...p, declencheur: e.target.value as 'entree_rue' | 'interaction' }))} style={{ ...inpDark, width: 130 }}>
          <option value="entree_rue">Entrée Rue</option>
          <option value="interaction">Interaction</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          <input type="checkbox" checked={meta.repetable ?? false} onChange={e => setMeta(p => ({ ...p, repetable: e.target.checked }))} style={{ cursor: 'pointer' }} />
          Répétable
        </label>

        <select value={meta.statut ?? 'brouillon'} onChange={e => setMeta(p => ({ ...p, statut: e.target.value as Scenario['statut'] }))} style={{ ...inpDark, width: 110 }}>
          <option value="brouillon">Brouillon</option>
          <option value="active">Actif</option>
          <option value="archive">Archivé</option>
        </select>
      </div>

      {/* Canvas + panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Canvas Scroll Wrapper */}
        <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch', cursor: connecting ? 'crosshair' : (drag ? 'grabbing' : 'default') }}>
          <div ref={canvasRef}
            style={{ width: 3000, height: 3000, position: 'relative', background: '#0f172a' }}
            onMouseMove={onMouseMove}
            onTouchMove={onMouseMove}
            onMouseUp={() => setDrag(null)}
            onTouchEnd={() => setDrag(null)}
            onClick={() => { setSelected(null); if (connecting) setConnecting(null); }}
          >
            {/* Grille de points */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <defs>
                <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="#1e293b" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="#0f172a" />
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>

            {/* Arêtes SVG */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              <marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M0,0 L8,3 L0,6 Z" fill="#475569" />
              </marker>
            </defs>
            {aretes.map(arete => {
              const src = noeuds.find(n => n.id === arete.src);
              const dst = noeuds.find(n => n.id === arete.dst);
              if (!src || !dst) return null;
              
              const sx = src.x + NODE_W, sy = src.y + NODE_H / 2;
              const tx = dst.x, ty = dst.y + NODE_H / 2;
              const path = bezier(sx, sy, tx, ty);
              const mx = (sx + tx) / 2, my = (sy + ty) / 2;
              const hasEff = arete.piasses !== 0 || arete.xp !== 0;

              return (
                <g key={arete.id} style={{ pointerEvents: 'all', cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); setAretes(as => as.filter(a => a.id !== arete.id)); }}>
                  <path d={path} fill="none" stroke="transparent" strokeWidth={14} />
                  <path d={path} fill="none" stroke="#334155" strokeWidth={2.5} markerEnd="url(#arr)" />
                  <rect x={mx - 65} y={my - 13} width={130} height={26} rx={13} fill="#1e293b" stroke="#334155" strokeWidth={1} />
                  <text x={mx} y={my + 4} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight={700}>{arete.label}</text>
                  {hasEff && (
                    <>
                      <rect x={mx - 40} y={my + 14} width={80} height={15} rx={7} fill="#0f172a" />
                      <text x={mx} y={my + 24} textAnchor="middle" fontSize={9} fontWeight={700} fill={arete.piasses < 0 ? '#f87171' : '#34d399'}>
                        {arete.piasses !== 0 ? `${arete.piasses > 0 ? '+' : ''}${arete.piasses}$ ` : ''}
                        {arete.xp > 0 ? `+${arete.xp}XP` : ''}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Nœuds */}
            {noeuds.map(noeud => {
              const cfg = TYPES_NOEUDS[noeud.type] ?? TYPES_NOEUDS.systeme;
              const isSel = selected === noeud.id;
              
              return (
                <div key={noeud.id}
                  onMouseDown={(e) => onNodeDown(e, noeud.id)}
                  onTouchStart={(e) => onNodeDown(e, noeud.id)}
                  style={{
                  position: 'absolute', left: noeud.x, top: noeud.y, width: NODE_W, minHeight: NODE_H,
                  background: cfg.bg, border: `2px solid ${isSel ? '#fff' : cfg.color}`,
                  borderRadius: 14, cursor: drag?.id === noeud.id ? 'grabbing' : 'grab',
                  boxShadow: isSel ? `0 0 0 3px ${cfg.color}40, 0 12px 32px rgba(0,0,0,0.6)` : '0 4px 16px rgba(0,0,0,0.5)',
                  userSelect: 'none',
                }}>
                {/* Header */}
                <div style={{ padding: '6px 12px 4px', borderBottom: `1px solid ${cfg.color}30`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: cfg.color, fontSize: 9, fontWeight: 900, letterSpacing: '0.08em' }}>{cfg.label}</span>
                  {noeud.avatar && <span style={{ fontSize: 14 }}>{noeud.avatar}</span>}
                </div>
                {/* Texte */}
                <div style={{ padding: '7px 12px' }}>
                  <p style={{ color: '#e2e8f0', fontSize: 11, lineHeight: 1.4, margin: 0 }}>
                    {noeud.texte.length > 85 ? noeud.texte.slice(0, 85) + '…' : noeud.texte}
                  </p>
                </div>
                {/* Actions */}
                <div style={{ padding: '3px 10px 8px', display: 'flex', gap: 5 }}>
                  <button onClick={(e) => { e.stopPropagation(); setEditNoeud({ ...noeud }); }} style={btnNodeSm('#1e293b', '#94a3b8', '#334155')}>✏️</button>
                  <button onClick={(e) => { e.stopPropagation(); setConnecting(noeud.id); }} style={btnNodeSm('#1e3a5f', '#60a5fa', '#3b82f6')}>🔗 Relier</button>
                  <button onClick={(e) => { e.stopPropagation(); supprimerNoeud(noeud.id); }} style={btnNodeSm('#1f0000', '#f87171', '#ef444440')}>🗑️</button>
                </div>
                
                {/* Ports */}
                <div onClick={(e) => { e.stopPropagation(); setConnecting(noeud.id); }}
                  style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, borderRadius: '50%', background: cfg.color, border: '2px solid #0f172a', cursor: 'crosshair' }} />
                <div onClick={(e) => { e.stopPropagation(); if (connecting) connecterVers(noeud.id); }}
                  style={{ position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, borderRadius: '50%', background: '#1e293b', border: `2px solid ${cfg.color}`, cursor: connecting ? 'crosshair' : 'default' }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel d'édition */}
        {editNoeud && (
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 280, background: '#1e293b', borderLeft: '1px solid #334155', padding: 20, overflowY: 'auto', flexShrink: 0, zIndex: 50, boxShadow: '-4px 0 24px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 900, fontSize: 14 }}>Éditer le nœud</span>
              <button onClick={() => setEditNoeud(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            
            <label style={lbl}>Type</label>
            <select value={editNoeud.type} onChange={e => setEditNoeud(p => p ? { ...p, type: e.target.value, locuteur: e.target.value } : p)} style={inpDark}>
              {Object.entries(TYPES_NOEUDS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            
            <label style={lbl}>Avatar</label>
            <input value={editNoeud.avatar ?? ''} onChange={e => setEditNoeud(p => p ? { ...p, avatar: e.target.value } : p)} style={inpDark} placeholder="🏠" />
            
            <label style={lbl}>Texte / Message</label>
            <textarea value={editNoeud.texte} onChange={e => setEditNoeud(p => p ? { ...p, texte: e.target.value } : p)} rows={5} style={{ ...inpDark, resize: 'vertical' }} />

            <label style={lbl}>URL Audio (optionnel)</label>
            <input value={editNoeud.audioUrl ?? ''} onChange={e => setEditNoeud(p => p ? { ...p, audioUrl: e.target.value } : p)} style={inpDark} placeholder="https://..." />

            {editNoeud.outcome !== undefined && (
              <>
                <label style={lbl}>Message Outcome</label>
                <input value={editNoeud.outcome?.message ?? ''} onChange={e => setEditNoeud(p => p ? { ...p, outcome: { ...p.outcome!, message: e.target.value } } : p)} style={inpDark} />
                <label style={lbl}>Sous-titre</label>
                <input value={editNoeud.outcome?.sousTitre ?? ''} onChange={e => setEditNoeud(p => p ? { ...p, outcome: { ...p.outcome!, sousTitre: e.target.value } } : p)} style={inpDark} />
                <label style={lbl}>Récompense XP</label>
                <input type="number" value={editNoeud.outcome?.recompense ?? 0} onChange={e => setEditNoeud(p => p ? { ...p, outcome: { ...p.outcome!, recompense: Number(e.target.value) } } : p)} style={inpDark} />
              </>
            )}

            <button onClick={sauvegarderNoeud} style={{ ...btnGreen, marginTop: 16, width: '100%', padding: '10px', justifyContent: 'center' }}>
              ✅ Sauvegarder
            </button>
          </div>
        )}
      </div>

      {/* Modal nouvelle arête */}
      {nouvelleArete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setNouvelleArete(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', border: '1px solid #7c3aed', borderRadius: 16, padding: 24, width: 320 }}>
            <h3 style={{ margin: '0 0 16px', fontWeight: 900, fontSize: 15 }}>🔗 Nouveau choix</h3>
            <label style={lbl}>Texte du choix</label>
            <input value={labelArete} onChange={e => setLabelArete(e.target.value)} placeholder="Ex: Je refuse poliment" style={inpDark} autoFocus />
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <div style={{ flex: 1 }}><label style={lbl}>Piasses 💰</label><input type="number" value={piassesArete} onChange={e => setPiassesArete(Number(e.target.value))} style={inpDark} /></div>
              <div style={{ flex: 1 }}><label style={lbl}>XP ⭐</label><input type="number" value={xpArete} onChange={e => setXpArete(Number(e.target.value))} style={inpDark} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setNouvelleArete(null)} style={{ ...btnSec, flex: 1 }}>Annuler</button>
              <button onClick={confirmerArete} style={{ ...btnGreen, flex: 1, justifyContent: 'center' }}>Créer →</button>
            </div>
          </div>
        </div>
      )}

      {/* Help bar */}
      <div style={{ background: '#1e293b', borderTop: '1px solid #334155', padding: '5px 16px', display: 'flex', gap: 20 }}>
        {[['🖱️ Glisser','déplacer'],['🔗 Relier + clic cible','connecter'],['⚫ Port droit','nouvelle connexion'],['Clic arête','supprimer']].map(([k,v]) => (
          <span key={k} style={{ fontSize: 10, color: '#475569' }}><strong style={{ color: '#64748b' }}>{k}</strong> {v}</span>
        ))}
      </div>
    </div>
  );
}

// ─── LISTE DES SCÉNARIOS ──────────────────────────────────────────
export default function AdminScenarios() {
  const { theme } = useAdminTheme();
  const { currentTenant } = useTenant();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<'liste' | 'editeur'>('liste');
  const [scenarioActif, setScenarioActif] = useState<Scenario | null>(null);
  const [saving, setSaving] = useState(false);
  const [filtreCategorie, setFiltreCategorie] = useState<string>('toutes');
  const [showIAGen, setShowIAGen] = useState(false);
  const [iaSubject, setIaSubject] = useState('');
  const [iaPrompt, setIaPrompt] = useState('');
  const [iaCount, setIaCount] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const charger = async () => {
      try {
        const tenantId = currentTenant?.id || 'eduforge';
        const snap = await getDocs(collection(db, 'tenants', tenantId, 'scenarios'));
        if (!snap.empty) {
          setScenarios(snap.docs.map(d => d.data() as Scenario));
        } else {
          setScenarios(scenariosDefaut as Scenario[]);
        }
      } catch {
        setScenarios(scenariosDefaut as Scenario[]);
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [currentTenant?.id]);

  const genererIA = async () => {
    if (!iaSubject.trim()) return;
    setIsGenerating(true);
    try {
      const { apiKey, persona, context, documents } = useSettings.getState();
      const response = await secureFetch('/api/gemini/generate-scenario', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
          ...(apiKey ? { 'x-api-key': apiKey } : {})
        },
        body: JSON.stringify({ subject: iaSubject, prompt: iaPrompt, count: iaCount, persona, context: context + (documents && documents.length > 0 ? "\n\nDocuments Additionnels:\n" + documents.map(d => `--- ${d.name} ---\n${d.content}`).join("\n\n") : "") })
      });
      if (!response.ok) throw new Error("Erreur de l'API");
      const result = await response.json();
      
      const newScenarios: Scenario[] = [];
      for (const scenario of result) {
        const generatedScenario: Scenario = {
          ...scenario,
          id: `scenario_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        };
        const tenantId = currentTenant?.id || 'eduforge';
        await setDoc(doc(db, 'tenants', tenantId, 'scenarios', generatedScenario.id), generatedScenario);
        newScenarios.push(generatedScenario);
      }
      setScenarios(prev => [...prev, ...newScenarios]);
      setShowIAGen(false);
      alert(`${newScenarios.length} scénario(s) généré(s) avec succès !`);
    } catch (e) {
      alert("❌ Une erreur est survenue lors de la génération avec l'IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const sauvegarder = async (s: Scenario) => {
    setSaving(true);
    try {
      const tenantId = currentTenant?.id || 'eduforge';
      await setDoc(doc(db, 'tenants', tenantId, 'scenarios', s.id), s);
      setScenarios(prev => {
        const idx = prev.findIndex(x => x.id === s.id);
        if (idx >= 0) { const n = [...prev]; n[idx] = s; return n; }
        return [...prev, s];
      });
      setEditMode('liste');
      alert('✅ Scénario sauvegardé dans Firestore !');
    } catch (e) {
      alert('Erreur Firestore — scénario sauvegardé localement seulement.');
    } finally {
      setSaving(false);
    }
  };

  const supprimer = async (id: string) => {
    if (!confirm(`Supprimer le scénario "${id}" ?`)) return;
    const tenantId = currentTenant?.id || 'eduforge';
    try { await deleteDoc(doc(db, 'tenants', tenantId, 'scenarios', id)); } catch {}
    setScenarios(prev => prev.filter(s => s.id !== id));
  };

  if (editMode === 'editeur') {
    return (
      <div style={{ height: 'calc(100vh - 120px)' }}>
        <EditeurVisuel
          scenario={scenarioActif}
          onSave={sauvegarder}
          onBack={() => setEditMode('liste')}
        />
      </div>
    );
  }

  const filteredScenarios = filtreCategorie === 'toutes' 
    ? scenarios 
    : scenarios.filter(s => (s.categorie ?? 'logement') === filtreCategorie);

  return (
    <div className="p-6 max-w-3xl mx-auto" style={{ color: theme.colors.ink }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black" style={{ color: theme.colors.ink }}>🎭 Scénarios</h2>
          <p className="text-sm" style={{ color: theme.colors.muted }}>Arbres de dialogue interactifs — sauvegardés dans Firestore</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={filtreCategorie} 
            onChange={(e) => setFiltreCategorie(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm font-bold outline-none"
            style={{ backgroundColor: theme.colors.surface, borderColor: `color-mix(in srgb, ${theme.colors.ink} 15%, transparent)`, color: theme.colors.ink }}
          >
            <option value="toutes">Toutes catégories</option>
            <option value="logement">Logement</option>
            <option value="travail">Travail</option>
            <option value="services">Services</option>
            <option value="etudes">Études</option>
            <option value="sante">Santé</option>
            <option value="quotidien">Quotidien</option>
            <option value="social">Social</option>
          </select>
          <button
            onClick={() => { setScenarioActif(null); setEditMode('editeur'); }}
            className="flex items-center gap-2 font-black px-4 py-2 rounded-xl transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.colors.primary, color: theme.colors.surface }}
          >
            <Plus className="w-4 h-4" />
            Manuel
          </button>
          <button
            onClick={() => setShowIAGen(true)}
            className="flex items-center gap-2 font-black px-4 py-2 rounded-xl transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.colors.accent, color: theme.colors.surface }}
          >
            ✨ Générer via l'IA
          </button>
        </div>
      </div>

      {showIAGen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowIAGen(false)}>
          <div className="rounded-3xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()} style={{ backgroundColor: theme.colors.surface, color: theme.colors.ink }}>
            <h3 className="text-xl font-black mb-4" style={{ color: theme.colors.ink }}>✨ Générer avec Gemini</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: theme.colors.muted }}>Thématique (obligatoire)</label>
                <input 
                  autoFocus
                  placeholder="Ex: Passer une commande au Tim Hortons"
                  value={iaSubject}
                  onChange={e => setIaSubject(e.target.value)}
                  className="w-full border-2 rounded-xl px-4 py-3 font-bold outline-none transition-all"
                  style={{ backgroundColor: theme.colors.bg, borderColor: `color-mix(in srgb, ${theme.colors.ink} 15%, transparent)`, color: theme.colors.ink }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: theme.colors.muted }}>Instructions supplémentaires (optionnel)</label>
                <textarea 
                  placeholder="Ex: Sois sûr que le commis utilise du tutoiement québécois"
                  value={iaPrompt}
                  onChange={e => setIaPrompt(e.target.value)}
                  rows={3}
                  className="w-full border-2 rounded-xl px-4 py-3 font-medium outline-none transition-all"
                  style={{ backgroundColor: theme.colors.bg, borderColor: `color-mix(in srgb, ${theme.colors.ink} 15%, transparent)`, color: theme.colors.ink }}
                />
              </div>

              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: theme.colors.muted }}>Nombre à générer</label>
                  <input 
                    type="number"
                    min="1"
                    max="10"
                    value={iaCount}
                    onChange={e => setIaCount(Number(e.target.value))}
                    className="w-full border-2 rounded-xl px-4 py-3 font-bold outline-none transition-all"
                    style={{ backgroundColor: theme.colors.bg, borderColor: `color-mix(in srgb, ${theme.colors.ink} 15%, transparent)`, color: theme.colors.ink }}
                  />
                </div>
                <div className="flex-[2] pt-6">
                  <p className="text-xs" style={{ color: theme.colors.muted }}>Attention: la génération peut prendre jusqu'à 30 secondes selon le nombre.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowIAGen(false)} className="flex-1 py-3 font-bold rounded-xl transition-opacity hover:opacity-80" style={{ backgroundColor: theme.colors.bg, color: theme.colors.ink }}>
                Annuler
              </button>
              <button 
                onClick={genererIA} 
                disabled={isGenerating || !iaSubject.trim()}
                className="flex-[2] flex justify-center items-center gap-2 py-3 font-black rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: theme.colors.primary, color: theme.colors.surface }}
              >
                {isGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {isGenerating ? "Création en cours..." : "Lancer la magie ✨"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12" style={{ color: theme.colors.muted }}>Chargement…</div>
      ) : (
        <div className="space-y-3">
          {filteredScenarios.map(s => (
            <div key={s.id} className="rounded-2xl border p-4 flex items-center gap-4 transition-colors hover:bg-black/5" style={{ backgroundColor: theme.colors.surface, borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)` }}>
              <div className="text-3xl">{s.statut === 'active' ? '🟢' : s.statut === 'archive' ? '🔴' : '🟡'}</div>
              <div className="flex-1">
                <p className="font-black" style={{ color: theme.colors.ink }}>{s.titre}</p>
                <p className="text-xs" style={{ color: theme.colors.muted }}>{s.description}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)`, color: theme.colors.ink }}>{s.categorie ?? 'logement'}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)`, color: theme.colors.ink }}>Niv. {s.niveauMin ?? 0}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.primary} 15%, transparent)`, color: theme.colors.primary }}>{s.planRequis ?? 'free'}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)`, color: theme.colors.ink }}>{s.noeuds.length} nœuds</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.gold} 15%, transparent)`, color: theme.colors.gold }}>{s.statut}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setScenarioActif(s); setEditMode('editeur'); }}
                  className="font-bold px-3 py-1.5 rounded-xl text-sm transition-colors hover:opacity-80"
                  style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.primary} 10%, transparent)`, color: theme.colors.primary }}>
                  ✏️ Éditer
                </button>
                <button onClick={() => supprimer(s.id)}
                  className="font-bold px-3 py-1.5 rounded-xl text-sm transition-colors hover:opacity-80"
                  style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.danger} 10%, transparent)`, color: theme.colors.danger }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredScenarios.length === 0 && (
            <div className="text-center py-12" style={{ color: theme.colors.muted }}>
              Aucun scénario trouvé pour cette catégorie.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Style helpers ────────────────────────────────────────────────
const lbl: React.CSSProperties = { display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, marginTop: 10 };
const inpDark: React.CSSProperties = { width: '100%', background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 8, padding: '7px 10px', fontSize: 12, outline: 'none', boxSizing: 'border-box' };
const btnGreen: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: '#10b981', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 900, fontSize: 12, cursor: 'pointer' };
const btnSec: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, padding: '6px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer' };
const btnNodeSm = (bg: string, color: string, border: string): React.CSSProperties => ({ background: bg, color, border: `1px solid ${border}`, borderRadius: 6, padding: '2px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 700 });
