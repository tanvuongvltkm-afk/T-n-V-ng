import { Episode, StoryArc, Character, Faction, WorldLocation } from './types';

export const WORLD_LOCATIONS: WorldLocation[] = [
  // 7 Cities
  {
    name: 'Thành Đô',
    type: 'city',
    description: 'Thủ phủ vùng Tây Thục, nổi tiếng với sự phồn hoa, những hàng trà quán náo nhiệt và là nơi hội tụ của nhiều bậc anh hùng hào kiệt vùng biên thùy.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20city%20chengdu%20wuxia%20architecture%20market?nologo=true&width=512&height=512'
  },
  {
    name: 'Lâm An',
    type: 'city',
    description: 'Kinh đô tráng lệ ven sông, trung tâm chính trị và văn hóa. Nơi có cảnh sắc hữu tình, lầu các nguy nga, và cũng là nơi ẩn chứa nhiều âm mưu quyền lực đại nội.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20capital%20hangzhou%20linan%20west%20lake%20palace?nologo=true&width=512&height=512'
  },
  {
    name: 'Biện Kinh',
    type: 'city',
    description: 'Bắc kinh phồn thịnh, cửa ngõ giao thương sầm uất. Thành trì kiên cố với những phố xá nhộn nhịp, là biểu tượng cho sự hưng thịnh của vương triều.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20city%20kaifeng%20bianjing%20bustling%20street?nologo=true&width=512&height=512'
  },
  {
    name: 'Dương Châu',
    type: 'city',
    description: 'Thành phố của kênh rạch và tơ lụa. Nổi tiếng với mỹ nhân, danh trà và những bến thuyền tấp nập khách phong lưu, nơi khởi đầu của nhiều giai thoại giang hồ.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20city%20yangzhou%20canal%20willow%20trees?nologo=true&width=512&height=512'
  },
  {
    name: 'Đại Lý',
    type: 'city',
    description: 'Nằm ở phương Nam xa xôi, vương quốc của Phật triều và khí hậu ôn hòa. Nổi tiếng với những ngôi chùa cổ kính và võ học Đoàn Thị vang danh hải nội.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20city%20dali%20pagoda%20mountains%20flowers?nologo=true&width=512&height=512'
  },
  {
    name: 'Tương Dương',
    type: 'city',
    description: 'Pháo đài trọng yếu bên dòng Giang Thủy, nơi diễn ra những trận chiến bảo vệ sơn hà oanh liệt. Biểu tượng cho lòng trung nghĩa và tinh thần bất khuất.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20fortress%20xiangyang%20city%20wall%20river?nologo=true&width=512&height=512'
  },
  {
    name: 'Phượng Tường',
    type: 'city',
    description: 'Cửa ngõ miền Tây Bắc, vùng đất của gió và cát. Nơi có những con người khí khái, võ học cương mãnh và là trạm dừng chân quan trọng trên con đường tơ lụa.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20city%20fengxiang%20desert%20gate%20windy?nologo=true&width=512&height=512'
  },
  // 14 Villages/Towns
  {
    name: 'Ba Lăng Huyện',
    type: 'village',
    description: 'Một vùng sông nước hữu tình, nơi các tân thủ thường bắt đầu hành trình. Cảnh sắc thanh bình với những cánh đồng lúa và bến phà tấp nập.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20village%20baling%20river%20peaceful?nologo=true&width=512&height=512'
  },
  {
    name: 'Giang Tân Thôn',
    type: 'village',
    description: 'Ngôi làng ven sông hiền hòa, nổi tiếng với nghề đánh cá và những con người chất phác, là trạm nghỉ chân lý tưởng cho khách bộ hành.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20fishing%20village%20river%20boats?nologo=true&width=512&height=512'
  },
  {
    name: 'Đạo Hương Thôn',
    type: 'village',
    description: 'Ngôi làng nhỏ thơm ngát hương lúa, khởi nguồn của trái tim chính nghĩa. Nơi ẩn chứa những kỷ niệm đầu đời của những vị anh hùng.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20village%20rice%20fields%20heavenly?nologo=true&width=512&height=512'
  },
  {
    name: 'Chu Tiên Trấn',
    type: 'village',
    description: 'Thôn trấn cổ xưa gắn liền với những truyền thuyết về các vị tiên nhân, nơi có không khí huyền bí và những cổ thụ ngàn năm.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20town%20zhuxian%20mystical%20trees?nologo=true&width=512&height=512'
  },
  {
    name: 'Long Môn Trấn',
    type: 'village',
    description: 'Nằm nơi cửa ngõ sa mạc, vùng đất khô cằn nhưng đầy sức sống với những quán trọ náo nhiệt của khách buôn miền viễn xứ.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20desert%20town%20longmen%20inn?nologo=true&width=512&height=512'
  },
  {
    name: 'Vĩnh Lạc Trấn',
    type: 'village',
    description: 'Ngôi làng thịnh vượng với tinh thần luôn lạc quan, nổi tiếng với các lễ hội quanh năm và sự hiếu khách của người dân.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20town%20yongle%20festive%20lanterns?nologo=true&width=512&height=512'
  },
  {
    name: 'Thạch Cổ Trấn',
    type: 'village',
    description: 'Vùng đất núi đá hiểm trở, danh bất hư truyền với nghề rèn đúc vũ khí và những lò luyện kim rực lửa ngày đêm.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20town%20shigu%20forge%20mountains?nologo=true&width=512&height=512'
  },
  {
    name: 'Long Tuyền Thôn',
    type: 'village',
    description: 'Nổi tiếng với dòng suối rồng tinh khiết, nơi có những lò rèn thần binh và không gian tĩnh mịch phù hợp cho việc tu luyện nội công.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20village%20longquan%20spring%20swords?nologo=true&width=512&height=512'
  },
  {
    name: 'Phong Lăng Độ',
    type: 'village',
    description: 'Bến phà huyết mạch giao thoa giữa các vùng miền, nơi chứng kiến bao cuộc chia ly và ngộ biến của giới giang hồ.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20ferry%20dock%20foggy%20river?nologo=true&width=512&height=512'
  },
  {
    name: 'Nhãn Môn Quan',
    type: 'village',
    description: 'Cửa ải hiểm yếu trấn giữ biên thùy, nơi hào khí ngút trời và những câu chuyện về lòng quả cảm bảo vệ biên cương.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20fortress%20gate%20yanmen%20snowy?nologo=true&width=512&height=512'
  },
  {
    name: 'Nam Nhạc Trấn',
    type: 'village',
    description: 'Nằm dưới chân ngọn núi thiêng, không gian bảng lảng sương khói và những đạo quán thanh tịnh phục vụ khách hành hương.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20town%20temple%20mountain%20mist?nologo=true&width=512&height=512'
  },
  {
    name: 'Kiếm Các',
    type: 'village',
    description: 'Vùng đất núi non trùng điệp, vách đá dựng đứng như gươm dao, là thử thách khó khăn cho bất kỳ lữ khách nào muốn vượt qua.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20mountain%20pass%20swordgate%20cliffs?nologo=true&width=512&height=512'
  },
  {
    name: 'Thải Vân Trấn',
    type: 'village',
    description: 'Ngôi trấn nhỏ lung linh dưới những dải mây sắc màu, nổi tiếng với nghề dệt nhuộm và các sản vật quý hiếm vùng cao nguyên.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20town%20colorful%20clouds%20dyeing?nologo=true&width=512&height=512'
  },
  {
    name: 'Đại Thạch Trấn',
    type: 'village',
    description: 'Thôn làng đặc trưng với những kiến trúc bằng đá khối hùng vĩ, mang vẻ đẹp thô mộc và vững chãi giữa thiên nhiên.',
    avatar: 'https://image.pollinations.ai/prompt/ancient%20chinese%20village%20giant%20stones%20monuments?nologo=true&width=512&height=512'
  }
];

