const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add states for faction member modal
code = code.replace(
  "const [showAddFaction, setShowAddFaction] = useState(false);",
  "const [showAddFaction, setShowAddFaction] = useState(false);\n  const [showFactionMemberModal, setShowFactionMemberModal] = useState<{factionName: string, memberIdx?: number} | null>(null);\n  const [newFactionMember, setNewFactionMember] = useState<{name: string, role: string, parentId?: string}>({name: '', role: '', parentId: ''});"
);

// 2. Change diagram-container to have SVG and new modal logic
const oldDiagramContainer = `<div className="relative flex-1 bg-white/60 border border-gold/20 rounded-2xl overflow-hidden shadow-inner diagram-container min-h-[350px]">
                      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #D4A373 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                      
                      {(viewingFaction.members || []).map((member, mIdx) => (`;

const newDiagramContainer = `<div className="relative flex-1 bg-white/60 border border-gold/20 rounded-2xl overflow-hidden shadow-inner diagram-container min-h-[350px]">
                      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #D4A373 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                      
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {(viewingFaction.members || []).map((m) => {
                          if (!m.parentId) return null;
                          const parent = (viewingFaction.members || []).find(p => p.id === m.parentId);
                          if (!parent) return null;
                          return (
                            <path 
                              key={\`line-\${m.id}-\${parent.id}\`}
                              d={\`M \${parent.x}% \${parent.y}% Q \${parent.x}% \${m.y}%, \${m.x}% \${m.y}%\`}
                              stroke="rgba(212, 163, 115, 0.8)"
                              strokeWidth="2"
                              fill="none"
                              strokeDasharray="4 2"
                            />
                          );
                        })}
                      </svg>
                      
                      {(viewingFaction.members || []).map((member, mIdx) => (`;

code = code.replace(oldDiagramContainer, newDiagramContainer);

// Update member representation to include a "Connect" and "Edit" button if canEdit
const oldMemberCard = `<div 
                             id={\`member-view-\${mIdx}\`}
                             className="flex flex-col items-center gap-1 sm:gap-2 cursor-grab active:cursor-grabbing p-1 sm:p-2 hover:bg-white/50 rounded-xl transition-colors relative group/member"
                           >`;

const newMemberCard = `<div 
                             id={\`member-view-\${mIdx}\`}
                             className="flex flex-col items-center gap-1 sm:gap-2 cursor-grab active:cursor-grabbing p-1 sm:p-2 hover:bg-white/50 rounded-xl transition-colors relative group/member z-10"
                           >
                           {canEdit && (
                             <div className="absolute -top-6 bg-white shadow-lg rounded flex gap-1 p-0.5 opacity-0 group-hover/member:opacity-100 transition-opacity pointer-events-auto">
                               <button 
                                 title="Sửa nhân lực"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setNewFactionMember({name: member.name, role: member.role, parentId: member.parentId || ''});
                                   setShowFactionMemberModal({factionName: viewingFaction.name, memberIdx: mIdx});
                                 }}
                                 className="p-1 hover:text-jade text-wood/50"
                               ><PenTool size={10} /></button>
                               <button 
                                 title="Xóa nhân lực"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   if (!canDelete) { alert('Chỉ admin mới được xóa!'); return; }
                                   if (confirm('Bỏ người này khỏi bang?')) {
                                      const updatedFactions = factions.map(f => f.name === viewingFaction.name ? { ...f, members: (f.members || []).filter((_, i) => i !== mIdx) } : f);
                                      setFactions(updatedFactions);
                                      setViewingFaction(updatedFactions.find(f => f.name === viewingFaction.name) || null);
                                   }
                                 }}
                                 className="p-1 hover:text-cinnabar text-wood/50"
                               ><Trash2 size={10} /></button>
                             </div>
                           )}`;

code = code.replace(oldMemberCard, newMemberCard);

// 3. Replace the button Thêm Cán Bộ
const oldButton = `<button 
                           onClick={() => {
                             const name = prompt("Tên thành viên:");
                             const role = prompt("Chức vụ:");
                             if (name && role) {
                                const newMember = { id: Date.now().toString(), name, role, x: 50, y: 50 };
                                const updatedFactions = factions.map(f => f.name === viewingFaction.name ? { ...f, members: [...(f.members || []), newMember] } : f);
                                setFactions(updatedFactions);
                                setViewingFaction(updatedFactions.find(f => f.name === viewingFaction.name) || null);
                             }
                           }}
                           className="text-[7px] sm:text-[9px] font-bold uppercase py-1.5 px-4 bg-jade text-white rounded-full shadow hover:bg-jade/80 transition-all flex items-center gap-1"
                        >
                           <Plus size={12} /> Thêm Cán Bộ
                        </button>`;

