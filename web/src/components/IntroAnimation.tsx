import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Animated restaurant intro shown when the site opens (once per browser session).
 * 0.0–3.3s  medium close-up: two colored stick figures eating, talking and drinking
 * 3.3–8.8s  camera pulls back, revealing the dining room, other tables and guests
 * 8.8–11s   camera exits through the room and reveals the entrance with the green KHANG DIMSUM sign
 * Everything is SVG + CSS keyframes, so it stays crisp and lightweight.
 */

const DURATION_MS = 11500;
export const INTRO_SESSION_KEY = "khang-intro-seen";

interface Pal {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  accent: string;
}

const PAL_RED: Pal = { skin: "#f1c6a0", hair: "#2b2118", shirt: "#b91c1c", pants: "#334155", accent: "#facc15" };
const PAL_JADE: Pal = { skin: "#e9b48a", hair: "#1c1917", shirt: "#15803d", pants: "#1e3a5f", accent: "#fde68a" };
const PAL_GOLD: Pal = { skin: "#f5d0b0", hair: "#3f2a1d", shirt: "#ca8a04", pants: "#44403c", accent: "#fef3c7" };
const PAL_TEAL: Pal = { skin: "#d9a57c", hair: "#111827", shirt: "#0f766e", pants: "#3f3f46", accent: "#99f6e4" };
const PAL_PLUM: Pal = { skin: "#f3c9a5", hair: "#4a1d3d", shirt: "#7e22ce", pants: "#27272a", accent: "#e9d5ff" };
const PAL_SKY: Pal = { skin: "#f0bd98", hair: "#0f172a", shirt: "#0369a1", pants: "#44403c", accent: "#bae6fd" };

type Facing = 1 | -1;

