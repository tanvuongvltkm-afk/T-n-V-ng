const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Update `handleShareProject` implementation
const newShareFuncContent = `
  const handleShareProject = async (targetEmail: string, action: 'add' | 'remove', role: 'collaborator' | 'viewer' = 'collaborator') => {
    if (!activeProjectId || !user) return;
    setIsSharing(true);
    try {
      const emailLower = targetEmail.toLowerCase().trim();
      if (!emailLower) return;
      
      const newCollaborators = action === 'add' 
        ? Array.from(new Set([...collaborators, emailLower]))
        : collaborators.filter(e => e !== emailLower);
        
      const newRoles = { ...collaboratorRoles };
      if (action === 'add') {
         newRoles[emailLower] = role;
      } else {
         delete newRoles[emailLower];
      }
      
      const batch = writeBatch(db);
      const projectRef = doc(db, 'projects', activeProjectId);
      batch.update(projectRef, { 
        collaborators: newCollaborators,
        collaboratorRoles: newRoles,
        updatedAt: new Date().toISOString()
      });
      
      // Update all collections to include new collaborators for Pillar 8 list rules
      const syncCollections = ['episodes', 'characters', 'arcs', 'factions', 'artifacts'];
      for (const colName of syncCollections) {
        const colRef = collection(db, \`projects/\${activeProjectId}/\${colName}\`);
        const snap = await getDocs(colRef);
        snap.forEach((docSnap) => {
          batch.update(docSnap.ref, { collaborators: newCollaborators, collaboratorRoles: newRoles });
        });
      }
      
      await batch.commit();
      setCollaborators(newCollaborators);
      setCollaboratorRoles(newRoles);
      setShareEmail('');
      if (action === 'add') alert(\`Đã thiết lập quyền \${role === 'collaborator' ? 'Cộng Tác Viên' : 'Khách Xem'} cho \${emailLower}\`);
    } catch (e) {
      console.error(e);
      alert("Thiên Cơ Các gặp trục trặc khi thao tác.");
    } finally {
      setIsSharing(false);
    }
  };`;

content = content.replace(
  /const handleShareProject = async \(targetEmail: string, action: 'add' \| 'remove'\) => \{[\s\S]*?setIsSharing\(false\);\n    \}\n  \};\n/,
  newShareFuncContent + '\n'
);


fs.writeFileSync('src/App.tsx', content);
