const fs = require('fs');
let content = fs.readFileSync('src/constants.ts', 'utf8');

content = content.replace(
  `name: "Tiêu Dao",
    description: "Hành tung bất định, tự tại trần gian. Tông chỉ: 'Tiêu dao tự tại, vạn vật vi tâm'. Võ học phi phàm, lấy sự linh hoạt và nội công kì ảo làm trọng tâm.",
    alignment: "Trung lập"`,
  `name: "Tiêu Dao",
    description: "Hành tung bất định, tự tại trần gian. Tông chỉ: 'Tiêu dao tự tại, vạn vật vi tâm'. Võ học phi phàm, lấy sự linh hoạt và nội công kì ảo làm trọng tâm.",
    alignment: "Trung lập",
    flagAvatar: "https://image.pollinations.ai/prompt/xiaoyao%20sect%20wuxia%20game%20faction%20icon%20symbol%20feather%20fan%20intricate?nologo=true&width=512&height=512"`
);

content = content.replace(
  `name: "Đoàn Thị",
    description: "Gia tộc hoàng thất Đại Lý. Tông chỉ: 'Lục mạch thần kiếm, uy chấn thiên hạ'. Nổi danh với Lục Mạch Thần Kiếm và Nhất Dương Chỉ.",
    alignment: "Chính phái"`,
  `name: "Đoàn Thị",
    description: "Gia tộc hoàng thất Đại Lý. Tông chỉ: 'Lục mạch thần kiếm, uy chấn thiên hạ'. Nổi danh với Lục Mạch Thần Kiếm và Nhất Dương Chỉ.",
    alignment: "Chính phái",
    flagAvatar: "https://image.pollinations.ai/prompt/dali%20duan%20sect%20wuxia%20game%20faction%20icon%20symbol%20royal%20swords%20intricate?nologo=true&width=512&height=512"`
);

fs.writeFileSync('src/constants.ts', content);
