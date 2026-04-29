const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const saveFunc = `
  const handleSaveFactionMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showFactionMemberModal || !canEdit || !activeProjectId) return;
    
    try {
      const factionId = toSlug(showFactionMemberModal.factionName);
      const fac = factions.find(f => toSlug(f.name) === factionId);
      if (!fac) return;
      
      let updatedMembers = [...fac.members];
      
      if (showFactionMemberModal.memberIdx !== undefined) {
         updatedMembers[showFactionMemberModal.memberIdx] = { ...updatedMembers[showFactionMemberModal.memberIdx], ...newFactionMember };
      } else {
         updatedMembers.push({
           name: newFactionMember.name,
           role: newFactionMember.role,
           parentId: newFactionMember.parentId || undefined
         });
         
         // Also add character if not exists
         const charExists = characters.find(c => c.name.toLowerCase() === newFactionMember.name.toLowerCase());
         if (!charExists && newFactionMember.name.trim()) {
           const newCharId = toSlug(newFactionMember.name);
           const { doc, setDoc } = require('firebase/firestore');
           await setDoc(doc(db, \`projects/\${activeProjectId}/characters\`, newCharId), withCollaboration({
             name: newFactionMember.name.trim(),
             faction: fac.name,
             role: newFactionMember.role,
             past: "Được phát hiện gia nhập " + fac.name,
             avatar: '',
             projectId: activeProjectId
           }), { merge: true });
         }
      }
      
      const { doc, setDoc } = require('firebase/firestore');
      await setDoc(doc(db, \`projects/\${activeProjectId}/factions\`, factionId), { members: updatedMembers }, { merge: true });
      setShowFactionMemberModal(null);
      setNewFactionMember({name: '', role: '', parentId: ''});
    } catch(err) {
      console.error(err);
      alert("Thiên Cơ Các gặp trục trặc khi bố trí nhân lực.");
    }
  };
`;

code = code.replace(
  "const handleSuggestArtifactAI = async () => {",
  saveFunc + "\n\n  const handleSuggestArtifactAI = async () => {"
);

// We need to inject the modal. We can put it near `showAddFaction` modal.
const modalRegex = /\{\/\* Add Faction Modal \*\/\}/;

const modalCode = `
      <AnimatePresence>
        {showFactionMemberModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-sand w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border-2 border-gold/40 relative max-h-[90vh] flex flex-col"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-wood to-gold"></div>
              
              <div className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <UserPlus className="text-sacred-orange" size={24} />
                    <h2 className="text-xl font-black text-wood tracking-tight">Bố Trí Nhân Lực</h2>
                  </div>
                  <button onClick={() => setShowFactionMemberModal(null)} className="text-wood/50 hover:text-cinnabar transition-colors p-1 bg-white/50 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); handleSaveFactionMember(e); }} className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Tên Nhâm Vật</label>
                      <input 
                        required
                        type="text" 
                        value={newFactionMember.name}
                        onChange={e => setNewFactionMember({...newFactionMember, name: e.target.value})}
                        className="w-full bg-white border border-gold/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cinnabar/20 font-bold"
                        placeholder="Ví dụ: Tả Lãnh Thiền"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Chức vụ / Tước vị</label>
                      <input 
                        required
                        type="text" 
                        value={newFactionMember.role}
                        onChange={e => setNewFactionMember({...newFactionMember, role: e.target.value})}
                        className="w-full bg-white border border-gold/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cinnabar/20"
                        placeholder="Ví dụ: Chưởng Môn, Trưởng Lão..."
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Trực thuộc (Cấp trên)</label>
                      <select 
                        value={newFactionMember.parentId || ''}
                        onChange={e => setNewFactionMember({...newFactionMember, parentId: e.target.value})}
                        className="w-full bg-white border border-gold/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cinnabar/20"
                      >
                         <option value="">-- Trực tiếp từ Bang Phái --</option>
                         {factions.find(f => f.name === showFactionMemberModal.factionName)?.members?.map((m: any, idx: number) => (
                           <option key={idx} value={m.name}>{m.name} - {m.role}</option>
                         ))}
                      </select>
                   </div>
                   
                   <div className="pt-4 flex justify-end gap-3">
                      <button type="button" onClick={() => setShowFactionMemberModal(null)} className="px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-wood/5 text-wood uppercase tracking-widest">
                        Hủy
                      </button>
                      <button type="submit" className="bg-gradient-to-r from-jade to-jade/80 text-white px-6 py-2.5 rounded-xl font-bold shadow hover:shadow-lg hover:scale-105 transition-all text-xs uppercase tracking-widest border border-jade/50">
                        {showFactionMemberModal.memberIdx !== undefined ? 'Cập Nhật' : 'Bố Trí'}
                      </button>
                   </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Faction Modal */}`;

code = code.replace(modalRegex, modalCode);

fs.writeFileSync('src/App.tsx', code);
