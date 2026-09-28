"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { GameComponentProps } from "@rarefriends/friendsdk/runtime";
import { createFriendReader, spriteFrame, type GenerationSprites } from "@rarefriends/friendsdk/sprites";
import "./style.css";

type Choice = { label: string; line: string; color: string; ending: string };
type Beat = { eyebrow: string; title: string; narration: string; choices: readonly Choice[] };
type Prop = { id: string; name: string; icon: string; description: string; color: string };
type Point = { x: number; y: number };

const STAR = { x: 583, y: 210 } as const;
const PERSONAS: Record<GenerationSprites["familyName"], { role: string; color: string; note: string }> = {
  Skeleton: { role: "The Bone Keeper", color: "#d8f6a3", note: "Brave enough to rattle in the dark." },
  Mask: { role: "The Hidden Hero", color: "#ffd79f", note: "Every mask hides a little courage." },
  Family: { role: "The Chorus", color: "#ffacd1", note: "Never truly alone on any stage." },
  Cellular: { role: "The Shape Shifter", color: "#b6ebd3", note: "Always becoming someone new." },
  Asymmetry: { role: "The Odd Wonder", color: "#c8b5ff", note: "Perfectly strange, perfectly rare." },
  Hoverer: { role: "The Dream Drifter", color: "#a5dfff", note: "A little above the ordinary." },
  Colossus: { role: "The Gentle Giant", color: "#ffcf9e", note: "A big heart under the lights." },
  Sparkling: { role: "The Living Spark", color: "#f7ef9a", note: "A light that makes more light." },
  Hollow: { role: "The Echo", color: "#e3c6f0", note: "Even an echo can lead the way." },
};

