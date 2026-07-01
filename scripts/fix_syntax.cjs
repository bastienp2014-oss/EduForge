const fs = require('fs');

const filesToFix = {
  'src/mechanics/21_ErrorCorrection.tsx': [
    { search: /dans l'espace/g, replace: "dans l\\'espace" }
  ],
  'src/mechanics/22_DeceptivePairs.tsx': [
    { search: /c'est/g, replace: "c\\'est" },
    { search: /d'école/g, replace: "d\\'école" },
    { search: /l'événement/g, replace: "l\\'événement" }
  ],
  'src/mechanics/24_VoiceRecording.tsx': [
    { search: /C'est/g, replace: "C\\'est" },
    { search: /s'il/g, replace: "s\\'il" }
  ],
  'src/mechanics/25_AudioAB.tsx': [
    { search: /C'est/g, replace: "C\\'est" },
    { search: /qu'on/g, replace: "qu\\'on" }
  ]
};

const dirs = fs.readdirSync('src/mechanics').filter(f => f.endsWith('.tsx'));
dirs.forEach(file => {
  let content = fs.readFileSync('src/mechanics/' + file, 'utf8');
  // General fix: finding text enclosed in single quotes that contain a single quote
  // E.g. 'foo l'bar'
  // Let's just fix the files manually since there aren't that many errors.
  content = content.replace(/'([^']*)'([^']*)'/g, (match, p1, p2) => {
    // If the string itself contains apostrophes, let's wrap it in double quotes instead
    // Actually, safer is to just replace the known bad phrases
    return match;
  });
});

for (const [file, fixes] of Object.entries(filesToFix)) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  fixes.forEach(fix => {
    content = content.replace(fix.search, fix.replace);
  });
  fs.writeFileSync(file, content);
}
