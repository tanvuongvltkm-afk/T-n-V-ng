const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add collaboratorRoles state
content = content.replace(
  "const [collaborators, setCollaborators] = useState<string[]>([]);",
  "const [collaborators, setCollaborators] = useState<string[]>([]);\n  const [collaboratorRoles, setCollaboratorRoles] = useState<Record<string, 'collaborator' | 'viewer'>>({});"
);

// 2. Load collaboratorRoles
content = content.replace(
  "setCollaborators(projectData.collaborators || []);",
  "setCollaborators(projectData.collaborators || []);\n        setCollaboratorRoles(projectData.collaboratorRoles || {});"
);

// 3. Redefine access booleans
content = content.replace(
  "const canEdit = Boolean(isProjectOwner || (user?.email && collaborators.includes(user.email)) || user?.email === 'tanvuongvltkm@gmail.com');\n  const canShare = Boolean(isProjectOwner || user?.email === 'tanvuongvltkm@gmail.com');",
  `const currentUserEmail = user?.email?.toLowerCase();
  const isAdmin = Boolean(isProjectOwner || currentUserEmail === 'tanvuongvltkm@gmail.com');
  const _roleInProject = currentUserEmail ? collaboratorRoles[currentUserEmail] : null;
  // If no specific role is found but email is in collaborators (legacy), default to collaborator
  const userRole = isAdmin ? 'admin' : (_roleInProject ? _roleInProject : (currentUserEmail && collaborators.includes(currentUserEmail) ? 'collaborator' : null));
  
  const canEdit = isAdmin || userRole === 'collaborator';
  const canDelete = isAdmin;
  const canEditUI = isAdmin;
  const canShare = isAdmin;
  const canView = isAdmin || userRole === 'collaborator' || userRole === 'viewer';`
);

// 4. withCollaboration should include collaboratorRoles
content = content.replace(
  "collaborators: collaborators || []\n  });",
  "collaborators: collaborators || [],\n    collaboratorRoles: collaboratorRoles || {}\n  });"
);

// 5. Replace canEdit with canDelete where appropriate
content = content.replace(/if \(!activeProjectId \|\| !canEdit\) return;\n    try \{\n      const ref = doc\(db, \`projects\/\$\{activeProjectId\}\/\$\{col\}\`, docId\);\n      await deleteDoc\(ref\);/g, 
  "if (!activeProjectId || !canDelete) return;\n    try {\n      const ref = doc(db, `projects/${activeProjectId}/${col}`, docId);\n      await deleteDoc(ref);"
);
content = content.replace(/if \(!canEdit \|\| !activeProjectId\) return;\n    setConfirmDialog\(\{\n      message: `Bạn có chắc muốn xóa nhân vật/g, 
  "if (!canDelete || !activeProjectId) return;\n    setConfirmDialog({\n      message: `Bạn có chắc muốn xóa nhân vật"
);
content = content.replace(/if \(!canEdit \|\| !activeProjectId\) return;\n    setConfirmDialog\(\{\n      message: `Bạn có chắc muốn giải tán bang phái/g, 
  "if (!canDelete || !activeProjectId) return;\n    setConfirmDialog({\n      message: `Bạn có chắc muốn giải tán bang phái"
);
content = content.replace(/if \(!canEdit \|\| !activeProjectId\) return;\n    setConfirmDialog\(\{\n      message: `Bạn có chắc muốn tiêu hủy\/xóa bỏ bí/g, 
  "if (!canDelete || !activeProjectId) return;\n    setConfirmDialog({\n      message: `Bạn có chắc muốn tiêu hủy/xóa bỏ bí"
);

// Deleting episodes
content = content.replace(
  "onClick={(e) => {\n                                      e.stopPropagation();\n                                      setConfirmDialog({\n                                        message: `Xóa tập \"${ep.title}\"?`,",
  "onClick={(e) => {\n                                      e.stopPropagation();\n                                      if (!canDelete) { alert('Chỉ có Admin mới có quyền xóa!'); return; }\n                                      setConfirmDialog({\n                                        message: `Xóa tập \"${ep.title}\"?`,"
);

// Deleting extra stories
content = content.replace(
  "onClick={(e) => {\n                                      e.stopPropagation();\n                                      setConfirmDialog({\n                                        message: `Xóa ngoại truyện \"${story.title}\"?`,",
  "onClick={(e) => {\n                                      e.stopPropagation();\n                                      if (!canDelete) { alert('Chỉ có Admin mới có quyền xóa!'); return; }\n                                      setConfirmDialog({\n                                        message: `Xóa ngoại truyện \"${story.title}\"?`,"
);
content = content.replace(
  "onClick={(e) => {\n                                      e.stopPropagation();\n                                      setConfirmDialog({\n                                        message: `Xóa ký ức \"${memory.title}\"?`,",
  "onClick={(e) => {\n                                      e.stopPropagation();\n                                      if (!canDelete) { alert('Chỉ có Admin mới có quyền xóa!'); return; }\n                                      setConfirmDialog({\n                                        message: `Xóa ký ức \"${memory.title}\"?`,"
);

// Empty trash
content = content.replace(
  "onClick={() => {\n                                              setConfirmDialog({\n                                                message: 'Xóa vĩnh viễn phân cảnh này khỏi giang hồ?',",
  "onClick={() => {\n                                              if (!canDelete) { alert('Chỉ có Admin mới có quyền xóa!'); return; }\n                                              setConfirmDialog({\n                                                message: 'Xóa vĩnh viễn phân cảnh này khỏi giang hồ?',"
);


// Note: I will use regex or careful strings for the UI changes
fs.writeFileSync('src/App.tsx', content);
