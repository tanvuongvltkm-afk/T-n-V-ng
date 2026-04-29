const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace Sửa Tên Cảnh with {canEdit &&}
content = content.replace(
  /<button\s+onClick=\{\(\) => \{\n\s+setEditingEpisodeId\(ep\.id\);\n\s+setEditingEpisodeTitle\(ep\.title\);\n\s+\}\}\n\s+className="px-3 py-1\.5 bg-white border border-gold\/30 text-wood\/60 hover:text-cinnabar/g,
  "{canEdit && <button \n                                                                onClick={() => {\n                                                                  setEditingEpisodeId(ep.id);\n                                                                  setEditingEpisodeTitle(ep.title);\n                                                                }}\n                                                                className=\"px-3 py-1.5 bg-white border border-gold/30 text-wood/60 hover:text-cinnabar"
);

// Replace Xóa Cảnh with {canDelete &&}
content = content.replace(
  /<button\s+onClick=\{\(e\) => \{\n\s+e\.stopPropagation\(\);\n\s+setConfirmDialog\(\{\n\s+message: `Bạn có chắc chắn muốn xóa cảnh "\$\{ep\.title\}"\?`,\n\s+onConfirm: \(\) => deleteSubDoc\('episodes', ep\.id as string\)\n\s+\}\);\n\s+\}\}\n\s+className="px-3 py-1\.5 bg-white border border-gold\/30 text-wood\/60 hover:text-cinnabar hover:border-cinnabar\/30 rounded-lg text-\[9px\] font-bold uppercase tracking-widest transition-all flex items-center gap-2"\n\s+>\n\s+<Trash2 size=\{12\} \/> Xóa Cảnh\n\s+<\/button>/g,
  "{canDelete && <button \n                                                                onClick={(e) => {\n                                                                  e.stopPropagation();\n                                                                  if (!canDelete) { alert('Chỉ admin mới có quyền xóa!'); return; }\n                                                                  setConfirmDialog({\n                                                                    message: `Bạn có chắc chắn muốn xóa cảnh \"${ep.title}\"?`,\n                                                                    onConfirm: () => deleteSubDoc('episodes', ep.id as string)\n                                                                  });\n                                                                }}\n                                                                className=\"px-3 py-1.5 bg-white border border-gold/30 text-wood/60 hover:text-cinnabar hover:border-cinnabar/30 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2\"\n                                                              >\n                                                                <Trash2 size={12} /> Xóa Cảnh\n                                                              </button>}"
).replace("</button>}", "</button>\n                                                              }"); // Fix closing tag format

fs.writeFileSync('src/App.tsx', content);
