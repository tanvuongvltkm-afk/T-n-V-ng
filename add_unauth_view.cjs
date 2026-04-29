const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const unauthView = `
  if (user && !activeProjectId && !authLoading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 p-8 rounded-3xl border border-gold/30 shadow-2xl text-center space-y-6 relative overflow-hidden backdrop-blur-sm">
          <div className="w-24 h-24 bg-wood/5 rounded-full flex items-center justify-center mx-auto mb-6 transform -rotate-12 border border-wood/10 shadow-inner">
            <Castle className="text-wood" size={48} />
          </div>
          <h2 className="text-3xl font-display font-medium text-wood brush-stroke">Cửa Cốc Đã Đóng</h2>
          <div className="space-y-4 font-serif text-sm text-wood/80 text-justify">
            <p>Vị đại hiệp này, Thiên Cơ Các hiện đang đóng cửa bế quan.</p>
            <p>Danh tánh của các hạ (<span className="font-bold text-cinnabar">{user.email}</span>) chưa được ghi danh trên bảng phong thần của dự án nào.</p>
            <p>Các hạ hãy liên hệ Chủ Các (Admin) để được cấp lệnh bài truy cập!</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full mt-8 py-3 bg-white hover:bg-parchment border border-wood/20 text-wood rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
          >
            Ca Từ
          </button>
        </div>
      </div>
    );
  }
`;

content = content.replace("return (\n    <div className=\"min-h-screen", unauthView + "\n  return (\n    <div className=\"min-h-screen");

fs.writeFileSync('src/App.tsx', content);
