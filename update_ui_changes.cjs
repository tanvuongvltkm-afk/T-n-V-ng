const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add state for selected share role
content = content.replace(
  "const [shareEmail, setShareEmail] = useState('');",
  "const [shareEmail, setShareEmail] = useState('');\n  const [shareRole, setShareRole] = useState<'collaborator' | 'viewer'>('collaborator');"
);

// 2. Update Share Modal input area
content = content.replace(
  "<input \n                        type=\"email\"\n                        placeholder=\"Email vị huynh đệ cần mời...\"\n                        className=\"flex-1 bg-white border border-gold/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cinnabar/50 font-medium\"\n                        value={shareEmail}\n                        onChange={(e) => setShareEmail(e.target.value)}\n                        onKeyDown={(e) => e.key === 'Enter' && canShare && handleShareProject(shareEmail, 'add')}\n                      />",
  `<input 
                        type="email"
                        placeholder="Email hảo hữu..."
                        className="flex-1 bg-white border border-gold/40 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-cinnabar/50 font-medium"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && canShare && handleShareProject(shareEmail, 'add', shareRole)}
                      />
                      <select 
                        className="bg-white border border-gold/40 rounded-xl px-2 py-3 focus:outline-none focus:ring-2 focus:ring-cinnabar/50 font-medium text-xs text-wood"
                        value={shareRole}
                        onChange={(e) => setShareRole(e.target.value as 'collaborator' | 'viewer')}
                      >
                         <option value="collaborator">Cộng Tác Viên</option>
                         <option value="viewer">Khách Xem</option>
                      </select>`
);

content = content.replace(
  "onClick={() => handleShareProject(shareEmail, 'add')}",
  "onClick={() => handleShareProject(shareEmail, 'add', shareRole)}"
);

// 3. Update displaying of roles in the list
content = content.replace(
  "<span className=\"text-sm text-wood font-medium\">{email}</span>",
  "<div className=\"flex flex-col\"><span className=\"text-sm text-wood font-medium\">{email}</span><span className=\"text-[10px] uppercase text-jade\">{collaboratorRoles[email] === 'viewer' ? 'Khách Xem' : 'Cộng Tác Viên'}</span></div>"
);


// 4. Wrap the dashboard UI with early return if `!canView`
const unauthView = `
  if (user && activeProjectId && !authLoading && !canView) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl max-w-md w-full border-2 border-gold/50 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-cinnabar"></div>
          <div className="w-20 h-20 bg-parchment rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-gold/50 shadow-inner">
             <span className="text-4xl">⛩️</span>
          </div>
          <h2 className="text-2xl font-display font-black uppercase text-cinnabar tracking-widest mb-4">Cửa Cốc Đã Đóng!</h2>
          <p className="text-wood font-serif leading-relaxed italic mb-8">
            Vị đại hiệp này chưa có thiếp mời tham gia dự án này. Xin hãy liên hệ Hạc Trưởng Lão (Admin) để xin chỉ thị nhập cốc, hoặc lui bước về chốn giang hồ.
          </p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => setActiveProjectId(null)}
              className="px-6 py-2.5 bg-sand text-wood font-bold rounded-full border border-gold/50 hover:bg-gold/20 transition-all uppercase tracking-widest text-xs"
            >
              Về Trang Chủ
            </button>
            <button 
               onClick={logout}
               className="px-6 py-2.5 bg-wood text-white font-bold rounded-full border border-wood hover:bg-ink transition-all uppercase tracking-widest text-xs shadow-md"
            >
               Tẩu Thoát (Logout)
            </button>
          </div>
        </div>
      </div>
    );
  }
`;

content = content.replace(
  "return (\n    <div className=\"min-h-screen bg-sand text-ink font-sans relative overflow-x-hidden\">",
  unauthView + "\n\n  return (\n    <div className=\"min-h-screen bg-sand text-ink font-sans relative overflow-x-hidden\">"
);

fs.writeFileSync('src/App.tsx', content);