const reader = createFriendReader();
const COST = 2;
const STARTING_RF = 8;
const PROPS: readonly Prop[] = [
  { id: "lantern", name: "Moon lantern", icon: "✦", description: "A light for the lost", color: "#ffdd76" },
  { id: "key", name: "Brass key", icon: "◇", description: "Opens one impossible door", color: "#d2ff8f" },
  { id: "confetti", name: "Star confetti", icon: "✳", description: "For a grand finale", color: "#ffaec6" },
];
const BEATS: readonly Beat[] = [
  { eyebrow: "ACT I · THE ARRIVAL", title: "The star has vanished", narration: "The theater is full. Your Friend discovers the spotlight is empty and a trail of stardust leads backstage.", choices: [
    { label: "Follow the stardust", line: "One step into the dark, and the trail begins to glow.", color: "#ffdd76", ending: "followed the smallest light" },
    { label: "Call out to the crowd", line: "A hundred voices answer. None belong to the missing star.", color: "#c5a9ff", ending: "asked the crowd for help" },
    { label: "Peek behind the curtain", line: "The velvet parts. An impossible door waits beyond it.", color: "#ffaec6", ending: "found a secret door" },
  ] },
  { eyebrow: "ACT II · THE CHOICE", title: "A door with no handle", narration: "A little voice whispers from the other side: “I forgot how to shine.” Your Friend has one chance to answer.", choices: [
    { label: "Offer your light", line: "Your Friend shares a glow. The door grows warm.", color: "#ffdd76", ending: "shared their own light" },
    { label: "Tell a ridiculous joke", line: "A laugh escapes through the keyhole. The lock clicks.", color: "#d2ff8f", ending: "made the dark laugh" },
    { label: "Sit and listen", line: "Silence becomes a song, and the door opens on its own.", color: "#a6e3ef", ending: "listened until the door opened" },
  ] },
  { eyebrow: "ACT III · THE FINALE", title: "The star steps out", narration: "The lost star is tiny and trembling. The audience waits. How will your Friend bring it back to the stage?", choices: [
    { label: "Take its hand", line: "Together, they cross the stage. The room becomes a sky.", color: "#ffaec6", ending: "brought the star home hand in hand" },
    { label: "Make room for it", line: "Your Friend steps aside. The smallest star shines brightest.", color: "#ffdd76", ending: "let the star shine for itself" },
    { label: "Dance together", line: "A clumsy little dance turns the entire audience into a constellation.", color: "#d2ff8f", ending: "started a constellation dance" },
  ] },
];

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}
function drawFriend(ctx: CanvasRenderingContext2D, sprites: GenerationSprites, x: number, y: number, size: number, frameIndex: number) {
  const { frame } = spriteFrame(sprites, "down", false, frameIndex % 8);
  const pixel = size / 16;
  ctx.save(); ctx.translate(x - size / 2, y - size / 2);
  ctx.fillStyle = "#fff9e7";
  frame.rows.forEach((row, py) => { for (let px = 0; px < 16; px++) if (row[px] === "#") ctx.fillRect(px * pixel - 2, py * pixel - 2, pixel + 4, pixel + 4); });
  ctx.fillStyle = PERSONAS[sprites.familyName].color;
  frame.rows.forEach((row, py) => { for (let px = 0; px < 16; px++) if (row[px] === "#") ctx.fillRect(px * pixel, py * pixel, pixel + .3, pixel + .3); });
  ctx.restore();
}
function drawStage(ctx: CanvasRenderingContext2D, w: number, h: number, sprites: GenerationSprites, beat: number, selected: number | null, prop: Prop | null, frameIndex: number, beam?: Point, clueFound = true) {
  const sx = w / 800, sy = h / 500; ctx.save(); ctx.scale(sx, sy);
  const gradient = ctx.createLinearGradient(0, 0, 0, 500);
  gradient.addColorStop(0, beat === 2 ? "#261536" : "#10162b"); gradient.addColorStop(1, "#67304d");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 800, 500);
  ctx.fillStyle = "#f2d4a0"; ctx.globalAlpha = .3;
  for (let i = 0; i < 12; i++) { const x = (i * 187 + beat * 83) % 800, y = (i * 107 + 37) % 300; ctx.beginPath(); ctx.arc(x, y, i % 3 === 0 ? 3 : 1.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
  ctx.fillStyle = PERSONAS[sprites.familyName].color; ctx.globalAlpha = .16; ctx.beginPath(); ctx.moveTo(367, 0); ctx.lineTo(190, 410); ctx.lineTo(610, 410); ctx.lineTo(437, 0); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = "#402845"; ctx.fillRect(0, 390, 800, 110);
  ctx.fillStyle = "#b88473"; ctx.fillRect(0, 385, 800, 10);
  ctx.fillStyle = "#614060"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(80, 90, 35, 280, 108, 378); ctx.lineTo(0, 415); ctx.fill();
  ctx.beginPath(); ctx.moveTo(800, 0); ctx.bezierCurveTo(720, 90, 765, 280, 692, 378); ctx.lineTo(800, 415); ctx.fill();
  ctx.fillStyle = "#a46476"; ctx.fillRect(0, 0, 800, 23); ctx.fillRect(0, 0, 37, 390); ctx.fillRect(763, 0, 37, 390);
  ctx.fillStyle = "#ffdc99"; ctx.font = "600 18px Georgia"; ctx.textAlign = "center"; ctx.fillText("THE LITTLE LOST STAR", 400, 52);
  if (beat === 0) {
    ctx.fillStyle = "#d6ad72"; rounded(ctx, 520, 245, 110, 140, 8);
    ctx.fillStyle = "#39283d"; rounded(ctx, 533, 260, 84, 125, 38);
    ctx.fillStyle = "#ffe69c"; ctx.beginPath(); ctx.arc(570, 286, 4, 0, Math.PI * 2); ctx.fill();
  } else if (beat === 1) {
    ctx.fillStyle = "#c59675"; rounded(ctx, 500, 157, 146, 227, 12);
    ctx.fillStyle = "#51405c"; rounded(ctx, 515, 172, 116, 211, 55);
    ctx.strokeStyle = "#ffdfab"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(573, 238, 21, 0, Math.PI * 2); ctx.stroke();
  } else {
    ctx.fillStyle = "#ffdd86"; ctx.shadowColor = "#ffe1a5"; ctx.shadowBlur = 45;
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 17 : 36; const px = 577 + Math.cos(a) * r, py = 255 + Math.sin(a) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
  }
  ctx.fillStyle = "#211a35"; ctx.globalAlpha = .4; ctx.beginPath(); ctx.ellipse(316, 389, 125, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  drawFriend(ctx, sprites, 315, 306 + (frameIndex % 2 ? -2 : 0), 160, frameIndex);
  if (prop?.id === "lantern") { ctx.strokeStyle = "#e9c779"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(370, 317); ctx.lineTo(407, 335); ctx.stroke(); ctx.fillStyle = "#ffe99c"; ctx.shadowColor = "#ffdf8b"; ctx.shadowBlur = 25; rounded(ctx, 395, 316, 30, 38, 7); ctx.shadowBlur = 0; }
  if (prop?.id === "key") { ctx.strokeStyle = "#e8cf80"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(414, 307, 11, 0, Math.PI * 2); ctx.moveTo(414, 318); ctx.lineTo(414, 350); ctx.lineTo(427, 350); ctx.stroke(); }
  if (prop?.id === "confetti") { ctx.fillStyle = "#ffc1d4"; for (let i = 0; i < 24; i++) { const x = 125 + (i * 73) % 575, y = 98 + (i * 59) % 265; ctx.save(); ctx.translate(x, y); ctx.rotate(i); ctx.fillRect(0, 0, 9, 4); ctx.restore(); } }
  if (beat === 0 && clueFound) {
    ctx.strokeStyle = "rgba(255, 227, 137, .72)"; ctx.lineWidth = 3; ctx.setLineDash([3, 11]);
    ctx.beginPath(); ctx.moveTo(378, 331); ctx.bezierCurveTo(462, 294, 505, 237, STAR.x, STAR.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#fff0a1"; ctx.shadowColor = "#ffe079"; ctx.shadowBlur = 32;
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? 12 : 25; ctx.lineTo(STAR.x + Math.cos(angle) * radius, STAR.y + Math.sin(angle) * radius); } ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
  }
  if (selected !== null) {
    const accent = BEATS[beat].choices[selected].color;
    ctx.fillStyle = accent; ctx.shadowColor = accent; ctx.shadowBlur = 18;
    for (let i = 0; i < 5; i++) {
      const x = 155 + selected * 42 + i * 78, y = 212 + (i % 3) * 37;
      ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 10); ctx.lineTo(x - 4, y); ctx.closePath(); ctx.fill();
    }
    ctx.shadowBlur = 0; rounded(ctx, 72, 412, 656, 63, 10);
    ctx.fillStyle = "#31253d"; ctx.font = "600 19px Georgia"; ctx.textAlign = "center";
    ctx.fillText(BEATS[beat].choices[selected].line, 400, 451, 620);
  }
  if (beat === 0 && !clueFound && beam) {
    ctx.fillStyle = "rgba(5, 7, 20, .82)";
    ctx.beginPath(); ctx.rect(0, 0, 800, 500); ctx.moveTo(beam.x + 105, beam.y);
    ctx.arc(beam.x, beam.y, 105, 0, Math.PI * 2, true); ctx.fill("evenodd");
    const glow = ctx.createRadialGradient(beam.x, beam.y, 5, beam.x, beam.y, 105);
    glow.addColorStop(0, "rgba(255, 235, 160, .20)"); glow.addColorStop(1, "rgba(255, 235, 160, 0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(beam.x, beam.y, 105, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255, 232, 166, .75)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(beam.x, beam.y, 105, 0, Math.PI * 2); ctx.stroke();
    if (Math.hypot(beam.x - STAR.x, beam.y - STAR.y) < 105) {
      ctx.fillStyle = "#fff3aa"; ctx.shadowColor = "#ffe079"; ctx.shadowBlur = 30;
      ctx.beginPath(); for (let i = 0; i < 10; i++) { const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? 12 : 24; ctx.lineTo(STAR.x + Math.cos(angle) * radius, STAR.y + Math.sin(angle) * radius); } ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    }
  }
  ctx.restore();
}

function renderComic(sprites: GenerationSprites, choices: readonly number[], prop: Prop | null, friendId: bigint) {
  const canvas = document.createElement("canvas"); canvas.width = 1200; canvas.height = 2380;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas export is unavailable.");
  ctx.fillStyle = "#f4e9d1"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#302541"; ctx.textAlign = "left"; ctx.font = "bold 50px Georgia"; ctx.fillText("RARE FRIEND THEATER", 64, 78);
  ctx.font = "20px Arial"; ctx.fillText(`A little lost star · ${PERSONAS[sprites.familyName].role} · Friend #${friendId}`, 66, 111);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = "#302541"; ctx.font = "bold 18px Arial"; ctx.fillText(BEATS[i].eyebrow, 65, 157 + i * 730);
    ctx.save(); ctx.translate(64, 171 + i * 730); drawStage(ctx, 1072, 670, sprites, i, choices[i], prop, 0); ctx.restore();
  }
  ctx.fillStyle = "#302541"; ctx.font = "italic 24px Georgia";
  ctx.fillText(`Friend #${friendId} ${BEATS[0].choices[choices[0]].ending},`, 65, 2320);
  ctx.fillText(`${BEATS[1].choices[choices[1]].ending}, and ${BEATS[2].choices[choices[2]].ending}.`, 65, 2350, 1070);
  return canvas.toDataURL("image/png");
}

export default function RareFriendTheater({ friendId, client, paused }: GameComponentProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [sprites, setSprites] = useState<GenerationSprites | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [beat, setBeat] = useState(0);
  const [choices, setChoices] = useState<number[]>([]);
  const [finale, setFinale] = useState(false);
  const [balance, setBalance] = useState(STARTING_RF);
  const [owned, setOwned] = useState<string[]>([]);
  const [equipped, setEquipped] = useState<string | null>(null);
  const [motion, setMotion] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [frame, setFrame] = useState(0);
  const [comic, setComic] = useState<string | null>(null);
  const [beam, setBeam] = useState<Point>({ x: 275, y: 260 });
  const [clueFound, setClueFound] = useState(false);
  const currentProp = PROPS.find(p => p.id === equipped) ?? null;
  const complete = finale;
  const persona = sprites ? PERSONAS[sprites.familyName] : null;

  useEffect(() => {
    let active = true; setSprites(null); setLoading(true); setError(""); setBeat(0); setChoices([]); setFinale(false); setComic(null); setBalance(STARTING_RF); setOwned([]); setEquipped(null); setBeam({ x: 275, y: 260 }); setClueFound(false);
    Promise.all([client.read(), reader.read(friendId)]).then(([snapshot, art]) => {
      if (!active) return;
      if (snapshot.friendId !== friendId) throw new Error("The selected Friend changed. Reconnect and retry.");
      setSprites(art); setLoading(false);
    }).catch(cause => { if (active) { setError(cause instanceof Error ? cause.message : "Could not load your Friend."); setLoading(false); } });
    return () => { active = false; };
  }, [client, friendId]);
  useEffect(() => { if (!motion || paused || !sprites) return; const timer = window.setInterval(() => setFrame(v => (v + 1) % 8), 300); return () => window.clearInterval(timer); }, [motion, paused, sprites]);
  useEffect(() => { const ctx = canvas.current?.getContext("2d"); if (ctx && sprites) drawStage(ctx, 800, 500, sprites, Math.min(beat, 2), choices[beat] ?? null, currentProp, frame, beam, clueFound); }, [sprites, beat, choices, equipped, frame, beam, clueFound]);
  function pointAt(event: PointerEvent<HTMLCanvasElement>): Point {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(800, (event.clientX - box.left) * 800 / box.width)), y: Math.max(0, Math.min(500, (event.clientY - box.top) * 500 / box.height)) };
  }
  function aim(event: PointerEvent<HTMLCanvasElement>) { if (!paused && beat === 0 && !clueFound) setBeam(pointAt(event)); }
  function reveal(event: PointerEvent<HTMLCanvasElement>) {
    if (paused || beat !== 0 || clueFound) return;
    event.currentTarget.focus();
    const point = pointAt(event); setBeam(point);
    if (Math.hypot(point.x - STAR.x, point.y - STAR.y) < 105) setClueFound(true);
  }
  function handleStageKey(event: KeyboardEvent<HTMLCanvasElement>) {
    if (paused || beat !== 0 || clueFound) return;
    const delta: Record<string, Point> = { ArrowLeft: { x: -32, y: 0 }, ArrowRight: { x: 32, y: 0 }, ArrowUp: { x: 0, y: -32 }, ArrowDown: { x: 0, y: 32 } };
    if (delta[event.key]) { event.preventDefault(); const step = delta[event.key]; setBeam(point => ({ x: Math.max(0, Math.min(800, point.x + step.x)), y: Math.max(0, Math.min(500, point.y + step.y)) })); }
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (Math.hypot(beam.x - STAR.x, beam.y - STAR.y) < 105) setClueFound(true); }
  }
  function pick(index: number) { if (paused || complete || choices.length !== beat) return; setChoices([...choices, index]); }
  function next() { if (paused || choices.length !== beat + 1) return; if (beat < 2) setBeat(beat + 1); else setFinale(true); }
  function buy(prop: Prop) { if (paused || balance < COST || owned.includes(prop.id)) return; setBalance(balance - COST); setOwned([...owned, prop.id]); setEquipped(prop.id); }
  function replay() { if (paused) return; setBeat(0); setChoices([]); setFinale(false); setComic(null); setClueFound(false); setBeam({ x: 275, y: 260 }); }
  return <main className="rft-shell" aria-label="Rare Friend Theater">
    <div className="rft-top"><div className="rft-brand"><span className="rft-brandmark">✳</span><span>Rare Friend<br/><b>Theater</b></span></div><div className="rft-topright"><span className="rft-sim">Preview mode</span><span>Friend #{friendId.toString()}</span></div></div>
    {loading || error ? <div className="rft-loading" role={error ? "alert" : "status"}><span className="rft-loading-star">✦</span><h1>{error ? "The curtain caught" : "Preparing the stage"}</h1><p>{error || "Loading your verified Friend and their original sprite…"}</p>{error && <button onClick={() => { setLoading(true); setError(""); void Promise.all([client.read(), reader.read(friendId)]).then(([snapshot, art]) => { if (snapshot.friendId !== friendId) throw new Error("The selected Friend changed."); setSprites(art); setLoading(false); }).catch(cause => { setError(cause instanceof Error ? cause.message : "Could not load your Friend."); setLoading(false); }); }} disabled={paused}>Retry</button>}</div> : <div className="rft-content">
      <section className="rft-stage-col"><div className="rft-stage-frame"><div className="rft-stage-header"><span>Tonight's performance</span><span>Act {beat + 1} of 3</span></div><canvas ref={canvas} width={800} height={500} tabIndex={beat === 0 && !clueFound ? 0 : -1} onPointerMove={aim} onPointerDown={reveal} onKeyDown={handleStageKey} className={beat === 0 && !clueFound ? "rft-interactive-stage" : ""} aria-label={beat === 0 && !clueFound ? "Search the stage with the spotlight. Tap near the hidden star, or use arrow keys and Enter." : `Illustrated stage starring your Rare Friend: ${BEATS[Math.min(beat, 2)].title}`} /><div className="rft-stage-footer"><span>{persona?.role} · Friend #{friendId.toString()}</span><span>The Little Lost Star</span></div></div><div className="rft-cast"><span className="rft-cast-icon" style={{ color: persona?.color }}>✦</span><div><strong>{persona?.role}</strong><small>{persona?.note}</small></div><span className="rft-cast-id">#{friendId.toString()}</span></div><div className="rft-below"><span>{beat === 0 && !clueFound ? "Move the spotlight to find the star" : "Your story is taking shape"}</span><span className="rft-progress">{BEATS.map((_, i) => <i key={i} className={i <= beat ? "on" : ""} />)}</span><label><input type="checkbox" checked={!motion} onChange={e => setMotion(!e.target.checked)} /> Reduce motion</label></div></section>
      <section className="rft-panel" aria-live="polite"><div className="rft-panel-meta"><span>{complete ? "Final curtain" : BEATS[beat].eyebrow}</span><span>Scene {beat + 1} / 3</span></div><h1>{complete ? "A star is born." : BEATS[beat].title}</h1><p className="rft-narration">{complete ? `${persona?.role} ${BEATS[0].choices[choices[0]].ending}, ${BEATS[1].choices[choices[1]].ending}, and ${BEATS[2].choices[choices[2]].ending}.` : BEATS[beat].narration.replace("Your Friend", persona?.role ?? "Your Friend")}</p>
        {complete ? <div className="rft-final"><p>Three scenes. One very rare star.</p><button className="rft-primary" disabled={paused} onClick={() => { if (!sprites) return; try { setComic(renderComic(sprites, choices, currentProp, friendId)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Comic export failed."); } }}>View your comic</button><button className="rft-secondary" disabled={paused} onClick={replay}>Play another version</button></div>
          : beat === 0 && !clueFound ? <div className="rft-search" role="status"><strong>Find the missing clue</strong><p>Move your spotlight across the stage. When the little star appears, tap it. Keyboard: focus the stage, use arrow keys, then press Enter.</p><button type="button" className="rft-secondary" disabled={paused} onClick={() => setClueFound(true)}>Reveal the clue</button></div>
          : choices.length === beat + 1 ? <div className="rft-chosen"><span>Your Friend chose</span><strong>{BEATS[beat].choices[choices[beat]].label}</strong><p>{BEATS[beat].choices[choices[beat]].line}</p><button className="rft-primary" disabled={paused} onClick={next}>{beat === 2 ? "See the ending" : "Next act"}</button></div>
          : <div className="rft-choices">{BEATS[beat].choices.map((choice, i) => <button key={choice.label} disabled={paused} onClick={() => pick(i)}><span className="rft-choice-no">0{i + 1}</span><span>{choice.label}</span><span className="rft-choice-arrow">↗</span></button>)}</div>}
        <div className="rft-props"><div className="rft-props-head"><div><span>BACKSTAGE PROP BOX</span><small>Dress the scene. Props appear in your comic.</small></div><b>{balance} <small>RF PREVIEW</small></b></div><div className="rft-prop-list">{PROPS.map(prop => <button key={prop.id} className={equipped === prop.id ? "rft-prop equipped" : "rft-prop"} disabled={paused || (!owned.includes(prop.id) && balance < COST)} onClick={() => owned.includes(prop.id) ? setEquipped(prop.id) : buy(prop)}><span className="rft-prop-icon" style={{ color: prop.color }}>{prop.icon}</span><span><strong>{prop.name}</strong><small>{prop.description}</small></span><em>{equipped === prop.id ? "ON" : owned.includes(prop.id) ? "USE" : `${COST} RF`}</em></button>)}</div><p className="rft-disclaimer">Preview RF and props exist only for this session. No wallet transaction or real token spend.</p></div>
      </section>
    </div>}
    {comic && <div className="rft-comic-overlay" role="dialog" aria-modal="true" aria-label="Your finished comic"><div className="rft-comic-head"><span>YOUR RARE FRIEND COMIC</span><button type="button" onClick={() => setComic(null)}>Close ×</button></div><p>Right-click or long-press the image to save it.</p><img src={comic} alt={`Three-panel comic starring Rare Friend #${friendId}`} /></div>}
  </main>;
}
