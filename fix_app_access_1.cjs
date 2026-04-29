const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "where('collaborators', 'array-contains', user.email || '')",
  "where('collaborators', 'array-contains', user.email?.toLowerCase() || '')"
);

content = content.replace(
  "if (snapshot.empty && !activeProjectId) {",
  `if (snapshot.empty && !activeProjectId) {
        if (user.email !== 'tanvuongvltkm@gmail.com') {
          return;
        }`
);

fs.writeFileSync('src/App.tsx', content);