/** Seated figure — back layer (legs, torso, head). Coordinates are local to the head centre. */
function FigureBack({ x, y, f, s = 1, pal, talk = false, delay = 0, animate = true }: {
  x: number; y: number; f: Facing; s?: number; pal: Pal; talk?: boolean; delay?: number; animate?: boolean;
}) {
  const p = (dx: number, dy: number): [number, number] => [x + f * dx * s, y + dy * s];
  const w = (n: number) => n * s;
  const hipA = p(10, 182), kneeA = p(110, 186), ankleA = p(116, 300);
  const hipB = p(18, 192), kneeB = p(120, 198), ankleB = p(126, 302);
  const neck = p(0, 40), chest = p(10, 186);
  const style = { "--dir": f, "--hx": `${x}px`, "--hy": `${y}px`, "--d": `${delay}s` } as CSSProperties;
  const line = (a: [number, number], b: [number, number]) => `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`;

  return (
    <g style={style} className={animate ? "figure-back" : undefined}>
      {/* legs (sitting) */}
      <path d={`${line(hipB, kneeB)} L${ankleB[0]} ${ankleB[1]}`} stroke="#0f172a" strokeWidth={w(26)} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".85" />
      <path d={`${line(hipA, kneeA)} L${ankleA[0]} ${ankleA[1]}`} stroke={pal.pants} strokeWidth={w(28)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <ellipse cx={ankleA[0] + f * 6 * s} cy={ankleA[1] + 6 * s} rx={w(20)} ry={w(9)} fill="#1f2937" />
      <ellipse cx={ankleB[0] + f * 6 * s} cy={ankleB[1] + 6 * s} rx={w(20)} ry={w(9)} fill="#111827" />
      {/* torso */}
      <path d={line(neck, chest)} stroke={pal.shirt} strokeWidth={w(56)} strokeLinecap="round" fill="none" />
      <path d={line(p(-6, 52), p(10, 72))} stroke={pal.accent} strokeWidth={w(4)} strokeLinecap="round" />
      <path d={line(p(6, 80), p(14, 150))} stroke={pal.accent} strokeWidth={w(2)} strokeLinecap="round" opacity=".7" />
      {/* neck */}
      <path d={line([x, y + 28 * s], neck)} stroke={pal.skin} strokeWidth={w(13)} strokeLinecap="round" />
      {/* head */}
      <g className={talk ? "head talk" : "head"} style={style}>
        <circle cx={x} cy={y} r={w(33)} fill={pal.skin} />
        <path
          d={`M${x - w(34)} ${y + w(2)} A${w(34)} ${w(34)} 0 0 1 ${x + w(34)} ${y + w(2)} C${x + f * w(20)} ${y - w(10)} ${x - f * w(6)} ${y - w(14)} ${x - w(34)} ${y + w(2)} Z`}
          fill={pal.hair}
        />
        <path d={`M${x - f * w(4)} ${y - w(20)} q${f * w(18)} ${-w(4)} ${f * w(28)} ${w(8)}`} stroke={pal.hair} strokeWidth={w(7)} strokeLinecap="round" fill="none" opacity=".9" />
        <circle cx={x + f * w(10)} cy={y - w(2)} r={w(3.2)} fill="#1f2937" />
        <circle cx={x + f * w(22)} cy={y - w(2)} r={w(3.2)} fill="#1f2937" />
        <path d={`M${x + f * w(6)} ${y - w(12)} q${f * w(8)} ${-w(4)} ${f * w(14)} 0`} stroke={pal.hair} strokeWidth={w(2)} fill="none" strokeLinecap="round" />
        <circle cx={x + f * w(6)} cy={y + w(12)} r={w(6)} fill="#f87171" opacity=".4" />
        <path className="mouth-smile" d={`M${x + f * w(10)} ${y + w(12)} q${f * w(8)} ${w(8)} ${f * w(16)} ${-w(1)}`} stroke="#7f1d1d" strokeWidth={w(2.6)} strokeLinecap="round" fill="none" />
        <ellipse className="mouth-open" cx={x + f * w(16)} cy={y + w(15)} rx={w(5.5)} ry={w(4.4)} fill="#7f1d1d" />
      </g>
    </g>
  );
}

/** Arms that touch the table. Drawn after the table so they rest on top of it. */
function FigureFront({ x, y, f, pal, eat = false, delay = 0, animate = true }: {
  x: number; y: number; f: Facing; pal: Pal; eat?: boolean; delay?: number; animate?: boolean;
}) {
  const p = (dx: number, dy: number): [number, number] => [x + f * dx, y + dy];
  const sh = p(4, 72), elbowE = p(44, 112), handE = p(40, 26);
  const shR = p(2, 74), elbowR = p(46, 134), handR = p(78, 196);
  const style = {
    "--dir": f, "--sx": `${sh[0]}px`, "--sy": `${sh[1]}px`, "--d": `${delay}s`,
  } as CSSProperties;
  const seg = (a: [number, number], b: [number, number]) => `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`;
  return (
    <g>
      {/* resting arm */}
      <path d={`${seg(shR, elbowR)} L${handR[0]} ${handR[1]}`} stroke={pal.shirt} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx={handR[0]} cy={handR[1]} r={9} fill={pal.skin} />
      {/* eating arm: pivots at the shoulder, reaches to the dishes, then lifts to the mouth */}
      <g className={`${eat ? "arm-eat" : ""} ${animate ? "" : "static"}`} style={style}>
        <path d={`${seg(sh, elbowE)} L${handE[0]} ${handE[1]}`} stroke={pal.shirt} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d={seg(elbowE, handE)} stroke={pal.skin} strokeWidth={11} strokeLinecap="round" fill="none" opacity="0" />
        <circle cx={handE[0]} cy={handE[1]} r={9} fill={pal.skin} />
        <path d={`${seg(handE, [handE[0] + f * 22, handE[1] - 30])}`} stroke="#92400e" strokeWidth={3.4} strokeLinecap="round" />
        <path d={`${seg([handE[0] + f * 4, handE[1] - 2], [handE[0] + f * 27, handE[1] - 36])}`} stroke="#b45309" strokeWidth={3.4} strokeLinecap="round" />
      </g>
    </g>
  );
}

function Steam({ x, y, h = 40, delay = 0 }: { x: number; y: number; h?: number; delay?: number }) {
  return (
    <path
      className="steam"
      style={{ animationDelay: `${delay}s` }}
      d={`M${x} ${y} q-10 ${-h / 4} 0 ${-h / 2} t0 ${-h / 2}`}
      stroke="#ffffff"
      strokeWidth={4}
      strokeLinecap="round"
      fill="none"
    />
  );
}

function Dumpling({ x, y, r = 15, color = "#fffbeb" }: { x: number; y: number; r?: number; color?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={color} stroke="#e7d7b8" strokeWidth={1.5} />
      <path d={`M${x - r * 0.5} ${y - r * 0.6} q${r * 0.4} ${r * 0.4} 0 ${r * 1.1}`} stroke="#e7d7b8" strokeWidth={1.4} fill="none" />
      <path d={`M${x + r * 0.2} ${y - r * 0.6} q${r * 0.4} ${r * 0.4} 0 ${r * 1.1}`} stroke="#e7d7b8" strokeWidth={1.4} fill="none" />
    </g>
  );
}

/** Two-tier bamboo dim-sum steamer standing on the table at (x, baseY). */
function Steamer({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 62} y={y - 46} width={124} height={24} rx={6} fill="#d6a86a" stroke="#a16207" strokeWidth={2} />
      <rect x={x - 54} y={y - 70} width={108} height={24} rx={6} fill="#e7bf7d" stroke="#a16207" strokeWidth={2} />
      <Dumpling x={x - 30} y={y - 58} r={13} />
      <Dumpling x={x} y={y - 58} r={13} color="#fef3c7" />
      <Dumpling x={x + 30} y={y - 58} r={13} />
      <Dumpling x={x - 14} y={y - 34} r={12} color="#fdf2f8" />
      <Dumpling x={x + 16} y={y - 34} r={12} />
      <Steam x={x - 18} y={y - 80} h={46} />
      <Steam x={x + 12} y={y - 84} h={54} delay={0.8} />
    </g>
  );
}

