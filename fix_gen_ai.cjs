const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldAiFunc = `  const handleSuggestArtifactAI = async () => {
    if (!newArtifact.name) {
      alert('Vui lòng nhập tên bí bảo trước khi gọi AI gợi ý!');
      return;
    }
    try {
      const gClient = getGoogleGenAI();
      const prompt = \\\`Hãy đóng vai một học giả uyên bác về truyện kiếm hiệp Kim Dung và Cổ Long.
Tên bí bảo/kỳ trân: "\\\${newArtifact.name}"
Hãy gợi ý nguồn gốc xuất xứ (origin) và công dụng đặc biệt (effect) của bí bảo này dựa trên nguyên tác. Nếu tên này không có trong nguyên tác, hãy sáng tạo một cách logic theo phong cách kiếm hiệp.
TRẢ VỀ DUY NHẤT CHUỖI JSON THEO ĐỊNH DẠNG SAU, KHÔNG CÓ BẤT KỲ VĂN BẢN NÀO KHÁC:
{
  "origin": "nguồn gốc...",
  "effect": "công dụng..."
}\\\`;
      const response = await gClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt
      });
      const text = response.text || '';
      let jsonStr = text.replace(/\\\`\\\`\\\`json/g, '').replace(/\\\`\\\`\\\`/g, '').trim();
      const data = JSON.parse(jsonStr);
      setNewArtifact(prev => ({ ...prev, origin: data.origin, effect: data.effect }));
    } catch (e) {
      console.error(e);
      handleWuxiaException(e, "AI gợi ý bí bảo");
    }
  };`;

const newAiFunc = `  const handleSuggestArtifactAI = async () => {
    if (!newArtifact.name) {
      alert('Vui lòng nhập tên bí bảo trước khi gọi AI gợi ý!');
      return;
    }
    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        alert("Thiếu cấu hình GEMINI_API_KEY.");
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      
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
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      let jsonStr = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      const data = JSON.parse(jsonStr);
      setNewArtifact(prev => ({ ...prev, origin: data.origin, effect: data.effect }));
    } catch (e) {
      console.error(e);
      handleWuxiaException(e, "AI gợi ý bí bảo");
    }
  };`;

code = code.replace(oldAiFunc, newAiFunc);
fs.writeFileSync('src/App.tsx', code);
