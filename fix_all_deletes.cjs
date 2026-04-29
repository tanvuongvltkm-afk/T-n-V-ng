const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace all trash buttons without check
const buttonsToProtect = [
  // Arc delete
  {
    search: "onClick={(e) => {\n                                                  e.stopPropagation();\n                                                  setConfirmDialog({\n                                                    message: `Bạn có chắc chắn muốn xóa hồi phim \"${arc.title}\"?`",
    replace: "onClick={(e) => {\n                                                  e.stopPropagation();\n                                                  if (!canDelete) { alert('Chỉ admin mới có quyền xóa!'); return; }\n                                                  setConfirmDialog({\n                                                    message: `Bạn có chắc chắn muốn xóa hồi phim \"${arc.title}\"?`"
  },
  {
    search: "onClick={() => {\n                                                              setConfirmDialog({\n                                                                message: `Bạn có chắc chắn muốn xóa cảnh \"${scene.point}\"? Cảnh sát sẽ bị mất. Vẫn xóa?`",
    replace: "onClick={() => {\n                                                              if (!canDelete) { alert('Chỉ admin mới có quyền xóa!'); return; }\n                                                              setConfirmDialog({\n                                                                message: `Bạn có chắc chắn muốn xóa cảnh \"${scene.point}\"? Cảnh sát sẽ bị mất. Vẫn xóa?`"
  },
  {
    search: "onClick={(e) => {\n                                    e.stopPropagation();\n                                    setConfirmDialog({\n                                      message: `Xóa ngoại truyện \"${story.title}\"?`",
    replace: "onClick={(e) => {\n                                    e.stopPropagation();\n                                    if (!canDelete) { alert('Chỉ admin mới có quyền xóa!'); return; }\n                                    setConfirmDialog({\n                                      message: `Xóa ngoại truyện \"${story.title}\"?`"
  },
  {
    search: "onClick={(e) => {\n                                    e.stopPropagation();\n                                    setConfirmDialog({\n                                      message: `Xóa ký ức \"${memory.title}\"?`",
    replace: "onClick={(e) => {\n                                    e.stopPropagation();\n                                    if (!canDelete) { alert('Chỉ admin mới có quyền xóa!'); return; }\n                                    setConfirmDialog({\n                                      message: `Xóa ký ức \"${memory.title}\"?`"
  },
  {
    search: "onClick={(e) => {\n                                                  e.stopPropagation();\n                                                  if (confirm(`Xóa nhân vật ${char.name}?`))",
    replace: "onClick={(e) => {\n                                                  e.stopPropagation();\n                                                  if (!canDelete) { alert('Chỉ admin mới có quyền xóa!'); return; }\n                                                  if (confirm(`Xóa nhân vật ${char.name}?`))"
  },
  {
    search: "onClick={(e) => { e.stopPropagation(); handleDeleteFaction(fac.id || toSlug(fac.name), fac.name); }}",
    replace: "onClick={(e) => { e.stopPropagation(); if (!canDelete) { alert('Chỉ admin mới có quyền xóa!'); return; } handleDeleteFaction(fac.id || toSlug(fac.name), fac.name); }}"
  },
  {
    search: "onClick={(e) => { e.stopPropagation(); handleDeleteArtifact(artifact.id || toSlug(artifact.name), artifact.name); }}",
    replace: "onClick={(e) => { e.stopPropagation(); if (!canDelete) { alert('Chỉ admin mới có quyền xóa!'); return; } handleDeleteArtifact(artifact.id || toSlug(artifact.name), artifact.name); }}"
  },
  {
    search: "onClick={() => handleShareProject(email, 'remove')}",
    replace: "onClick={() => { if (!canShare) { alert('Không có quyền chia sẻ!'); return; } handleShareProject(email, 'remove'); }}"
  }
];

buttonsToProtect.forEach(({search, replace}) => {
  content = content.replace(search, replace);
});

// For delete elements inside canEdit, if we just alert instead of hiding, it works well.
// Wait, `handleDeleteCharacter`, `handleDeleteFaction`, `handleDeleteArtifact` are handlers. I can just secure the handlers too:
content = content.replace("const handleDeleteCharacter = async (id: string, name: string) => {", "const handleDeleteCharacter = async (id: string, name: string) => {\n    if (!canDelete) return;");
content = content.replace("const handleDeleteFaction = async (id: string, name: string) => {", "const handleDeleteFaction = async (id: string, name: string) => {\n    if (!canDelete) return;");
content = content.replace("const handleDeleteArtifact = async (id: string, name: string) => {", "const handleDeleteArtifact = async (id: string, name: string) => {\n    if (!canDelete) return;");

fs.writeFileSync('src/App.tsx', content);
