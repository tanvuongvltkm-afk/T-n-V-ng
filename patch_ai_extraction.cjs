const fs = require('fs');

// Patch geminiService.ts
let service = fs.readFileSync('src/services/geminiService.ts', 'utf8');

const oldExtract = `export const extractCharacterChanges = async (episodeId: number, summary: string[], characters: any[]) => {
  const prompt = \`
    Dựa trên tóm tắt tập phim sau:
    "\${summary.join(". ")}"

    Hãy xác định xem các nhân vật sau đây có biến cố gì quan trọng trong tập này không (VD: Bị thương, mất tích, tăng tiến võ công, thay đổi tâm tính, nhận vật phẩm...).

    NHÂN VẬT:
    \${characters.map(c => c.name).join(", ")}

    YÊU CẦU:
    Trả về định dạng JSON mảng các đối tượng:
    [
      { "name": "Tên nhân vật", "change": "Mô tả BIẾN CỐ SONG NGỮ (VIETNAMESE | ENGLISH)" }
    ]
    Ví dụ: "Bị thương nặng trong rừng | Severely injured in the forest"
    Chỉ trả về những nhân vật CÓ biến cố. Nếu không có ai biến cố, trả về mảng rỗng [].
    KHÔNG trả về bất kỳ giải thích nào khác ngoài JSON.
  \`;`;

const newExtract = `export const extractCharacterChanges = async (episodeId: number, summary: string[], characters: any[]) => {
  const prompt = \`
    Dựa trên tóm tắt tập phim sau:
    "\${summary.join(". ")}"

    THÔNG TIN HIỆN CÓ:
    \${characters.map(c => c.name).join(", ")}

    YÊU CẦU:
    1. Xác định biến cố cùa các nhân vật ĐÃ CÓ trong danh sách (VD: Bị thương, tăng tiến võ công, nhận vật phẩm).
    2. Đọc mạch truyện và PHÁT HIỆN TỰ ĐỘNG các NHÂN VẬT MỚI (nếu có) xuất hiện trong mạch truyện mà chưa có trong danh sách trên. (Có thể là phái phụ, nhân vật qua đường nhưng vai trò nhỏ/lớn tùy ý).
    
    Trả về định dạng JSON DUY NHẤT chứa 2 mảng:
    {
      "changes": [
        { "name": "Tên nhân vật cũ", "change": "Mô tả biến cố ngắn gọn tiếng Việt (VD: Bị chém đứt tay)" }
      ],
      "newCharacters": [
        { "name": "Tên nhân vật mới", "role": "Vai trò/Chức vụ (VD: Trưởng lão, sư muội)", "faction": "Chọn 1 trong: Chính phái, Tà phái, Trung lập", "description": "Mô tả tóm tắt lai lịch/hiện trạng từ truyện" }
      ]
    }
    NẾU KHÔNG CÓ THAY ĐỔI HAY NHÂN VẬT MỚI THÌ TRẢ VỀ MẢNG RỖNG TƯƠNG ỨNG. KHÔNG CÓ VĂN BẢN NGOÀI JSON.
  \`;`;

service = service.replace(oldExtract, newExtract);

// Update try-catch return inside geminiService to match new structure
service = service.replace(
  `// Clean JSON response (Markdown guard removal)
    const text = response.text || "[]";
    const jsonStr = text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Character Change Extraction Error:", error);
    return [];
  }`,
  `// Clean JSON response (Markdown guard removal)
    const text = response.text || "{}";
    const jsonStr = text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Character Change Extraction Error:", error);
    return { changes: [], newCharacters: [] };
  }`
);
fs.writeFileSync('src/services/geminiService.ts', service);


// Patch App.tsx handleAIExtractChanges
let app = fs.readFileSync('src/App.tsx', 'utf8');

const oldHandleExtract = `  const handleAIExtractChanges = async (ep: Episode) => {
    if (!canEdit) return;
    setIsExtractingChanges(ep.id);
    try {
      const changes = await extractCharacterChanges(ep.id, ep.summary, characters);
      const updatedChars = [...characters];
      
      changes.forEach((changeData: any) => {`;

const newHandleExtract = `  const handleAIExtractChanges = async (ep: Episode) => {
    if (!canEdit) return;
    setIsExtractingChanges(ep.id);
    try {
      const data = await extractCharacterChanges(ep.id, ep.summary, characters);
      const changes = Array.isArray(data) ? data : data.changes || [];
      const newCharsFromAI = data.newCharacters || [];
      
      const updatedChars = [...characters];
      
      changes.forEach((changeData: any) => {`;
      
app = app.replace(oldHandleExtract, newHandleExtract);      

const oldCharsLoop = `        }
      });
      
      setCharacters(updatedChars);`;

const newCharsLoop = `        }
      });

      let addedNew = false;
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

app = app.replace(oldCharsLoop, newCharsLoop);

fs.writeFileSync('src/App.tsx', app);
