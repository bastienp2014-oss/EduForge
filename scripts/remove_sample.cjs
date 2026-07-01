const fs = require('fs');

const dirs = fs.readdirSync('src/mechanics').filter(f => f.endsWith('.tsx'));
dirs.forEach(file => {
  const filePath = 'src/mechanics/' + file;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove const SAMPLE = { ... }; completely
  // Since it might span multiple lines and contain nested braces, a regex is tricky.
  // We can just find "const SAMPLE =" and then parse to remove the block, or since we know it's usually at the top level and ends with "};", we can do a greedy or balanced brace approach.
  
  let sampleStart = content.indexOf('const SAMPLE = {');
  if (sampleStart !== -1) {
    let braceCount = 0;
    let i = sampleStart + 'const SAMPLE = '.length;
    let sampleEnd = -1;
    for (; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          sampleEnd = i;
          break;
        }
      }
    }
    if (sampleEnd !== -1) {
      // also remove the trailing semicolon
      if (content[sampleEnd+1] === ';') sampleEnd++;
      content = content.substring(0, sampleStart) + content.substring(sampleEnd + 1);
    }
  }

  fs.writeFileSync(filePath, content);
});
