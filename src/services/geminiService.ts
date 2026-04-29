import { GoogleGenAI } from "@google/genai";
import { Episode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateScriptSuggestion = async (episode: Episode, characters: any[], factions: any[]) => {
  const worldContext = `
Danh sách cao thủ:
${characters.map(c => `- ${c.name} (${c.role}, ${c.faction}): ${c.personality || 'Chưa rõ'}. Võ: ${[c.martialArtsBeginner, c.martialArtsIntermediate, c.martialArtsAdvanced, c.martialArtsSpecial].filter(m => m).join(', ')}. Trang phục: ${c.attire || 'Chưa rõ'}`).join('\n')}

Thế lực:
${factions.map(f => `- ${f.name}: ${f.description}`).join('\n')}
  `;

  const prompt = `
    Bạn là một nhà biên kịch phim kiếm hiệp chuyên nghiệp. 
    Dựa trên bối cảnh giang hồ:
    ${worldContext}

    Hãy viết một bản kịch bản chi tiết cho cảnh phim sau đây theo phong cách "Cổ phong", "Nghĩa hiệp", "Hùng tráng".
    
    Trong kịch bản, hãy chú trọng vào việc thể hiện đúng tính cách, phục trang và võ công của từng nhân vật khi họ xuất hiện.
    
    Cảnh ${episode.id}: ${episode.title}
    Tập: ${episode.arc}
    Danh sách các Phân đoạn diễn biến: ${episode.summary.join(". ")}
    
    Kịch bản phải được trình bày SONG NGỮ (Vietnamese - English) theo cấu trúc:
    [Nội dung tiếng Việt]
    ---
    [English Translation]

    Kịch bản bao gồm:
    1. Bối cảnh (Mô tả không gian, thời gian, không khí).
    2. Chi tiết kịch bản cho từng Phân đoạn (Đặc biệt mô tả võ thuật và thần thái, y phục phù hợp với thiết lập).
    3. Lời thoại tiêu biểu (Sâu sắc, mang đậm tính triết lý kiếm hiệp).
    4. Gợi ý nhạc phim.
    
    Hãy viết bằng ngôn ngữ chau chuốt, bay bổng ở cả hai phiên bản.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      }
    });

    return response.text || "Không thể khởi tạo kịch bản lúc này.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Phát sinh lỗi khi kết nối với thần khí AI. Hãy kiểm tra lại kết nối.";
  }
};

export const generateSceneDetail = async (episode: Episode, point: string, characters: any[]) => {
  const worldContext = `
Nhân vật liên quan:
${characters.map(c => `- ${c.name}: Tính cách: ${c.personality}. Võ công: ${[c.martialArtsBeginner, c.martialArtsIntermediate, c.martialArtsAdvanced, c.martialArtsSpecial].filter(m => m).join(', ')}. Y phục: ${c.attire}`).join('\n')}
  `;

  const prompt = `
    Bạn là một nhà biên kịch phim kiếm hiệp chuyên nghiệp. 
    Hãy viết chi tiết "Phân Cảnh" cho phân đoạn phim sau. KHÔNG viết thông tin về Tập phim, và KHÔNG viết thông tin về thời lượng.
    
    Phân đoạn: "${point}"
    
    Yêu cầu trình bày: TOÀN BỘ BẰNG TIẾNG VIỆT CÓ DẤU.
    TUYỆT ĐỐI KHÔNG dùng ký tự "#" trong văn bản (ví dụ không dùng #, ##, ###).
    Tên các phân cảnh (ví dụ: **Phân cảnh 1:**) phải được BÔI ĐẬM.
    
    Các đầu mục cần chắt lọc gọn lại và giàu tính điện ảnh:
    1. Bối Cảnh: Không gian, không khí.
    2. Góc Quay: Các đề xuất góc máy.
    3. Hành Động: Cử chỉ, võ thuật.
    4. Ánh Sáng: Mô tả ánh sáng và màu sắc.
    5. Tâm Lý nhân vật: Thần thái, cảm xúc.
    6. Lời Thoại (nếu có): Thoại ngắn gọn, khí chất kiếm hiệp.

    Thông tin nhân vật:
    ${worldContext}

    Hãy viết hành văn đậm chất chương hồi kiếm hiệp.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
      }
    });

    return response.text || "Không thể khởi tạo chi tiết phân cảnh.";
  } catch (error) {
    console.error("Gemini API Error (Scene):", error);
    return "Phát sinh lỗi khi kết nối với thần khí AI.";
  }
};

