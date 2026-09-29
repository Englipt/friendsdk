"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { GameComponentProps } from "@rarefriends/friendsdk/runtime";
import { createFriendReader, spriteFrame, type GenerationSprites } from "@rarefriends/friendsdk/sprites";
import "./style.css";

type Choice = { label: string; line: string; color: string; ending: string };
type Beat = { eyebrow: string; title: string; narration: string; choices: readonly Choice[] };
type Prop = { id: string; name: string; icon: string; description: string; color: string };
type Point = { x: number; y: number };
type SetDesign = { id: string; name: string; sky: string; hill: string; curtain: string; light: string };

const STAR = { x: 583, y: 210 } as const;
const NOTES: readonly Point[] = [{ x: 470, y: 305 }, { x: 555, y: 260 }, { x: 635, y: 205 }];
const FINALE_TITLES = ["The Hand-Held Constellation", "The Star Who Shone Alone", "The Great Sky Dance"] as const;
const SETS: readonly SetDesign[] = [
  { id: "blue", name: "Moonbeam", sky: "#1b2d4a", hill: "#607395", curtain: "#a24f70", light: "#f8d89a" },
  { id: "pink", name: "Sugarplum", sky: "#503a65", hill: "#a17eae", curtain: "#b75d7b", light: "#ffe1a4" },
  { id: "green", name: "Mossy", sky: "#1e4b4a", hill: "#719c8a", curtain: "#a45b67", light: "#f6df9f" },
];
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
  { eyebrow: "ACT III · THE LULLABY", title: "A song in pieces", narration: "Beyond the door, three lost notes float in the dark. Play them in order to help the star remember its song.", choices: [
    { label: "Hum it softly", line: "A quiet melody gathers the scattered light.", color: "#a6e3ef", ending: "hummed the star's song" },
    { label: "Let the star lead", line: "The star finds the next note, then the next.", color: "#ffdd76", ending: "followed the star's melody" },
    { label: "Make it a dance", line: "The little notes bounce like feet across the floor.", color: "#ffaec6", ending: "danced to the lost lullaby" },
  ] },
  { eyebrow: "ACT IV · THE CROSSING", title: "The bridge of wishes", narration: "The song reveals a paper bridge over a sea of clouds. The star is afraid to cross. What will your Friend do?", choices: [
    { label: "Build paper steps", line: "Each careful fold becomes a place to land.", color: "#d2ff8f", ending: "folded a bridge from wishes" },
    { label: "Carry the star", line: "One brave leap brings them to the other side.", color: "#ffdd76", ending: "carried the star across" },
    { label: "Ask the audience", line: "The crowd holds up tiny lights to guide them.", color: "#c5a9ff", ending: "turned the audience into a path" },
  ] },
  { eyebrow: "ACT V · THE FINALE", title: "The star steps out", narration: "The lost star is tiny and trembling. The audience waits. How will your Friend bring it back to the stage?", choices: [
    { label: "Take its hand", line: "Together, they cross the stage. The room becomes a sky.", color: "#ffaec6", ending: "brought the star home hand in hand" },
    { label: "Make room for it", line: "Your Friend steps aside. The smallest star shines brightest.", color: "#ffdd76", ending: "let the star shine for itself" },
    { label: "Dance together", line: "A clumsy little dance turns the entire audience into a constellation.", color: "#d2ff8f", ending: "started a constellation dance" },
  ] },
];

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}
function littleStar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, mood: "shy" | "happy" | "sleepy") {
  ctx.save(); ctx.translate(x, y); ctx.shadowColor = "#ffe38d"; ctx.shadowBlur = radius * .9;
  ctx.fillStyle = "#fff1a3"; ctx.strokeStyle = "#ba754d"; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? radius * .54 : radius; const px = Math.cos(a) * r, py = Math.sin(a) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
  ctx.fillStyle = "#4c3b55";
  if (mood === "sleepy") { ctx.strokeStyle = "#4c3b55"; ctx.beginPath(); ctx.arc(-radius * .25, 0, 3, 0, Math.PI); ctx.arc(radius * .25, 0, 3, 0, Math.PI); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(-radius * .25, -1, 2.5, 0, Math.PI * 2); ctx.arc(radius * .25, -1, 2.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = "#ef9cad"; ctx.beginPath(); ctx.arc(-radius * .4, radius * .18, 4, 0, Math.PI * 2); ctx.arc(radius * .4, radius * .18, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#4c3b55"; ctx.lineWidth = 1.5; ctx.beginPath();
  if (mood === "shy") { ctx.moveTo(-3, radius * .24); ctx.quadraticCurveTo(0, radius * .16, 3, radius * .24); }
  else { ctx.arc(0, radius * .16, 5, 0, Math.PI); }
  ctx.stroke(); ctx.restore();
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
function drawStage(ctx: CanvasRenderingContext2D, w: number, h: number, sprites: GenerationSprites, beat: number, selected: number | null, prop: Prop | null, set: SetDesign, frameIndex: number, beam?: Point, clueFound = true, melodyCount = 3) {
  const sx = w / 800, sy = h / 500; ctx.save(); ctx.scale(sx, sy);
  const gradient = ctx.createLinearGradient(0, 0, 0, 500);
  gradient.addColorStop(0, set.sky); gradient.addColorStop(.72, set.hill); gradient.addColorStop(1, "#ead3ad");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 800, 500);
  const moonGlow = ctx.createRadialGradient(585, 145, 8, 585, 145, 365);
  moonGlow.addColorStop(0, "rgba(255,239,197,.28)"); moonGlow.addColorStop(1, "rgba(255,239,197,0)");
  ctx.fillStyle = moonGlow; ctx.fillRect(0, 0, 800, 400);
  ctx.fillStyle = "#fff1c5"; ctx.globalAlpha = .7;
  for (let i = 0; i < 24; i++) { const x = (i * 187 + beat * 83) % 800, y = (i * 107 + 37) % 300; ctx.beginPath(); ctx.arc(x, y, i % 3 === 0 ? 2.5 : 1.2, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255, 248, 232, .24)";
  for (const [x, y, scale] of [[138, 132, 1], [316, 91, .65], [675, 122, .8]] as const) {
    ctx.beginPath(); ctx.ellipse(x, y, 42 * scale, 14 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 19 * scale, y - 7 * scale, 22 * scale, 15 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 20 * scale, y - 10 * scale, 25 * scale, 17 * scale, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = PERSONAS[sprites.familyName].color; ctx.globalAlpha = .16; ctx.beginPath(); ctx.moveTo(367, 0); ctx.lineTo(190, 410); ctx.lineTo(610, 410); ctx.lineTo(437, 0); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255, 237, 187, .16)"; ctx.beginPath(); ctx.moveTo(105, 386); ctx.quadraticCurveTo(227, 315, 360, 386); ctx.quadraticCurveTo(540, 289, 700, 386); ctx.fill();
  const floor = ctx.createLinearGradient(0, 388, 0, 500);
  floor.addColorStop(0, "#7e5364"); floor.addColorStop(1, "#3f2c43");
  ctx.fillStyle = floor; ctx.fillRect(0, 390, 800, 110);
  ctx.fillStyle = "#ddae82"; ctx.fillRect(0, 387, 800, 6);
  ctx.strokeStyle = "rgba(255, 224, 170, .24)"; ctx.lineWidth = 2; for (let x = 0; x < 800; x += 76) { ctx.beginPath(); ctx.moveTo(x, 398); ctx.lineTo(x - 30, 500); ctx.stroke(); }
  const velvet = ctx.createLinearGradient(0, 0, 130, 0);
  velvet.addColorStop(0, "#4c253f"); velvet.addColorStop(.3, set.curtain); velvet.addColorStop(.7, set.curtain); velvet.addColorStop(1, "#552940");
  ctx.fillStyle = velvet; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(101, 55, 28, 296, 113, 388); ctx.lineTo(0, 415); ctx.fill();
  const velvetRight = ctx.createLinearGradient(670, 0, 800, 0);
  velvetRight.addColorStop(0, "#552940"); velvetRight.addColorStop(.35, set.curtain); velvetRight.addColorStop(1, "#4c253f");
  ctx.fillStyle = velvetRight; ctx.beginPath(); ctx.moveTo(800, 0); ctx.bezierCurveTo(699, 55, 772, 296, 687, 388); ctx.lineTo(800, 415); ctx.fill();
  ctx.strokeStyle = "rgba(255,225,173,.35)"; ctx.lineWidth = 2;
  for (const x of [32, 57, 742, 767]) { ctx.beginPath(); ctx.moveTo(x, 32); ctx.bezierCurveTo(x + (x < 400 ? 16 : -16), 180, x - (x < 400 ? 12 : -12), 275, x, 371); ctx.stroke(); }
  ctx.fillStyle = "#552940"; ctx.fillRect(0, 0, 800, 23); ctx.fillRect(0, 0, 22, 390); ctx.fillRect(778, 0, 22, 390);
  ctx.fillStyle = set.curtain; for (let x = 0; x <= 800; x += 50) { ctx.beginPath(); ctx.arc(x + 25, 22, 26, 0, Math.PI); ctx.fill(); }
  ctx.strokeStyle = set.light; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(29, 57); ctx.lineTo(771, 57); ctx.stroke();
  ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,239,197,.55)"; ctx.strokeRect(24, 53, 752, 331);
  ctx.fillStyle = set.light; ctx.font = "600 17px Georgia"; ctx.textAlign = "center"; ctx.fillText("✦   THE LITTLE LOST STAR   ✦", 400, 81);
  for (let x = 105; x <= 695; x += 59) { ctx.fillStyle = "#f5d796"; ctx.shadowColor = "#ffe0a6"; ctx.shadowBlur = 13; ctx.beginPath(); ctx.arc(x, 387, 3, 0, Math.PI * 2); ctx.fill(); } ctx.shadowBlur = 0;
  if (beat === 0) {
    ctx.fillStyle = "#f3d7a3"; rounded(ctx, 520, 245, 110, 140, 12);
    ctx.fillStyle = "#674260"; rounded(ctx, 532, 258, 86, 127, 38);
    ctx.fillStyle = "#ffe69c"; ctx.beginPath(); ctx.arc(569, 288, 5, 0, Math.PI * 2); ctx.fill();
  } else if (beat === 1) {
    ctx.fillStyle = "#f4d6a7"; rounded(ctx, 500, 157, 146, 227, 20);
    ctx.fillStyle = "#785075"; rounded(ctx, 513, 170, 120, 213, 55);
    ctx.strokeStyle = "#fff1c6"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(573, 238, 24, 0, Math.PI * 2); ctx.stroke();
    littleStar(ctx, 573, 238, 18, "sleepy");
  } else if (beat === 2) {
    littleStar(ctx, 595, 337, 25, "sleepy");
    NOTES.forEach((note, i) => {
      ctx.save(); ctx.globalAlpha = i > melodyCount ? .42 : 1;
      ctx.fillStyle = i < melodyCount ? "#bff3d7" : "#fff0ac";
      ctx.shadowColor = "#fff0ac"; ctx.shadowBlur = i === melodyCount ? 28 : 8;
      ctx.beginPath(); ctx.arc(note.x, note.y, 29, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = "#58456e"; ctx.font = "bold 31px Georgia";
      ctx.textAlign = "center"; ctx.fillText(i < melodyCount ? "✓" : "♫", note.x, note.y + 10);
      ctx.font = "bold 12px Arial"; ctx.fillText(String(i + 1), note.x, note.y + 48); ctx.restore();
    });
  } else if (beat === 3) {
    ctx.fillStyle = "rgba(255,244,203,.56)"; ctx.beginPath(); ctx.ellipse(582, 370, 145, 21, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f7e3ba";
    for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(440 + i * 47, 334 - Math.sin(i * Math.PI / 4) * 43); ctx.rotate(.12 - i * .05); rounded(ctx, -22, -8, 44, 18, 4); ctx.restore(); }
    littleStar(ctx, 654, 270, 31, "shy");
  } else {
    const finalePosition = selected === 1 ? { x: 522, y: 223 } : selected === 2 ? { x: 588, y: 215 } : { x: 575, y: 264 };
    littleStar(ctx, finalePosition.x, finalePosition.y, 52, "happy");
    if (beat === 4 && selected !== null) {
      ctx.strokeStyle = "#ffe9ad"; ctx.lineWidth = 3; ctx.setLineDash([6, 8]);
      ctx.beginPath();
      if (selected === 0) { ctx.moveTo(379, 301); ctx.quadraticCurveTo(449, 235, 523, 261); }
      else if (selected === 1) { ctx.arc(522, 223, 91, -.9, 2.3); }
      else { ctx.moveTo(445, 215); ctx.bezierCurveTo(490, 120, 620, 354, 690, 204); }
      ctx.stroke(); ctx.setLineDash([]);
      for (let i = 0; i < 7; i++) littleStar(ctx, 440 + (i * 43) % 245, 130 + (i * 67) % 115, 5 + i % 3, "happy");
    }
  }
  ctx.fillStyle = "#211a35"; ctx.globalAlpha = .4; ctx.beginPath(); ctx.ellipse(316, 389, 125, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  drawFriend(ctx, sprites, 315, 306 + (frameIndex % 2 ? -2 : 0), 160, frameIndex);
  if (prop?.id === "lantern") { ctx.strokeStyle = "#e9c779"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(370, 317); ctx.lineTo(407, 335); ctx.stroke(); ctx.fillStyle = "#ffe99c"; ctx.shadowColor = "#ffdf8b"; ctx.shadowBlur = 25; rounded(ctx, 395, 316, 30, 38, 7); ctx.shadowBlur = 0; }
  if (prop?.id === "key") { ctx.strokeStyle = "#e8cf80"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(414, 307, 11, 0, Math.PI * 2); ctx.moveTo(414, 318); ctx.lineTo(414, 350); ctx.lineTo(427, 350); ctx.stroke(); }
  if (prop?.id === "confetti") { ctx.fillStyle = "#ffc1d4"; for (let i = 0; i < 24; i++) { const x = 125 + (i * 73) % 575, y = 98 + (i * 59) % 265; ctx.save(); ctx.translate(x, y); ctx.rotate(i); ctx.fillRect(0, 0, 9, 4); ctx.restore(); } }
  if (beat === 0 && clueFound) {
    ctx.strokeStyle = "rgba(255, 227, 137, .72)"; ctx.lineWidth = 3; ctx.setLineDash([3, 11]);
    ctx.beginPath(); ctx.moveTo(378, 331); ctx.bezierCurveTo(462, 294, 505, 237, STAR.x, STAR.y); ctx.stroke(); ctx.setLineDash([]);
    littleStar(ctx, STAR.x, STAR.y, 25, "shy");
  }
  ctx.fillStyle = "#513b5a";
  for (const x of [46, 112, 688, 752]) { ctx.beginPath(); ctx.arc(x, 493, 26, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.ellipse(x - 11, 466, 7, 19, -.22, 0, Math.PI * 2); ctx.ellipse(x + 11, 466, 7, 19, .22, 0, Math.PI * 2); ctx.fill(); }
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
    ctx.fillStyle = "rgba(5, 7, 20, .55)";
    ctx.beginPath(); ctx.rect(0, 0, 800, 500); ctx.moveTo(beam.x + 105, beam.y);
    ctx.arc(beam.x, beam.y, 105, 0, Math.PI * 2, true); ctx.fill("evenodd");
    const glow = ctx.createRadialGradient(beam.x, beam.y, 5, beam.x, beam.y, 105);
    glow.addColorStop(0, "rgba(255, 235, 160, .20)"); glow.addColorStop(1, "rgba(255, 235, 160, 0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(beam.x, beam.y, 105, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255, 232, 166, .75)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(beam.x, beam.y, 105, 0, Math.PI * 2); ctx.stroke();
    if (Math.hypot(beam.x - STAR.x, beam.y - STAR.y) < 105) {
      littleStar(ctx, STAR.x, STAR.y, 25, "shy");
    }
  }
  ctx.restore();
}

function renderComic(sprites: GenerationSprites, choices: readonly number[], prop: Prop | null, set: SetDesign, friendId: bigint) {
  const canvas = document.createElement("canvas"); canvas.width = 1200; canvas.height = 130 + BEATS.length * 730 + 145;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas export is unavailable.");
  ctx.fillStyle = "#f4e9d1"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#302541"; ctx.textAlign = "left"; ctx.font = "bold 50px Georgia"; ctx.fillText("RARE FRIEND THEATER", 64, 78);
  ctx.font = "20px Arial"; ctx.fillText(`${FINALE_TITLES[choices[4]]} · ${PERSONAS[sprites.familyName].role} · Friend #${friendId}`, 66, 111, 1070);
  for (let i = 0; i < BEATS.length; i++) {
    ctx.fillStyle = "#302541"; ctx.font = "bold 18px Arial"; ctx.fillText(`${BEATS[i].eyebrow}  /  ${BEATS[i].choices[choices[i]].label}`, 65, 157 + i * 730, 1070);
    ctx.save(); ctx.translate(64, 171 + i * 730); drawStage(ctx, 1072, 670, sprites, i, choices[i], prop, set, 0); ctx.restore();
  }
  ctx.fillStyle = "#302541"; ctx.font = "italic 24px Georgia";
  const ending = choices.map((choice, i) => BEATS[i].choices[choice].ending);
  ctx.fillText(`Friend #${friendId} ${ending.slice(0, 2).join(", ")},`, 65, canvas.height - 75, 1070);
  ctx.fillText(`${ending.slice(2, 4).join(", ")}, and ${ending[4]}.`, 65, canvas.height - 42, 1070);
  return canvas.toDataURL("image/png");
}

export default function RareFriendTheater({ friendId, client, paused }: GameComponentProps) {
  const shell = useRef<HTMLElement>(null);
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
  const [design, setDesign] = useState<SetDesign>(SETS[0]);
  const [beam, setBeam] = useState<Point>({ x: 275, y: 260 });
  const [clueFound, setClueFound] = useState(false);
  const [melodyCount, setMelodyCount] = useState(0);
  const currentProp = PROPS.find(p => p.id === equipped) ?? null;
  const complete = finale;
  const persona = sprites ? PERSONAS[sprites.familyName] : null;

  useEffect(() => {
    let active = true; setSprites(null); setLoading(true); setError(""); setBeat(0); setChoices([]); setFinale(false); setComic(null); setBalance(STARTING_RF); setOwned([]); setEquipped(null); setDesign(SETS[0]); setBeam({ x: 275, y: 260 }); setClueFound(false); setMelodyCount(0);
    Promise.all([client.read(), reader.read(friendId)]).then(([snapshot, art]) => {
      if (!active) return;
      if (snapshot.friendId !== friendId) throw new Error("The selected Friend changed. Reconnect and retry.");
      setSprites(art); setLoading(false);
    }).catch(cause => { if (active) { setError(cause instanceof Error ? cause.message : "Could not load your Friend."); setLoading(false); } });
    return () => { active = false; };
  }, [client, friendId]);
  useEffect(() => { if (!motion || paused || !sprites) return; const timer = window.setInterval(() => setFrame(v => (v + 1) % 8), 300); return () => window.clearInterval(timer); }, [motion, paused, sprites]);
  useEffect(() => { if ((beat > 0 || finale) && shell.current && shell.current.clientWidth <= 800) shell.current.scrollTo({ top: 0, behavior: motion ? "smooth" : "instant" }); }, [beat, finale, motion]);
  useEffect(() => { const ctx = canvas.current?.getContext("2d"); if (ctx && sprites) drawStage(ctx, 800, 500, sprites, beat, choices[beat] ?? null, currentProp, design, frame, beam, clueFound, melodyCount); }, [sprites, beat, choices, equipped, design, frame, beam, clueFound, melodyCount]);
  function pointAt(event: PointerEvent<HTMLCanvasElement>): Point {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(800, (event.clientX - box.left) * 800 / box.width)), y: Math.max(0, Math.min(500, (event.clientY - box.top) * 500 / box.height)) };
  }
  function aim(event: PointerEvent<HTMLCanvasElement>) { if (!paused && beat === 0 && !clueFound) setBeam(pointAt(event)); }
  function reveal(event: PointerEvent<HTMLCanvasElement>) {
    if (paused) return;
    event.currentTarget.focus();
    if (beat === 2 && melodyCount < NOTES.length) {
      const point = pointAt(event), note = NOTES[melodyCount];
      if (Math.hypot(point.x - note.x, point.y - note.y) < 45) setMelodyCount(melodyCount + 1);
      return;
    }
    if (beat !== 0 || clueFound) return;
    const point = pointAt(event); setBeam(point);
    if (Math.hypot(point.x - STAR.x, point.y - STAR.y) < 105) setClueFound(true);
  }
  function handleStageKey(event: KeyboardEvent<HTMLCanvasElement>) {
    if (!paused && beat === 2 && melodyCount < NOTES.length && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setMelodyCount(melodyCount + 1); return; }
    if (paused || beat !== 0 || clueFound) return;
    const delta: Record<string, Point> = { ArrowLeft: { x: -32, y: 0 }, ArrowRight: { x: 32, y: 0 }, ArrowUp: { x: 0, y: -32 }, ArrowDown: { x: 0, y: 32 } };
    if (delta[event.key]) { event.preventDefault(); const step = delta[event.key]; setBeam(point => ({ x: Math.max(0, Math.min(800, point.x + step.x)), y: Math.max(0, Math.min(500, point.y + step.y)) })); }
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (Math.hypot(beam.x - STAR.x, beam.y - STAR.y) < 105) setClueFound(true); }
  }
  function pick(index: number) { if (paused || complete || choices.length !== beat || (beat === 2 && melodyCount < NOTES.length)) return; setChoices([...choices, index]); }
  function next() { if (paused || choices.length !== beat + 1) return; if (beat < BEATS.length - 1) setBeat(beat + 1); else setFinale(true); }
  function buy(prop: Prop) { if (paused || balance < COST || owned.includes(prop.id)) return; setBalance(balance - COST); setOwned([...owned, prop.id]); setEquipped(prop.id); }
  function replay() { if (paused) return; setBeat(0); setChoices([]); setFinale(false); setComic(null); setClueFound(false); setMelodyCount(0); setBeam({ x: 275, y: 260 }); }
  return <main ref={shell} className="rft-shell" aria-label="Rare Friend Theater">
    <div className="rft-top"><div className="rft-brand"><span className="rft-brandmark">✳</span><span>Rare Friend<br/><b>Theater</b></span></div><div className="rft-topright"><span className="rft-sim">Preview mode</span><span>Friend #{friendId.toString()}</span></div></div>
    {loading || error ? <div className="rft-loading" role={error ? "alert" : "status"}><span className="rft-loading-star">✦</span><h1>{error ? "The curtain caught" : "Preparing the stage"}</h1><p>{error || "Loading your verified Friend and their original sprite…"}</p>{error && <button onClick={() => { setLoading(true); setError(""); void Promise.all([client.read(), reader.read(friendId)]).then(([snapshot, art]) => { if (snapshot.friendId !== friendId) throw new Error("The selected Friend changed."); setSprites(art); setLoading(false); }).catch(cause => { setError(cause instanceof Error ? cause.message : "Could not load your Friend."); setLoading(false); }); }} disabled={paused}>Retry</button>}</div> : <div className="rft-content">
      <section className="rft-stage-col"><div className="rft-stage-frame"><div className="rft-stage-header"><span>Tonight's performance</span><span>Act {beat + 1} of {BEATS.length}</span></div><canvas ref={canvas} width={800} height={500} tabIndex={(beat === 0 && !clueFound) || (beat === 2 && melodyCount < NOTES.length) ? 0 : -1} onPointerMove={aim} onPointerDown={reveal} onKeyDown={handleStageKey} className={(beat === 0 && !clueFound) || (beat === 2 && melodyCount < NOTES.length) ? "rft-interactive-stage" : ""} aria-label={beat === 0 && !clueFound ? "Search the stage with the spotlight. Tap near the hidden star, or use arrow keys and Enter." : beat === 2 && melodyCount < NOTES.length ? `Play note ${melodyCount + 1} of ${NOTES.length}. Tap the glowing note or press Enter.` : `Illustrated stage starring your Rare Friend: ${BEATS[beat].title}`} /><div className="rft-stage-footer"><span>{persona?.role} · Friend #{friendId.toString()}</span><span>The Little Lost Star</span></div></div><div className="rft-cast"><span className="rft-cast-icon" style={{ color: persona?.color }}>✦</span><div><strong>{persona?.role}</strong><small>{persona?.note}</small></div><span className="rft-cast-id">#{friendId.toString()}</span></div><div className="rft-below"><span>{beat === 0 && !clueFound ? "Move the spotlight to find the star" : beat === 2 && melodyCount < NOTES.length ? `Play the melody · ${melodyCount}/${NOTES.length}` : "Your story is taking shape"}</span><span className="rft-progress">{BEATS.map((_, i) => <i key={i} className={i <= beat ? "on" : ""} />)}</span><label><input type="checkbox" checked={!motion} onChange={e => setMotion(!e.target.checked)} /> Reduce motion</label></div></section>
      <section className="rft-panel" aria-live="polite"><div className="rft-panel-meta"><span>{complete ? "Final curtain" : BEATS[beat].eyebrow}</span><span>Scene {beat + 1} / {BEATS.length}</span></div><h1>{complete ? FINALE_TITLES[choices[4]] : BEATS[beat].title}</h1><p className="rft-narration">{complete ? `Friend #${friendId} brought the lost star home. ${BEATS[4].choices[choices[4]].line} Every choice became part of tonight's constellation.` : BEATS[beat].narration.replace("Your Friend", persona?.role ?? "Your Friend")}</p>
        {complete ? <div className="rft-final"><p>Five scenes. One very rare star.</p><button className="rft-primary" disabled={paused} onClick={() => { if (!sprites) return; try { setComic(renderComic(sprites, choices, currentProp, design, friendId)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Comic export failed."); } }}>View your comic</button><button className="rft-secondary" disabled={paused} onClick={replay}>Play another version</button></div>
          : beat === 0 && !clueFound ? <div className="rft-search" role="status"><strong>Find the missing clue</strong><p>Move your spotlight across the stage. When the little star appears, tap it. Keyboard: focus the stage, use arrow keys, then press Enter.</p><button type="button" className="rft-secondary" disabled={paused} onClick={() => setClueFound(true)}>Reveal the clue</button></div>
          : beat === 2 && melodyCount < NOTES.length ? <div className="rft-search" role="status"><strong>Play the lost lullaby · {melodyCount}/{NOTES.length}</strong><p>Tap the glowing notes in order. Keyboard: focus the stage and press Enter or Space for each note.</p><button type="button" className="rft-secondary" disabled={paused} onClick={() => setMelodyCount(melodyCount + 1)}>Play next note</button></div>
          : choices.length === beat + 1 ? <div className="rft-chosen"><span>Your Friend chose</span><strong>{BEATS[beat].choices[choices[beat]].label}</strong><p>{BEATS[beat].choices[choices[beat]].line}</p><button className="rft-primary" disabled={paused} onClick={next}>{beat === BEATS.length - 1 ? "See the ending" : "Next act"}</button></div>
          : <div className="rft-choices">{BEATS[beat].choices.map((choice, i) => <button key={choice.label} disabled={paused} onClick={() => pick(i)}><span className="rft-choice-no">0{i + 1}</span><span>{choice.label}</span><span className="rft-choice-arrow">↗</span></button>)}</div>}
        {choices.length > 0 && <div className="rft-story-trail" aria-label="Your story so far"><span>YOUR STORY SO FAR</span><ol>{choices.map((choice, i) => <li key={i}><b>{i + 1}</b>{BEATS[i].choices[choice].label}</li>)}</ol></div>}
        <div className="rft-set-design"><div className="rft-set-heading"><strong>Paint the backdrop</strong><small>The color stays with your comic.</small></div><div className="rft-set-list">{SETS.map(set => <button key={set.id} type="button" aria-pressed={design.id === set.id} disabled={paused} onClick={() => setDesign(set)}><i style={{ background: set.sky, borderColor: set.curtain }} />{set.name}</button>)}</div></div>
        <div className="rft-props"><div className="rft-props-head"><div><span>Backstage prop box</span><small>Dress the scene. Props appear in your comic.</small></div><b>{balance} <small>RF preview</small></b></div><div className="rft-prop-list">{PROPS.map(prop => <button key={prop.id} className={equipped === prop.id ? "rft-prop equipped" : "rft-prop"} disabled={paused || (!owned.includes(prop.id) && balance < COST)} onClick={() => owned.includes(prop.id) ? setEquipped(prop.id) : buy(prop)}><span className="rft-prop-icon" style={{ color: prop.color }}>{prop.icon}</span><span><strong>{prop.name}</strong><small>{prop.description}</small></span><em>{equipped === prop.id ? "On" : owned.includes(prop.id) ? "Use" : `${COST} RF`}</em></button>)}</div><p className="rft-disclaimer">Preview RF and props exist only for this session. No wallet transaction or real token spend.</p></div>
      </section>
    </div>}
    {comic && <div className="rft-comic-overlay" role="dialog" aria-modal="true" aria-label="Your finished comic"><div className="rft-comic-head"><span>YOUR RARE FRIEND COMIC</span><button type="button" onClick={() => setComic(null)}>Close ×</button></div><p>Right-click or long-press the image to save it.</p><img src={comic} alt={`Five-panel comic starring Rare Friend #${friendId}`} /></div>}
  </main>;
}
