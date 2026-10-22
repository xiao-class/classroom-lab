# 默认MP4交付

教师只说实验名，默认收到带讲解的横屏MP4，下载后可插入PPT。HTML是需要调参或学生操作时的可选补充，工程文件由代理管理。不要让教师自行录屏、安装FFmpeg或运行脚本。

默认1920×1080、16:9、30fps、H.264、yuv420p、AAC 48kHz、MP4 faststart；用户指定的画幅、时长、声音和无声要求优先。微软推荐PowerPoint使用H.264/AAC MP4，见 [官方格式说明](https://support.microsoft.com/en-us/powerpoint/video-and-audio-file-formats-supported-in-powerpoint)（2026-10-21核对）。编码符合推荐不等于已经在每台学校电脑或WPS版本实测。

## 制作前选定可用路径

- SVG场景：本Skill的 `scripts/export_video.cjs` 可从 `lesson.json` 与 `scene.js` 直接渲染帧、按阶段合成旁白，输出MP4，不打开浏览器。适用于以SVG元素表示全部画面的场景；支持现有DOM属性更新及整段SVG重绘。内置化学溶解/生物有丝分裂可复用此路径。
- 三维实体实验：先读 [原生三维MP4](native-3d-video.md)。随包的 `scripts/export_3d.py` 已实现macOS SceneKit/Metal → MP4，附杠杆、单摆、折射三种有声样例，支持实际三维材质、灯光和镜头。其他系统需选择可用的真实三维后端。
- 其他Canvas、WebGL、三维：使用当前环境允许且实际可用的原生视频渲染流程，或预先设计能按时间定位的专用渲染器。这个SVG脚本不录制Canvas或WebGL，也不把三维静默变为平面。保留材质、镜头和原科学模型。浏览器工具拒绝访问时不能用另一协议、浏览器或原始自动化接口绕过。
- 已有HTML：不能只改扩展名。优先取对应场景源码与配音重新渲染；只有具备实际允许的录制能力时才录制，裁掉控件且检查掉帧/音画同步。

## SVG导出器（代理使用）

依赖：Node.js（建议22+）、Python 3、FFmpeg/ffprobe，以及 `scripts/package.json` 中固定版本的 `@resvg/resvg-js` 和 `linkedom`。Python只用于复用现有lesson校验器。代理可将package.json复制到课程输出目录的工具目录再 `npm install`，用 `NODE_PATH` 指向该目录的node_modules；不要求修改用户全局环境或在Skill安装目录生成课程文件。字体用机器上合法可用的中文字体，导出后视频播放无需安装该字体。`--font`可重复传入中文和数学符号字体；检查Na⁺、Cl⁻等字符是否缺字。大型字体合集会拖慢逐帧渲染，可在本机临时提取所用字形以加速；不将系统字体或子集打入公开Skill。

```sh
NODE_PATH=/实际工具目录/node_modules node /实际Skill路径/scripts/export_video.cjs \
  --lesson /课程目录/lesson.json --scene /课程目录/scene.js \
  --out /课程目录/实验动画.mp4 \
  --font /实际字体路径/中文字体.ttf --font-family '实际字体名称'
```

默认每阶段必须有真实可解码的 `audioFile`，脚本会探测实际时长并拒绝讲解溢出。仅用户明确要无声时加 `--silent`。`--force` 仅用于已确认的本次修订目标。`--width`、`--height`、`--fps` 可调整偶数16:9画幅及帧率；其他画幅用合适渲染实现，不强行拉伸。

Scene沿用 [场景接口](build-contract.md)，必须由time/localTime/stageIndex/params决定画面，无浏览器专用布局、Canvas或外部图片/字体请求；参数从默认值按各阶段values累积，seek结果一致。脚本仅运行自己已审查的源码，Node VM不是安全沙箱。不要向它传入未知网页代码。

视频壳显示标题、阶段、实验画面、简短讲解字幕，没有播放器按钮。字幕按句长分配到该段真实音频时长，属于近似短句字幕，不是逐字强制对齐；需要精准字幕时用实际语音对齐。画面中保留必要的“模型/示意”标记；不要把网页长说明全部塞进视频。

## 完成标准

导出器写入临时文件，成功后交付MP4，并在同名 `.qa/` 目录保存抽样帧与编码核验。逐帧渲染由时间驱动，音轨按stage.at延迟合成，保留阶段尾部观察停顿。

代理继续检查最终MP4的开头、关键变化、阶段切换与结尾（不是只看源SVG），确认中文、字号、字幕和科学关系；核对音轨有声且无截断，完整解码通过，正常速度回看节奏。脚本成功不代表听审、PPT插入或课堂实测通过。源文件、审核说明放次级入口；回复首个入口是视频。
