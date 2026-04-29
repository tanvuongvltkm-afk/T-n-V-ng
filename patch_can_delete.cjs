const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const canDelete = isAdmin;",
  "const canDelete = currentUserEmail === 'tanvuongvltkm@gmail.com';"
);

// Admin in this project context means: Super Admin OR Project Owner OR 'admin' role
code = code.replace(
  "const canEditUI = isAdmin;",
  "const canEditUI = isAdmin || userRole === 'admin';"
);

code = code.replace(
  "const canShare = isAdmin;",
  "const canShare = isAdmin || userRole === 'admin';"
);

// Update userRole to allow 'admin' from roles
code = code.replace(
  "const userRole = isAdmin ? 'admin' : (_roleInProject ? _roleInProject : (currentUserEmail && collaborators.includes(currentUserEmail) ? 'collaborator' : null));",
  "const userRole = isAdmin ? 'admin' : (_roleInProject ? _roleInProject : (currentUserEmail && collaborators.includes(currentUserEmail) ? 'collaborator' : null));"
); // well it's already there

// Wait! If userRole is 'admin' for project collaborator admin, canEdit should include it
code = code.replace(
  "const canEdit = isAdmin || userRole === 'collaborator';",
  "const canEdit = isAdmin || userRole === 'admin' || userRole === 'collaborator';"
);

fs.writeFileSync('src/App.tsx', code);