export const EPISODES: Episode[] = [
  {
    id: 22,
    title: "Cát Tường dẫn nhóm về gia trang Cát Gia",
    arc: "TẬP 1: MIÊU LĨNH – CÁT GIA – HẮC BẠCH VÔ THƯỜNG",
    summary: ["Cả nhóm đến rừng Miêu Lĩnh.", "Gia trang Cát Gia bị bỏ hoang, đầy dấu vết thảm sát.", "Hé lộ Cát Tường từng là tiểu thư Cát Gia."],
    status: 'draft'
  },
  {
    id: 23,
    title: "Sở Vương tỏ tình Như Ý",
    arc: "TẬP 1: MIÊU LĨNH – CÁT GIA – HẮC BẠCH VÔ THƯỜNG",
    summary: ["Sở Vương thổ lộ tình cảm.", "Khi biết Như Ý thích Tần Vương -> anh vui vẻ xem nàng như em gái."],
    status: 'draft'
  },
  {
    id: 24,
    title: "Hồi ức Cát Tường",
    arc: "TẬP 1: MIÊU LĨNH – CÁT GIA – HẮC BẠCH VÔ THƯỜNG",
    summary: ["Hé lộ đôi mắt đặc biệt: nhìn thấy thứ người khác không thấy.", "Gia tộc Cát Gia bị tiêu diệt vì sở hữu 'Thiên Nhãn'."],
    status: 'draft'
  },
  {
    id: 25,
    title: "Cát Tường bị bắt cóc",
    arc: "TẬP 1: MIÊU LĨNH – CÁT GIA – HẮC BẠCH VÔ THƯỜNG",
    summary: ["Thiên Ma Giáo phục kích, bắt Cát Tường."],
    status: 'draft'
  },
  {
    id: 26,
    title: "Cả nhóm đi cứu Cát Tường",
    arc: "TẬP 1: MIÊU LĨNH – CÁT GIA – HẮC BẠCH VÔ THƯỜNG",
    summary: ["Tần – Sở – Như Ý – Hồng Y – Tiểu Phong truy đuổi."],
    status: 'draft'
  },
  {
    id: 27,
    title: "Như Ý trúng độc Vô Tình",
    arc: "TẬP 1: MIÊU LĨNH – CÁT GIA – HẮC BẠCH VÔ THƯỜNG",
    summary: ["Như Ý cứu Cát Tường -> trúng độc khiến nàng không thể yêu."],
    status: 'draft'
  },
  {
    id: 31,
    title: "Đối đầu Song Sát Hắc – Bạch Vô Thường",
    arc: "TẬP 1: MIÊU LĨNH – CÁT GIA – HẮC BẠCH VÔ THƯỜNG",
    summary: ["Hai Sứ giả mạnh nhất của Thiên Ma Giáo xuất hiện."],
    status: 'draft'
  },
  {
    id: 41,
    title: "Gia Luật Tị Li phản bội",
    arc: "TẬP 1: MIÊU LĨNH – CÁT GIA – HẮC BẠCH VÔ THƯỜNG",
    summary: ["Giả vờ quan tâm -> hút sạch sinh lực Hắc – Bạch Vô Thường.", "Hắn mạnh lên gấp bội."],
    status: 'draft'
  },
  {
    id: 42,
    title: "Gặp Ngạo Thiên",
    arc: "TẬP 2: VÕ ĐANG – ĐỘC CÔ KIẾM – TAM HỘ PHÁP",
    summary: ["Đệ tử Võ Đang, hơi ngáo nhưng nghĩa khí."],
    status: 'draft'
  },
  {
    id: 46,
    title: "Tam Hộ Pháp xuất hiện",
    arc: "TẬP 2: VÕ ĐANG – ĐỘC CÔ KIẾM – TAM HỘ PHÁP",
    summary: ["Huyết Ảnh – Địa Sát – Thiết Diện."],
    status: 'draft'
  },
  {
    id: 67,
    title: "Hắc Diện Lang Quân xuất hiện",
    arc: "TẬP 3: LIỄU TÂM NHI – BANG PHÁ THIÊN",
    summary: ["Triệu tập Ngũ Độc – Đường Môn – Minh Giáo – Thiên Nhẫn."],
    status: 'draft'
  },
  {
    id: 81,
    title: "Như Ý trúng kế Hồng Liên Sứ Giả",
    arc: "TẬP 4: HỒNG LIÊN – HỒNG Y – TÂM NHI",
    summary: ["Bắt đầu âm mưu mới của Thiên Ma Giáo."],
    status: 'draft'
  },
  {
    id: 99,
    title: "Đại chiến Tương Dương",
    arc: "TẬP 5: VÂY THÀNH TƯƠNG DƯƠNG",
    summary: ["Bang Phá Thiên + Liên Minh Giang Hồ + 4 tướng trấn thủ."],
    status: 'draft'
  }
];

