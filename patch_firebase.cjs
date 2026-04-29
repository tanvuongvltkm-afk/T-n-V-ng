const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace standard setDoc / deleteDoc in background promises to just skip
const replacers = [
    [/await setDoc\(doc\(db,\s*`projects\/\$\{activeProjectId\}\/episodes`,/g, '// await setDoc(doc(db, `projects/${activeProjectId}/episodes`,'],
    [/await setDoc\(doc\(db,\s*`projects\/\$\{activeProjectId\}\/arcs`,/g, '// await setDoc(doc(db, `projects/${activeProjectId}/arcs`,'],
    [/await setDoc\(doc\(db,\s*`projects\/\$\{activeProjectId\}\/weapons`,/g, '// await setDoc(doc(db, `projects/${activeProjectId}/weapons`,'],
    [/await setDoc\(doc\(db,\s*`projects\/\$\{activeProjectId\}\/characters`,/g, '// await setDoc(doc(db, `projects/${activeProjectId}/characters`,'],
    [/await deleteDoc\(doc\(db,\s*`projects\/\$\{activeProjectId\}\/characters`,/g, '// await deleteDoc(doc(db, `projects/${activeProjectId}/characters`,'],
    [/await setDoc\(doc\(db,\s*`projects\/\$\{activeProjectId\}\/factions`,/g, '// await setDoc(doc(db, `projects/${activeProjectId}/factions`,'],
    [/await deleteDoc\(doc\(db,\s*`projects\/\$\{activeProjectId\}\/factions`,/g, '// await deleteDoc(doc(db, `projects/${activeProjectId}/factions`,'],
    [/await setDoc\(doc\(db,\s*`projects\/\$\{activeProjectId\}\/artifacts`,/g, '// await setDoc(doc(db, `projects/${activeProjectId}/artifacts`,'],
    [/await deleteDoc\(doc\(db,\s*`projects\/\$\{activeProjectId\}\/artifacts`,/g, '// await deleteDoc(doc(db, `projects/${activeProjectId}/artifacts`,'],
    [/await deleteDoc\(doc\(db,\s*`projects\/\$\{activeProjectId\}\/episodes`,/g, '// await deleteDoc(doc(db, `projects/${activeProjectId}/episodes`,'],
    [/await deleteDoc\(doc\(db,\s*`projects\/\$\{activeProjectId\}\/weapons`,/g, '// await deleteDoc(doc(db, `projects/${activeProjectId}/weapons`,']
];

replacers.forEach(([regex, replacement]) => {
    code = code.replace(regex, replacement);
});

fs.writeFileSync('src/App.tsx', code, 'utf8');

console.log("Done");