export const generateVideoPrompt = async (episode: Episode, scriptContent: string, characters: any[]) => {
  const charContext = characters.map(c => 
    `${c.name}: ${c.description}. Y phục: ${c.attire || 'Trang phục cổ phong'}. Vũ khí: ${c.weapon || 'Tay không'}. Thần thái: ${c.personality}`
  ).join('\n');

  const prompt = `
    Bạn là một chuyên gia tạo Prompt cho công cụ AI Video Seedance 2.0.
    Nhiệm vụ: Dựa trên "Phân Cảnh" (nội dung chi tiết của một phân đoạn), hãy tạo một Prompt TIẾNG VIỆT để tạo video 15 giây.
    
    Nội dung Phân Cảnh:
    "${scriptContent}"
    
    Thông tin nhân vật chi tiết:
    ${charContext}
    
    YÊU CẦU CẤU TRÚC PROMPT (CHỈ DÙNG TIẾNG VIỆT):
    Hãy trình bày theo cấu trúc sau:
    + Bối cảnh: [Mô tả bối cảnh ngắn gọn]
    + Shot 1 (0s-5s): [Hành động, góc quay, hiệu ứng]
    + Shot 2 (5s-10s): [Hành động, góc quay, hiệu ứng]
    + Shot 3 (10s-15s): [Hành động, góc quay, hiệu ứng]
    
    Lưu ý: Prompt phải bám sát nội dung Phân Cảnh đã cung cấp. Toàn bộ nội dung bằng tiếng Việt có dấu.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: { temperature: 0.7 }
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Video Prompt Error:", error);
    return "Lỗi khi khởi tạo linh ảnh video.";
  }
};

export const analyzeLogicConsistency = async (
  episodes: Episode[], 
  currentEpisode: Episode, 
  characters: any[]
) => {
  const context = episodes
    .filter(e => e.id !== currentEpisode.id)
    .map(e => `Cảnh ${e.id}: ${e.title} - Phân đoạn: ${e.summary.join(". ")}`)
    .join("\n");

  const prompt = `
    Bạn là một cố vấn kịch bản (Script Consultant) chuyên nghiệp cho dòng phim kiếm hiệp.
    Nhiệm vụ: Phát hiện các lỗi logic, sự không đồng bộ (inconsistency) trong mạch truyện.

    BỐI CẢNH TRUYỆN TRƯỚC ĐÓ:
    ${context}

    DANH SÁCH NHÂN VẬT:
    ${characters.map(c => `- ${c.name}: ${c.description}`).join("\n")}

    CẢNH HIỆN TẠI ĐANG PHÂN TÍCH:
    Cảnh ${currentEpisode.id}: ${currentEpisode.title}
    Tập: ${currentEpisode.arc}
    Các phân đoạn: ${currentEpisode.summary.join(". ")}

    YÊU CẦU:
    - Tìm xem có nhân vật nào đáng lẽ đã chết nhưng lại xuất hiện không?
    - Có võ công nào nhân vật chưa học nhưng lại sử dụng không?
    - Vị trí địa lý có mâu thuẫn không (di chuyển quá nhanh)?
    - Các mối quan hệ có bị đảo lộn vô lý không?
    - Mạch truyện có bị lặp lại hoặc mâu thuẫn với các tập trước không?

    CHỈ TRẢ VỀ:
    - Các gạch đầu dòng ngắn gọn về các lỗi logic (nếu có). Trình bày TOÀN BỘ BẰNG TIẾNG VIỆT cho từng lỗi.
    - Nếu không có lỗi, trả về: "Mạch truyện hiện đang đồng nhất và logic."

    Hãy viết phong cách chuyên nghiệp, súc tích bằng tiếng Việt.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: { temperature: 0.3 }
    });
    return response.text || "Không có phản hồi từ AI.";
  } catch (error) {
    console.error("Logic Analysis Error:", error);
    return "Lỗi phân tích logic.";
  }
};