export const STORY_ARCS: StoryArc[] = [
  { 
    id: "arc-1",
    title: "TẬP 1: MIÊU LĨNH – CÁT GIA – HẮC BẠCH VÔ THƯỜNG", 
    episodes: [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41],
    keyPoints: ["Hé lộ Thiên Nhãn", "Như Ý trúng độc Vô Tình", "Sự xuất hiện của Thiên Ma Giáo"]
  },
  { 
    id: "arc-2",
    title: "TẬP 2: VÕ ĐANG – ĐỘC CÔ KIẾM – TAM HỘ PHÁP", 
    episodes: [42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66],
    keyPoints: ["Tìm kiếm Độc Cô Kiếm", "Gặp gỡ đệ tử Võ Đang", "Tam Hộ Pháp vây hãm"]
  },
  { 
    id: "arc-3",
    title: "TẬP 3: LIỄU TÂM NHI – BANG PHÁ THIÊN – THÔNG THIÊN THÁP", 
    episodes: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76],
    keyPoints: ["Thành lập Bang Phá Thiên", "Bí mật Thông Thiên Tháp", "Cuộc gặp gỡ định mệnh"]
  },
  { 
    id: "arc-4",
    title: "TẬP 4: HỒNG LIÊN – HỒNG Y – TÂM NHI", 
    episodes: [81, 82, 83, 84, 85, 86, 87, 88],
    keyPoints: ["Âm mưu nội gián", "Thân phận thực sự của Hồng Y", "Cạm bẫy Hồng Liên"]
  },
  { 
    id: "arc-5",
    title: "TẬP 5: VÂY THÀNH TƯƠNG DƯƠNG", 
    episodes: [89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103],
    keyPoints: ["Đại quân Thiên Ma áp sát", "Quần hùng hội tụ", "Trận chiến trên tường thành"]
  },
  { 
    id: "arc-6",
    title: "TẬP 6: CAO TRÀO", 
    episodes: [104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122],
    keyPoints: ["Xung đột nội bộ", "Hy sinh đau đớn", "Tìm kiếm thuốc giải Hoa Tình"]
  },
  { 
    id: "arc-7",
    title: "TẬP 7: TRẬN CHIẾN CUỐI", 
    episodes: [123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134],
    keyPoints: ["Quyết đấu Hắc Diện Lang Quân", "Kết cục Thiên Ma Giáo", "Khai mở Kim Quốc"]
  }
];

