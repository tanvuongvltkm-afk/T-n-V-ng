const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regexes = [
    /\.\.\.arcData,\n\s*projectId: activeProjectId\n\s*\}\)(?: as any)?\);/g,
    /\.\.\.newEp,\n\s*projectId: activeProjectId\n\s*\}\)(?: as any)?\);/g,
];

regexes.forEach(r => {
    code = code.replace(r, '/* (skipped) */');
});

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log("Done");