export const extractCharacterChanges = async (episodeId: number, summary: string[], characters: any[]) => {
  const prompt = `
    Dựa trên tóm tắt tập phim sau:
    "${summary.join(". ")}"

    THÔNG TIN HIỆN CÓ:
    ${characters.map(c => c.name).join(", ")}

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
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: { temperature: 0.2 }
    });
    
    // Clean JSON response (Markdown guard removal)
    const text = response.text || "{}";
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Character Change Extraction Error:", error);
    return { changes: [], newCharacters: [] };
  }
};

export const importDocxScript = async (rawText: string) => {
  const prompt = `
    Bạn là một nhà biên kịch chuyên nghiệp. Dưới đây là nội dung văn thô (raw text) được trích xuất từ một file kịch bản DOCX cho một tập phim.
    Hãy phân loại và chia nhỏ nội dung này thành các "Phân Cảnh" (Scenes) / "Phân Đoạn" (Segments) tương ứng.

    NỘI DUNG KỊCH BẢN:
    """
    ${rawText}
    """

    Trích xuất ra một đối tượng JSON DUY NHẤT với cấu trúc sau:
    {
      "summary": [
        "Mấu chốt của phân đoạn 1 (1 câu ngắn gọn)",
        "Mấu chốt của phân đoạn 2 (1 câu ngắn gọn)"
      ],
      "scenes": [
        {
          "point": "Mấu chốt của phân đoạn 1 (phải giống hệt trong mảng summary phía trên)",
          "content": "Toàn bộ nội dung hành động, thoại, mô tả chi tiết xảy ra trong phân cảnh/phân đoạn này (dựa đúng theo văn bản gốc)."
        },
        ... (các phân cảnh tương ứng với summary)
      ]
    }
    
    YÊU CẦU:
    - KHÔNG tạo thêm nội dung không có trong văn bản gốc.
    - Giữ nguyên toàn bộ chi tiết thoại và hành động.
    - Đảm bảo "point" khớp chính xác giữa \`summary\` và \`scenes\`.
    - Trả về CHỈ MỘT CHUỖI JSON, KHÔNG CÓ BẤT KỲ VĂN BẢN NGOÀI.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: { temperature: 0.2 }
    });
    
    const text = response.text || "{}";
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("DOCX script parsing error:", error);
    throw new Error(error.message || "Lỗi giao tiếp với Thiên Cơ Các (Gemini API).");
  }
};

export const generateFactionDetail = async (factionName: string) => {
  const prompt = `
    Bạn là một nhà sử học và chuyên gia võ hiệp. 
    Hãy cung cấp thông tin chi tiết cho môn phái/thế lực sau: "${factionName}"
    
    Yêu cầu nội dung:
    1. Tông chỉ (Tenets/Dogma): Những quy tắc, niềm tin và mục tiêu cốt lõi của môn phái.
    2. Lịch sử (History): Nguồn gốc hình thành và các mốc sự kiện quan trọng.
    
    Trình bày: TOÀN BỘ BẰNG TIẾNG VIỆT CÓ DẤU.
    Phong cách: Hùng tráng, mang đậm màu sắc võ lâm kiếm hiệp.
    Định dạng trả về: JSON object
    {
      "tenets": "Nội dung tông chỉ",
      "history": "Nội dung lịch sử"
    }
    
    Lưu ý: Nếu đây là môn phái có thật trong tiểu thuyết Kim Dung, Cổ Long hoặc văn hóa võ hiệp phổ biến (như Thiếu Lâm, Võ Đang, Nga Mi...), hãy cung cấp thông tin chính xác theo nguyên tác. Nếu là môn phái lạ, hãy sáng tạo một cách logic và hấp dẫn.
    Cung cấp thông tin súc tích nhưng đầy đủ ý nghĩa (khoảng 2-3 đoạn văn cho mỗi mục).
    KHÔNG trả về bất kỳ giải thích nào khác ngoài JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: { temperature: 0.7 }
    });
    
    const text = response.text || "{}";
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Faction Detail Generation Error:", error);
    return { tenets: "Lỗi khi kết nối với Thiên Cơ Các.", history: "Vui lòng thử lại sau." };
  }
};
