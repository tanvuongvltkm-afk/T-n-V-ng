const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldSyntax = `           // await setDoc(doc(db, \`projects/\${activeProjectId}/characters\`, newCharSlug), {
             name: newC.name,
             role: newC.role,
             faction: ['Chính phái', 'Tà phái', 'Trung lập'].includes(newC.faction) ? newC.faction : 'Trung lập',
             description: newC.description || 'Hệ thống tự động phát hiện từ cốt truyện.',
             projectId: activeProjectId,
             _editorInfo: { userId: user ? user.uid : 'unknown', email: user ? user.email : '', timestamp: Date.now() },
             updatedAt: Date.now()
           });`;

const newSyntax = `           /*
           await setDoc(doc(db, \`projects/\${activeProjectId}/characters\`, newCharSlug), {
             name: newC.name,
             role: newC.role,
             faction: ['Chính phái', 'Tà phái', 'Trung lập'].includes(newC.faction) ? newC.faction : 'Trung lập',
             description: newC.description || 'Hệ thống tự động phát hiện từ cốt truyện.',
             projectId: activeProjectId,
             _editorInfo: { userId: user ? user.uid : 'unknown', email: user ? user.email : '', timestamp: Date.now() },
             updatedAt: Date.now()
           });
           */`;

if (code.includes(oldSyntax)) {
    code = code.replace(oldSyntax, newSyntax);
    fs.writeFileSync('src/App.tsx', code, 'utf8');
    console.log("Patched successfully");
} else {
    console.log("Could not find oldSyntax");
}
