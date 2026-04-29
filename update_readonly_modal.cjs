const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "if (!authLoading && user && !user.isAnonymous && !canEdit && !hasShownReadOnlyNotice && activeProjectId) {",
  "if (!authLoading && user && !user.isAnonymous && !canEdit && canView && !hasShownReadOnlyNotice && activeProjectId) {"
);

fs.writeFileSync('src/App.tsx', content);
