const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace previous unauthView rule
content = content.replace(
  "if (user && !activeProjectId && !authLoading) {",
  "if (user && !authLoading && (!activeProjectId || !canView)) {"
);

fs.writeFileSync('src/App.tsx', content);
