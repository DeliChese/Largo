# -*- coding: utf-8 -*-
"""
Authentic textbook syllabi and supplemental cards for both HSK 2.0 (《HSK标准教程 1–3》)
and HSK 3.0 (《新HSK教程 1–3》).
"""

from __future__ import annotations

EXTRA_TEXTBOOK_CARDS: list[dict] = [
    {
        'id': 'zh-extra-xiaxue',
        'term': '下雪',
        'phonetic': 'xià xuě',
        'partOfSpeech': 'Động từ ly hợp',
        'meaning': 'tuyết rơi',
        'collocations': [
            {'phrase': '下大雪', 'meaning': 'tuyết rơi to'},
            {'phrase': '开始下雪', 'meaning': 'bắt đầu có tuyết rơi'},
        ],
        'examples': [{
            'sentence': '北京的冬天很冷，常常下雪。',
            'translation': 'Mùa đông ở Bắc Kinh rất lạnh, thường hay có tuyết rơi.',
        }],
        'synonyms': ['下雨'],
        'notes': 'Động từ ly hợp: có thể tách thành 下了一场雪 (rơi một trận tuyết).',
    },
    {
        'id': 'zh-extra-bushao',
        'term': '不少',
        'phonetic': 'bù shǎo',
        'partOfSpeech': 'Tính từ',
        'meaning': 'không ít, khá nhiều',
        'collocations': [
            {'phrase': '买了不少衣服', 'meaning': 'mua khá nhiều quần áo'},
            {'phrase': '省了不少时间', 'meaning': 'tiết kiệm không ít thời gian'},
        ],
        'examples': [{
            'sentence': '今天商店打折，她买了不少东西。',
            'translation': 'Hôm nay cửa hàng giảm giá, cô ấy mua khá nhiều đồ.',
        }],
        'synonyms': ['很多'],
        'notes': 'Dùng trước danh từ (bỏ 的) hoặc làm vị ngữ chỉ số lượng nhiều hơn dự kiến.',
    },
    {
        'id': 'zh-extra-zhongjie',
        'term': '中介',
        'phonetic': 'zhōngjiè',
        'partOfSpeech': 'Danh từ',
        'meaning': 'môi giới, trung gian',
        'collocations': [
            {'phrase': '房屋中介', 'meaning': 'môi giới nhà đất'},
            {'phrase': '通过中介', 'meaning': 'thông qua môi giới'},
        ],
        'examples': [{
            'sentence': '我们是通过中介租到这间房子的。',
            'translation': 'Chúng tôi thuê được căn nhà này thông qua môi giới.',
        }],
        'synonyms': [],
        'notes': 'Thường dùng khi tìm thuê nhà, tìm việc hoặc dịch vụ kết nối.',
    },
    {
        'id': 'zh-extra-juxing',
        'term': '举行',
        'phonetic': 'jǔxíng',
        'partOfSpeech': 'Động từ',
        'meaning': 'tổ chức, tiến hành (lễ, cuộc thi, hội nghị)',
        'collocations': [
            {'phrase': '举行比赛', 'meaning': 'tổ chức cuộc thi'},
            {'phrase': '举行会议', 'meaning': 'tổ chức hội nghị'},
        ],
        'examples': [{
            'sentence': '学校下周举行汉语演讲比赛。',
            'translation': 'Tuần sau trường tổ chức cuộc thi hùng biện tiếng Trung.',
        }],
        'synonyms': ['举办'],
        'notes': 'Đi với sự kiện trang trọng hoặc quy mô như 活动, 仪式, 比赛, 婚礼.',
    },
    {
        'id': 'zh-extra-guafeng',
        'term': '刮风',
        'phonetic': 'guā fēng',
        'partOfSpeech': 'Động từ ly hợp',
        'meaning': 'gió thổi, nổi gió',
        'collocations': [
            {'phrase': '刮大风', 'meaning': 'gió thổi mạnh'},
            {'phrase': '今天刮风', 'meaning': 'hôm nay có gió'},
        ],
        'examples': [{
            'sentence': '外面刮风了，快把窗户关上吧。',
            'translation': 'Ngoài trời nổi gió rồi, mau đóng cửa sổ lại đi.',
        }],
        'synonyms': [],
        'notes': 'Động từ ly hợp, nói về mức độ dùng 刮大风 (gió to) hoặc 刮了一阵风.',
    },
    {
        'id': 'zh-extra-beijing',
        'term': '北京',
        'phonetic': 'Běijīng',
        'partOfSpeech': 'Danh từ',
        'meaning': 'Bắc Kinh (thủ đô Trung Quốc)',
        'collocations': [
            {'phrase': '去北京旅游', 'meaning': 'đi du lịch Bắc Kinh'},
            {'phrase': '北京烤鸭', 'meaning': 'vịt quay Bắc Kinh'},
        ],
        'examples': [{
            'sentence': '九月去北京旅游最好，天气不冷也不热。',
            'translation': 'Tháng chín đi du lịch Bắc Kinh là đẹp nhất, thời tiết không lạnh cũng không nóng.',
        }],
        'synonyms': [],
        'notes': 'Tên riêng địa danh, luôn viết hoa chữ cái đầu khi phiên âm pinyin.',
    },
    {
        'id': 'zh-extra-kele',
        'term': '可乐',
        'phonetic': 'kělè',
        'partOfSpeech': 'Danh từ',
        'meaning': 'nước ngọt có ga, cô-ca',
        'collocations': [
            {'phrase': '一瓶可乐', 'meaning': 'một chai cô-ca'},
            {'phrase': '冰可乐', 'meaning': 'cô-ca lạnh'},
        ],
        'examples': [{
            'sentence': '桌子上放着两瓶冰可乐。',
            'translation': 'Trên bàn có đặt hai chai nước ngọt lạnh.',
        }],
        'synonyms': ['饮料'],
        'notes': 'Lượng từ thường dùng là 瓶 (chai), 罐 (lon), 杯 (cốc).',
    },
    {
        'id': 'zh-extra-ge',
        'term': '各',
        'phonetic': 'gè',
        'partOfSpeech': 'Đại từ',
        'meaning': 'mỗi, các, từng',
        'collocations': [
            {'phrase': '各个地方', 'meaning': 'khắp mọi nơi'},
            {'phrase': '各种各样', 'meaning': 'đủ mọi loại'},
        ],
        'examples': [{
            'sentence': '公园里有各种各样的花，非常好看。',
            'translation': 'Trong công viên có đủ loại hoa, vô cùng đẹp mắt.',
        }],
        'synonyms': ['每'],
        'notes': 'Đứng trước danh từ hoặc lượng từ: 各位 (các vị), 各国 (các nước), 各自 (tự mình).',
    },
    {
        'id': 'zh-extra-duome',
        'term': '多么',
        'phonetic': 'duōme',
        'partOfSpeech': 'Phó từ',
        'meaning': 'biết bao, thật là (cảm thán)',
        'collocations': [
            {'phrase': '多么漂亮', 'meaning': 'đẹp biết bao'},
            {'phrase': '多么重要', 'meaning': 'quan trọng biết bao'},
        ],
        'examples': [{
            'sentence': '今天的天气多么好啊，我们去散步吧！',
            'translation': 'Thời tiết hôm nay đẹp biết bao, chúng ta đi dạo đi!',
        }],
        'synonyms': ['多', '真'],
        'notes': 'Dùng trong câu cảm thán trước tính từ hoặc động từ tâm lý, cuối câu hay có 啊.',
    },
    {
        'id': 'zh-extra-daxing',
        'term': '大兴',
        'phonetic': 'Dàxīng',
        'partOfSpeech': 'Danh từ',
        'meaning': 'Đại Hưng (quận và sân bay quốc tế ở Bắc Kinh)',
        'collocations': [
            {'phrase': '大兴机场', 'meaning': 'sân bay Đại Hưng'},
            {'phrase': '去大兴', 'meaning': 'đi quận Đại Hưng'},
        ],
        'examples': [{
            'sentence': '我们坐地铁去北京大兴国际机场。',
            'translation': 'Chúng tôi đi tàu điện ngầm đến sân bay quốc tế Đại Hưng Bắc Kinh.',
        }],
        'synonyms': [],
        'notes': 'Địa danh quen thuộc trong giáo trình HSK 3.0 gắn với tuyến sân bay mới ở Bắc Kinh.',
    },
    {
        'id': 'zh-extra-taitai',
        'term': '太太',
        'phonetic': 'tàitai',
        'partOfSpeech': 'Danh từ',
        'meaning': 'bà, phu nhân, vợ (lịch sự)',
        'collocations': [
            {'phrase': '王太太', 'meaning': 'bà Vương'},
            {'phrase': '他太太', 'meaning': 'vợ anh ấy'},
        ],
        'examples': [{
            'sentence': '李经理和他的太太都很热情。',
            'translation': 'Giám đốc Lý và phu nhân của ông ấy đều rất nhiệt tình.',
        }],
        'synonyms': ['妻子', '夫人'],
        'notes': 'Cách gọi trang nhã, lịch sự để chỉ người vợ hoặc phụ nữ đã kết hôn (Họ + 太太).',
    },
    {
        'id': 'zh-extra-maozi',
        'term': '帽子',
        'phonetic': 'màozi',
        'partOfSpeech': 'Danh từ',
        'meaning': 'mũ, nón',
        'collocations': [
            {'phrase': '戴帽子', 'meaning': 'đội mũ'},
            {'phrase': '一顶帽子', 'meaning': 'một chiếc mũ'},
        ],
        'examples': [{
            'sentence': '外面太阳很大，记得戴上帽子。',
            'translation': 'Ngoài trời nắng to lắm, nhớ đội mũ vào nhé.',
        }],
        'synonyms': [],
        'notes': 'Đi với động từ 戴 (đội/đeo), không dùng 穿.',
    },
    {
        'id': 'zh-extra-du',
        'term': '度',
        'phonetic': 'dù',
        'partOfSpeech': 'Lượng từ',
        'meaning': 'độ (nhiệt độ, góc độ)',
        'collocations': [
            {'phrase': '零下五度', 'meaning': 'âm 5 độ'},
            {'phrase': '二十多度', 'meaning': 'hơn hai mươi độ'},
        ],
        'examples': [{
            'sentence': '今天气温二十五度，很舒服。',
            'translation': 'Nhiệt độ hôm nay là 25 độ, rất dễ chịu.',
        }],
        'synonyms': ['温度'],
        'notes': 'Đơn vị đo nhiệt độ đứng trực tiếp sau số: 37度 (37 độ), 零度 (0 độ).',
    },
    {
        'id': 'zh-extra-shoujihao',
        'term': '手机号',
        'phonetic': 'shǒujīhào',
        'partOfSpeech': 'Danh từ',
        'meaning': 'số điện thoại di động',
        'collocations': [
            {'phrase': '留个手机号', 'meaning': 'để lại số điện thoại'},
            {'phrase': '记下手机号', 'meaning': 'ghi lại số di động'},
        ],
        'examples': [{
            'sentence': '请把你的手机号发给我，方便联系。',
            'translation': 'Xin hãy gửi số điện thoại của bạn cho tôi để tiện liên lạc.',
        }],
        'synonyms': ['电话号码'],
        'notes': 'Dạng rút gọn tự nhiên của 手机号码 trong giao tiếp hằng ngày.',
    },
    {
        'id': 'zh-extra-dalanqiu',
        'term': '打篮球',
        'phonetic': 'dǎ lánqiú',
        'partOfSpeech': 'Cụm động từ',
        'meaning': 'chơi bóng rổ',
        'collocations': [
            {'phrase': '喜欢打篮球', 'meaning': 'thích chơi bóng rổ'},
            {'phrase': '一起打篮球', 'meaning': 'cùng chơi bóng rổ'},
        ],
        'examples': [{
            'sentence': '下课以后，男生们经常去操场打篮球。',
            'translation': 'Sau khi tan học, các bạn nam thường ra sân tập chơi bóng rổ.',
        }],
        'synonyms': ['踢足球'],
        'notes': 'Các môn bóng dùng tay dùng động từ 打 (打篮球, 打乒乓球); dùng chân dùng 踢.',
    },
    {
        'id': 'zh-extra-jile',
        'term': '极了',
        'phonetic': 'jíle',
        'partOfSpeech': 'Phó từ',
        'meaning': 'vô cùng, cực kỳ (đứng sau tính từ)',
        'collocations': [
            {'phrase': '高兴极了', 'meaning': 'vui mừng khôn xiết'},
            {'phrase': '漂亮极了', 'meaning': 'đẹp cực kỳ'},
        ],
        'examples': [{
            'sentence': '看到老朋友来，爷爷高兴极了。',
            'translation': 'Thấy bạn cũ đến chơi, ông nội vui mừng vô cùng.',
        }],
        'synonyms': ['非常', '特别'],
        'notes': 'Luôn đứng ngay sau tính từ hoặc động từ tâm lý (Tính từ + 极了) để nhấn mạnh mức độ cao nhất.',
    },
    {
        'id': 'zh-extra-zhaoxiangji',
        'term': '照相机',
        'phonetic': 'zhàoxiàngjī',
        'partOfSpeech': 'Danh từ',
        'meaning': 'máy ảnh',
        'collocations': [
            {'phrase': '带照相机', 'meaning': 'mang theo máy ảnh'},
            {'phrase': '新照相机', 'meaning': 'máy ảnh mới'},
        ],
        'examples': [{
            'sentence': '这次去旅游，我带了一台照相机。',
            'translation': 'Chuyến du lịch lần này tôi mang theo một chiếc máy ảnh.',
        }],
        'synonyms': ['相机'],
        'notes': 'Cấu tạo: 照相 (chụp ảnh) + 机 (máy). Trong khẩu ngữ có thể nói gọn là 相机.',
    },
    {
        'id': 'zh-extra-xiongmao',
        'term': '熊猫',
        'phonetic': 'xióngmāo',
        'partOfSpeech': 'Danh từ',
        'meaning': 'gấu trúc',
        'collocations': [
            {'phrase': '大熊猫', 'meaning': 'gấu trúc lớn'},
            {'phrase': '看熊猫', 'meaning': 'xem gấu trúc'},
        ],
        'examples': [{
            'sentence': '孩子们去动物园看大熊猫。',
            'translation': 'Các em nhỏ đi sở thú xem gấu trúc lớn.',
        }],
        'synonyms': [],
        'notes': 'Lượng từ cho gấu trúc là 只 (一只大熊猫).',
    },
    {
        'id': 'zh-extra-pashan',
        'term': '爬山',
        'phonetic': 'páshān',
        'partOfSpeech': 'Động từ ly hợp',
        'meaning': 'leo núi',
        'collocations': [
            {'phrase': '周末爬山', 'meaning': 'cuối tuần đi leo núi'},
            {'phrase': '一起去爬山', 'meaning': 'cùng đi leo núi'},
        ],
        'examples': [{
            'sentence': '周末天气好，我们一起去爬山吧。',
            'translation': 'Cuối tuần thời tiết đẹp, chúng ta cùng đi leo núi nhé.',
        }],
        'synonyms': ['运动'],
        'notes': 'Động từ ly hợp: có thể nói 爬一次山 (leo núi một chuyến), 爬得上去 (leo lên được).',
    },
    {
        'id': 'zh-extra-wanr',
        'term': '玩儿',
        'phonetic': 'wánr',
        'partOfSpeech': 'Động từ',
        'meaning': 'chơi, đi chơi, giải trí',
        'collocations': [
            {'phrase': '出去玩儿', 'meaning': 'ra ngoài đi chơi'},
            {'phrase': '玩儿游戏', 'meaning': 'chơi trò chơi'},
        ],
        'examples': [{
            'sentence': '周末你打算去哪儿玩儿？',
            'translation': 'Cuối tuần bạn định đi đâu chơi?',
        }],
        'synonyms': ['玩'],
        'notes': 'Dạng cuốn lưỡi (nhi hóa âm) phổ biến trong khẩu ngữ miền Bắc Trung Quốc của 玩.',
    },
    {
        'id': 'zh-extra-dianziyoujian',
        'term': '电子邮件',
        'phonetic': 'diànzǐ yóujiàn',
        'partOfSpeech': 'Danh từ',
        'meaning': 'thư điện tử, email',
        'collocations': [
            {'phrase': '发电子邮件', 'meaning': 'gửi email'},
            {'phrase': '收电子邮件', 'meaning': 'nhận email'},
        ],
        'examples': [{
            'sentence': '我已经把资料通过电子邮件发给你了。',
            'translation': 'Tôi đã gửi tài liệu cho bạn qua email rồi.',
        }],
        'synonyms': ['邮件'],
        'notes': 'Lượng từ thường dùng là 封 (一封电子邮件 = một bức thư điện tử).',
    },
    {
        'id': 'zh-extra-pixie',
        'term': '皮鞋',
        'phonetic': 'píxié',
        'partOfSpeech': 'Danh từ',
        'meaning': 'giày da',
        'collocations': [
            {'phrase': '穿皮鞋', 'meaning': 'đi giày da'},
            {'phrase': '一双皮鞋', 'meaning': 'một đôi giày da'},
        ],
        'examples': [{
            'sentence': '爸爸每天上班都要穿黑色皮鞋。',
            'translation': 'Bố tôi ngày nào đi làm cũng phải đi giày da màu đen.',
        }],
        'synonyms': ['鞋'],
        'notes': 'Lượng từ cho giày luôn là 双 (một đôi).',
    },
    {
        'id': 'zh-extra-zhenzheng',
        'term': '真正',
        'phonetic': 'zhēnzhèng',
        'partOfSpeech': 'Tính từ / Phó từ',
        'meaning': 'chân chính, thực sự, đích thực',
        'collocations': [
            {'phrase': '真正的朋友', 'meaning': 'người bạn đích thực'},
            {'phrase': '真正理解', 'meaning': 'thực sự thấu hiểu'},
        ],
        'examples': [{
            'sentence': '遇到困难时，才会知道谁是真正的朋友。',
            'translation': 'Khi gặp khó khăn mới biết ai là người bạn chân chính.',
        }],
        'synonyms': ['真的', '实在'],
        'notes': 'Khi bổ nghĩa cho danh từ thường đi với 的 (真正的问题); khi đứng trước động từ đóng vai trò phó từ.',
    },
    {
        'id': 'zh-extra-shuizhao',
        'term': '睡着',
        'phonetic': 'shuìzháo',
        'partOfSpeech': 'Động từ',
        'meaning': 'ngủ thiếp đi, ngủ say',
        'collocations': [
            {'phrase': '很快睡着', 'meaning': 'ngủ thiếp đi rất nhanh'},
            {'phrase': '睡着了', 'meaning': 'đã ngủ rồi'},
        ],
        'examples': [{
            'sentence': '孩子太累了，刚躺下就睡着了。',
            'translation': 'Đứa trẻ mệt quá, vừa nằm xuống đã ngủ thiếp đi rồi.',
        }],
        'synonyms': ['睡觉'],
        'notes': 'Kết hợp động từ 睡 và bổ ngữ kết quả 着 (zháo = đạt tới), phủ định dùng 没睡着 (chưa ngủ được).',
    },
    {
        'id': 'zh-extra-mishu',
        'term': '秘书',
        'phonetic': 'mìshū',
        'partOfSpeech': 'Danh từ',
        'meaning': 'thư ký',
        'collocations': [
            {'phrase': '公司秘书', 'meaning': 'thư ký công ty'},
            {'phrase': '周秘书', 'meaning': 'thư ký Chu'},
        ],
        'examples': [{
            'sentence': '经理让我先把会议资料交给秘书。',
            'translation': 'Giám đốc bảo tôi đưa tài liệu cuộc họp cho thư ký trước.',
        }],
        'synonyms': [],
        'notes': 'Thường ghép sau họ: 王秘书 (thư ký Vương). Chú ý thanh điệu: mìshū.',
    },
    {
        'id': 'zh-extra-fense',
        'term': '粉色',
        'phonetic': 'fěnsè',
        'partOfSpeech': 'Danh từ',
        'meaning': 'màu hồng',
        'collocations': [
            {'phrase': '粉色的衣服', 'meaning': 'áo màu hồng'},
            {'phrase': '浅粉色', 'meaning': 'màu hồng nhạt'},
        ],
        'examples': [{
            'sentence': '妹妹最喜欢粉色的书包。',
            'translation': 'Em gái thích nhất chiếc cặp sách màu hồng.',
        }],
        'synonyms': ['红色'],
        'notes': 'Dùng làm định ngữ trực tiếp hoặc thêm 的 (粉色裙子 / 粉色的花).',
    },
    {
        'id': 'zh-extra-yangrou',
        'term': '羊肉',
        'phonetic': 'yángròu',
        'partOfSpeech': 'Danh từ',
        'meaning': 'thịt cừu, thịt dê',
        'collocations': [
            {'phrase': '烤羊肉', 'meaning': 'thịt cừu nướng'},
            {'phrase': '羊肉面', 'meaning': 'mì thịt cừu'},
        ],
        'examples': [{
            'sentence': '这家饭馆的羊肉面条很好吃。',
            'translation': 'Mì thịt cừu của quán ăn này rất ngon.',
        }],
        'synonyms': ['肉'],
        'notes': 'Các loại thịt ghép bằng tên con vật + 肉: 羊肉, 牛肉, 鸡肉.',
    },
    {
        'id': 'zh-extra-meiguo',
        'term': '美国',
        'phonetic': 'Měiguó',
        'partOfSpeech': 'Danh từ',
        'meaning': 'nước Mỹ, Hoa Kỳ',
        'collocations': [
            {'phrase': '美国人', 'meaning': 'người Mỹ'},
            {'phrase': '去美国留学', 'meaning': 'đi du học Mỹ'},
        ],
        'examples': [{
            'sentence': '我的新同学大卫是美国人。',
            'translation': 'Bạn học mới của tôi là David, người Mỹ.',
        }],
        'synonyms': ['中国'],
        'notes': 'Từ ghép Mỹ (美 = đẹp) + 国 (quốc gia), thêm 人 để chỉ quốc tịch.',
    },
    {
        'id': 'zh-extra-xinglixiang',
        'term': '行李箱',
        'phonetic': 'xínglixiāng',
        'partOfSpeech': 'Danh từ',
        'meaning': 'vali hành lý',
        'collocations': [
            {'phrase': '拉行李箱', 'meaning': 'kéo vali'},
            {'phrase': '大行李箱', 'meaning': 'vali cỡ lớn'},
        ],
        'examples': [{
            'sentence': '出发前，她把衣服都放进了行李箱里。',
            'translation': 'Trước khi khởi hành, cô ấy cất hết quần áo vào trong vali.',
        }],
        'synonyms': ['行李'],
        'notes': 'Từ ghép 行李 (hành lý) + 箱 (thùng, hòm). Lượng từ thường dùng là 个.',
    },
    {
        'id': 'zh-extra-jiedao',
        'term': '街道',
        'phonetic': 'jiēdào',
        'partOfSpeech': 'Danh từ',
        'meaning': 'đường phố, phố xá',
        'collocations': [
            {'phrase': '安静的街道', 'meaning': 'con phố yên tĩnh'},
            {'phrase': '街道两旁', 'meaning': 'hai bên đường phố'},
        ],
        'examples': [{
            'sentence': '春天的街道两旁开满了漂亮的花。',
            'translation': 'Hai bên đường phố mùa xuân nở đầy hoa đẹp.',
        }],
        'synonyms': ['马路'],
        'notes': 'Thường dùng lượng từ 条 (一条街道 = một con phố).',
    },
    {
        'id': 'zh-extra-ciyu',
        'term': '词语',
        'phonetic': 'cíyǔ',
        'partOfSpeech': 'Danh từ',
        'meaning': 'từ ngữ, từ vựng',
        'collocations': [
            {'phrase': '生词词语', 'meaning': 'từ vựng mới'},
            {'phrase': '常用词语', 'meaning': 'từ ngữ thường dùng'},
        ],
        'examples': [{
            'sentence': '请用课本里的这些词语造几个句子。',
            'translation': 'Hãy dùng những từ ngữ trong sách giáo khoa này đặt vài câu.',
        }],
        'synonyms': ['词', '词汇'],
        'notes': 'Khác với 词 (một từ đơn lẻ), 词语 thường chỉ chung các từ và cụm từ trong bài học.',
    },
    {
        'id': 'zh-extra-tizuqiu',
        'term': '踢足球',
        'phonetic': 'tī zúqiú',
        'partOfSpeech': 'Cụm động từ',
        'meaning': 'đá bóng, chơi bóng đá',
        'collocations': [
            {'phrase': '去操场踢足球', 'meaning': 'ra sân đá bóng'},
            {'phrase': '喜欢踢足球', 'meaning': 'thích đá bóng'},
        ],
        'examples': [{
            'sentence': '他每周六下午都和朋友去踢足球。',
            'translation': 'Chiều thứ Bảy nào anh ấy cũng đi đá bóng cùng bạn bè.',
        }],
        'synonyms': ['打篮球'],
        'notes': 'Động từ 踢 (đá) kết hợp với danh từ 足球 (bóng đá), có thể chèn thêm thành phần: 踢了一场足球.',
    },
    {
        'id': 'zh-extra-huanghe',
        'term': '黄河',
        'phonetic': 'Huánghé',
        'partOfSpeech': 'Danh từ',
        'meaning': 'sông Hoàng Hà',
        'collocations': [
            {'phrase': '黄河文化', 'meaning': 'văn hóa sông Hoàng Hà'},
            {'phrase': '一条黄河', 'meaning': 'dòng sông Hoàng Hà'},
        ],
        'examples': [{
            'sentence': '黄河是中国北方非常重要的一条大河。',
            'translation': 'Hoàng Hà là một con sông lớn rất quan trọng ở miền Bắc Trung Quốc.',
        }],
        'synonyms': [],
        'notes': 'Tên riêng địa danh, gọi theo sắc phù sa màu vàng (黄 = vàng, 河 = sông).',
    },
]

