const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const \{ doc, setDoc \} = require\('firebase\/firestore'\);/g, '');

fs.writeFileSync('src/App.tsx', code);
