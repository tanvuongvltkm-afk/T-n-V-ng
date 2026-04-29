const fs = require('fs');

let content = fs.readFileSync('src/constants.ts', 'utf8');

const factionAvatars = {
  "Thiếu Lâm": "https://image.pollinations.ai/prompt/shaolin%20wuxia%20game%20faction%20icon%20symbol%20golden%20buddha%20intricate?nologo=true&width=512&height=512",
  "Võ Đang": "https://image.pollinations.ai/prompt/wudang%20wuxia%20game%20faction%20icon%20symbol%20yin%20yang%20sword%20intricate?nologo=true&width=512&height=512",
  "Nga Mi": "https://image.pollinations.ai/prompt/emei%20wuxia%20game%20faction%20icon%20symbol%20lotus%20pink%20intricate?nologo=true&width=512&height=512",
  "Đường Môn": "https://image.pollinations.ai/prompt/tangmen%20wuxia%20game%20faction%20icon%20symbol%20dart%20poison%20intricate?nologo=true&width=512&height=512",
  "Thiên Nhẫn": "https://image.pollinations.ai/prompt/tianren%20wuxia%20game%20faction%20icon%20symbol%20fire%20assassin%20intricate?nologo=true&width=512&height=512",
  "Cái Bang": "https://image.pollinations.ai/prompt/beggar%20sect%20wuxia%20game%20faction%20icon%20symbol%20dragon%20stick%20intricate?nologo=true&width=512&height=512",
  "Ngũ Độc": "https://image.pollinations.ai/prompt/five%20poisons%20sect%20wuxia%20game%20faction%20icon%20symbol%20spider%20snake%20intricate?nologo=true&width=512&height=512",
  "Minh Giáo": "https://image.pollinations.ai/prompt/ming%20sect%20wuxia%20game%20faction%20icon%20symbol%20holy%20fire%20intricate?nologo=true&width=512&height=512",
  "Côn Lôn": "https://image.pollinations.ai/prompt/kunlun%20sect%20wuxia%20game%20faction%20icon%20symbol%20snow%20mountain%20intricate?nologo=true&width=512&height=512",
  "Đại Lý Đoàn Thị": "https://image.pollinations.ai/prompt/dali%20sect%20wuxia%20game%20faction%20icon%20symbol%20swords%20royal%20intricate?nologo=true&width=512&height=512"
};

for (const [name, url] of Object.entries(factionAvatars)) {
  const regex = new RegExp(`(name:\\s*"${name}"[\\s\\S]*?leader:\\s*".*?")\\s*\\}`, 'g');
  content = content.replace(regex, `$1,\n    flagAvatar: "${url}"\n  }`);
}


// Artifacts
const artifactAvatars = {
  "Cửu chuyển hoàn hồn đan": "https://image.pollinations.ai/prompt/golden%20elixir%20pill%20wuxia%20game%20icon%20intricate%20glowing%20magic?nologo=true&width=512&height=512",
  "Tẩy Tuỷ Kinh": "https://image.pollinations.ai/prompt/ancient%20buddhist%20scroll%20book%20wuxia%20game%20icon%20intricate%20golden?nologo=true&width=512&height=512",
  "Sơn Hà Đồ": "https://image.pollinations.ai/prompt/ancient%20treasure%20map%20scroll%20wuxia%20game%20icon%20intricate?nologo=true&width=512&height=512",
  "Võ Mục Di Thư": "https://image.pollinations.ai/prompt/military%20strategy%20book%20wuxia%20game%20icon%20intricate%20jade?nologo=true&width=512&height=512",
  "Huyền Chân Đơn": "https://image.pollinations.ai/prompt/mystical%20blue%20pill%20elixir%20wuxia%20game%20icon%20intricate%20glowing?nologo=true&width=512&height=512",
  "Thiết Bố Sam": "https://image.pollinations.ai/prompt/iron%20armor%20chainmail%20vest%20wuxia%20game%20icon%20intricate?nologo=true&width=512&height=512",
  "Ý Thiên Kiếm": "https://image.pollinations.ai/prompt/heaven%20reliant%20sword%20wuxia%20game%20icon%20intricate%20glowing%20blade?nologo=true&width=512&height=512",
  "Đả Cẩu Bổng": "https://image.pollinations.ai/prompt/jade%20dog%20beating%20staff%20stick%20wuxia%20game%20icon%20intricate?nologo=true&width=512&height=512"
};

for (const [name, url] of Object.entries(artifactAvatars)) {
  const regex = new RegExp(`(name:\\s*"${name}"[\\s\\S]*?effect:\\s*".*?")\\s*,\\s*avatar:\\s*""\\s*\\}`, 'g');
  content = content.replace(regex, `$1,\n    avatar: "${url}"\n  }`);
}

fs.writeFileSync('src/constants.ts', content);
