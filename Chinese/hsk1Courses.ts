import type { HskEdition } from '../src/types/vocab';

interface Lesson {
  title: string;
  topic: string;
  description: string;
  terms: string[];
}

const lesson = (title: string, topic: string, description: string, terms: string): Lesson => ({
  title, topic, description, terms: terms.split(' '),
});

export const DEFAULT_HSK_EDITION: HskEdition = 'hsk30';

export const HSK_EDITIONS = [
  { id: 'hsk20', label: 'HSK 2.0' },
  { id: 'hsk30', label: 'HSK 3.0' },
] as const;

export const HSK1_COURSES = {
  // ISBN 9787561937099. Lesson numbers follow the book's contents and vocabulary index.
  hsk20: {
    book: 'HSK Standard Course 1',
    source: 'https://www.blcup.com/PInfo/index/77',
    lessons: [
      lesson('Chào hỏi và xin lỗi', 'Giao tiếp', 'Chào một người hoặc một nhóm, xưng hô lịch sự và đáp lời xin lỗi.',
        '你 好 你好 您 你们 对不起 没关系'),
      lesson('Cảm ơn và tạm biệt', 'Giao tiếp', 'Cảm ơn, đáp lại lời cảm ơn và chào khi ra về.',
        '谢谢 不 不客气 再见'),
      lesson('Hỏi tên khi mới gặp', 'Giao tiếp', 'Giới thiệu tên, vai trò và quốc tịch. Đặt câu hỏi với 什么 và 吗.',
        '叫 什么 名字 我 是 老师 吗 学生 人 中国 美国'),
      lesson('Giới thiệu cô giáo tiếng Trung', 'Học tập', 'Giới thiệu thầy cô, bạn học và dùng 的 để diễn đạt sở hữu.',
        '她 谁 的 汉语 哪 国 呢 他 同学 朋友'),
      lesson('Hỏi tuổi và đếm người', 'Gia đình', 'Nói tuổi, đếm người trong gia đình và hỏi tuổi bằng 几岁 hoặc 多大.',
        '家 有 口 女儿 几 岁 了 今年 多 大 一 二 三 四 五 六 七 八 九 十'),
      lesson('Nói về điều mình biết làm', 'Học tập', 'Nói về khả năng nói, đọc, viết và nấu ăn với 会.',
        '会@82 说 妈妈 菜 很 好吃 做 写 汉字 字 怎么 读'),
      lesson('Hỏi ngày tháng', 'Thời gian', 'Nói ngày, tháng, thứ trong tuần và hỏi lịch sự bằng 请问.',
        '请 问 请问 今天 号 月 星期 昨天 明天 去 学校 看 书'),
      lesson('Gọi trà và hỏi giá', 'Ăn uống', 'Nói món mình muốn, chọn đồ trong cửa hàng và hỏi giá bằng 多少.',
        '想 喝 茶 吃 米饭 下午 商店 买 个 杯子 这 多少 钱 块 那'),
      lesson('Hỏi nơi làm việc', 'Công việc và sức khỏe', 'Nói người hoặc vật ở đâu. Dùng 在 để chỉ nơi làm việc.',
        '小 猫 在 那儿 狗 椅子 下面 下 哪儿 工作 儿子 医院 医生 爸爸'),
      lesson('Xin phép ngồi và chỉ chỗ', 'Vị trí và đồ vật', 'Chỉ vị trí đồ vật, nói có hay không có và xin phép bằng 能.',
        '桌子 上 电脑 和 本 里 前面 后面 这儿 没有 没 能 坐'),
      lesson('Hỏi giờ và hẹn về nhà', 'Thời gian', 'Nói giờ, phút, buổi trong ngày và hạn trước một mốc thời gian.',
        '现在 点@33 分 中午 吃饭 时候 回 我们 电影 住 前 北京'),
      lesson('Hỏi thời tiết ngày mai', 'Thời tiết', 'Hỏi trời nóng, lạnh hay mưa và nói về sức khỏe.',
        '天气 怎么样 太 热 冷 下雨 雨 小姐 来 身体 爱 些 水果 水'),
      lesson('Gọi điện và nói việc đang làm', 'Giao tiếp', 'Mở đầu cuộc gọi và nói về hoạt động đang diễn ra với 在…呢.',
        '喂 也 学习 学 上午 睡觉 电视 喜欢 给 打电话 吧'),
      lesson('Kể chuyện mua quần áo', 'Mua sắm', 'Kể lại việc đã làm với 了, nhận xét quần áo và chỉ các món đồ.',
        '东西 一点儿 苹果 看见 先生 开 车 回来 分钟 后 衣服 漂亮 啊 少 不少 这些 都'),
      lesson('Kể mình đến bằng cách nào', 'Đi lại', 'Nói phương tiện đi lại và nhấn mạnh cách thức với 是…的.',
        '认识 年 大学 饭店 出租车 一起 高兴 听 飞机'),
    ],
  },
  // ISBN 9787521367744. The Level 1 headwords follow Text 1–3 order in each lesson.
  // Source for the lesson-to-headword index: https://hsk-center.mn/vocab-review/book1.html
  hsk30: {
    book: 'New HSK Course 1',
    source: 'https://heep.fltrp.com/contents/475469828451340288?type=1',
    lessons: [
      lesson('Chào Tiểu Ngữ và cả lớp', 'Giao tiếp', 'Chào thầy cô và bạn học, dùng 您 để xưng hô lịch sự, cảm ơn và tạm biệt.',
        '你好 大家 好 学生 们 老师 您 你们 谢谢 不客气 同学 再见'),
      lesson('Tự giới thiệu và hỏi tên', 'Giao tiếp', 'Xin phép hỏi tên, giới thiệu mình và đáp lời xin lỗi.',
        '请问 你 叫 什么 名字 我 没关系 没事 很 高兴 认识 也 不 是 对不起'),
      lesson('Nói về quốc tịch', 'Giao tiếp', 'Hỏi và nói quốc tịch, giới thiệu bạn bè và đặt câu hỏi với 吗.',
        '这 谁 女朋友 哪 国 她 人 的 中国 中文 喂 姐姐 工作 还@67 忙 吗 对 太 我们 想'),
      lesson('Giới thiệu gia đình và số con', 'Gia đình', 'Đếm thành viên, hỏi tuổi và dùng số đếm với 个 hoặc 口.',
        '有 多少 个 八 百 二 大 两 零 六 九 七 千 三 十 五 四 一 哥哥 呢 没有 家 几 口 爸爸 妈妈 妹妹 和 儿子 孩子 女儿 岁 他 今年 多'),
      lesson('Sắp xếp một ngày nghỉ', 'Thời gian', 'Nói ngày trong tuần, việc làm vào ngày nghỉ và khả năng với 会.',
        '今天 号 月 日 星期 休息 会@82 做饭 做 面条儿 星期日 星期天 饺子 一些 菜 下班 新 电脑 真 好看 喜欢 它'),
      lesson('Hỏi số điện thoại', 'Giao tiếp', 'Trao đổi số liên lạc và nói kế hoạch đi mua đồ hoặc đi ăn.',
        '手机 电话 手机号 明天 去 哪儿 超市 买 东西 些 牛奶 出租车 坐 吃 晚饭 那边 包子 非常 好吃 米饭 怎么'),
      lesson('Nói giờ tan làm', 'Thời gian', 'Nói giờ học, giờ làm và hẹn gặp. Đặt mốc thời gian trước hoạt động.',
        '现在 点@33 早上 上午 分 课 下午 见 吧 店 后 晚上 电影院 看 电影 事 上课 半 下课 在 里 分钟 医院 上班'),
      lesson('Tìm hiểu nơi bố làm việc', 'Công việc và sức khỏe', 'Nói nơi làm việc và dùng từ chỉ vị trí để nói đồ vật ở đâu.',
        '房间 外 只@287 小 猫 看见 桌子 下 漂亮 学校 书店 前 能 到 午饭 医生 饭'),
      lesson('Hẹn học ở trường', 'Học tập', 'Nói giờ và địa điểm học, chỉ vị trí và diễn đạt thứ tự với 第.',
        '边 上 那个 外边 椅子 本 书 那 第 学习 白天 读书 朋友 唱 歌 好听 电视 狗 玩'),
      lesson('Xem giá táo và quần áo', 'Mua sắm', 'Hỏi, nói giá tiền và nhận xét món đồ trong cửa hàng.',
        '杯子 这边 钱 这些 块 那些 这儿 水果 少 苹果 便宜 商店 衣服 件 元 怎么样 贵 穿 那儿 男 女'),
      lesson('Kể về việc học đại học', 'Học tập', 'Nói mình học ở đâu, đang làm gì và muốn làm gì với 要.',
        '时候 饭店 知道 正在 找 开车 车 读 大学 大学生 学 问 要 弟弟 起床 睡觉 睡 那里 哪里 昨天 说 小朋友'),
      lesson('Tuyết rơi và chuyện đi khám', 'Thời tiết', 'Miêu tả mưa tuyết, nhiệt độ và nói khi bị ốm.',
        '喝 热 水 天气 这里 天 下雨 了 雨 有点儿 觉得 冷 雪 下雪 来 公司 生病 看病 病 一点儿 回 再'),
      lesson('Xin một tách trà', 'Ăn uống', 'Nhờ lấy đồ uống hoặc đồ ăn, dùng 请、给 và 一下 để nói lịch sự.',
        '可以 问题 卖 打电话 一下 女士 请 给 早饭 这个 面包 鸡蛋 先生 一半 茶 杯'),
      lesson('Kể về một bộ phim đã xem', 'Giải trí', 'Kể lại hoạt động đã làm với 了, nói về ngôn ngữ và chuyện đi học.',
        '火车 中午 开 有些 有的 写 都 听见 不要 说话 听 哪些 字 汉语 汉字 明年 中学 小学 中学生 她们 它们 晚 上学 他们 小学生'),
      lesson('Hẹn gặp ở sân bay Đại Hưng', 'Đi lại', 'Nói về sân bay, chuyến bay, thời gian và sắp xếp điểm gặp.',
        '爱 哪个 去年 男朋友 年 好玩儿 大兴 机场 飞机 小时 家人 时间 住 早'),
    ],
  },
} satisfies Record<HskEdition, { book: string; source: string; lessons: Lesson[] }>;
