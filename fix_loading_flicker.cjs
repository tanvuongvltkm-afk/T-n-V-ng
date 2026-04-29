const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the authLoading early return to also include project doc loading
content = content.replace(
  "if (authLoading) {",
  "if (authLoading || (activeProjectId && !projectOwnerId)) {"
);

fs.writeFileSync('src/App.tsx', content);
