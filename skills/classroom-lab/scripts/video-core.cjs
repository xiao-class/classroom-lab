// Shared deterministic timeline for SVG video export. No browser is opened.
const vm = require('node:vm');
const {DOMParser} = require('linkedom');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));

function stateAt(lesson, time) {
  const stageIndex = lesson.stages.findLastIndex(s => s.at <= time);
  const params = Object.fromEntries((lesson.parameters || []).map(p => [p.key, p.value]));
  for (let i = 0; i <= stageIndex; i++) Object.assign(params, lesson.stages[i].values || {});
  return {time, localTime: time - lesson.stages[stageIndex].at, stageIndex, params, revealed:false, manualParameters:false};
}

function captionAt(stage, localTime) {
  // Phrase timing is proportional, not forced-aligned word-level transcription.
  const phrases = (stage.narration || '').match(/[^，。！？；]+[，。！？；]?/gu) || [];
  const duration = stage.audioDuration || 0;
  if (!phrases.length || localTime >= duration) return '';
  const total = phrases.reduce((n, s) => n + Array.from(s).length, 0);
  let end = 0;
  for (const s of phrases) {
    end += duration * Array.from(s).length / total;
    if (localTime < end) return s;
  }
  return '';
}

function makeScene(code) {
  // Only trusted, authored SVG scene source. VM is not a security sandbox.
  if (/\bLab3D\b|\bWebGL\b|\.getContext\s*\(/.test(code))
    throw Error('This exporter renders SVG scenes only. Use a native video renderer for Canvas/3D; do not silently replace it with a flat fallback.');
  // XML mode preserves SVG tag case and self-closing elements in innerHTML.
  const document = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 500"/>','image/svg+xml');
  const svg = document.documentElement;
  const context = vm.createContext({Math, document});
  vm.runInContext(code, context, {timeout:5000});
  context.svg = svg;
  vm.runInContext('var experiment = createExperiment(svg); experiment.check();', context, {timeout:5000});
  return state => {
    context.frameState = state;
    vm.runInContext('experiment.render(frameState)', context, {timeout:5000});
    const result = svg.innerHTML;
    if (/NaN|Infinity|undefined/.test(result)) throw Error('Scene has invalid numeric/text output');
    return result;
  };
}

function frameSVG(lesson, render, time, {width=1920, height=1080, fontFamily='sans-serif'}={}) {
  const state = stateAt(lesson, time), stage = lesson.stages[state.stageIndex];
  const scene = render(state), caption = captionAt(stage, state.localTime);
  const titleSize = Math.min(50, 1600 / Math.max(1, Array.from(lesson.title).length));
  const captionSize = Math.min(42, 1640 / Math.max(1, Array.from(caption).length));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1920 1080" font-family="${escape(fontFamily)}">
<rect width="1920" height="1080" fill="#07131e"/>
<text x="120" y="80" fill="#eff7fc" font-size="${titleSize}" font-weight="700">${escape(lesson.title)}</text>
<text x="120" y="128" fill="#a6c1d4" font-size="26">${escape(lesson.subtitle)}</text>
<text x="1800" y="128" text-anchor="end" fill="#8de1d5" font-size="26">${state.stageIndex+1} / ${lesson.stages.length} · ${escape(stage.title)}</text>
<svg x="240" y="164" width="1440" height="750" viewBox="0 0 960 500" overflow="hidden">${scene}</svg>
<text x="960" y="992" text-anchor="middle" fill="#f2f7fa" font-size="${captionSize}" font-weight="600">${escape(caption)}</text>
<rect x="120" y="1044" width="1680" height="3" fill="#263c4d"/>
<rect x="120" y="1044" width="${1680*time/lesson.duration}" height="3" fill="#72d6c6"/>
</svg>`;
}
module.exports = {stateAt, captionAt, makeScene, frameSVG};
