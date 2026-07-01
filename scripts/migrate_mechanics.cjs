const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../design_handoff_theme_system/mechanics');
const destDir = path.join(__dirname, '../src/mechanics');

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jsx') && !f.startsWith('01_'));

let indexExports = [`export { default as FlashcardSRS } from './01_FlashcardSRS';`];

files.forEach(file => {
  let content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  
  // Add useTheme import if not there
  if (!content.includes('useTheme')) {
    content = `import { useTheme } from '../store/useTheme';\n` + content;
  }
  
  // Remove static const C = { ... };
  content = content.replace(/const C\s*=\s*\{[^}]+\};\s*/g, '');
  
  // Replace the component signature to inject const { theme } = useTheme(); const C = theme.colors;
  // Also add basic TS typing
  content = content.replace(/export default function ([A-Za-z0-9_]+)\s*\(\{\s*(.*?)\s*\}\)\s*\{/, (match, compName, args) => {
    return `export default function ${compName}({ data, onBack, onComplete }: any) {\n  const { theme } = useTheme();\n  const C = theme.colors;\n`;
  });

  // Handle a specific edge case for sample data assignment
  content = content.replace(/data\s*=\s*SAMPLE/g, 'data'); // we default in signature now, so just remove it if it was inline
  
  // Save as .tsx
  const newFilename = file.replace('.jsx', '.tsx');
  fs.writeFileSync(path.join(destDir, newFilename), content);
  
  // Extract component name for index
  const match = content.match(/export default function ([A-Za-z0-9_]+)/);
  if (match) {
    indexExports.push(`export { default as ${match[1]} } from './${newFilename.replace('.tsx', '')}';`);
  }
});

fs.writeFileSync(path.join(destDir, 'index.ts'), indexExports.join('\n') + '\n');
console.log('Migration complete. Files moved to src/mechanics');