# ---------------------------------------------------------------------------
# HSK 2.0 Textbook Syllabus: 《HSK标准教程 1–3》 (50 lessons)
# Tuple format: (level_id, lesson_num, textbook_title, vietnamese_desc, terms)
# ---------------------------------------------------------------------------
HSK20_SYLLABUS: list[tuple[str, int, str, str, list[str]]] = [
    # --- HSK 1 (15 lessons) ---
    ('hsk1', 1, '你好', 'Chào hỏi cơ bản và xưng hô lịch sự.', ['你好', '您', '你们', '对不起', '没关系']),
    ('hsk1', 2, '谢谢你', 'Nói lời cảm ơn, đáp lời lịch sự và tạm biệt.', ['谢谢', '不', '不客气', '再见', '请']),
    ('hsk1', 3, '你叫什么名字', 'Hỏi tên, quốc tịch và giới thiệu bản thân.', ['叫', '什么', '名字', '我', '是', '老师', '吗', '学生', '人', '中国', '美国']),
    ('hsk1', 4, '她是我的汉语老师', 'Giới thiệu người thân quen, sở hữu 的 và câu hỏi ai.', ['她', '谁', '的', '汉语', '哪', '国', '呢', '他', '同学', '朋友']),
    ('hsk1', 5, '她女儿今年二十岁', 'Hỏi tuổi tác, số đếm và diễn tả sự thay đổi với 了.', ['家', '有', '女儿', '几', '岁', '了', '今年', '多', '大', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']),
    ('hsk1', 6, '我会说汉语', 'Kỹ năng ngôn ngữ, nấu món ăn và đọc viết chữ Hán.', ['会@82', '说', '妈妈', '菜', '很', '好吃', '做', '写', '字', '怎么', '读']),
    ('hsk1', 7, '今天几号', 'Ngày tháng, thứ trong tuần và kế hoạch đi học.', ['请问', '今天', '号', '星期', '昨天', '明天', '去', '学校', '看', '书']),
    ('hsk1', 8, '我想喝茶', 'Gọi đồ ăn thức uống, mua sắm và hỏi giá tiền.', ['想', '喝', '茶', '吃', '米饭', '下午', '商店', '买', '个', '杯子', '这', '多少', '钱', '块', '那']),
    ('hsk1', 9, '你儿子在哪儿工作', 'Hỏi nơi ở, nơi làm việc với 在 và thành viên gia đình.', ['小', '猫', '在', '那儿', '狗', '椅子', '下面', '工作', '儿子', '医院', '医生', '爸爸']),
    ('hsk1', 10, '我能坐这儿吗', 'Vị trí đồ vật quanh nhà, xin phép và cụm từ không có.', ['桌子', '上', '电脑', '和', '里', '没有', '能', '坐', '这儿', '前面', '后面', '哪儿']),
    ('hsk1', 11, '现在几点', 'Hỏi giờ giấc, sinh hoạt hằng ngày và các buổi trong ngày.', ['现在', '点@33', '分', '中午', '吃饭', '时候', '回', '我们', '电影', '住', '前', '北京']),
    ('hsk1', 12, '明天天气怎么样', 'Miêu tả thời tiết nắng mưa, nóng lạnh và sức khỏe.', ['天气', '怎么样', '太', '热', '冷', '下雨', '小姐', '来', '身体', '爱', '些', '水果', '水']),
    ('hsk1', 13, '他在学做中国菜呢', 'Hành động đang diễn ra, gọi điện thoại và xem tivi.', ['喂', '也', '学习', '上午', '睡觉', '电视', '喜欢', '给', '打电话', '吧', '正在']),
    ('hsk1', 14, '她买了不少衣服', 'Mua sắm quần áo, táo, xe cộ và diễn tả hoàn thành.', ['东西', '一点儿', '苹果', '看见', '先生', '开', '车', '回来', '分钟', '后', '衣服', '漂亮', '啊', '少', '不少', '都']),
    ('hsk1', 15, '我是坐飞机来的', 'Phương tiện đi lại, thời gian quen biết và cấu trúc 是…的.', ['认识', '年', '大学', '饭店', '出租车', '一起', '高兴', '听', '飞机', '火车站', '地铁']),

    # --- HSK 2 (15 lessons) ---
    ('hsk2', 1, '九月去北京旅游最好', 'Mùa du lịch đẹp nhất, chơi thể thao và đưa ra lựa chọn.', ['旅游', '觉得', '最', '为什么', '运动', '踢足球', '要', '新', '它', '眼睛', '月', '日']),
    ('hsk2', 2, '我每天六点起床', 'Thói quen buổi sáng, chăm sóc sức khỏe và luyện tập.', ['生病', '每', '早上', '跑步', '起床', '药', '出', '高', '米', '知道', '休息', '忙', '时间']),
    ('hsk2', 3, '左边那个红色的是我的', 'Màu sắc, đồ dùng cá nhân và vị trí trái phải bên cạnh.', ['手表', '千', '报纸', '送', '一下', '牛奶', '房间', '丈夫', '旁边', '真', '粉色', '颜色', '左边', '红色', '右边']),
    ('hsk2', 4, '这个工作是他帮我介绍的', 'Giới thiệu việc làm, chúc mừng sinh nhật và gửi tặng.', ['生日', '快乐', '晚上', '问', '非常', '开始', '已经', '长@314', '两', '帮', '介绍', '百']),
    ('hsk2', 5, '就买这件吧', 'Nhận xét chất lượng, thời tiết bên ngoài và đưa ra gợi ý.', ['外', '准备', '就', '鱼', '件', '还@67', '可以', '不错', '考试', '意思', '咖啡', '对']),
    ('hsk2', 6, '你怎么不吃了', 'Hỏi lý do, đồ dùng học tập và thói quen ở cửa.', ['门', '自行车', '羊肉', '好吃', '面条', '打篮球', '因为', '所以', '游泳', '经常', '公斤', '姐姐']),
    ('hsk2', 7, '你家离公司远吗', 'Khoảng cách từ nhà đến công ty và phương tiện công cộng.', ['教室', '机场', '路', '离', '公司', '远', '公共汽车', '小时', '慢', '快', '过@347', '走', '到']),
    ('hsk2', 8, '让我想想再告诉你', 'Suy nghĩ trước khi trả lời, đề nghị giúp và màu sắc.', ['再', '让', '告诉', '等', '找', '事情', '服务员', '白', '黑', '贵', '便宜']),
    ('hsk2', 9, '题太多，我没做完', 'Làm bài thi, bổ ngữ kết quả và nhận xét bài tập.', ['题', '错', '从', '跳舞', '第一', '希望', '问题', '欢迎', '上班', '懂', '完', '课']),
    ('hsk2', 10, '别找了，手机在桌子上呢', 'Khuyên nhủ với 别, tìm đồ vật và lời cảm ơn giúp đỡ.', ['别', '哥哥', '鸡蛋', '西瓜', '手机', '洗', '帮助', '笑', '回答', '站@486', '饿', '超市']),
    ('hsk2', 11, '他比我大三岁', 'So sánh hơn kém với 比 và nhận xét bạn bè xung quanh.', ['唱歌', '男', '女', '孩子', '比', '年轻', '弟弟', '可能', '去年', '姓', '近', '进']),
    ('hsk2', 12, '你穿得太少了', 'Mặc ấm mùa lạnh, thức dậy sớm và bổ ngữ trạng thái 得.', ['得@332', '妻子', '雪', '下雪', '零', '度', '穿', '晚上', '早', '晚', '宾馆', '一直']),
    ('hsk2', 13, '门开着呢', 'Diễn tả trạng thái duy trì với 着 và tìm đường đi.', ['着', '手', '拿', '铅笔', '班', '长@968', '往', '路口', '次', '玩儿', '晴', '阴']),
    ('hsk2', 14, '你看过那个电影吗', 'Kể về trải nghiệm với 过 và cảm nhận phim ảnh, đồ ăn.', ['过@351', '虽然', '但是', '大家', '有意思', '没意思', '不错', '红茶', '绿茶', '肉', '面包', '蛋糕']),
    ('hsk2', 15, '新年就要到了', 'Chuẩn bị đón năm mới, chúc mừng và kế hoạch tương lai.', ['新年', '过年', '快要', '万', '以后', '只@287', '条', '双', '位', '酒店', '银行', '礼物']),

    # --- HSK 3 (20 lessons) ---
    ('hsk3', 1, '周末你有什么打算', 'Hỏi thăm kế hoạch cuối tuần và ôn tập bài học.', ['周末', '打算', '啊', '跟', '一直', '游戏', '作业', '着急', '复习']),
    ('hsk3', 2, '他什么时候回来', 'Thời gian trở về, địa lý nam bắc và đồ dùng đi đường.', ['南方', '北方', '面包', '带@190', '地图', '搬', '腿', '疼', '脚', '树', '容易', '难']),
    ('hsk3', 3, '桌子上放着很多饮料', 'Miêu tả đồ uống, khẩu vị và chọn mua đồ.', ['太太', '秘书', '经理', '办公室', '辆', '楼', '拿', '把@506', '伞', '胖', '其实', '瘦']),
    ('hsk3', 4, '她总是笑着跟客人说话', 'Tính cách, tác phong làm việc và đón tiếp khách.', ['还是', '爬山', '小心', '条', '裤子', '记得', '衬衫', '元', '新鲜', '甜', '只@975', '放', '饮料', '或者', '舒服', '花@358', '绿']),
    ('hsk3', 5, '我最近越来越胖了', 'Chăm sóc sức khỏe, phát sốt cảm cúm và biến đổi 越来越.', ['比赛', '照片', '年级', '又', '聪明', '热情', '努力', '总是', '回答', '站@966', '饿', '超市', '蛋糕', '越来越']),
    ('hsk3', 6, '怎么突然找不到了', 'Tìm kính, giải thích nguyên nhân và chăm sóc người ốm.', ['发烧', '照顾', '用', '感冒', '季节', '当然', '春天', '夏天', '秋天', '冬天', '草', '变化']),
    ('hsk3', 7, '我跟她都认识五年了', 'Khoảng thời gian quen biết, đồng nghiệp và lịch hẹn.', ['突然', '离开', '清楚', '刚才', '帮忙', '讲', '明白', '锻炼', '眼镜', '迟到', '同事', '以后']),
    ('hsk3', 8, '你去哪儿我就去哪儿', 'Đặt lịch hẹn, đi sở thú và sở thích chụp ảnh.', ['满意', '电梯', '层', '害怕', '熊猫', '见面', '安静', '可乐', '一会儿', '马上', '洗手间', '老']),
    ('hsk3', 9, '她的汉语说得跟中国人一样好', 'So sánh khả năng ngoại ngữ, môn học và khích lệ.', ['中文', '班', '一样', '最后', '放心', '一定', '担心', '比较', '了解', '先', '中间', '参加']),
    ('hsk3', 10, '数学比历史难多了', 'So sánh mức độ khó của môn học và kinh nghiệm học tập.', ['影响', '数学', '历史', '体育', '方便', '自行车', '骑', '旧', '换', '地方', '中介', '主要']),
    ('hsk3', 11, '别忘了把空调关了', 'Dặn dò tắt điều hòa, đóng cửa và dùng câu chữ 把.', ['图书馆', '借', '词典', '还@678', '灯', '会议', '结束', '忘记', '空调', '关', '地铁', '双', '筷子']),
    ('hsk3', 12, '把重要的东西放在我这儿吧', 'Chuẩn bị hộ chiếu, hành lý lên máy bay và dặn dò.', ['啤酒', '口', '瓶', '笔记本', '电子邮件', '习惯', '太阳', '西', '东', '生气', '行李箱', '自己', '包', '发现', '护照', '起飞', '司机', '教', '画', '需要']),
    ('hsk3', 13, '我是走回来的', 'Kể lại lộ trình di chuyển và bổ ngữ xu hướng phức.', ['终于', '爷爷', '奶奶', '礼物', '遇到', '一边', '过去@350', '一般', '愿意', '起来', '应该', '生活', '校长', '坏', '经常', '街道']),
    ('hsk3', 14, '你把水果拿过来', 'Đón khách, dọn dẹp nhà cửa và nhờ mang đồ sang.', ['打扫', '干净', '然后', '冰箱', '洗澡', '节目', '月亮', '像', '盘子', '刮风', '叔叔', '阿姨', '故事', '声音', '菜单', '简单', '香蕉']),
    ('hsk3', 15, '其他都没什么问题', 'Thói quen học tiếng, đọc báo và tra từ điển.', ['留学', '水平', '提高', '练习', '完成', '句子', '其他', '发', '要求', '注意', '上网', '除了', '新闻', '花@357', '极了', '节日', '举行', '世界', '街道', '各']),
    ('hsk3', 16, '我现在累得下了班就想睡觉', 'Cảm giác mệt mỏi sau giờ làm và tìm đồ dùng trong phòng.', ['如果', '认为', '皮鞋', '帽子', '长@314', '可爱', '米', '公斤', '鼻子', '头发', '检查', '刷牙', '关系', '别人', '词语', '机会', '城市']),
    ('hsk3', 17, '谁都有办法看好你的“病”', 'Lời khuyên giảm stress, thư giãn và giữ tinh thần tốt.', ['请假', '一共', '邻居', '后来', '爱好', '办法', '饱', '为了', '决定', '选择', '夏天', '渴', '只@287', '动物', '马', '鸟', '哭']),
    ('hsk3', 18, '我相信他们会同意的', 'Thảo luận thuê nhà, công việc và bày tỏ sự đồng tình.', ['向', '万', '只@975', '嘴', '动物', '段', '不但', '而且', '有名', '同意', '相信', '关于', '机会', '国家', '种', '奇怪', '地@333', '重要']),
    ('hsk3', 19, '你没看出来吗', 'Nhận ra sự thay đổi của bạn bè và cảm xúc bất ngờ.', ['耳朵', '脸', '短', '马', '张', '位', '蓝', '秋天', '过@347', '鸟', '哭', '黄河', '船', '经过', '真正', '睡着', '极了', '多么', '照相机']),
    ('hsk3', 20, '我被他影响了', 'Ảnh hưởng tích cực từ người khác, câu bị động 被 và chia sẻ.', ['被@519', '影响', '难过', '高兴', '解决', '试', '问题', '帮助', '文化', '成绩', '笑', '生活', '重要', '努力', '提高', '谢谢']),
]

# ---------------------------------------------------------------------------
# HSK 3.0 Textbook Syllabus: 《新HSK教程 1–3》 (48 lessons, covers all 1,000 HSK 3.0 words)
# Tuple format: (level_id, lesson_num, textbook_title, vietnamese_desc, terms)
# Note: All remaining official HSK 3.0 words for each level (1, 2, 3) are assigned cleanly
#       to textbook lessons with zero duplicates and 100% coverage of hskId 1..1000.
# ---------------------------------------------------------------------------
HSK30_SYLLABUS: list[tuple[str, int, str, str, list[str]]] = [
    # --- HSK 1 (15 lessons, 300 HSK 3.0 L1 words + 下雪, 大兴) ---
    ('hsk1', 1, '你好', 'Chào hỏi, xưng hô và những trợ từ câu đầu tiên.', [
        '你好', '您', '你们', '我', '你', '他', '她', '它', '我们', '他们', '她们', '它们', '吗', '呢', '吧', '啊',
        '对不起', '没关系', '没事', '谢谢', '不客气', '再见',
    ]),
    ('hsk1', 2, '你叫什么名字', 'Giới thiệu tên, quốc tịch, ngôn ngữ và động từ 是.', [
        '叫', '什么', '名字', '是', '不', '老师', '学生', '人', '中国', '汉语', '中文', '汉字', '谁', '的', '哪', '哪儿', '哪里', '国', '朋友', '同学',
    ]),
    ('hsk1', 3, '我的家', 'Các thành viên trong gia đình, người thân và thú cưng.', [
        '家', '家人', '爸爸', '妈妈', '哥哥', '姐姐', '弟弟', '妹妹', '儿子', '女儿', '孩子', '小朋友', '男', '女', '男朋友', '女朋友', '先生', '女士', '狗', '猫',
    ]),
    ('hsk1', 4, '你几岁了', 'Số đếm từ 0 đến nghìn, tuổi tác và các lượng từ nền tảng.', [
        '几', '岁', '今年', '去年', '明年', '零', '一', '二', '两', '三', '四', '五', '六', '七', '八', '九', '十', '百', '千', '第', '个', '只@287', '本', '口', '些', '一点儿', '一些', '一半', '半', '多', '多少', '少',
    ]),
    ('hsk1', 5, '我会说汉语', 'Diễn đạt khả năng, mong muốn, đọc viết và ghi nhớ.', [
        '会@82', '能', '可以', '要', '不要', '想', '觉得', '知道', '认识', '说', '说话', '读', '读书', '写', '字', '听', '听见', '看', '看见', '问', '请问', '请',
    ]),
    ('hsk1', 6, '今天几月几号', 'Ngày tháng, thứ, năm và các mốc thời gian cơ bản.', [
        '年', '月', '日', '号', '星期', '星期日', '星期天', '今天', '明天', '昨天', '白天', '早', '早上', '上午', '中午', '下午', '晚', '晚上', '时候', '时间', '现在',
    ]),
    ('hsk1', 7, '现在几点', 'Hỏi giờ giấc, phút, sinh hoạt thức dậy và đi ngủ.', [
        '点@33', '分', '分钟', '小时', '起床', '睡', '睡觉', '休息', '早饭', '午饭', '晚饭', '饭', '做饭', '做', '上班', '下班', '上学', '上课', '下课', '玩',
    ]),
    ('hsk1', 8, '你喜欢喝什么', 'Đồ ăn thức uống hằng ngày và cảm nhận vị ngon.', [
        '喜欢', '爱', '吃', '喝', '水', '茶', '牛奶', '水果', '苹果', '菜', '米饭', '面包', '面条儿', '包子', '饺子', '鸡蛋', '好吃', '杯子', '饭店',
    ]),
    ('hsk1', 9, '这个多少钱', 'Mua sắm ở cửa hàng, siêu thị, quần áo và giá cả.', [
        '商店', '超市', '买', '卖', '东西', '钱', '元', '块', '贵', '便宜', '新', '漂亮', '好看', '衣服', '穿', '件', '这', '这个', '这些', '那', '那个', '那些',
    ]),
    ('hsk1', 10, '你住在哪里', 'Nhà cửa, phòng ốc, đồ đạc và vị trí không gian.', [
        '住', '在', '有', '没有', '房间', '桌子', '椅子', '上', '下', '前', '后', '里', '外', '外边', '边', '这儿', '这边', '这里', '那儿', '那边', '那里', '都',
    ]),
    ('hsk1', 11, '你是怎么来的', 'Phương tiện giao thông, ga tàu, sân bay và di chuyển.', [
        '去', '来', '回', '到', '坐', '走', '开', '开车', '车', '出租车', '火车', '飞机', '大兴', '怎么', '怎么样', '一下', '一起', '找', '给', '事',
    ]),
    ('hsk1', 12, '我去学校学习', 'Trường học từ tiểu học đến đại học và việc học tập.', [
        '学校', '小学', '小学生', '中学', '中学生', '大学', '大学生', '书', '书店', '学', '学习', '课', '大家', '真', '非常', '很', '太', '好', '也', '还@67', '和',
    ]),
    ('hsk1', 13, '我在医院工作', 'Nghề nghiệp, bác sĩ, sức khỏe và liên lạc điện thoại.', [
        '工作', '公司', '医生', '医院', '病', '生病', '看病', '喂', '电话', '打电话', '手机', '电脑', '电视', '电影', '电影院', '放', '正在', '了',
    ]),
    ('hsk1', 14, '今天天气怎么样', 'Thời tiết nắng, mưa, tuyết rơi và cảm nhận nóng lạnh.', [
        '天', '天气', '下雨', '雨', '雪', '下雪', '冷', '热', '大', '小', '高兴', '忙', '累', '对', '问题',
    ]),
    ('hsk1', 15, '周末我们去玩儿', 'Giải trí ca hát, đánh giá sự vật và tổng kết HSK 1.', [
        '歌', '唱', '好玩儿', '好听', '笑', '见', '忘', '有的', '有些', '有点儿', '们',
    ]),

    # --- HSK 2 (15 lessons, 200 HSK 3.0 L2 words + 手机号) ---
    ('hsk2', 1, '你为什么学汉语', 'Hỏi lý do, biểu đạt nhân quả và trình độ.', [
        '为什么', '因为', '所以', '但', '但是', '虽然', '意思', '有意思', '没意思', '不错', '可能', '希望', '爱好', '经常', '每', '有时',
    ]),
    ('hsk2', 2, '我的家人', 'Gia đình mở rộng, ông bà, vợ chồng và trẻ nhỏ.', [
        '爷爷', '奶奶', '丈夫', '妻子', '小孩儿', '男孩儿', '女孩儿', '小时候', '从小', '自己', '大家', '位', '姓', '姓名', '名', '生日', '快乐',
    ]),
    ('hsk2', 3, '请给我一杯咖啡', 'Quán ăn, quán cà phê, trà sữa và các món thường gọi.', [
        '咖啡', '奶茶', '红茶', '绿茶', '肉', '鱼', '饭馆', '点@336', '酒', '酒店', '花@358', '瓶', '包',
    ]),
    ('hsk2', 4, '我想买一件衣服', 'Mua sắm ở trung tâm thương mại, màu sắc và trang phục.', [
        '商场', '颜色', '红色', '白色', '黑色', '绿色', '裤子', '洗', '干净', '穿', '长@314', '短',
    ]),
    ('hsk2', 5, '请问，火车站怎么走', 'Hỏi đường, phương hướng trái phải và vị trí không gian.', [
        '路', '路上', '走路', '车站', '公共汽车', '公交车', '地铁', '打车', '站@486', '离', '近', '远', '往', '左边', '左', '右边', '右', '前面', '后面', '旁边', '对面', '里面', '外面', '上面', '下面', '门口', '门', '楼', '间',
    ]),
    ('hsk2', 6, '我们要坐飞机去', 'Sân bay, vé tàu xe, du lịch nước ngoài và qua lại.', [
        '机场', '机票', '票', '门票', '飞', '旅游', '外国', '出国', '出', '出去', '出来', '出门', '进', '进去', '进来', '回去', '回来', '上去', '上来', '下去', '下来', '过@347', '过去@350', '过来', '送',
    ]),
    ('hsk2', 7, '他正在打电话呢', 'Internet, liên lạc, đồng hồ và số điện thoại.', [
        '上网', '网上', '打开', '打', '手机号', '手表', '告诉', '说话', '记得', '忘', '词', '画', '找',
    ]),
    ('hsk2', 8, '你每天几点起床', 'Thời gian biểu, tuần lễ, lịch trình và từ nối tiếp diễn.', [
        '周', '一会儿', '时', '次', '已经', '就', '正', '快要', '快', '慢', '开始', '完', '准备', '事情', '等', '刚才', '先', '后',
    ]),
    ('hsk2', 9, '我喜欢踢足球', 'Các môn thể thao, bóng đá, bóng rổ, bơi lội và chạy bộ.', [
        '运动', '球', '足球', '踢', '篮球', '跑', '跑步', '游', '游泳', '跳舞', '动', '起', '起来', '拿',
    ]),
    ('hsk2', 10, '我们教室在三楼', 'Lớp học, đồ dùng học tập, dạy học và kỳ thi.', [
        '教室', '班', '开学', '高中', '书包', '本子', '笔', '教', '考', '考试', '题', '懂', '错', '对', '帮', '帮忙',
    ]),
    ('hsk2', 11, '我觉得头有点儿疼', 'Cơ thể con người, triệu chứng đau nhức và thuốc men.', [
        '身体', '头', '手', '眼睛', '疼', '舒服', '累', '药', '药店', '洗手间', '不好意思', '笑',
    ]),
    ('hsk2', 12, '昨天我过得很开心', 'Miêu tả trải nghiệm đã qua, trạng thái và bổ ngữ.', [
        '过@351', '着', '得@332', '地@333', '过年', '万', '个子', '高', '重', '轻',
    ]),
    ('hsk2', 13, '外面下雪了', 'Thiên nhiên, thời tiết nắng âm u, chim muông và hoa lá.', [
        '晴', '阴', '鸟', '花@358', '坏', '风', '树', '草',
    ]),
    ('hsk2', 14, '他比我高一点儿', 'Cấu trúc so sánh 比, cách diễn đạt mức độ và thái độ.', [
        '比', '最', '这么', '这样', '那么', '那样', '让', '跟', '从', '得@587', '花@357',
    ]),
    ('hsk2', 15, '准备过年了', 'Đón năm mới, thời gian dự định và tổng kết HSK 2.', [
        '一起', '过@347', '还是', '别', '介绍', '欢迎', '过年', '万', '就',
    ]),

    # --- HSK 3 (18 lessons, ALL 500 HSK 3.0 L3 words: hskId 501..1000) ---
    ('hsk3', 1, '新邻居和新环境', 'Chuyển nhà, hàng xóm, người thân và môi trường sống mới.', [
        '搬', '搬家', '邻居', '楼', '层', '电梯', '房间', '客厅', '卧室', '厨房', '厕所', '窗户', '空调', '冰箱', '洗衣机', '打扫', '干净', '乱', '放', '整理', '收拾', '阿姨', '叔叔', '爱人', '老人', '年轻人', '屋子', '房子', '小区', '沙发', '楼梯',
    ]),
    ('hsk3', 2, '周末有什么安排', 'Lên kế hoạch cuối tuần, kỳ nghỉ, đặt lịch hẹn và hoạt động.', [
        '周末', '打算', '安排', '计划', '决定', '选择', '参加', '活动', '比赛', '游戏', '约', '约会', '见面', '邀请', '同意', '答应', '拒绝', '假@jià', '请假', '假期', '放假', '过节', '春节', '休假', '生日', '晚会', '请客', '做客',
    ]),
    ('hsk3', 3, '办公室的一天', 'Công việc văn phòng, đồng nghiệp, họp hành và email.', [
        '办公室', '同事', '经理', '领导', '秘书', '员工', '客户', '部门', '团队', '加班', '开会', '会@683', '会议', '工作日', '文件', '资料', '项目', '任务', '合同', '工资', '发', '收', '邮件', '电子邮件', '邮箱', '收到', '服务', '名单',
    ]),
    ('hsk3', 4, '校园与学习方法', 'Học tập, môn học, kỳ thi, từ điển và nâng cao trình độ.', [
        '班级', '年级', '初中', '校长', '课程', '数学', '历史', '文化', '语言', '外语', '句子', '词语', '词典', '字典', '笔记', '笔记本', '作业', '练习', '复习', '讲', '解释', '回答', '图书馆', '借', '还@678', '成绩', '水平', '提高', '毕业', '留学', '留学生', '课本', '课文', '黑板', '铅笔', '校园', '页', '难题',
    ]),
    ('hsk3', 5, '健康的生活习惯', 'Sức khỏe, triệu chứng bệnh, khám bệnh và tập luyện.', [
        '健康', '安全', '感冒', '发烧', '咳嗽', '牙', '牙刷', '刷牙', '洗澡', '检查', '吃药', '出院', '住院', '护士', '病人', '照顾', '锻炼', '瘦', '胖', '饱', '饿', '渴', '困', '醒', '躺', '睡着', '习惯', '生活', '身高', '头发', '脸', '耳朵', '嘴', '脚', '腿', '心里', '身边',
    ]),
    ('hsk3', 6, '美食与下厨', 'Hương vị món ăn, đồ uống, dụng cụ bếp và đi ăn hàng.', [
        '甜', '新鲜', '尝', '碗', '盘子', '筷子', '勺子', '菜单', '外卖', '饮料', '可乐', '啤酒', '酒', '矿泉水', '冰', '冰激凌', '米', '鸡蛋', '鸡', '牛', '羊', '蔬菜', '香蕉', '西瓜', '蛋糕', '糖', '方便面', '瓶子',
    ]),
    ('hsk3', 7, '逛街与购物消费', 'Mua sắm, thanh toán, giá cả, quần áo và đồ dùng cá nhân.', [
        '市场', '品牌', '价格', '免费', '付', '现金', '信用卡', '银行', '银行卡', '卡', '换', '试', '脱', '戴', '衬衫', '裙子', '大衣', '上衣', '短裤', '雨衣', '帽子', '皮鞋', '鞋', '眼镜', '伞', '行李箱', '箱子', '行李', '双', '套', '种', '斤', '毛', '角',
    ]),
    ('hsk3', 8, '交通与出行指南', 'Giao thông đường phố, lái xe, tàu xe, sân bay và chỉ đường.', [
        '司机', '骑', '自行车', '电动车', '辆', '高铁', '汽车', '船', '停车场', '经过', '十字路口', '路口', '路边', '红绿灯', '街道', '街', '马路', '城市', '地方', '地点', '北方', '南方', '东', '西', '南', '北', '东北', '东方', '东南', '西北', '西方', '西南', '中间', '对面', '附近', '周围', '护照', '起飞', '检票', '晚点', '宾馆', '准时', '迟到', '推迟', '提前', '出发', '到达', '方向', '地图', '游客',
    ]),
    ('hsk3', 9, '四季与自然风光', 'Thiên nhiên, bốn mùa, thời tiết, cây cối và động vật.', [
        '季节', '四季', '季', '春天', '夏天', '秋天', '冬天', '温度', '暖和', '凉快', '湿', '干', '刮风', '刮', '风', '太阳', '月亮', '空气', '环境', '保护', '山', '爬', '爬山', '河', '海', '树', '草', '草地', '花园', '开花', '大熊猫', '熊猫', '动物', '动物园', '马', '养',
    ]),
    ('hsk3', 10, '科技与网络时代', 'Công nghệ số, điện thoại, mạng xã hội, tin tức và truyền thông.', [
        '网络', '网站', '新闻', '消息', '信号', '密码', '账号', '下载', '上传', '搜索', '短信', '微信', '拍照', '照相', '照相机', '相机', '照片', '视频', '声音', '声', '音乐', '节目', '报纸', '广播', '电视', '电脑', '电子书', '耳机', '电', '开灯', '关机', '开机', '号码',
    ]),
    ('hsk3', 11, '情感与人际交往', 'Cảm xúc, tính cách con người và cách ứng xử lịch sự.', [
        '感情', '爱情', '友情', '热情', '友好', '客气', '关心', '担心', '放心', '开心', '高兴', '快乐', '幸福', '难过', '伤心', '生气', '害怕', '怕', '紧张', '激动', '感动', '惊讶', '满意', '讨厌', '害羞', '认真', '努力', '聪明', '笨', '可爱', '客人', '夫妇', '夫妻', '姐妹', '男人', '男生', '女人', '女生', '大人', '别人', '别的', '名人', '画家',
    ]),
    ('hsk3', 12, '表达看法与沟通', 'Thảo luận, nêu quan điểm, giải thích và thuyết phục.', [
        '认为', '以为', '相信', '理解', '明白', '清楚', '了解', '表示', '说明', '介绍', '讨论', '聊天', '聊天儿', '聊', '对话', '建议', '意见', '原因', '结果', '影响', '关系', '作用', '办法', '解决', '帮助', '支持', '原谅', '感兴趣', '兴趣', '关注', '感到', '觉得', '认得', '懂得', '据说', '听说',
    ]),
    ('hsk3', 13, '动作与日常行为 (1)', 'Động từ thao tác, di chuyển và xử lý công việc hằng ngày.', [
        '办', '把@506', '被@519', '带@578', '丢', '留下', '离开', '出现', '消失', '发生', '变化', '变', '变成', '发展', '增加', '减少', '降低', '改变', '修理', '修', '坏', '破', '打扫', '刷', '照', '接', '分开', '开', '关', '起', '用', '加', '查',
    ]),
    ('hsk3', 14, '动作与日常行为 (2)', 'Động từ nhận thức, giao tiếp, phấn đấu và hoàn thành.', [
        '发现', '比较', '坚持', '放弃', '继续', '结束', '完成', '成功', '失败', '举行', '注意', '重视', '肯定', '确认', '确定', '记住', '记', '忘记', '想念', '表演', '站@966', '长@968', '得到', '得分', '行@908', '受到', '受', '选', '需要', '要求',
    ]),
    ('hsk3', 15, '性质与状态描述 (1)', 'Tính từ miêu tả hình dáng, mức độ, chất lượng và trạng thái.', [
        '矮', '短', '胖', '瘦', '重', '轻', '满', '空', '暗', '亮', '红', '黄', '黄色', '蓝', '绿', '白', '黑', '真', '假@jiǎ', '正确', '普通', '特别', '奇怪', '正常', '重要', '主要', '简单', '复杂', '容易', '难', '难看', '难听', '合适', '大小', '多少', '旧', '老', '年轻', '干净', '脏',
    ]),
    ('hsk3', 16, '性质与状态描述 (2)', 'Tính từ đánh giá không khí, tính chất sự việc và cảm nhận.', [
        '安静', '热闹', '吵', '危险', '安全', '方便', '麻烦', '闲', '紧', '有名', '有趣', '无聊', '可惜', '遗憾', '模糊', '干', '湿', '有用', '不一样', '不同', '不见', '不用', '不久', '不行', '差不多', '好多', '好久', '好看', '一样', '一般',
    ]),
    ('hsk3', 17, '副词与时间表达', 'Phó từ mức độ, tần suất, thời gian và sự nhấn mạnh.', [
        '刚才', '刚', '刚刚', '马上', '终于', '突然', '总是', '经常', '常常', '常', '常见', '常用', '平时', '一直', '从来', '从不', '曾经', '本来', '原来', '其实', '确实', '居然', '竟然', '几乎', '大概', '也许', '或许', '一定', '必须', '应该', '只好', '只能', '极了', '极', '更', '越来越', '非常', '特别', '到底', '反正', '顺便', '半天', '久', '后来', '后年', '后天', '前年', '前天', '以前', '以后', '最近', '最后', '先', '然后', '遍', '刻', '一边', '一块儿', '一共', '又', '还@678',
    ]),
    ('hsk3', 18, '连词、介词与句式连接', 'Liên từ, giới từ, trợ từ kết cấu và liên kết câu phức.', [
        '而且', '不但', '或者', '或', '还是', '虽然', '但是', '不过', '可是', '因为', '所以', '如果', '只要', '只有', '才', '不管', '除了', '关于', '根据', '为了', '向', '把@506', '被@519', '得@583', '地@589', '得@587', '得@332', '着', '过@351', '来自', '的话', '除了', '因此', '以上', '以下', '以外', '咱们', '怎么样', '怎样', '怎么办', '其他', '另外', '可', '只是', '越', '挺@858', '比如', '好像', '看来', '为', '角', '段', '张', '封', '元', '米', '公斤', '子', '员', '园', '室', '市', '节', '运动会', '运动员', '球场', '体育', '体育馆', '网球', '羽毛球', '跳', '运动',
    ]),
]