export const CHARACTERS: Character[] = [
  { 
    name: "Tần Vương", 
    role: "Nam chính", 
    faction: "Chính phái",
    description: "Võ công cao cường, mang trọng trách đại cục.",
    past: "Con trai một danh tướng đã hy sinh, được cao nhân bí ẩn truyền thụ công lực từ nhỏ. Hắn mang trên mình gánh nặng của gia tộc và vận mệnh giang hồ.",
    weapon: "Long Uyên Kiếm",
    weaponOrigin: "Thượng cổ thần binh, rèn từ sắt trời, nghe đồn có linh tính, chỉ chủ nhân xứng đáng mới có thể rút ra.",
    personality: "Trầm tĩnh, quyết đoán, mang nặng nỗi lòng cứu thế. Luôn đặt nghĩa khí lên trên tư lợi.",
    relationships: "Người yêu: Như Ý\nBạn thân: Sở Vương\nĐối thủ: Hắc Diện Lang Quân",
    martialArtsBeginner: "Cơ bản kiếm thuật",
    martialArtsIntermediate: "Khinh công Lăng Ba",
    martialArtsAdvanced: "Tẩy Tủy Kinh\nLong Uyên Kiếm Pháp",
    martialArtsSpecial: "Vạn Kiếm Quy Tông (Tầng 9)",
    status: 'appeared'
  },
  { 
    name: "Như Ý", 
    role: "Nữ chính", 
    faction: "Chính phái",
    description: "Trúng độc Vô Tình, không thể yêu.",
    past: "Tiểu thư cành vàng lá ngọc nhưng vì cứu Cát Tường mà dấn thân vào chốn giang hồ. Bi kịch trúng độc khiến nàng phải kìm nén tình cảm với Tần Vương.",
    weapon: "Mộc Lan Châm",
    weaponOrigin: "Vật gia bảo của dòng họ, mỏng như cánh ve nhưng cứng hơn kim cương, có thể xuyên thấu hộ thân cương khí.",
    personality: "Dịu dàng nhưng kiên cường, từ khi trúng độc thì trở nên lạnh lùng, xa cách.",
    relationships: "Đồng môn: Tần Vương\nBằng hữu: Cát Tường",
    martialArtsBeginner: "Điểm huyệt pháp",
    martialArtsIntermediate: "Mộc Lan Điệp Vũ",
    martialArtsAdvanced: "Ám khí tuyệt học",
    status: 'appeared'
  },
  { 
    name: "Sở Vương", 
    role: "Nam thứ", 
    faction: "Trung lập",
    description: "Hào hoa, nghĩa hiệp, yêu Như Ý nhưng sẵn sàng rút lui.",
    past: "Hoàng tử phong lưu, rời bỏ cung đình để tìm kiếm tự do đích thực. Hắn rong ruổi khắp nơi với cây tiêu và bình rượu.",
    weapon: "Cửu Khúc Tiêu",
    weaponOrigin: "Chế tác từ ngọc nghìn năm sâu trong hang băng, âm thanh có thể định tâm hoặc phá phách tinh thần địch thủ.",
    personality: "Phóng khoáng, hài hước, trọng tình trọng nghĩa. Coi tiền bạc như phân thổ.",
    relationships: "Bạn tâm giao: Tần Vương\nSư phụ: Ẩn cư lão nhân",
    martialArtsIntermediate: "Hỗn Nguyên Công",
    martialArtsAdvanced: "Cửu Khúc Âm Phong",
    status: 'appeared'
  },
  {
    name: "Hắc Diện Lang Quân",
    role: "Phản diện chính",
    faction: "Tà phái",
    description: "Kẻ cầm đầu Thiên Ma Giáo, tàn nhẫn và đầy tham vọng.",
    weapon: "Ma Long Đao",
    weaponOrigin: "Tương truyền rèn từ xương rồng đen, mang tà tính cực mạnh, hút máu để tăng cường sức mạnh.",
    martialArtsAdvanced: "Thiên Ma Công",
    martialArtsSpecial: "Phệ Huyết Đại Pháp",
    status: 'upcoming'
  }
];

