import fs from 'fs';
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
console.log(JSON.stringify(lines.slice(6346, 6352)));
