## 目录 | Contents

1.  [产品描述 | Product Description]
2.  [产品定位 | Product Positioning]
3.  [设计举措 | Concept Design]
4.  [总结 | Summary]

- [Dot2Dot Readme in English](#en)
- [Dot2Dot Readme 中文说明](#zh)

---

# <span id="en">Dot2Dot Readme in English</span>

> **An interest‑based connection platform powered by AI content filtering.**  
> *有道德 · 慢车马 · 轻量化* – Find resonant people, not fasion.

🔗 **Try it now**: [https://cy-dogear.github.io/dot2dot/](https://cy-dogear.github.io/dot2dot/)

---

## <span id="c1">1. Product Description</span>

**1.1** Dot2Dot is a social platform that uses AI to semantically analyze user‑generated content.  
Content that aligns with healthy values is **statistically more likely to be shown**, while low‑quality or distracting content is naturally deprioritized – without being outright banned.

- Supports Chinese, English, Russian, and other languages.
- Anyone can use it, and everyone has a fair chance to find people who share their interests and values.

**1.2** User registration requires an email address, which is displayed by default on the user’s profile.

- This old‑fashioned, non‑real‑time contact method is intentional – it helps users feel more secure.
- Want to use another way to connect? Feel free to share it peer‑to‑peer.
- If you are not willing to disclose an email address at all, this platform may not be for you.

---

## <span id="c2">2. Positioning</span>

**“To find the dot‑to‑dot connection, to see a spiritual way of life.”**

- ❌ Dot2Dot is **not** a dating app.
- ❌ It is **not** a traditional BBS.
- ✅ It **is** a place to share your spiritual life.
- ✅ It **is** a place where “resonant people” can contact you via email.

---

## <span id="c3">3. Concept Design</span>

The product positioning is achieved through two complementary strategies:

### 3.1 Subtraction

We deliberately remove features that are not essential to the core mission:

- No profile pictures, gender, age, occupation, or follower/following lists.
- No comments, likes, or private chat.
- No images or videos – only plain text.
- Each user can post multiple messages per day, but the platform only shows **one new message per user per day** (others are queued).
- Each user has a **maximum of 20 visible messages** (FIFO – oldest are removed automatically).
- Inactive accounts are deleted after prolonged absence (re‑registration is always free).

### 3.2 AI‑Powered Filtering

Quality content is prioritized through a multi‑step AI pipeline:

- **Message tagging** – semantic analysis of each post.
- **User tagging** – aggregation of a user’s content tendencies.
- **User weighting** – dynamic scoring based on value alignment.
- **Discovery & matching** – show resonant content with higher probability.

**Algorithm flow overview:**  
![Algorithm flow](./image/algorithm-flow.png)

---

## <span id="c4">4. Summary</span>

| Feature | Dot2Dot |
|---------|---------|
| **Ethical** | No addiction loops, no engagement traps. |
| **Slow‑paced** | One visible post per user per day. |
| **Lightweight** | Pure text, no images/videos. |
| **AI‑driven** | Semantic filtering for quality content. |
| **Private by default** | Email‑based, no real‑time chat. |

> AI semantic parsing and filtering algorithms are the technical means to realize this product positioning.

Initial implementation: [https://cy-dogear.github.io/dot2dot/](https://cy-dogear.github.io/dot2dot/)

---

## License

This project is open source. See the [LICENSE](./LICENSE) file for details.

---

---

# <span id="zh">Dot2Dot Readme 中文说明</span>

🔗 **立即体验**: [https://cy-dogear.github.io/dot2dot/](https://cy-dogear.github.io/dot2dot/)

---

## <span id="c1">1. 产品描述</span>

### 1.1 项目缘起

我反感注意力经济的弊端，然而抱怨并无用处。那些大型社交平台在此潮流中采取纵容态度——为了盈利，可以理解。但真、善、美在与假、恶、丑的博弈中往往处于劣势。

好在进入 2025 年，我们可以大规模使用 AI 了。**Dot2Dot 的核心特点是用 AI 解析用户发布内容，将价值观趋同的内容以更高概率展示出来。**

但我们不做“价值观暴君”。不被鼓励的内容不会被直接禁止，只是出现的概率更低。

> 当湖水还浅的时候，您能看到湖底的岩石；随着源头活水越来越多流入，您将看到一湖海蓝！

### 1.2 核心理念

想做成这样的交友平台：**有道德、慢车马、轻量化**。

- 不禁止特定信息，但调用 AI 解析语义，将价值观不符的信息往下沉、少展示（概率问题）。
- 禁用图片展示，从源头上大幅减少诱惑。在算法上鼓励以兴趣爱好为纽带建立点对点连接。这里只是起点，走向哪里靠个人、靠缘分。

### 1.3 主要特征

利用具备持续升级能力的 AI 调用方法去筛选用户权重和内容权重。

---

## <span id="c2">2. 产品定位</span>

**「找得到点对点的连接，看得见精神生活内容」**

如果您不需要“点对点”的连接，那么这平台不适合您——这里不鼓励“点对网”的连接（如树洞、分享、记录、展示）。

- 连接要基于 **兴趣爱好**，而不是婚恋、长期关系或交易。缺少共通的精神生活和兴趣爱好，其他事情很难持久。
- “兴趣爱好”在这里被严格定义为：**没有必要做、但自主喜欢做、且可以经常做的事情**。  
  “可以经常做”是重要限定条件。例如：喝大酒（影响健康）或约P（违背公序良俗）不在此列。

本平台要有道德操守，不为谋利而纵容人性贪嗔痴，不追求用户留存、活跃度，追求 **对用户有用**。用户觉得有用，用完离开，也是平台的价值（欢迎再来，这里不设门槛）。

---

## <span id="c3">3. 设计举措</span>

### 3.1 做减法

砍掉与核心定位不相关的功能：

- ❌ 不显示关注/被关注列表、性别、年龄、头像、职业
- ❌ 无留言、评论、点赞、私聊功能
- ❌ 不支持图片和视频，仅纯文本
- ✅ 默认联系方式为 **Email**（显示在个人主页）
- ✅ 登录/注册不要求密码验证或邮箱验证（邮箱仅作为 user_id 白名单）
- ✅ 长期未登录的用户记录将被自动删除
- ✅ 每人每天最多展示 **1 条**广播（其余排队），总展示上限 **20 条**（FIFO）

### 3.2 以 AI 赋能的筛选机制

让好内容优先呈现，实现 **「找得到点对点的连接，看得见精神生活内容」**。

**算法流程图概览：**  
![算法流程图](./image/algorithm-flow.png)

---

## <span id="c4">4. 总结</span>

Dot2Dot 是一个：
- **有道德** 的交友平台
- 利用 **AI** 筛选用户和内容权重
- 区别于那些默许或纵容擦边、成瘾机制、表演压力和轻度伤害内容的主流平台
- 适合需要 **点对点兴趣交友** 且注重健康价值观的人群

初始实现：[https://cy-dogear.github.io/dot2dot/](https://cy-dogear.github.io/dot2dot/)

---

## 许可证

本项目开源，详见 [LICENSE](./LICENSE) 文件。