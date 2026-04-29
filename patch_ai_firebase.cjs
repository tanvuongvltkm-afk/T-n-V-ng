const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldAiSave = `      let addedNew = false;
      newCharsFromAI.forEach((newC: any) => {
        if (!updatedChars.find(c => c.name.toLowerCase() === newC.name.toLowerCase())) {
           addedNew = true;
           updatedChars.push({
             name: newC.name,
             role: newC.role,
             faction: ['Chính phái', 'Tà phái', 'Trung lập'].includes(newC.faction) ? newC.faction : 'Trung lập',
             description: newC.description || 'Hệ thống tự động phát hiện từ cốt truyện.',
           });
        }
      });

      if (addedNew) {
         alert(\`Đã tự động phát hiện và thêm \${newCharsFromAI.length} nhân vật mới từ tập này!\`);
      }
      
      setCharacters(updatedChars);`;

const newAiSave = `      let addedNewCount = 0;
      for (const newC of newCharsFromAI) {
        if (!updatedChars.find(c => c.name.toLowerCase() === newC.name.toLowerCase())) {
           addedNewCount++;
           
           const newCharSlug = newC.name.toLowerCase()
                     .normalize('NFD')
                     .replace(/[\\u0300-\\u036f]/g, '')
                     .replace(/\\s+/g, '-')
                     .replace(/[^a-z0-9-]/g, '') || String(Date.now());
                     
           await setDoc(doc(db, \`projects/\${activeProjectId}/characters\`, newCharSlug), {
             name: newC.name,
             role: newC.role,
             faction: ['Chính phái', 'Tà phái', 'Trung lập'].includes(newC.faction) ? newC.faction : 'Trung lập',
             description: newC.description || 'Hệ thống tự động phát hiện từ cốt truyện.',
             projectId: activeProjectId,
             _editorInfo: { userId: user ? user.uid : 'unknown', email: user ? user.email : '', timestamp: Date.now() },
             updatedAt: Date.now()
           });
        }
      }

      if (addedNewCount > 0) {
         alert(\`Đã tự động phát hiện và thêm \${addedNewCount} nhân vật mới từ tập này!\`);
      }
      
      // Save changes to timelines
      for (const char of updatedChars) {
        if (changes.some((ch:any) => ch.name === char.name)) {
          const charSlug = char.name.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          await updateDoc(doc(db, \`projects/\${activeProjectId}/characters\`, charSlug), {
            stateTimeline: char.stateTimeline
          }).catch(console.error);
        }
      }`;

code = code.replace(oldAiSave, newAiSave);
fs.writeFileSync('src/App.tsx', code);
