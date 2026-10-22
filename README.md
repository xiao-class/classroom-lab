<div align="center">

# 课堂实验动画

### 说出实验，让课堂里的变化动起来。

一个面向教师的 AI Skill：用一句话，生成**带中文讲解、可插入 PPT、能够离线播放**的实验动画 MP4。需要调参或学生操作时，可另附互动网页。

[在线体验](https://xiao-class.github.io/classroom-lab/) · [安装 Skill](#安装-skill) · [开始使用](#开始使用) · [验证说明](VALIDATION.md)

</div>

### 15 秒，看见实验的另一种样子

https://github.com/user-attachments/assets/82409a41-3d20-4d40-a0ae-f5a6fd7a3666

三维视觉概念开场 · 无声。点击播放器即可在本页观看，也可[下载宣传片](https://xiao-class.github.io/classroom-lab/media/intro.mp4)。下方是带中文讲解的教学样片。

> “做一个杠杆平衡的实验动画，让学生先猜，再移动砝码验证。”
>
> AI 制作实验画面和讲解，默认交付 MP4。老师下载后插入 PPT，即可上课。

## 默认交付 MP4

默认输出 16:9、1080p、30fps、H.264/AAC 视频，沿用晓晓讲解。教师不用录屏、转格式或操作代码；渲染工具由 AI 助手准备。内置 SVG 导出器与 macOS 原生三维导出器，已制作杠杆、单摆、折射三支真正的三维有声样片。

[下载化学实验 MP4：氯化钠溶解（52 秒）](https://xiao-class.github.io/classroom-lab/examples/dissolution/animation.mp4) · [查看视频导出说明](skills/classroom-lab/references/video-export.md)

## 直接看视频

所有教学视频都带晓晓中文讲解，下载后可插入PPT。播放器若显示静音，点击小喇叭开启声音。开场是独立制作的无声三维概念片，不代表每个实验自动获得相同三维效果。

### 物理 · 杠杆平衡

36 秒 · 晓晓讲解 · 真实三维教学成片

https://github.com/user-attachments/assets/00d698e2-95a7-42a9-9a3c-2268f88600c1

[下载 MP4](https://xiao-class.github.io/classroom-lab/examples/lever/animation.mp4)

### 物理 · 单摆的周期

36 秒 · 晓晓讲解 · 真实三维教学成片

https://github.com/user-attachments/assets/bac100c8-9a06-4a89-96e7-6c1ea51c4fba

[下载 MP4](https://xiao-class.github.io/classroom-lab/examples/pendulum/animation.mp4)

### 物理 · 光的折射

49 秒 · 晓晓讲解 · 真实三维教学成片

https://github.com/user-attachments/assets/f601b9bf-ff33-49e0-9d25-947c14bdcb36

[下载 MP4](https://xiao-class.github.io/classroom-lab/examples/refraction/animation.mp4)

### 化学 · 氯化钠溶解

52 秒 · 晓晓讲解 · 离子分散的微观示意

https://github.com/user-attachments/assets/3c51898f-438e-4051-893a-ed45f624c897

[下载 MP4](https://xiao-class.github.io/classroom-lab/examples/dissolution/animation.mp4)

### 生物 · 动物细胞有丝分裂

56 秒 · 晓晓讲解 · 染色体分离的过程示意

https://github.com/user-attachments/assets/859226be-6269-4679-9131-54f5f6138b8c

[下载 MP4](https://xiao-class.github.io/classroom-lab/examples/mitosis/animation.mp4)

播放器需要点击播放。也可以打开[视频展示首页](https://xiao-class.github.io/classroom-lab/)集中观看、下载。

<details>
<summary>三维实验做到哪里了？</summary>

杠杆、单摆、折射已升级为真实三维有声 MP4：金属器材、实体球体、立体水槽、灯光、相机和模型计算共同驱动画面。讲解沿用晓晓，保留预测与观察停顿。三维画面和数值来自对应实验模型，宣传片仍是独立概念开场。

Skill 已包含三个有声配方和[三维导出流程](skills/classroom-lab/references/native-3d-video.md)。内置三维后端目前在 macOS 上验证通过；其他系统需要可用的三维渲染后端，不能静默改成二维。已导出的 MP4 无需安装渲染工具。化学和生物样片仍是各自的示意动画，不冒称已全部三维化。

[三维杠杆互动原型](https://xiao-class.github.io/classroom-lab/examples/lever-3d/)作为额外网页演示保留，与新视频分别维护。

</details>

## 安装 Skill

### 在 Codex 中，一句话安装

把下面这段话发给 Codex：

```text
请用 skill-installer 安装这个课堂实验动画 Skill：
https://github.com/xiao-class/classroom-lab
Skill 位于 skills/classroom-lab 目录。
```

安装后输入 `$classroom-lab`，检查是否能选中。没有出现时，重启 Codex 再查看。

<details>
<summary>手动安装 / 其他 AI 助手</summary>

下载仓库，把完整的 `skills/classroom-lab` 文件夹放入 Codex 的用户 Skill 目录 `~/.agents/skills/`。模板、脚本和资源都要保留，不能只复制 `SKILL.md`。如果已有同名 Skill，先比较版本，保留自己的修改。

其他工具请按照它们支持的 Skill 安装方式操作。需要助手具备读取本地 Skill、生成文件和运行代码的能力；普通聊天窗口不一定能够使用。当前实际验证环境是 Codex，未逐一测试其他助手。

安装目录与发现机制参考 [OpenAI Skill 文档](https://learn.chatgpt.com/docs/build-skills)，核对日期：2026-10-20。

</details>

## 开始使用

安装好之后，直接说：

```text
用 $classroom-lab 做一个量筒读数实验动画。
```

也可以加一句课堂要求：

```text
演示光从空气进入水中的折射，给初二学生看。

做一个氯化钠溶解的微观动画，让学生看清离子去哪里了。

演示动物细胞的有丝分裂，突出染色体的分离。

做一个浮力实验动画，让学生先猜，再看结果。

做一个杠杆实验，先别显示答案，让学生移动砝码试一试。
```

不用先写完整教案，也不用填参数表或选择音色。默认交付中文、有普通话讲解的 MP4；年级、时长、风格等已有要求会优先采用。

拿到动画后还可以继续说：

| 你说 | 可以调整什么 |
| --- | --- |
| “慢一点，给学生留时间观察” | 演示节奏与阶段停顿 |
| “给四年级学生看” | 讲解方式和内容难度 |
| “先不要显示答案” | 提问与解释的出现顺序 |
| “换一组数据再演示” | 模型参数与对应讲解 |

## 你会得到什么

- **可插入 PPT 的 MP4**：横屏视频、中文讲解和简短字幕，播放时无需联网。
- **按需附带的互动网页**：需要改参数、分步查看或学生操作时提供。
- **随实验推进的讲解**：默认使用微软普通话女声“晓晓”；视频可在播放器中静音，网页可关闭讲解。
- **与格式匹配的演示**：视频预先安排参数变化；互动网页可提供滑块。
- **讲解稿和模型说明**：便于备课，也说明哪些数值属于模型计算。
- **可继续修改的源文件**：继续用自然语言提出修改即可。

在互动网页手动改变参数时，示例会暂停固定讲解，避免声音仍在讲旧条件。重播或进入预设步骤后可以恢复讲解。

## 常见问题

**需要老师编程吗？**  
不用。代码、配音和文件构建由 AI 助手处理。制作仍需要一个具备相应能力的 AI 工具和可执行环境。

**需要配音 Key、录音或部署声音模型吗？**  
默认“晓晓”方案不需要。助手通过 [edge-tts](https://github.com/rany2/edge-tts) 在线生成讲解，准备所需依赖并合入视频；附网页时也内嵌音频。生成时需要联网，会将讲解文字发送到语音服务；生成后的 MP4 与独立网页可离线播放。在线服务可能因网络或服务变化不可用，助手应明确说明，不能把无声结果称为有声完成。

**只能做示例里的实验吗？**

五支视频只是例子。三个基础物理网页曾完成浏览器验证，视频与新增案例的实际验证范围见验证说明。Skill 会根据新实验编写对应模型，并核对科学关系；不保证所有学科、所有题目都能一次生成正确结果。

**能直接放进 PPT 或导出视频吗？**  
默认交付 MP4，可以作为视频插入 PPT。推荐使用 H.264 视频和 AAC 音频，见 [微软格式说明](https://support.microsoft.com/en-us/powerpoint/video-and-audio-file-formats-supported-in-powerpoint)。MP4不保留滑块交互，也不是可编辑的PPT图形；需要互动时另附HTML。实际PPT/WPS插入尚未实测。

**可以代替真实实验吗？**  
它适合课堂演示、预测和对照观察。涉及真实操作时，仍需遵守实验规范与现场指导。模型计算不能冒充实测数据。

## 验证到哪里了

五支教学MP4均为1080p/30fps、H.264/AAC，完成全文件解码及最终视频关键帧检查。导出器另有短片集成测试，核对画面对象、阶段音频起点及失败时保留旧文件。未完成完整听审、正常速度回看及PPT/WPS实际插入。

已验证杠杆、单摆和折射三个物理案例，包括模型计算、主要交互、手机尺寸布局、离线资源和讲解播放。最新音频也完成了解码、时长和内嵌检查。

目前尚未进行真实教师课堂、全部浏览器和所有学科验证。各版本实际检查过什么、没有检查什么，见 [VALIDATION.md](VALIDATION.md)。

发现问题时，可以[提交 Issue](https://github.com/xiao-class/classroom-lab/issues)，附上实验名称、原始要求、浏览器和复现方式。

<details>
<summary>开发者：源码结构与检查命令</summary>

```text
skills/classroom-lab/  可安装的完整 Skill
examples/             互动案例与已导出的MP4样片
index.html            在线 / 本地演示入口
tests/                开发者测试
qa/                   验证记录与截图
```

基础杠杆与新增预览案例的源文件在 `skills/classroom-lab/assets/` 下对应的 `*-demo/` 目录；单摆、折射源文件在各自示例目录。Skill 工作说明见 [SKILL.md](skills/classroom-lab/SKILL.md)。

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
node tests/models.cjs
python3 skills/classroom-lab/scripts/build.py --lesson skills/classroom-lab/assets/lever-demo/lesson.json --scene skills/classroom-lab/assets/lever-demo/scene.js --out examples/lever/index.html --force
```

HTML构建器只依赖 Python 标准库；SVG视频导出需要Node.js、FFmpeg、字体及scripts/package.json中的依赖。新增三维视频导出使用macOS Swift/SceneKit/Metal与FFmpeg，代理准备依赖，见 [MP4交付](skills/classroom-lab/references/video-export.md) 和 [三维制作](skills/classroom-lab/references/native-3d-video.md)。浏览器测试另外需要 Node.js、Playwright 和 Chromium：

```sh
npm install --no-save playwright
npx playwright install chromium
node tests/browser.cjs
```

已有 Chrome 时，可通过 `CHROME_PATH` 指定其可执行文件。配音辅助器的依赖和调用方式见 [旁白说明](skills/classroom-lab/references/narration.md)。以上命令供维护者使用，不是教师的使用步骤。

</details>

## 许可

原创代码、文档与绘图采用 [MIT License](LICENSE)。科学资料以链接和概述为主，没有复制教材插图。第三方语音服务及新增素材遵循各自适用条款。
