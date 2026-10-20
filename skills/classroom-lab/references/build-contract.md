# 播放模板契约

仅供生成动画的代理读取。老师只说实验要求，不接触这些文件。

模板是可选的无依赖播放壳；实验模型与绘制仍由代理按题目实现。不要将内置示例当成支持题目的白名单。

## 文件

编写 `lesson.json` 和 `scene.js`，运行：

```sh
python3 /实际Skill路径/scripts/build.py --lesson /输出目录/lesson.json --scene /输出目录/scene.js --out /输出目录/index.html
```

所有路径由代理解析。脚本只用Python标准库；输出包含全部CSS、配置、JS与提供的音频，无运行时请求。不覆盖已有HTML；修订已确认目标时可加 `--force`。不要在安装目录写课程产物。

第一次使用模板时，可参考完整可运行的 [杠杆配置](../assets/lever-demo/lesson.json) 与 [实验绘制](../assets/lever-demo/scene.js)。它是结构示例，不要将别的实验强行改成杠杆。

## lesson.json

```json
{
  "title": "杠杆什么时候平衡？",
  "subtitle": "初中物理 · 改变右侧力臂，观察两侧的变化",
  "modelNote": "忽略杆重与摩擦；倾斜只表示转动方向。",
  "duration": 36,
  "parameters": [
    {"key":"distance","label":"右侧距离","unit":"cm","min":10,"max":40,"step":10,"value":20}
  ],
  "stages": [
    {"at":0,"title":"先预测","question":"哪边会下降？","explanation":"比较力与力臂的乘积。","narration":"先看两边的砝码，猜猜哪边会下降。"},
    {"at":12,"title":"观察变化","question":"把右侧砝码移远会怎样？","explanation":"同样的力，力臂变大时力矩变大。","narration":"现在观察距离变化带来的结果。"},
    {"at":24,"title":"说说理由","question":"怎样让杠杆平衡？","explanation":"两侧力矩相等。","narration":"试着用力和力臂解释你看到的现象。"}
  ],
  "sources":[{"label":"教材依据","url":"https://example.org/真实查阅页面"}]
}
```

此片段仅示意结构，必须替换实验内容及真实来源。`parameters` 可为空。`stages` 可为任意合理数量，从0开始，严格递增且小于duration。
阶段可有 `values`（参数key到数值的映射），在进入阶段时应用，适合先同条件、再改变单一变量的自动演示。
参数手动调整会暂停并回到当前阶段起点；重播恢复全部默认值、隐藏结论并暂停。播放从当前位置继续；结束后点播放从头开始。

阶段可带 `audioFile`（lesson.json目录内的相对音频路径）与 `audioDuration`（真实秒数）。构建器内嵌音频并拒绝短于讲解的阶段。准备音频见 [旁白](narration.md)。

## scene.js

提供一个普通脚本函数，不使用import、网络、定时器或依赖包：

```js
function createExperiment(svg) {
  svg.innerHTML = '<circle id="ball" cx="480" cy="220" r="24" fill="#087f8c"/>';
  const ball = svg.querySelector('#ball');
  return {
    render({time, localTime, stageIndex, params, revealed}) {
      // 所有图形由当前状态决定，暂停/定位/重播后可还原。
      ball.setAttribute('cx', String(480 + params.distance));
      return {metrics:[{label:'距离',value:params.distance+' cm'}], observation:'观察画面里的变化。'};
    },
    check() {
      // 运行真实断言，失败时抛出Error；不要只return true。
      if (Math.abs(100*20-50*40)>1e-9) throw Error('平衡基准失败');
      return ['平衡基准通过'];
    }
  };
}
```

SVG坐标为 `0 0 960 500`。主要标注至少约22个SVG单位，避免小字号装饰说明；手机端默认完整缩放画面并放大SVG文字；检查标签是否相撞，复杂场景可提供局部放大。不要将大段文字绘入SVG；正文放播放器阶段区。

`render` 返回值还可提供 `question` 和 `explanation`，覆盖当前阶段文案。手动改参数后若固定文案不再成立，必须由模型动态生成相符的提问/解释。

`render` 必须纯粹由传入的时间/参数决定，不使用累计帧数或随机值。动画时间不是未经说明的真实实验时间。`localTime` 是当前阶段内秒数；`stageIndex` 从0开始。可根据阶段切换实验状态，但不能只切标题。

`check` 便于检测已知模型错误，不代替独立核验。返回值和异常会显示在折叠的模型信息中。代理可以在测试中调用 `window.classroomLab`：

- `seek(seconds)`、`play()`、`pause()`、`reset()`。
- `setParameter(key,value)`：同UI行为，边界与步长校验。
- `getState()`：time、playing、params、stageIndex、revealed的副本。
- `checks`：模型检查结果。

浏览器实际检查文件打开/离线、控件、可读性和科学对应关系。纯脚本断言不能替代画面。
