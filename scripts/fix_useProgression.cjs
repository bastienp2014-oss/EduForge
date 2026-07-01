const fs = require('fs');

const path = 'src/store/useProgression.ts';
let code = fs.readFileSync(path, 'utf8');

// Replace addPiasses
code = code.replace(/addPiasses:\s*\((.*?)\)\s*=>\s*\{([\s\S]*?)get\(\)\.sauvegarderVersFirebase\(\);\s*\}/, (match, p1, p2) => {
  return `addPiasses: async (${p1}) => {${p2}
    const { auth } = await import('../../services/firebase');
    if (auth.currentUser) {
      try {
        await fetch('/api/economy/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${await auth.currentUser.getIdToken()}\` },
          body: JSON.stringify({ piasses: montant, xp: montant > 0 ? montant : 0 })
        });
      } catch (e) {}
    }
  }`;
});

// Replace addXp
code = code.replace(/addXp:\s*\((.*?)\)\s*=>\s*\{([\s\S]*?)get\(\)\.sauvegarderVersFirebase\(\);([\s\S]*?)\}/, (match, p1, p2, p3) => {
  return `addXp: async (${p1}) => {${p2}${p3}
    const { auth } = await import('../../services/firebase');
    if (auth.currentUser) {
      try {
        await fetch('/api/economy/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${await auth.currentUser.getIdToken()}\` },
          body: JSON.stringify({ xp: montant })
        });
      } catch (e) {}
    }
  }`;
});

// Replace depenserPiasses
code = code.replace(/depenserPiasses:\s*\((.*?)\)\s*=>\s*\{([\s\S]*?)get\(\)\.sauvegarderVersFirebase\(\);\s*(\}\s*return success;\s*\})/, (match, p1, p2, p3) => {
  return `depenserPiasses: async (${p1}) => {${p2}
      const { auth } = await import('../../services/firebase');
      if (auth.currentUser) {
        try {
          await fetch('/api/economy/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${await auth.currentUser.getIdToken()}\` },
            body: JSON.stringify({ piasses: -cout })
          });
        } catch (e) {}
      }
    ${p3}`;
});

// For acheterObjet and echangerObjetContreMot, since depenserPiasses is now async, we need to await it.
code = code.replace(/acheterObjet:\s*\((.*?)\)\s*=>\s*\{(\s*)const success = get\(\)\.depenserPiasses\((.*?)\);/, (match, p1, p2, p3) => {
  return `acheterObjet: async (${p1}) => {${p2}const success = await get().depenserPiasses(${p3});`;
});

code = code.replace(/echangerObjetContreMot:\s*\((.*?)\)\s*=>\s*\{(\s*)const success = get\(\)\.depenserPiasses\((.*?)\);/, (match, p1, p2, p3) => {
  return `echangerObjetContreMot: async (${p1}) => {${p2}const success = await get().depenserPiasses(${p3});`;
});

// Exclude piasses and xp from setDoc
code = code.replace(/piasses:\s*state\.piasses,\s*/, '');
code = code.replace(/xp:\s*state\.xp,\s*/, '');
code = code.replace(/isPremium:\s*state\.isPremium,\s*/, '');
code = code.replace(/subscriptionPlan:\s*state\.subscriptionPlan,\s*/, '');
code = code.replace(/entitlements:\s*state\.entitlements,\s*/, '');
code = code.replace(/scoreTotal:\s*state\.xp,\s*/, '');

// Add promise to types
code = code.replace(/depenserPiasses: \(cout: number\) => boolean;/, 'depenserPiasses: (cout: number) => Promise<boolean>;');
code = code.replace(/acheterObjet: \(objetId: string, cout: number\) => boolean;/, 'acheterObjet: (objetId: string, cout: number) => Promise<boolean>;');
code = code.replace(/echangerObjetContreMot: \(objetId: string, motId: string\) => boolean;/, 'echangerObjetContreMot: (objetId: string, motId: string) => Promise<boolean>;');

fs.writeFileSync(path, code, 'utf8');