function NoodleBowl({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x - 40} ${y} Q${x} ${y + 56} ${x + 40} ${y} Z`} fill="#b91c1c" stroke="#7f1d1d" strokeWidth={2} />
      <path d={`M${x - 36} ${y + 14} Q${x} ${y + 36} ${x + 36} ${y + 14}`} stroke="#facc15" strokeWidth={3} fill="none" />
      <ellipse cx={x} cy={y} rx={40} ry={9} fill="#fff7ed" stroke="#7f1d1d" strokeWidth={2} />
      <path d={`M${x - 26} ${y - 1} q8 -6 16 0 t16 0 t16 0`} stroke="#fbbf24" strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d={`M${x - 20} ${y + 3} q8 -6 16 0 t16 0`} stroke="#fde68a" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Steam x={x - 8} y={y - 12} h={40} delay={0.3} />
      <Steam x={x + 10} y={y - 14} h={50} delay={1.1} />
    </g>
  );
}

function Plate({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={44} ry={10} fill="#fff7ed" stroke="#b91c1c" strokeWidth={2} />
      {[-22, -8, 6, 20].map((dx, i) => (
        <rect key={i} x={x + dx - 8} y={y - 14 - (i % 2) * 2} width={16} height={11} rx={5} fill="#d97706" stroke="#92400e" strokeWidth={1} />
      ))}
    </g>
  );
}

function TeaCup({ x, y, color = "#fef3c7" }: { x: number; y: number; color?: string }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={14} ry={4} fill="#14532d" />
      <path d={`M${x - 14} ${y} Q${x - 14} ${y + 22} ${x} ${y + 22} Q${x + 14} ${y + 22} ${x + 14} ${y} Z`} fill={color} stroke="#b91c1c" strokeWidth={2} />
      <path d={`M${x - 10} ${y + 10} h20`} stroke="#b91c1c" strokeWidth={2} />
    </g>
  );
}

function Teapot({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x - 26} ${y} Q${x - 30} ${y - 40} ${x} ${y - 42} Q${x + 30} ${y - 40} ${x + 26} ${y} Z`} fill="#15803d" stroke="#14532d" strokeWidth={2} />
      <path d={`M${x + 24} ${y - 26} Q${x + 46} ${y - 40} ${x + 56} ${y - 58}`} stroke="#14532d" strokeWidth={6} strokeLinecap="round" fill="none" />
      <path d={`M${x - 24} ${y - 22} Q${x - 42} ${y - 36} ${x - 44} ${y - 50}`} stroke="#14532d" strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d={`M${x - 12} ${y - 44} q12 -10 24 0`} stroke="#facc15" strokeWidth={3} fill="none" />
      <ellipse cx={x} cy={y} rx={30} ry={6} fill="#166534" />
    </g>
  );
}

