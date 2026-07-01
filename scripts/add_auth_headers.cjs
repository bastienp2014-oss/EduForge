const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src').filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;

  if (content.includes("fetch('/api/gemini/") || content.includes("fetch('/api/parse-document'")) {
    if (!content.includes('import { auth } from')) {
      const depth = file.split(path.sep).length - 2;
      let relativePath = '';
      for(let i=0; i<depth; i++) relativePath += '../';
      relativePath += 'services/firebase';
                           
      content = `import { auth } from '${relativePath}';\n` + content;
      changed = true;
    }

    if (!content.includes('Authorization')) {
      // Replaces headers: { ... } for gemini requests which have 'Content-Type': 'application/json'
      content = content.replace(/headers:\s*\{([^}]*?)'Content-Type':\s*'application\/json'([^}]*?)\}/g, (match, p1, p2) => {
        return `headers: {${p1}'Content-Type': 'application/json', 'Authorization': \`Bearer \${await auth.currentUser?.getIdToken()}\`${p2}}`;
      });

      // Replace for parse-document (FormData)
      content = content.replace(/body:\s*formData\s*\}/g, (match) => {
          return `body: formData,\n      headers: { 'Authorization': \`Bearer \${await auth.currentUser?.getIdToken()}\` }\n    }`;
      });
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(file, content, 'utf-8');
      console.log('Updated ' + file);
    }
  }
}

