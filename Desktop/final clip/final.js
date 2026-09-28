// =================================================
// EASY EDIT SETTINGS  (change things here - all times are in milliseconds, 1000 = 1 second)
// =================================================

const CONFIG = {

  // ---------- overall timeline ----------
  clip1Start: 0,               // wait before Clip 1 begins (0 = start at once)
  fadeTime: 800,               // cross-fade between clips (Clip 1 -> 2 -> 3)

  // ---------- Clip 1 : heart & bow ----------
  clip1ShootDelay: 3000,       // if nobody touches the bow, it shoots by itself after this time
  clip1EndHold: 200,           // pause after the red circle fills the screen, before Clip 2

  // ---------- Clip 2 : birthday cake ----------
  clip2Text: "Happy Birthday", // text that gets typed
  clip2TypeStart: 4300,        // when typing starts (after the cake is built)
  clip2TypeSpeed: 110,         // time per letter
  clip2HoldAfterTyping: 2500,  // how long the finished text stays before Clip 3

  // ---------- Clip 3 : birthday story ----------
  clip3Name: "Tanya Srivastava",
  clip3Age: "30",               // <-- CHANGED from "5" to "30"
  clip3EnvelopeOpenDelay: 1200, // envelope opens by itself after this time
  clip3LetterRevealDelay: 900,  // letter slides out this long after the envelope opens
  clip3PhotoLabels: ["first memory","that day","favourite","together","good days","always","laughter","forever","us"],
  clip3Wishes: ["i love your laugh","you make me happy","you are so beautiful","you mean everything","so glad you exist","forever cheering for you"]

};

// =================================================
// EXISTING WEBSITE JAVASCRIPT
// =================================================

// (no existing website code was attached - paste it here if you have any)

// =================================================
// CLIP 1  (heart & bow)
// =================================================