/** Main close-up table: wooden top, red runner with gold trim, cream tablecloth edge, wood apron. */
function MainTable() {
  return (
    <g>
      <rect x={370} y={580} width={860} height={150} fill="#78350f" />
      <rect x={370} y={580} width={860} height={10} fill="#92400e" />
      <rect x={360} y={548} width={880} height={36} rx={6} fill="#b91c1c" />
      <rect x={360} y={548} width={880} height={5} fill="#facc15" />
      <rect x={360} y={577} width={880} height={3} fill="#facc15" opacity=".8" />
      {[420, 620, 980, 1180].map((x) => (
        <rect key={x} x={x - 6} y={600} width={12} height={150} fill="#451a03" />
      ))}
      {/* subtle chopstick rests */}
      <rect x={590} y={543} width={40} height={4} rx={2} fill="#a16207" />
      <rect x={972} y={543} width={40} height={4} rx={2} fill="#a16207" />
    </g>
  );
}

/** Small round table with two guests, used in the dining room. */
function GuestTable({ x, y, s, guests }: { x: number; y: number; s: number; guests: [Pal, Pal] }) {
  const w = 230 * s;
  return (
    <g>
      <FigureBack x={x - w * 0.28} y={y - 200 * s} f={1} s={s} pal={guests[0]} animate={false} />
      <FigureBack x={x + w * 0.28} y={y - 200 * s} f={-1} s={s} pal={guests[1]} animate={false} />
      <rect x={x - w / 2} y={y} width={w} height={20 * s} rx={6} fill="#b91c1c" />
      <rect x={x - w / 2} y={y + 20 * s} width={w} height={120 * s} fill="#78350f" />
      <rect x={x - 6 * s} y={y + 140 * s} width={12 * s} height={120 * s} fill="#451a03" />
      <Teapot x={x + 10 * s} y={y - 2} />
    </g>
  );
}

function LanternShape({ x, y, size = 1, sway = 0 }: { x: number; y: number; size?: number; sway?: number }) {
  return (
    <g className="lantern-sway" style={{ "--lx": `${x}px`, "--ly": `${y - 70 * size}px`, "--sway-delay": `${sway}s` } as CSSProperties}>
      <line x1={x} y1={y - 70 * size} x2={x} y2={y - 46 * size} stroke="#facc15" strokeWidth={2} />
      <ellipse cx={x} cy={y} rx={34 * size} ry={42 * size} fill="#b91c1c" />
      <ellipse cx={x} cy={y} rx={34 * size} ry={42 * size} fill="url(#lanternGlow)" />
      {[-18, 0, 18].map((dx) => (
        <path key={dx} d={`M${x + dx * 0.5 * size} ${y - 40 * size} Q${x + dx * size} ${y} ${x + dx * 0.5 * size} ${y + 40 * size}`} stroke="#7f1d1d" strokeWidth={1.4} fill="none" />
      ))}
      <rect x={x - 22 * size} y={y - 46 * size} width={44 * size} height={7 * size} rx={3} fill="#facc15" />
      <rect x={x - 22 * size} y={y + 40 * size} width={44 * size} height={7 * size} rx={3} fill="#facc15" />
      <line x1={x} y1={y + 47 * size} x2={x} y2={y + 66 * size} stroke="#facc15" strokeWidth={2} />
      <circle cx={x} cy={y + 68 * size} r={3 * size} fill="#facc15" />
    </g>
  );
}

