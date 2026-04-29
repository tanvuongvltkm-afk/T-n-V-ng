const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "where('collaborators', 'array-contains', user.email?.toLowerCase() || '')",
  "where('collaborators', 'array-contains', user.email?.toLowerCase() || ''),\n        where('collaborators', 'array-contains', user.email || '')"
);

fs.writeFileSync('src/App.tsx', content);
