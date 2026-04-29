const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// I need to find the specific block I added in patch_faction_map.cjs
const oldSaveNewMember = `                  // Auto create character if doesn't exist
                  if (!characters.find(c => c.name.toLowerCase() === newFactionMember.name.toLowerCase())) {
                    setCharacters(prev => [...prev, {
                      name: newFactionMember.name,
                      role: newFactionMember.role,
                      faction: showFactionMemberModal.factionName,
                      description: 'Được thêm tự động từ sơ đồ quyền lực.',
                    }]);
                  }`;

const newSaveNewMember = `                  // Auto create character if doesn't exist
                  if (!characters.find(c => c.name.toLowerCase() === newFactionMember.name.toLowerCase())) {
                    const newCharSlug = newFactionMember.name.toLowerCase()
                     .normalize('NFD')
                     .replace(/[\\u0300-\\u036f]/g, '')
                     .replace(/\\s+/g, '-')
                     .replace(/[^a-z0-9-]/g, '') || String(Date.now());
                     
                    setDoc(doc(db, \`projects/\${activeProjectId}/characters\`, newCharSlug), {
                      name: newFactionMember.name,
                      role: newFactionMember.role,
                      faction: 'Trung lập',
                      description: 'Được thêm tự động từ sơ đồ quyền lực.',
                      projectId: activeProjectId,
                      _editorInfo: { userId: user ? user.uid : 'unknown', email: user ? user.email : '', timestamp: Date.now() },
                      updatedAt: Date.now()
                    });
                  }`;

code = code.replace(oldSaveNewMember, newSaveNewMember);
fs.writeFileSync('src/App.tsx', code);
