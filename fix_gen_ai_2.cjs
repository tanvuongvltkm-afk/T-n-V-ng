const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const handleSuggestArtifactAI \= async \(\) \=\> \{[\s\S]*?handleWuxiaException\(e\, "AI gợi ý bí bảo"\);\s*\}/g;

const newFunc = `const handleSuggestArtifactAI = async () => {
    if (!newArtifact.name) {
      alert('Vui lòng nhập tên bí bảo trước khi gọi AI gợi ý!');
      return;
    }
    try {
      const apiKey = (import.meta.env?.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY) as string;
      if (!apiKey) {
        alert("Thiếu cấu hình GEMINI_API_KEY.");
        return;
      }
      const ai = new (require('@google/genai').GoogleGenAI)({ apiKey });
      
      const prompt = \`Hãy đóng vai một học giả uyên bác về truyện kiếm hiệp Kim Dung và Cổ Long.
Tên bí bảo/kỳ trân: "\${newArtifact.name}"
Hãy gợi ý nguồn gốc xuất xứ (origin) và công dụng đặc biệt (effect) của bí bảo này dựa trên nguyên tác. Nếu tên này không có trong nguyên tác, hãy sáng tạo một cách logic theo phong cách kiếm hiệp.
TRẢ VỀ DUY NHẤT CHUỖI JSON THEO ĐỊNH DẠNG SAU, KHÔNG CÓ BẤT KỲ VĂN BẢN NÀO KHÁC:
{
  "origin": "nguồn gốc...",
  "effect": "công dụng..."
}\`;
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt
      });
      const text = response.text || '';
      let jsonStr = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      const data = JSON.parse(jsonStr);
      setNewArtifact(prev => ({ ...prev, origin: data.origin || prev.origin, effect: data.effect || prev.effect }));
    } catch (e) {
      console.error(e);
    }
  }`;

code = code.replace(regex, newFunc);

fs.writeFileSync('src/App.tsx', code);
