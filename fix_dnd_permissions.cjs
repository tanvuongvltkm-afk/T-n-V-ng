const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "const onDragEnd = (result: any) => {",
  "const onDragEnd = (result: any) => {\n    if (!canEdit) return;"
);

// We should also disable dragging on the UI
content = content.replace(/<Draggable draggableId=\{.*?\} index=\{.*?\}>/g, (match) => {
  return match.replace(">", " isDragDisabled={!canEdit}>");
});

fs.writeFileSync('src/App.tsx', content);
