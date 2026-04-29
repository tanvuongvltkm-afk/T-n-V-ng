const fs = require('fs');

let content = fs.readFileSync('src/constants.ts', 'utf8');

content = content.replace(
  `name: "Cửu Chuyển Hoàn Hồn Đan",
    origin: "Tương truyền do Y Tiên Biển Thước dành cả đời luyện chế, chứa đựng tinh hoa của cỏ cây hiếm có ngàn năm từ vùng Băng Sa Đảo.",
    effect: "Người chết sống lại, khôi phục lục phủ ngũ tạng, tăng cường một giáp (60 năm) công lực nhưng người dùng phải chịu sự thống khổ tột cùng trong ba ngày.",
    avatar: ""`,
  `name: "Cửu Chuyển Hoàn Hồn Đan",
    origin: "Tương truyền do Y Tiên Biển Thước dành cả đời luyện chế, chứa đựng tinh hoa của cỏ cây hiếm có ngàn năm từ vùng Băng Sa Đảo.",
    effect: "Người chết sống lại, khôi phục lục phủ ngũ tạng, tăng cường một giáp (60 năm) công lực nhưng người dùng phải chịu sự thống khổ tột cùng trong ba ngày.",
    avatar: "https://image.pollinations.ai/prompt/golden%20elixir%20pill%20wuxia%20game%20icon%20intricate%20glowing%20magic?nologo=true&width=512&height=512"`
);

fs.writeFileSync('src/constants.ts', content);
