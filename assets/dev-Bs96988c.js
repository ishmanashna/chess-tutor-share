import{n as k,r as T,l as C,s as A,a as f,p as F,c as P,b as R,e as L,d as j,t,f as z,h as y,g as S,i as O,j as I,D as H,k as N,T as _,G as U}from"./dev-apply-xUi_ZpnC.js";const G=80,E=document.getElementById("dev-controls"),x=document.getElementById("dev-frame"),J=document.getElementById("dev-sample"),v=document.createElement("input");v.type="file";v.accept="application/json";v.hidden=!0;document.body.appendChild(v);let m=k(T()),c=C(),w=0;function e(){return m}function i(n,a){return`<label><span>${r(n)}</span>${a}</label>`}function l(n,a,s,d,o=1){return`<input type="number" data-path="${n}" value="${r(a)}" min="${s}" max="${d}" step="${o}" />`}function h(n,a){return`<input type="checkbox" data-path="${n}" ${a?"checked":""} />`}function W(n,a){const s=Q(a);return`<input type="color" data-path="${n}" value="${r(s)}" />`}function b(n,a,s){const d=s.map(o=>`<option value="${r(o.value)}" ${o.value===a?"selected":""}>${r(o.label)}</option>`).join("");return`<select data-path="${n}">${d}</select>`}function B(n){const a=c.theme[n],s={boardLight:"devBoardLight",boardDark:"devBoardDark",lastMove:"devLastMove",pageBg:"devPageBg",panelBg:"devPanelBg",text:"devText",muted:"devMuted",accent:"devAccent",link:"devLink",border:"devBorder"};return`${_.map(o=>i(t(e(),s[o]),W(`theme.${n}.${o}`,a[o]))).join("")}
    ${i(t(e(),"devRadius"),l(`theme.${n}.radius`,a.radius,0,24))}
    ${i(t(e(),"devFont"),b(`theme.${n}.fontStack`,a.fontStack,[{value:"default",label:t(e(),"devFontDefault")},{value:"system-sans",label:t(e(),"devFontSans")},{value:"serif",label:t(e(),"devFontSerif")},{value:"monospace",label:t(e(),"devFontMono")}]))}
    ${i(t(e(),"devFontCustom"),`<input type="text" data-path="theme.${n}.fontFamily" value="${r(a.fontFamily)}" />`)}
    ${i(t(e(),"devFontSize"),l(`theme.${n}.fontSize`,a.fontSize,12,28))}
    <h4>${r(t(e(),"grainHeading"))}</h4>
    ${i(t(e(),"grainEnabled"),h(`theme.${n}.grain.enabled`,a.grain.enabled))}
    ${i(t(e(),"grainOpacity"),l(`theme.${n}.grain.opacity`,a.grain.opacity,0,1,.01))}
    ${i(t(e(),"grainSize"),l(`theme.${n}.grain.size`,a.grain.size,16,256))}
    ${i(t(e(),"grainSpeed"),l(`theme.${n}.grain.speed`,a.grain.speed,0,4,.05))}
    ${i(t(e(),"grainBlend"),b(`theme.${n}.grain.blend`,a.grain.blend,V()))}`}function V(){return U.map(n=>({value:n,label:q(n)}))}function q(n){switch(n){case"normal":return t(e(),"grainBlendNormal");case"multiply":return t(e(),"grainBlendMultiply");case"screen":return t(e(),"grainBlendScreen");case"overlay":return t(e(),"grainBlendOverlay");case"soft-light":return t(e(),"grainBlendSoftLight");case"hard-light":return t(e(),"grainBlendHardLight");case"difference":return t(e(),"grainBlendDifference");default:return n}}function g(){document.title=t(e(),"devPageTitle"),I(document,e()),S(c,{saved:y()});const n=c.ui,a=c.engine,s=c.thresholds;E.innerHTML=`
    <div class="dev-head">
      <h1>${r(t(e(),"devPageTitle"))}</h1>
      <div class="lang-switch" role="group" aria-label="${r(t(e(),"language"))}">
        <button type="button" class="secondary" data-dev-lang="es" aria-pressed="${e()==="es"}">ES</button>
        <button type="button" class="secondary" data-dev-lang="en" aria-pressed="${e()==="en"}">EN</button>
      </div>
    </div>
    <div class="dev-presets">
      ${H.map(d=>`<button type="button" class="secondary" data-preset="${d}">${r(K(d))}</button>`).join("")}
    </div>
    <div class="dev-actions">
      <button type="button" data-reset="all">${r(t(e(),"devResetAll"))}</button>
      <button type="button" class="secondary" data-export="json">${r(t(e(),"devExportJson"))}</button>
      <button type="button" class="secondary" data-export="css">${r(t(e(),"devExportCss"))}</button>
      <button type="button" class="secondary" data-copy>${r(t(e(),"devCopy"))}</button>
      <button type="button" class="secondary" data-import>${r(t(e(),"devImport"))}</button>
    </div>
    <details class="dev-section" open>
      <summary>${r(t(e(),"devSectionEngine"))}</summary>
      <div class="dev-fields">
        ${i(t(e(),"devDepth"),l("engine.depth",a.depth,1,40))}
        ${i(t(e(),"devLiveDepth"),l("engine.liveDepth",a.liveDepth,0,40))}
        ${i(t(e(),"devMovetime"),l("engine.movetime",a.movetime,0,3e4))}
        ${i(t(e(),"devMultipv"),l("engine.multipv",a.multipv,1,5))}
        ${i(t(e(),"devThreads"),`<input type="number" data-path="engine.threads" value="${a.threads}" min="1" max="8" disabled />`)}
        ${i(t(e(),"devHash"),`<input type="number" data-path="engine.hash" value="${a.hash}" min="1" max="1024" disabled />`)}
        <p class="dev-note">${r(t(e(),"liteThreadsNote"))}</p>
        <button type="button" class="secondary" data-reset="engine">${r(t(e(),"devResetSection"))}</button>
      </div>
    </details>
    <details class="dev-section" open>
      <summary>${r(t(e(),"devSectionThresholds"))}</summary>
      <div class="dev-fields">
        ${i(t(e(),"devInaccuracy"),l("thresholds.inaccuracy",s.inaccuracy,0,100,.1))}
        ${i(t(e(),"devMistake"),l("thresholds.mistake",s.mistake,0,100,.1))}
        ${i(t(e(),"devBlunder"),l("thresholds.blunder",s.blunder,0,100,.1))}
        ${i(t(e(),"devMateCap"),l("thresholds.mateCp",s.mateCp,100,1e4))}
        ${i(t(e(),"devWinSteepness"),l("thresholds.winSteepness",s.winSteepness,1e-4,.02,1e-4))}
        <button type="button" class="secondary" data-reset="thresholds">${r(t(e(),"devResetSection"))}</button>
      </div>
    </details>
    <details class="dev-section" open>
      <summary>${r(t(e(),"devSectionUi"))}</summary>
      <div class="dev-fields">
        ${i(t(e(),"devBoardSize"),l("ui.boardSize",n.boardSize,0,720))}
        ${i(t(e(),"devCoords"),h("ui.showCoordinates",n.showCoordinates))}
        ${i(t(e(),"devAnimation"),l("ui.animationMs",n.animationMs,0,800))}
        ${i(t(e(),"devArrows"),h("ui.showBestMoveArrows",n.showBestMoveArrows))}
        ${i(t(e(),"devEvalBar"),h("ui.showEvalBar",n.showEvalBar))}
        ${i(t(e(),"devMoveFont"),l("ui.moveListFontSize",n.moveListFontSize,0,28))}
        ${i(t(e(),"devCompact"),h("ui.compact",n.compact))}
        ${i(t(e(),"devOrientation"),b("ui.defaultOrientation",n.defaultOrientation,[{value:"white",label:t(e(),"white")},{value:"black",label:t(e(),"black")}]))}
        ${i(t(e(),"devDefaultLang"),b("ui.defaultLang",n.defaultLang,[{value:"es",label:"Español"},{value:"en",label:"English"}]))}
        <button type="button" class="secondary" data-reset="ui">${r(t(e(),"devResetSection"))}</button>
      </div>
    </details>
    <details class="dev-section" open>
      <summary>${r(t(e(),"devSectionTheme"))}</summary>
      <div class="dev-theme-block">
        <h3>${r(t(e(),"devThemeLight"))}</h3>
        <div class="dev-fields">${B("light")}</div>
      </div>
      <div class="dev-theme-block">
        <h3>${r(t(e(),"devThemeDark"))}</h3>
        <div class="dev-fields">${B("dark")}</div>
      </div>
      <button type="button" class="secondary" data-reset="theme">${r(t(e(),"devResetSection"))}</button>
    </details>
  `,J.innerHTML=`
    <span>${r(t(e(),"devSample"))}</span>
    <button type="button">${r(t(e(),"devSamplePrimary"))}</button>
    <button type="button" class="secondary">${r(t(e(),"devSampleSecondary"))}</button>
    <p>${r(t(e(),"devSampleText"))}</p>
  `}function K(n){switch(n){case"default":return t(e(),"devPresetDefault");case"high-contrast":return t(e(),"devPresetContrast");case"warm-paper":return t(e(),"devPresetWarm");case"green-board":return t(e(),"devPresetGreen");case"large-text":return t(e(),"devPresetLarge");default:return n}}function p(n,{saved:a=!0}={}){c=n,a&&f(n),S(c,{saved:a}),M(a)}function M(n){const a=x?.contentWindow;a&&a.postMessage({type:N,settings:c,saved:n},"*")}function Y(n){c=n,window.clearTimeout(w),w=window.setTimeout(()=>p(c),G)}function $(n,a){const s=String(n).split("."),d=structuredClone(c);let o=d;for(let u=0;u<s.length-1;u+=1)o=o[s[u]];o[s[s.length-1]]=a,Y(f(d))}function D(n,a,s){const d=new Blob([a],{type:s}),o=URL.createObjectURL(d),u=document.createElement("a");u.href=o,u.download=n,document.body.appendChild(u),u.click(),u.remove(),URL.revokeObjectURL(o)}E.addEventListener("input",n=>{const a=n.target;if(!(a instanceof HTMLInputElement||a instanceof HTMLSelectElement))return;const s=a.getAttribute("data-path");s&&(a.type==="checkbox"?$(s,a.checked):a.type==="number"?$(s,a.value===""?0:Number(a.value)):$(s,a.value))});E.addEventListener("click",async n=>{const a=n.target instanceof Element?n.target:null;if(!a)return;const s=a.closest("[data-dev-lang]");if(s){m=k(s.getAttribute("data-dev-lang")),A(m),c=f({ui:{...c.ui,defaultLang:m}}),g(),p(c);return}const d=a.closest("[data-preset]")?.getAttribute("data-preset");if(d){p(F(d)),g();return}const o=a.closest("[data-reset]")?.getAttribute("data-reset");if(o){o==="all"?p(P(),{saved:!1}):p(R(o)),g();return}if(a.closest("[data-export='json']")){D("chess-tutor-dev-settings.json",L(c),"application/json");return}if(a.closest("[data-export='css']")){D("chess-tutor-theme.css",j(c),"text/css");return}if(a.closest("[data-copy]")){try{await navigator.clipboard.writeText(L(c)),a.textContent=t(e(),"devCopied")}catch{}return}a.closest("[data-import]")&&v.click()});v.addEventListener("change",async()=>{const n=v.files?.[0];if(v.value="",!n)return;const a=z(await n.text());if(!a.ok){window.alert(t(e(),"devImportFail"));return}p(a.settings),g()});x?.addEventListener("load",()=>{M(y())});g();y()||S(O(),{saved:!1});function Q(n){const a=String(n??"");if(/^#[0-9a-f]{6}$/i.test(a))return a;const s=a.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);return s?`#${[s[1],s[2],s[3]].map(d=>Number(d).toString(16).padStart(2,"0")).join("")}`:"#000000"}function r(n){return String(n??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
