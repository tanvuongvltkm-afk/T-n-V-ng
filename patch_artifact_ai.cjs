const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const handleSuggestArtifactAI = `
  const handleSuggestArtifactAI = async () => {
    if (!newArtifact.name) {
      alert('Vui lòng nhập tên bí bảo trước khi gọi AI gợi ý!');
      return;
    }
    try {
      const gClient = getGoogleGenAI();
      const prompt = \`Hãy đóng vai một học giả uyên bác về truyện kiếm hiệp Kim Dung và Cổ Long.
Tên bí bảo/kỳ trân: "\${newArtifact.name}"
Hãy gợi ý nguồn gốc xuất xứ (origin) và công dụng đặc biệt (effect) của bí bảo này dựa trên nguyên tác. Nếu tên này không có trong nguyên tác, hãy sáng tạo một cách logic theo phong cách kiếm hiệp.
TRẢ VỀ DUY NHẤT CHUỖI JSON THEO ĐỊNH DẠNG SAU, KHÔNG CÓ BẤT KỲ VĂN BẢN NÀO KHÁC:
{
  "origin": "nguồn gốc...",
  "effect": "công dụng..."
}\`;
      const response = await gClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt
      });
      const text = response.text || '';
      let jsonStr = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      const data = JSON.parse(jsonStr);
      setNewArtifact(prev => ({ ...prev, origin: data.origin, effect: data.effect }));
    } catch (e) {
      console.error(e);
      handleWuxiaException(e, "AI gợi ý bí bảo");
    }
  };
`;

code = code.replace("const handleAddArtifact = async (e: React.FormEvent) => {", handleSuggestArtifactAI + "\n\n  const handleAddArtifact = async (e: React.FormEvent) => {");

const oldLabelWithMic = `<div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Tên Bảo Vật</label>
                      {canEdit && (
                        <button 
                          type="button"
                          onClick={() => handleToggleGenericDictation('artifact_name', (val) => setNewArtifact({...newArtifact, name: val}), newArtifact.name || "", "Chuyển thành tên bảo vật/kỳ trân kiếm hiệp ngầu (chỉ trả về tên):\\n\\n\\"{{transcript}}\\"", true)}
                          disabled={isTranslatingSpeech && genericDictationField !== 'artifact_name'}
                          className={\`text-[9px] font-bold uppercase flex items-center transition-colors \${isListening && genericDictationField === 'artifact_name' ? 'text-red-500 animate-pulse' : 'text-jade hover:text-jade/80'}\`}
                        >
                          {isListening && genericDictationField === 'artifact_name' ? <MicOff size={10} /> : <Mic size={10} />} 
                        </button>
                      )}
                    </div>`;

const newLabelWithMic = `<div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase text-wood opacity-50 tracking-widest">Tên Bảo Vật</label>
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <button 
                            type="button"
                            onClick={handleSuggestArtifactAI}
                            className={\`text-[9px] font-bold uppercase flex items-center transition-colors text-sacred-orange hover:text-sacred-orange/80\`}
                            title="Gợi ý dữ liệu Kim Dung / Cổ Long từ Tên Bí Bảo"
                          >
                            <Sparkles size={10} className="mr-1" /> AI Gợi Ý
                          </button>
                        )}
                        {canEdit && (
                          <button 
                            type="button"
                            onClick={() => handleToggleGenericDictation('artifact_name', (val) => setNewArtifact({...newArtifact, name: val}), newArtifact.name || "", "Chuyển thành tên bảo vật/kỳ trân kiếm hiệp ngầu (chỉ trả về tên):\\n\\n\\"{{transcript}}\\"", true)}
                            disabled={isTranslatingSpeech && genericDictationField !== 'artifact_name'}
                            className={\`text-[9px] font-bold uppercase flex items-center transition-colors \${isListening && genericDictationField === 'artifact_name' ? 'text-red-500 animate-pulse' : 'text-jade hover:text-jade/80'}\`}
                          >
                            {isListening && genericDictationField === 'artifact_name' ? <MicOff size={10} /> : <Mic size={10} />} 
                          </button>
                        )}
                      </div>
                    </div>`;

code = code.replace(oldLabelWithMic, newLabelWithMic);

fs.writeFileSync('src/App.tsx', code);
