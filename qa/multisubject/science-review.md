# 跨学科案例核验 · 2026-10-21

化学：左侧追踪10个Na⁺和10个Cl⁻，20个粒子全程不增不减，总电荷零。右侧是同类粒子的放大解释，不是额外追踪数量。水分子负的氧端朝向Na⁺，正的氢端朝向Cl⁻；图中五个水分子只是表示包围，不声称实际水合数。分散和水合的分步是教学拆解，不是分子动力学模拟。依据：[ACS](https://www.acs.org/middleschoolchemistry/lessonplans/chapter5/lesson3.html)、[OpenStax](https://openstax.org/books/chemistry-2e/pages/11-1-the-dissolution-process)。

生物：动物细胞2n=4，从已完成DNA复制开始。中期4条染色体/8个核DNA；后期同一细胞8条染色体/8个核DNA；胞质分裂后每个子细胞4条染色体/4个核DNA。颜色只用来追踪，结构和时间简化，前期/前中期合并。依据：[OpenStax细胞周期](https://openstax.org/books/biology-2e/pages/10-2-the-cell-cycle)。

检查方法：直接执行场景模型与SVG生成代码，不启动浏览器；resvg静态渲染检查主要阶段及胞质分裂中途。修正了染色体彼此接触，以及早期/末期核膜边界靠得过近的问题。手机整页、播放器操作、正常速度回放和完整音频听审未完成；不把SVG静态检查叫浏览器验收。