export const FACTIONS: Faction[] = [
  { 
    name: "Thiếu Lâm", 
    description: "Ngôi chùa ngàn năm, Thái Sơn Bắc Đấu của võ lâm. Tôn chỉ: 'Từ bi vi bản, thiện niệm tại tâm. Võ dĩ trấn ma, thiền dĩ tịnh tánh'. Võ công cương mãnh, phòng ngự tuyệt đối, luôn lấy việc cứu nhân độ thế làm trọng.", 
    alignment: "Chính phái", 
    leader: "Phương Trượng Huyền Từ",
    flagAvatar: "https://image.pollinations.ai/prompt/shaolin%20wuxia%20game%20faction%20icon%20symbol%20golden%20buddha%20intricate?nologo=true&width=512&height=512"
  },
  { 
    name: "Võ Đang", 
    description: "Lấy nhu chế cương, thái cực vô vi. Tông chỉ: 'Thái cực quy nhất, thuận đạo tự nhiên. Dĩ tĩnh chế động, dĩ nhu khắc cương'. Danh trấn thiên hạ với kiếm thuật tinh diệu và nội công thâm hậu.", 
    alignment: "Chính phái", 
    leader: "Trương Tam Phong",
    flagAvatar: "https://image.pollinations.ai/prompt/wudang%20wuxia%20game%20faction%20icon%20symbol%20yin%20yang%20sword%20intricate?nologo=true&width=512&height=512"
  },
  { 
    name: "Nga Mi", 
    description: "Nơi tụ hội của những nữ hiệp tài sắc. Tôn chỉ: 'Thanh tâm quả dục, phổ độ chúng sinh. Kiếm nhu mang ý nghĩa hiệp, tâm tịnh diệt tà ma'. Võ học tinh tế, vừa có khả năng trị liệu cứu người, vừa có uy lực trấn nhiếp kẻ gian.", 
    alignment: "Chính phái", 
    leader: "Thanh Hiểu Sư Thái",
    flagAvatar: "https://image.pollinations.ai/prompt/emei%20wuxia%20game%20faction%20icon%20symbol%20lotus%20pink%20intricate?nologo=true&width=512&height=512"
  },
  { 
    name: "Đường Môn", 
    description: "Gia tộc ám khí danh chấn vùng Thục Trung. Tông chỉ: 'Cơ quan xảo diệu, hành tung bất định. Ẩn thân đoạt mệnh, độc bộ thiên hạ'. Không phân thiện ác, chỉ làm theo gia quy.", 
    alignment: "Trung lập", 
    leader: "Đường Giản",
    flagAvatar: "https://image.pollinations.ai/prompt/tangmen%20wuxia%20game%20faction%20icon%20symbol%20dart%20poison%20intricate?nologo=true&width=512&height=512"
  },
  { 
    name: "Thiên Nhẫn", 
    description: "Giáo phái thần bí vùng biên cương. Tông chỉ: 'Tốc độ vi tiên, ám sát vi bổn. Đoạt mạng trong chớp mắt, bóng tối là nhà'. Thường bị xem là tà đạo vì thủ đoạn tàn độc.", 
    alignment: "Tà phái", 
    leader: "Hoàn Nhan Tượng",
    flagAvatar: "https://image.pollinations.ai/prompt/tianren%20wuxia%20game%20faction%20icon%20symbol%20fire%20assassin%20intricate?nologo=true&width=512&height=512"
  },
  { 
    name: "Cái Bang", 
    description: "Thiên hạ đệ nhất bang, đệ tử đông đảo khắp bốn bể. Tông chỉ: 'Tứ hải giai huynh đệ, trung nghĩa đặt lên hàng đầu'. Trấn phái chi bảo là Đả Cẩu Bổng và Hàng Long Thập Bát Chưởng.", 
    alignment: "Chính phái", 
    leader: "Hồng Thất Công",
    flagAvatar: "https://image.pollinations.ai/prompt/beggar%20sect%20wuxia%20game%20faction%20icon%20symbol%20dragon%20stick%20intricate?nologo=true&width=512&height=512"
  },
  { 
    name: "Ngũ Độc", 
    description: "Sử dụng kỳ độc vùng Miêu Cương. Tông chỉ: 'Độc tự ngã tâm, vạn vật tương khắc. Oán báo oán, ân báo ân. Kẻ đắc tội giáo phái, vạn kiếp bất phục'. Hành tung quái dị, là nỗi khiếp sợ của trung nguyên.", 
    alignment: "Tà phái", 
    leader: "Mặc Phong",
    flagAvatar: "https://image.pollinations.ai/prompt/five%20poisons%20sect%20wuxia%20game%20faction%20icon%20symbol%20spider%20snake%20intricate?nologo=true&width=512&height=512"
  },
  { 
    name: "Minh Giáo", 
    description: "Thờ phụng ngọn lửa thần. Tôn chỉ: 'Cứu khổ phò nguy, ánh sáng dẫn lối. Đối đầu bạo tàn, thắp sáng hy vọng'. Minh Giáo võ học linh hoạt, bạo phát mạnh mẽ.", 
    alignment: "Chính phái", 
    leader: "Lục Nguy Lâu",
    flagAvatar: "https://image.pollinations.ai/prompt/ming%20sect%20wuxia%20game%20faction%20icon%20symbol%20holy%20fire%20intricate?nologo=true&width=512&height=512"
  },
  {
    name: "Tiêu Dao",
    description: "Hành tung bất định, tự tại trần gian. Tông chỉ: 'Tiêu dao tự tại, vạn vật vi tâm'. Võ học phi phàm, lấy sự linh hoạt và nội công kì ảo làm trọng tâm.",
    alignment: "Trung lập",
    flagAvatar: "https://image.pollinations.ai/prompt/xiaoyao%20sect%20wuxia%20game%20faction%20icon%20symbol%20feather%20fan%20intricate?nologo=true&width=512&height=512"
  },
  {
    name: "Đoàn Thị",
    description: "Đại Lý Vương tộc. Tông chỉ: 'Vương giả chi khí, từ bi vi hoài'. Tuyệt học Lục Mạch Thần Kiếm và Nhất Dương Chỉ ảo diệu khôn lường.",
    alignment: "Chính phái",
    leader: "Đoàn Chính Thuần"
  },
  {
    name: "Tàng Kiếm",
    description: "Danh môn đúc kiếm, tọa lạc bên Tây Hồ. Tông chỉ: 'Kiếm khí ngất trời, hiệp cốt nhu tình'. Sở trường sử dụng cả trọng kiếm và khinh kiếm, kiếm pháp bá đạo.",
    alignment: "Chính phái"
  },
  {
    name: "Trường Ca",
    description: "Văn nhân nhã sĩ, cầm kỳ thi họa. Tông chỉ: 'Dĩ khúc nhập đạo, dĩ thi sát địch'. Áp dụng âm luật vào võ học để chi phối kẻ địch, phong thái phi phàm.",
    alignment: "Chính phái"
  },
  {
    name: "Thiên Sơn",
    description: "Ẩn mình trên đỉnh núi tuyết mờ ảo. Tông chỉ: 'Tàng hình trong mây tuyết, ám sát không lưu rớt mồ hôi'. Sát thủ tuyệt đỉnh, khả năng tàng hình và bộ pháp quỷ mị.",
    alignment: "Trung lập",
    leader: "Thiên Sơn Đồng Lão"
  },
  {
    name: "Thúy Yên",
    description: "Nữ nhi giang hồ uyển chuyển, dung mạo tuyệt trần. Tông chỉ: 'Đẹp như đóa hoa, tàn nhẫn như băng giá'. Có khả năng ngự thú, kiếm pháp phiêu diêu như tuyết rơi.",
    alignment: "Trung lập"
  },
  {
    name: "Cô Hồng",
    description: "Môn phái thần bí nơi hoang cốc. Võ học độc đáo, linh hoạt, thân pháp phiêu bồng tựa chim hồng bay lượn.",
    alignment: "Trung lập"
  },
  {
    name: "Vạn Hoa",
    description: "Cầm kỳ thi họa, y thuật siêu phàm. Tông chỉ: 'Điểm huyệt phong sát, diệu thủ hồi xuân'. Có thể dùng bút làm vũ khí, vừa sát địch vừa cứu người.",
    alignment: "Chính phái"
  },
  {
    name: "Thần Cơ",
    description: "Bậc thầy cơ quan thuật và hỏa khí. Sử dụng thuốc nổ, khinh khí cầu và cung nỏ để cấu rỉa kẻ địch từ xa.",
    alignment: "Trung lập"
  },
  {
    name: "Thiên Vương Bang",
    description: "Môn phái rèn luyện thể phách, xông pha trận mạc. Tông chỉ: 'Thiết huyết đan tâm, quét sạch phỉ thúy'. Thể phách vô địch, cận chiến uy mãnh.",
    alignment: "Chính phái",
    leader: "Dương Anh"
  },
  {
    name: "Trảm Liệt",
    description: "Môn phái sử dụng hãn đao, sát khí nặng nề. Dồn toàn lực vào những nhát chém chí mạng phá tan phòng ngự kẻ thù.",
    alignment: "Tà phái"
  },
  {
    name: "Côn Lôn",
    description: "Tọa lạc trên đỉnh Côn Lôn quanh năm sương giá. Tông chỉ: 'Kiếm xuất như phong, sấm sét kinh hồn'. Võ học thiên về lôi điện và thần trập.",
    alignment: "Trung lập"
  },
  {
    name: "Hoa Sơn",
    description: "Đệ nhất kiếm phái trung nguyên. Tông chỉ: 'Kiếm ý tung hoành, phiêu dật như mây'. Xuất chiêu vô hình vô ảnh, sắc bén tuyệt luân.",
    alignment: "Chính phái"
  },
  {
    name: "Long Uy",
    description: "Hoàng thất chi phái, uy chấn thiên hạ. Tông chỉ: 'Long uy chấn nhiếp, thiên mệnh bất khả vi'. Võ học đường hoàng, uy dũng bá đạo.",
    alignment: "Chính phái"
  },
  {
    name: "Bá Đao",
    description: "Sơn trang luyện đao nổi danh, đao khí ngang dọc. Tông chỉ: 'Đao trảm càn khôn, khí phách ngút trời'. Cực kỳ cương mãnh, xả thân sát địch.",
    alignment: "Trung lập"
  },
  {
    name: "Thiên Tâm",
    description: "Môn phái thần bí ngộ đạo từ tinh tú. Tông chỉ: 'Thiên tâm minh nguyệt, đạo luân bất diệt'. Nội công sâu không lường được, hóa giải mọi chiêu thức.",
    alignment: "Trung lập"
  },
  {
    name: "Long Tước",
    description: "Phiêu bạt giang hồ, danh xưng tước điểu. Tông chỉ: 'Tước dực phất thiên, thân như lưu tinh'. Thân pháp thoắt ẩn thoắt hiện, dùng chủy thủ đoạt mạng.",
    alignment: "Trung lập"
  },
  {
    name: "Xung Tiêu",
    description: "Kiếm khí xuyên phá những tầng mây, ngạo thị quần hùng. Tông chỉ: 'Xung phong phá trận, ngạo khí lăng thiên'. Xuất kiếm là không để đường lui.",
    alignment: "Tà phái"
  }
];