function Window({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <path d={`M${x} ${y + h} V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} Z`} fill="#fde68a" stroke="#14532d" strokeWidth={10} />
      <path d={`M${x + w / 2} ${y + w / 2} V${y + h} M${x} ${y + h * 0.6} H${x + w}`} stroke="#14532d" strokeWidth={5} />
      <path d={`M${x} ${y + h} V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} Z`} fill="url(#windowLight)" />
    </g>
  );
}

function Plant({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g>
      <path d={`M${x - 36 * s} ${y} L${x - 28 * s} ${y + 90 * s} H${x + 28 * s} L${x + 36 * s} ${y} Z`} fill="#9a3412" />
      <rect x={x - 40 * s} y={y - 6 * s} width={80 * s} height={12 * s} rx={4} fill="#c2410c" />
      {[-60, -30, 0, 30, 60].map((a, i) => (
        <path
          key={a}
          d={`M${x} ${y} q${a * 0.4 * s} ${-80 * s} ${a * 0.9 * s} ${-(120 + (i % 2) * 30) * s}`}
          stroke="#15803d"
          strokeWidth={6 * s}
          strokeLinecap="round"
          fill="none"
        />
      ))}
      <ellipse cx={x - 30 * s} cy={y - 150 * s} rx={22 * s} ry={8 * s} fill="#22c55e" transform={`rotate(-30 ${x - 30 * s} ${y - 150 * s})`} />
      <ellipse cx={x + 36 * s} cy={y - 130 * s} rx={22 * s} ry={8 * s} fill="#16a34a" transform={`rotate(25 ${x + 36 * s} ${y - 130 * s})`} />
    </g>
  );
}

/** Dining room: lattice wall, arched windows, lanterns, wood floor, guests at other tables. */
function DiningRoom() {
  return (
    <g>
      <rect x={0} y={0} width={1600} height={900} fill="#fdebd0" />
      <rect x={0} y={0} width={1600} height={64} fill="#7c2d12" />
      <rect x={0} y={64} width={1600} height={8} fill="#facc15" />
      <rect x={60} y={96} width={1480} height={300} rx={8} fill="url(#latticeFill)" stroke="#a16207" strokeWidth={4} />
      <rect x={560} y={112} width={480} height={240} rx={6} fill="#fef3c7" stroke="#a16207" strokeWidth={6} />
      <text x={800} y={205} textAnchor="middle" fontSize={64} fill="#b91c1c" className="brush">福</text>
      <text x={800} y={288} textAnchor="middle" fontSize={24} fill="#15803d" letterSpacing={6}>KHANG DIMSUM</text>
      <Window x={110} y={130} w={200} h={250} />
      <Window x={1290} y={130} w={200} h={250} />
      <LanternShape x={420} y={150} sway={0} />
      <LanternShape x={1180} y={150} sway={1} />
      <LanternShape x={260} y={330} size={0.7} sway={0.6} />
      <LanternShape x={1340} y={330} size={0.7} sway={1.4} />
      {/* pendant lights */}
      {[560, 800, 1040].map((x) => (
        <g key={x}>
          <line x1={x} y1={64} x2={x} y2={120} stroke="#78350f" strokeWidth={2} />
          <path d={`M${x - 26} 150 L${x + 26} 150 L${x + 12} 126 L${x - 12} 126 Z`} fill="#facc15" opacity=".8" />
        </g>
      ))}
      {/* floor */}
      <rect x={0} y={640} width={1600} height={260} fill="url(#woodFloor)" />
      {[700, 760, 830].map((y) => (
        <line key={y} x1={0} y1={y} x2={1600} y2={y} stroke="#a16207" strokeWidth={2} opacity=".35" />
      ))}
      {/* other tables and guests */}
      <GuestTable x={290} y={520} s={0.9} guests={[PAL_TEAL, PAL_PLUM]} />
      <GuestTable x={1310} y={520} s={0.9} guests={[PAL_SKY, PAL_GOLD]} />
      <GuestTable x={500} y={420} s={0.55} guests={[PAL_PLUM, PAL_SKY]} />
      <GuestTable x={1100} y={420} s={0.55} guests={[PAL_TEAL, PAL_GOLD]} />
      <Plant x={60} y={700} s={1.1} />
      <Plant x={1540} y={700} s={1.1} />
    </g>
  );
}

