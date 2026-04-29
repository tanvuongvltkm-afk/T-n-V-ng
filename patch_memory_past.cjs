const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldHandleSaveNewMemory = `    try {
      await setDoc(doc(db, \`projects/\${activeProjectId}/episodes\`, \`memory-\${memoryId}\`), withCollaboration({
        ...newEp,
        id: memoryId,
        projectId: activeProjectId
      }));
      setNewEpisodePayload({ title: '', content: '' });
      setShowAddMemoryModal(false);
    } catch (e) {`;

const newHandleSaveNewMemory = `    try {
      await setDoc(doc(db, \`projects/\${activeProjectId}/episodes\`, \`memory-\${memoryId}\`), withCollaboration({
        ...newEp,
        id: memoryId,
        projectId: activeProjectId
      }));
      
      // Tự động cập nhật vào quá khứ của nhân vật
      if (newEpisodePayload.characterName) {
        const targetChar = characters.find(c => c.name === newEpisodePayload.characterName);
        if (targetChar) {
           const charId = toSlug(targetChar.name);
           const newPastInfo = \`[KÝ ỨC: \${newEpisodePayload.title}]\\n\${newEpisodePayload.content}\`;
           const updatedPast = targetChar.past ? (targetChar.past + '\\n\\n' + newPastInfo) : newPastInfo;
           
           await updateDoc(doc(db, \`projects/\${activeProjectId}/characters\`, charId), {
             past: updatedPast
           });
        }
      }

      setNewEpisodePayload({ title: '', content: '' });
      setShowAddMemoryModal(false);
    } catch (e) {`;

code = code.replace(oldHandleSaveNewMemory, newHandleSaveNewMemory);

fs.writeFileSync('src/App.tsx', code);
