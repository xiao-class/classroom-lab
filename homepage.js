'use strict';
const hero = document.getElementById('intro');
const toggle = document.getElementById('motion-toggle');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
let wantsMotion = !reduced.matches && !navigator.connection?.saveData;
let heroVisible = false;
function updateToggle(){toggle.textContent = hero.paused ? '播放开场 ▶' : '暂停开场 Ⅱ';toggle.setAttribute('aria-label',hero.paused?'播放15秒开场':'暂停15秒开场');}
function autoplay(){if(wantsMotion && heroVisible && !document.hidden) hero.play().catch(()=>updateToggle());}
hero.addEventListener('play',updateToggle);hero.addEventListener('pause',updateToggle);
toggle.addEventListener('click',()=>{wantsMotion=hero.paused;if(wantsMotion)hero.play().catch(()=>updateToggle());else hero.pause();});
if('IntersectionObserver' in window){new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;if(heroVisible)autoplay();else hero.pause();},{threshold:.15}).observe(hero);}
reduced.addEventListener('change',()=>{if(reduced.matches){wantsMotion=false;hero.pause();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(v=>v.pause());else autoplay();});
document.querySelectorAll('video').forEach(video=>video.addEventListener('play',()=>{document.querySelectorAll('video').forEach(other=>{if(other!==video)other.pause();});if(video!==hero)wantsMotion=false;}));
document.getElementById('copy-install').addEventListener('click',async()=>{
 const prompt=document.getElementById('install-prompt'),status=document.getElementById('copy-status');
 try{await navigator.clipboard.writeText(prompt.textContent.trim());status.textContent='已复制。粘贴到 Codex，开始制作你的实验。';}
 catch{const range=document.createRange();range.selectNodeContents(prompt);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);prompt.focus();status.textContent='已选中安装指令，请使用系统复制操作。';}
});
updateToggle();