export const ARTIFACTS = [
  {
    id: "1",
    name: "Cửu Chuyển Hoàn Hồn Đan",
    origin: "Tương truyền do Y Tiên Biển Thước dành cả đời luyện chế, chứa đựng tinh hoa của cỏ cây hiếm có ngàn năm từ vùng Băng Sa Đảo.",
    effect: "Người chết sống lại, khôi phục lục phủ ngũ tạng, tăng cường một giáp (60 năm) công lực nhưng người dùng phải chịu sự thống khổ tột cùng trong ba ngày.",
    avatar: "https://image.pollinations.ai/prompt/golden%20elixir%20pill%20wuxia%20game%20icon%20intricate%20glowing%20magic?nologo=true&width=512&height=512"
  },
  {
    id: "2",
    name: "Tẩy Tuỷ Kinh",
    origin: "Do Đạt Ma Sư Tổ Thiếu Lâm Tự sáng kiến, được lưu giữ cẩn mật tại Tàng Kinh Các.",
    effect: "Giúp người luyện gân cốt như sắt thép, bách độc bất xâm, kinh mạch nở nang, là nội công đỉnh cao của Phật môn.",
    avatar: "https://image.pollinations.ai/prompt/ancient%20buddhist%20scroll%20book%20wuxia%20game%20icon%20intricate%20golden?nologo=true&width=512&height=512"
  },
  {
    id: "3",
    name: "Sơn Hà Đồ",
    origin: "Tấm bản đồ da cừu tàn khuyết truyền từ đời nhà Chu, giấu bí mật về lăng mộ của bậc Đế vương.",
    effect: "Chỉ đường đến kho báu Thượng Cổ và bí kíp võ công chí tôn. Ai sở hữu có khả năng sai khiến quần hùng.",
    avatar: "https://image.pollinations.ai/prompt/ancient%20treasure%20map%20scroll%20wuxia%20game%20icon%20intricate?nologo=true&width=512&height=512"
  },
  {
    id: "4",
    name: "Võ Mục Di Thư",
    origin: "Binh pháp do Nhạc Phi - Nhạc Vũ Mục truyền lại trước khi bị hại tại Đình Phong Ba.",
    effect: "Ghi chép về trận pháp dùng binh quỷ khốc thần sầu, luyện được có thể hô hoán vạn quân, đánh đâu thắng đó.",
    avatar: "https://image.pollinations.ai/prompt/military%20strategy%20book%20wuxia%20game%20icon%20intricate%20jade?nologo=true&width=512&height=512"
  },
  {
    id: "5",
    name: "Huyền Chân Đơn",
    origin: "Thánh dược của Đạo gia do phái Võ Đang luyện chế suốt 49 năm nhờ lửa Thái Thượng Nguyên Quân.",
    effect: "Người uống vào tự đả thông nhâm đốc nhị mạch, tẩu hỏa nhập ma cũng có thể quay về cảnh giới ban đầu.",
    avatar: "https://image.pollinations.ai/prompt/mystical%20blue%20pill%20elixir%20wuxia%20game%20icon%20intricate%20glowing?nologo=true&width=512&height=512"
  },
  {
    id: "6",
    name: "Thiết Bố Sam",
    origin: "Tấm kim giáp được bện từ tơ nhện tuyết vùng Thiên Sơn kết hợp với tằm vương.",
    effect: "Mặc vào đao thương bất nhập, thủy hỏa bất xâm, có thể ngăn chặn nội lực xâm nhập kinh mạch.",
    avatar: "https://image.pollinations.ai/prompt/iron%20armor%20chainmail%20vest%20wuxia%20game%20icon%20intricate?nologo=true&width=512&height=512"
  },
  {
    id: "7",
    name: "Ý Thiên Kiếm",
    origin: "Thần binh do Quách Tĩnh và Hoàng Dung rèn thành từ thanh Huyền Thiết Trọng Kiếm.",
    effect: "Sắc bén vô song, chém ngọc đứt kim, bên trong giấu bí mật Cửu Âm Chân Kinh và Hàng Long Thập Bát Chưởng.",
    avatar: "https://image.pollinations.ai/prompt/heaven%20reliant%20sword%20wuxia%20game%20icon%20intricate%20glowing%20blade?nologo=true&width=512&height=512"
  },
  {
    id: "8",
    name: "Đả Cẩu Bổng",
    origin: "Tín vật truyền đời của bang chủ Cái Bang, làm từ bích ngọc cứng hơn huyền thiết.",
    effect: "Đi kèm Đả Cẩu Bổng Pháp 36 chiêu thay đổi khôn lường, thấy bổng như thấy bang chủ.",
    avatar: "https://image.pollinations.ai/prompt/jade%20dog%20beating%20staff%20stick%20wuxia%20game%20icon%20intricate?nologo=true&width=512&height=512"
  }
];