const newButton = `<button 
                           onClick={() => {
                             setNewFactionMember({name: '', role: '', parentId: ''});
                             setShowFactionMemberModal({factionName: viewingFaction.name});
                           }}
                           className="text-[7px] sm:text-[9px] font-bold uppercase py-1.5 px-4 bg-jade text-white rounded-full shadow hover:bg-jade/80 transition-all flex items-center gap-1"
                        >
                           <Plus size={12} /> Bố Trí Nhân Lực
                        </button>`;

code = code.replace(oldButton, newButton);


// Replace viewing faction modal rendering root... Wait, I need to add the faction member modal inside the UI!
// Just append to the end of <div className="min-h-screen bg-parchment flex font-sans text-wood overflow-hidden">
const modalJSX = `
      {showFactionMemberModal && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 w-full max-w-lg shadow-2xl relative border border-gold/30">
            <button onClick={() => setShowFactionMemberModal(null)} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-wood/40 hover:text-cinnabar transition-colors bg-white/50 rounded-full p-2">
              <X size={20} />
            </button>
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-cinnabar mb-2 brush-stroke">Bố Trí Nhân Lực</h2>
            <p className="text-xs text-wood/60 mb-6 italic">Sắp xếp vai vế trong giang hồ.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-wood/60 mb-2">Tên Nhân Vật</label>
                <input 
                  type="text" 
                  value={newFactionMember.name}
                  onChange={e => setNewFactionMember({...newFactionMember, name: e.target.value})}
                  className="w-full bg-parchment p-3 rounded-lg text-sm sm:text-base border border-gold/40 focus:border-cinnabar focus:outline-none"
                  placeholder="Nhập tên..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-wood/60 mb-2">Chức Vụ</label>
                <input 
                  type="text" 
                  value={newFactionMember.role}
                  onChange={e => setNewFactionMember({...newFactionMember, role: e.target.value})}
                  className="w-full bg-parchment p-3 rounded-lg text-sm sm:text-base border border-gold/40 focus:border-cinnabar focus:outline-none"
                  placeholder="Chức vụ..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-wood/60 mb-2">Cấp Trên Trực Tiếp</label>
                <select
                  value={newFactionMember.parentId || ''}
                  onChange={e => setNewFactionMember({...newFactionMember, parentId: e.target.value})}
                  className="w-full bg-parchment p-3 rounded-lg text-sm sm:text-base border border-gold/40 focus:border-cinnabar focus:outline-none"
                >
                  <option value="">Không có (đứng đầu)</option>
                  {(factions.find(f => f.name === showFactionMemberModal.factionName)?.members || [])
                    .filter((m, i) => i !== showFactionMemberModal.memberIdx) // Cannot be own parent
                    .map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={() => {
                  if (!newFactionMember.name || !newFactionMember.role) {
                    alert('Hãy điền tên và chức vụ!'); return;
                  }
                  
                  // Auto create character if doesn't exist
                  if (!characters.find(c => c.name.toLowerCase() === newFactionMember.name.toLowerCase())) {
                    setCharacters(prev => [...prev, {
                      name: newFactionMember.name,
                      role: newFactionMember.role,
                      faction: showFactionMemberModal.factionName,
                      description: 'Được thêm tự động từ sơ đồ quyền lực.',
                    }]);
                  }
                  
                  const targetFaction = factions.find(f => f.name === showFactionMemberModal.factionName);
                  if (!targetFaction) return;
                  
                  let newMembers = [...(targetFaction.members || [])];
                  if (showFactionMemberModal.memberIdx !== undefined) {
                    newMembers[showFactionMemberModal.memberIdx] = {
                      ...newMembers[showFactionMemberModal.memberIdx],
                      name: newFactionMember.name,
                      role: newFactionMember.role,
                      parentId: newFactionMember.parentId || undefined
                    };
                  } else {
                    newMembers.push({
                      id: Date.now().toString(),
                      name: newFactionMember.name,
                      role: newFactionMember.role,
                      x: Math.random() * 20 + 40,
                      y: Math.random() * 20 + 40,
                      parentId: newFactionMember.parentId || undefined
                    });
                  }
                  
                  const updatedFactions = factions.map(f => f.name === showFactionMemberModal.factionName ? { ...f, members: newMembers } : f);
                  setFactions(updatedFactions);
                  setViewingFaction(updatedFactions.find(f => f.name === showFactionMemberModal.factionName) || null);
                  setShowFactionMemberModal(null);
                }}
                className="w-full py-3 bg-cinnabar hover:bg-ink text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors mt-6"
              >
                Lưu Bố Trí
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace("{showUserNotice && (", modalJSX + "\n      {showUserNotice && (");

fs.writeFileSync('src/App.tsx', code);
