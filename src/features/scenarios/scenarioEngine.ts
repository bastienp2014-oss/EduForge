/**
 * SCENARIO ENGINE — Mots & Blocs (Phase 13)
 * Fonctions PURES — aucune dépendance React.
 * Testable sans UI.
 */

// ─── Types ────────────────────────────────────────────────────────
export type OutcomeType = 'succes' | 'echec' | 'neutre';

export type Effets = {
  piasses?: number;
  xp?: number;
};

export type Choix = {
  id: string;
  texte: string;
  noeudSuivant: string;
  effets?: Effets;
  feedback?: string;
};

export type Outcome = {
  type: OutcomeType;
  message: string;
  sousTitre?: string;
  recompense?: number;
};

export type Noeud = {
  id: string;
  locuteur: string;
  avatar?: string;
  texte: string;
  audioUrl?: string; // Optionnel : URL pour écouter l'audio
  choix: Choix[];
  outcome?: Outcome;
};

export type Scenario = {
  id: string;
  titre: string;
  description: string;
  lieu: string;
  rue_id: string;
  statut: 'active' | 'brouillon' | 'archive';
  categorie?: string;
  niveauMin?: number;
  planRequis?: 'free' | 'basic' | 'premium';
  declencheur?: 'entree_rue' | 'interaction';
  repetable?: boolean;
  noeudInitial: string;
  noeuds: Noeud[];
};

// ─── Fonctions pures ──────────────────────────────────────────────

/** Récupère un nœud par son id */
export const getNoeud = (scenario: Scenario, id: string): Noeud | undefined =>
  scenario.noeuds.find(n => n.id === id);

/** Un nœud est terminal s'il a un outcome ou s'il n'a pas de choix */
export const isTerminal = (noeud: Noeud): boolean =>
  !!noeud.outcome || noeud.choix.length === 0;

/** Récupère un choix dans un nœud */
export const getChoix = (noeud: Noeud, choixId: string): Choix | undefined =>
  noeud.choix.find(c => c.id === choixId);

/** Calcule les effets totaux accumulés */
export const cumulerEffets = (effetsListe: Effets[]): Effets =>
  effetsListe.reduce(
    (acc, e) => ({
      piasses: (acc.piasses ?? 0) + (e.piasses ?? 0),
      xp: (acc.xp ?? 0) + (e.xp ?? 0),
    }),
    { piasses: 0, xp: 0 }
  );

/** Valide qu'un scénario est jouable (nœuds cohérents) */
export const validerScenario = (scenario: Scenario): string[] => {
  const erreurs: string[] = [];
  const ids = new Set(scenario.noeuds.map(n => n.id));
  
  if (!ids.has(scenario.noeudInitial)) {
    erreurs.push(`Nœud initial "${scenario.noeudInitial}" introuvable.`);
  }
  
  for (const noeud of scenario.noeuds) {
    for (const choix of noeud.choix) {
      if (!ids.has(choix.noeudSuivant)) {
        erreurs.push(`Nœud "${noeud.id}" → choix "${choix.id}" pointe vers "${choix.noeudSuivant}" qui n'existe pas.`);
      }
    }
  }
  
  return erreurs;
};