/** Two colored stick figures seated opposite each other, eating and talking. */
function Characters() {
  return (
    <g>
      <FigureBack x={520} y={352} f={1} pal={PAL_RED} talk delay={0} />
      <FigureBack x={1080} y={352} f={-1} pal={PAL_JADE} delay={1.2} />
    </g>
  );
}

function CharactersFront() {
  return (
    <g>
      <FigureFront x={520} y={352} f={1} pal={PAL_RED} eat delay={0} />
      <FigureFront x={1080} y={352} f={-1} pal={PAL_JADE} eat delay={1.8} />
    </g>
  );
}

function TableSetting() {
  return (
    <g>
      <Steamer x={800} y={548} />
      <Plate x={650} y={552} />
      <Plate x={950} y={552} />
      <NoodleBowl x={1000} y={556} />
      <TeaCup x={700} y={556} />
      <TeaCup x={900} y={556} color="#fff7ed" />
      <Teapot x={770} y={548} />
    </g>
  );
}

/** Restaurant entrance: pagoda roof, green-trimmed sign, lit door and windows, lanterns, bamboo. */
function Entrance() {
  return (
    <g>
      <defs>
        <linearGradient id="skyDusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.6" stopColor="#fef3c7" />
          <stop offset="1" stopColor="#fff7ed" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1600} height={900} fill="url(#skyDusk)" />
      {/* neighbouring buildings */}
      <rect x={0} y={330} width={300} height={420} fill="#e7d3b0" />
      <rect x={1300} y={330} width={300} height={420} fill="#e7d3b0" />
      <rect x={40} y={420} width={60} height={60} fill="#d6b98c" />
      <rect x={1500} y={400} width={70} height={70} fill="#d6b98c" />
      {/* main facade */}
      <rect x={330} y={260} width={940} height={460} fill="#fff1dc" />
      <rect x={330} y={700} width={940} height={20} fill="#a8a29e" />
      <rect x={330} y={260} width={940} height={14} fill="#facc15" />
      <rect x={330} y={330} width={36} height={390} fill="#b91c1c" />
      <rect x={1234} y={330} width={36} height={390} fill="#b91c1c" />
      <rect x={326} y={322} width={44} height={14} fill="#facc15" />
      <rect x={1230} y={322} width={44} height={14} fill="#facc15" />
      {/* pagoda roof */}
      <path d="M270 262 Q800 150 1330 262 L1330 282 Q800 186 270 282 Z" fill="#292524" />
      <path d="M270 262 Q300 228 340 230 Q316 248 330 262 Z" fill="#292524" />
      <path d="M1330 262 Q1300 228 1260 230 Q1284 248 1270 262 Z" fill="#292524" />
      {[...Array(9)].map((_, i) => (
        <path key={i} d={`M${300 + i * 110} ${252 - i * 0} q8 -10 18 0`} stroke="#57534e" strokeWidth={3} fill="none" />
      ))}
      {/* sign: cream board, green ribbons, green name */}
      <g className="entrance-sign">
        <rect x={420} y={318} width={760} height={150} rx={18} fill="#fffbeb" stroke="#facc15" strokeWidth={10} />
        <rect x={420} y={318} width={760} height={26} rx={10} fill="#15803d" />
        <rect x={420} y={442} width={760} height={26} rx={10} fill="#15803d" />
        <text x={800} y={398} textAnchor="middle" fontSize={72} textLength={640} lengthAdjust="spacingAndGlyphs" fontFamily="'Ma Shan Zheng','Noto Serif SC',serif" fill="#15803d" fontWeight={700}>KHANG DIMSUM</text>
        <text x={800} y={436} textAnchor="middle" fontSize={26} fill="#b91c1c" letterSpacing={9} fontWeight={700} fontFamily="Inter, Arial, sans-serif">CHINESE RESTAURANT</text>
      </g>
      {/* windows */}
      <rect x={430} y={500} width={230} height={170} rx={10} fill="#fde68a" stroke="#14532d" strokeWidth={8} />
      <rect x={940} y={500} width={230} height={170} rx={10} fill="#fde68a" stroke="#14532d" strokeWidth={8} />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${430 + i * 77 + 38} 508 V662 M${940 + i * 77 + 38} 508 V662`} stroke="#14532d" strokeWidth={4} opacity=".6" />
      ))}
      <path d="M430 586 H660 M940 586 H1170" stroke="#14532d" strokeWidth={4} opacity=".6" />
      {/* entrance door */}
      <rect x={700} y={480} width={200} height={220} rx={8} fill="#7f1d1d" />
      <rect x={714} y={494} width={172} height={206} fill="url(#doorGlow)" />
      <path d="M800 494 V700 M714 600 H886" stroke="#7f1d1d" strokeWidth={6} />
      <circle cx={790} cy={600} r={5} fill="#facc15" />
      <circle cx={810} cy={600} r={5} fill="#facc15" />
      <rect x={680} y={700} width={240} height={14} fill="#d6d3d1" />
      {/* lanterns */}
      <LanternShape x={380} y={300} size={1.1} sway={0.4} />
      <LanternShape x={1220} y={300} size={1.1} sway={1.1} />
      {/* bamboo planters */}
      <Plant x={300} y={770} s={1.6} />
      <Plant x={1300} y={770} s={1.6} />
      {/* sidewalk */}
      <rect x={0} y={714} width={1600} height={186} fill="#d6d3d1" />
      {[300, 700, 1100, 1500].map((x) => (
        <line key={x} x1={x} y1={714} x2={x - 60} y2={900} stroke="#a8a29e" strokeWidth={2} />
      ))}
    </g>
  );
}

function Defs() {
  return (
    <defs>
      <pattern id="latticeFill" width="60" height="60" patternUnits="userSpaceOnUse">
        <rect width="60" height="60" fill="#fde9c9" />
        <path d="M0 0 H60 M0 30 H60 M0 0 V60 M30 0 V60" stroke="#a16207" strokeWidth={3} />
        <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="none" stroke="#b91c1c" strokeWidth={2} opacity=".5" />
      </pattern>
      <linearGradient id="woodFloor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d89f6a" />
        <stop offset="1" stopColor="#a16207" />
      </linearGradient>
      <radialGradient id="lanternGlow" cx="35%" cy="30%" r="70%">
        <stop offset="0" stopColor="#fecaca" stopOpacity=".9" />
        <stop offset="1" stopColor="#7f1d1d" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="windowLight" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fef9c3" stopOpacity=".9" />
        <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="doorGlow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fde68a" />
        <stop offset="1" stopColor="#f59e0b" />
      </linearGradient>
    </defs>
  );
}

export function IntroAnimation({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  const finish = useCallback(() => {
    setLeaving(true);
    window.setTimeout(onDone, 650);
  }, [onDone]);

  useEffect(() => {
    const t = window.setTimeout(finish, DURATION_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [finish]);

  return (
    <div className={`intro ${leaving ? "is-leaving" : ""}`} role="dialog" aria-label="Welcome to Khang Dimsum">
      <svg className="intro-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <Defs />
        <g className="intro-interior">
          <DiningRoom />
          <Characters />
          <MainTable />
          <TableSetting />
          <CharactersFront />
        </g>
        <g className="intro-exterior">
          <Entrance />
        </g>
      </svg>

      <div className="intro-caption caption-1">Good food, good company</div>
      <div className="intro-caption caption-2">Come in, the dim sum is hot</div>
      <div className="intro-caption caption-3">Welcome to Khang Dimsum</div>

      <button className="intro-skip" onClick={finish}>Skip intro</button>
      <div className="intro-progress" aria-hidden="true"><span /></div>
    </div>
  );
}

/** Wrap-up helper: only shown once per browser session. */
export function IntroGate({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    return !reduced && !sessionStorage.getItem(INTRO_SESSION_KEY);
  });
  const done = useCallback(() => {
    sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    setShow(false);
  }, []);
  return (
    <>
      {show && <IntroAnimation onDone={done} />}
      {children}
    </>
  );
}