const Clip1 = (function () {
  const api = { onFinish: function () {}, start: function () { start(); } };

  const svg   = document.getElementById("c1-scene");
  const heart = document.getElementById("c1-heart");
  const glow  = document.getElementById("c1-glow");
  const ball  = document.getElementById("c1-ball");
  const bow   = document.getElementById("c1-bow");
  const nock  = document.getElementById("c1-nock");
  const string= document.getElementById("c1-string");
  const finger= document.getElementById("c1-finger");
  const sparks= document.getElementById("c1-sparks");
  const flood = document.getElementById("c1-flood");
  const hint  = document.getElementById("c1-hint");

  const H = {x:500, y:200};          // heart position
  const C = {x:150, y:430};          // bow position
  const ang = Math.atan2(H.y - C.y, H.x - C.x);
  const dir = {x:Math.cos(ang), y:Math.sin(ang)};
  const ARROW = 72, MAX_PULL = 60;

  let phase = "idle";                // idle | pulling | flying | hit | done
  let pull = 0, shake = 0, heartScale = 1, t0 = performance.now();
  let arrowStuck = null;             // {x,y} arrow offset inside heart
  let demoTimer;

  /* ---------- drawing ---------- */
  function drawBow(){
    bow.setAttribute("transform", `translate(${C.x} ${C.y}) rotate(${ang*180/Math.PI})`);
    string.setAttribute("points", `0,-52 ${-pull},0 0,52`);
    if(phase === "idle" || phase === "pulling"){
      nock.setAttribute("transform", `translate(${-pull} 0)`);
      nock.style.display = "";
    } else if(phase === "flying"){
      nock.style.display = "none";
    }
    finger.setAttribute("cx", -pull);
    finger.style.opacity = phase === "pulling" ? .9 : 0;
  }
  function drawHeart(now){
    const bob = Math.sin((now - t0)/500) * 4;
    const sx = shake ? (Math.random()-.5)*shake : 0;
    heart.setAttribute("transform",
      `translate(${H.x+sx} ${H.y+bob}) scale(${heartScale})`);
    glow.setAttribute("cy", H.y + bob);
  }
  function loop(now){ drawHeart(now); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  drawBow();

  /* ---------- helpers ---------- */
  const ease = t => t*t*(3-2*t);
  function tween(ms, fn, done){
    const s = performance.now();
    (function step(now){
      const p = Math.min(1,(now - s)/ms);
      fn(p);
      p < 1 ? requestAnimationFrame(step) : done && done();
    })(s);
  }
  function svgPoint(e){
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  /* ---------- shoot ---------- */
  function release(){
    if(phase === "flying" || phase === "hit" || phase === "done") return;
    clearTimeout(demoTimer);
    const startPull = pull;
    phase = "flying";
    hint.style.opacity = 0;

    // string snaps back
    tween(220, p => { pull = startPull * (1 - ease(p)) * Math.cos(p*10) ; drawBow(); },
          () => { pull = 0; drawBow(); });

    // arrow flight (separate arrow element in scene)
    const arrow = nock.cloneNode(true);
    arrow.removeAttribute("id");
    arrow.style.display = "";
    const holder = document.createElementNS("http://www.w3.org/2000/svg","g");
    holder.appendChild(arrow);
    svg.appendChild(holder);
    const sx = C.x - dir.x*startPull, sy = C.y - dir.y*startPull;
    const ex = H.x - dir.x*(ARROW - 14), ey = H.y - dir.y*(ARROW - 14);
    const deg = ang*180/Math.PI;

    tween(340, p => {
      const e = p*p;
      holder.setAttribute("transform",
        `translate(${sx+(ex-sx)*e} ${sy+(ey-sy)*e}) rotate(${deg})`);
    }, () => hitHeart(holder));
  }

  function hitHeart(holder){
    phase = "hit";
    arrowStuck = holder;
    // shake + burst
    shake = 14;
    tween(350, p => { shake = 14*(1-p); }, () => shake = 0);
    burst();
    // squash, then turn into a ball
    setTimeout(() => {
      tween(260, p => { heartScale = 1 - ease(p)*0.55; });
    }, 400);
    setTimeout(() => {
      arrowStuck.style.display = "none";
      heart.style.display = "none";
      glow.style.opacity = 0;
      ball.setAttribute("r", 32);
      tween(320, p => ball.setAttribute("r", 32 + ease(p)*4));
    }, 700);
    setTimeout(floodScreen, 1000);
  }

  function burst(){
    const colors = ["#ff5c8a","#ffb703","#ff8fab","#c2185b","#ffd166"];
    for(let i=0;i<16;i++){
      const c = document.createElementNS("http://www.w3.org/2000/svg","circle");
      const a = Math.random()*Math.PI*2, d = 60 + Math.random()*90;
      const r = 2 + Math.random()*3.5;
      c.setAttribute("r", r);
      c.setAttribute("fill", colors[i % colors.length]);
      sparks.appendChild(c);
      const x0 = H.x, y0 = H.y;
      tween(900, p => {
        const e = 1-Math.pow(1-p,3);
        c.setAttribute("cx", x0 + Math.cos(a)*d*e);
        c.setAttribute("cy", y0 + Math.sin(a)*d*e - p*30);
        c.setAttribute("opacity", 1-p);
      }, () => c.remove());
    }
  }

  function floodScreen(){
    const r = ball.getBoundingClientRect();
    const cx = r.left + r.width/2, cy = r.top + r.height/2;
    const size = 200;
    flood.style.left = cx+"px"; flood.style.top = cy+"px";
    const need = Math.hypot(Math.max(cx, innerWidth-cx), Math.max(cy, innerHeight-cy))*2;
    flood.style.transform = "translate(-50%,-50%) scale(.16)";
    flood.offsetWidth;
    flood.classList.add("go");
    flood.style.transform = `translate(-50%,-50%) scale(${need/size})`;
    setTimeout(() => { phase = "done"; api.onFinish(); }, 1100);
  }

  /* ---------- input ---------- */
  svg.addEventListener("pointerdown", e => {
    if(phase === "done"){ reset(); return; }
    if(phase !== "idle") return;
    const p = svgPoint(e);
    if(Math.hypot(p.x - C.x, p.y - C.y) > 110) return;
    clearTimeout(demoTimer);
    phase = "pulling";
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  svg.addEventListener("pointermove", move);
  svg.addEventListener("pointerup", () => { if(phase === "pulling") release(); });
  function move(e){
    if(phase !== "pulling") return;
    const p = svgPoint(e);
    const back = (C.x - p.x)*dir.x + (C.y - p.y)*dir.y;   // distance behind bow
    pull = Math.max(0, Math.min(MAX_PULL, back));
    drawBow();
  }
  flood.addEventListener("click", () => phase === "done" && reset());
  document.getElementById("clip1").addEventListener("click", () => phase === "done" && reset());

  /* ---------- auto demo (like the clip) ---------- */
  function demo(){
    if(phase !== "idle") return;
    phase = "pulling";
    tween(800, p => { pull = MAX_PULL*ease(p); drawBow(); }, () => {
      setTimeout(release, 250);
    });
  }

  /* ---------- replay ---------- */
  function reset(){
    flood.classList.remove("go");
    flood.style.transform = "translate(-50%,-50%) scale(0)";
    sparks.innerHTML = "";
    [...svg.querySelectorAll(":scope > g:not(#c1-heart):not(#c1-sparks):not(#c1-bow)")].forEach(g=>g.remove());
    heart.style.display = ""; glow.style.opacity = 1;
    ball.setAttribute("r", 0);
    heartScale = 1; pull = 0; phase = "idle"; hint.style.opacity = 1;
    drawBow();
    demoTimer = setTimeout(demo, CONFIG.clip1ShootDelay);
  }

  /* ---------- called by the timeline when Clip 1 begins ---------- */
  function start(){
    demoTimer = setTimeout(demo, CONFIG.clip1ShootDelay);
  }

  return api;
})();

// =================================================
// CLIP 2  (birthday cake)
// =================================================

const Clip2 = (function () {
  const api = { onFinish: function () {}, start: function () { start(); } };

  const TEXT       = CONFIG.clip2Text;        // text that is typed
  const TYPE_START = CONFIG.clip2TypeStart;   // ms when typing starts
  const TYPE_SPEED = CONFIG.clip2TypeSpeed;   // ms per letter

  const stage = document.getElementById("c2-stage");
  const title = document.getElementById("c2-title");
  let timers = [];

  /* typewriter */
  function typeText(){
    title.textContent = "";
    title.classList.remove("done");
    [...TEXT].forEach((_, i) => {
      timers.push(setTimeout(() => {
        title.textContent = TEXT.slice(0, i + 1);
        if (i === TEXT.length - 1) title.classList.add("done");
      }, TYPE_START + i * TYPE_SPEED));
    });
    // when typing is finished, wait a moment, then tell the timeline Clip 2 is over
    timers.push(setTimeout(() => api.onFinish(),
      TYPE_START + TEXT.length * TYPE_SPEED + CONFIG.clip2HoldAfterTyping));
  }

  /* confetti */
  function makeConfetti(){
    const box = document.getElementById("c2-confetti");
    box.innerHTML = "";
    const colors = ["#ffffff","#fff8ee","#f28ba0","#ffd6dc"];
    for (let i = 0; i < 45; i++){
      const d = document.createElement("span");
      d.className = "dot";
      const size = 4 + Math.random() * 8;
      const round = Math.random() > .4;
      d.style.cssText = `
        left:${Math.random()*100}vw;
        width:${size}px;height:${round ? size : size*.6}px;
        border-radius:${round ? "50%" : "1px"};
        background:${colors[Math.floor(Math.random()*colors.length)]};
        animation-duration:${5 + Math.random()*6}s;
        animation-delay:${-Math.random()*10}s;
        --dx:${(Math.random()-.5)*160}px;
        --rot:${Math.random()*720}deg;
      `;
      box.appendChild(d);
    }
  }

  /* start / replay */
  function play(){
    timers.forEach(clearTimeout);
    timers = [];
    stage.classList.remove("play");
    void stage.offsetWidth;          // restart CSS animations
    stage.classList.add("play");
    typeText();
  }

  makeConfetti();
  document.getElementById("clip2").addEventListener("click", play);

  /* ---------- called by the timeline when Clip 2 begins ---------- */
  function start(){
    document.fonts.ready.then(play);
  }

  return api;
})();

// =================================================
// CLIP 3  (birthday story)
// =================================================

const Clip3 = (function () {
  const api = { onFinish: function () {}, start: function () { start(); } };

  const NAME = CONFIG.clip3Name, AGE = CONFIG.clip3Age;
  const screens = [...document.querySelectorAll(".screen")];
  const dotsBox = document.getElementById("c3-dots");
  const back = document.getElementById("c3-back");
  let cur = 0, lit = false;

  /* dots */
  for (let i = 0; i < 4; i++) dotsBox.appendChild(document.createElement("i"));
  /* text */
  const th = n => n + (["th","st","nd","rd"][(n%100>10&&n%100<14)||n%10>3?0:n%10]);
  document.getElementById("c3-age").innerHTML = AGE + "<sup>" + th(+AGE).slice(String(AGE).length) + "</sup>";
  document.getElementById("c3-age2").textContent = th(+AGE);
  ["c3-name","c3-name2"].forEach(id => document.getElementById(id).textContent = NAME);

  /* candles */
  const cg = document.getElementById("c3-candles");
  [70,110,150].forEach(x => cg.innerHTML +=
    `<rect x="${x-3}" y="46" width="6" height="36" fill="#fff" stroke="#8e2a45" stroke-width="1.5" stroke-dasharray="4 4"/>
     <g class="fire" style="display:none"><ellipse class="flame" cx="${x}" cy="38" rx="5" ry="9" fill="#f5a623"/><ellipse class="flame" cx="${x}" cy="41" rx="2.5" ry="5" fill="#ffe27a"/></g>`);

  /* photo wall */
  const labels = CONFIG.clip3PhotoLabels;
  document.getElementById("c3-grid").innerHTML = labels.map((t,i) =>
    `<div class="pol" style="--r:${(Math.random()*6-3).toFixed(1)}deg;--d:${i*.09}s"><div>♡</div><span>${t}</span></div>`).join("");

  /* wishes */
  const wishes = CONFIG.clip3Wishes;
  document.getElementById("c3-tags").innerHTML = wishes.map(() => "").join("");

  /* navigation */
  function go(n){
    screens.forEach((s,i) => s.classList.toggle("on", i === n));
    cur = n;
    [...dotsBox.children].forEach((d,i) => d.classList.toggle("on", i === Math.min(n,3)));
    back.style.display = n > 0 ? "block" : "none";
    if (n === 3) resetLetter();
    if (n === 4) showWishes();
  }
  document.querySelectorAll("[data-go]").forEach(b => b.onclick = () => go(+b.dataset.go));
  back.onclick = () => go(Math.max(0, cur - 1));
  go(0);

  /* cake: light candles + confetti */
  document.getElementById("c3-cake").onclick = () => {
    if (lit) return; lit = true;
    document.querySelectorAll(".fire").forEach(f => f.style.display = "");
    document.getElementById("c3-msg").textContent = "wish made ✨";
    confetti(40);
  };
  function confetti(n){
    const fx = document.getElementById("c3-fx"), cols = ["#b0405f","#f2c94c","#f3c3cb","#7b1e34","#d98b62"];
    for (let i = 0; i < n; i++){
      const p = document.createElement("i");
      p.style.cssText = `left:${Math.random()*100}vw;background:${cols[i%5]};--x:${Math.random()*200-100}px;animation-delay:${Math.random()*.6}s`;
      fx.appendChild(p); setTimeout(() => p.remove(), 3500);
    }
  }

  /* envelope -> letter */
  const env = document.getElementById("c3-env"), lscreen = document.querySelector(".letter");
  function resetLetter(){ env.classList.remove("open"); lscreen.classList.remove("show"); setTimeout(openEnv, CONFIG.clip3EnvelopeOpenDelay); }
  function openEnv(){ if (cur !== 3) return; env.classList.add("open"); setTimeout(() => lscreen.classList.add("show"), CONFIG.clip3LetterRevealDelay); }
  env.onclick = openEnv;

  /* flowers screen */
  function showWishes(){
    const box = document.getElementById("c3-tags"); box.innerHTML = "";
    wishes.forEach((w,i) => { const s = document.createElement("span"); s.textContent = w; s.style.animationDelay = (.5 + i*.35) + "s"; box.appendChild(s); });
    confetti(30);
  }

  /* ---------- called by the timeline when Clip 3 begins ---------- */
  function start(){
    go(0);
  }

  return api;
})();

// =================================================
// TRANSITIONS  (the timeline that plays Clip 1 -> Clip 2 -> Clip 3)
// =================================================

const clipEls  = [document.getElementById("clip1"), document.getElementById("clip2"), document.getElementById("clip3")];
const clipApis = [Clip1, Clip2, Clip3];
let currentClip = -1;

// fade-time is also used by the CSS
document.documentElement.style.setProperty("--fade-time", CONFIG.fadeTime + "ms");

// show clip number i (0, 1 or 2) on top of the previous one, then start its animation
function showClip(i, instant) {
  if (i <= currentClip || i >= clipEls.length) return;   // never repeat or go backwards
  const previous = clipEls[currentClip];
  if (instant) clipEls[i].classList.add("no-fade");
  clipEls[i].classList.add("visible");
  currentClip = i;
  clipApis[i].start();
  // remove the old clip only after the new one is fully visible (no blank flash)
  if (previous) setTimeout(() => previous.classList.remove("visible"), CONFIG.fadeTime + 100);
}

// when a clip says "I'm finished", show the next one
Clip1.onFinish = () => setTimeout(() => showClip(1), CONFIG.clip1EndHold);
Clip2.onFinish = () => showClip(2);
// Clip 3 is the final section: it is interactive (buttons) and stays on screen.

// START THE WHOLE TIMELINE
setTimeout(() => showClip(0, true), CONFIG.clip1Start);