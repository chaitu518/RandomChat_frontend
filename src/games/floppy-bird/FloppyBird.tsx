import React, { useEffect, useRef, useState, useCallback } from 'react';
import './FloppyBird.css';

// ─── Game constants ─────────────────────────────────────────────────────────
const W            = 400;
const H            = 580;
const GROUND_Y     = H - 52;
const GRAVITY      = 0.42;
const FLAP_FORCE   = -8.8;
const GATE_WIDTH   = 56;
const GATE_GAP     = 160;
const GATE_SPEED   = 2.6;
const GATE_EVERY   = 1700; // ms
const BIRD_X       = 88;
const BIRD_R       = 17;

type Phase = 'idle' | 'playing' | 'dead';

interface Gate { x: number; topH: number; passed: boolean; }
interface Star  { x: number; y: number; r: number; spd: number; a: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; }

// ─── Canvas drawing helpers ──────────────────────────────────────────────────

function drawSky(ctx: CanvasRenderingContext2D, stars: Star[], scroll: number) {
  // Deep space background
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0,   '#06020f');
  sky.addColorStop(0.6, '#0d0825');
  sky.addColorStop(1,   '#120a30');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Stars with parallax
  for (const s of stars) {
    const sx = ((s.x - scroll * s.spd) % W + W) % W;
    ctx.beginPath();
    ctx.arc(sx, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.a})`;
    ctx.fill();
  }
}

function drawGround(ctx: CanvasRenderingContext2D, scroll: number) {
  // Ground fill
  const g = ctx.createLinearGradient(0, GROUND_Y, 0, H);
  g.addColorStop(0, '#1c0b45');
  g.addColorStop(1, '#080314');
  ctx.fillStyle = g;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  // Scrolling circuit-board pattern on ground
  ctx.strokeStyle = 'rgba(124,58,237,0.25)';
  ctx.lineWidth = 1;
  const seg = 40;
  const offset = scroll % seg;
  for (let x = -seg + offset; x < W + seg; x += seg) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 16);
    ctx.lineTo(x + 20, GROUND_Y + 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 20, GROUND_Y + 20, 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Neon glow line
  ctx.save();
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#7c3aed';
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(W, GROUND_Y);
  ctx.stroke();
  ctx.restore();
}

function drawGate(ctx: CanvasRenderingContext2D, gate: Gate) {
  const { x, topH } = gate;
  const botY = topH + GATE_GAP;
  const botH = GROUND_Y - botY;

  const drawColumn = (cy: number, ch: number, capBottom: boolean) => {
    // Column body
    const col = ctx.createLinearGradient(x, cy, x + GATE_WIDTH, cy);
    col.addColorStop(0,   '#1e0845');
    col.addColorStop(0.35,'#4c1d96');
    col.addColorStop(1,   '#6d28d9');
    ctx.fillStyle = col;
    ctx.beginPath();
    if (capBottom) {
      (ctx as any).roundRect(x, cy, GATE_WIDTH, ch, [10, 10, 0, 0]);
    } else {
      (ctx as any).roundRect(x, cy, GATE_WIDTH, ch, [0, 0, 10, 10]);
    }
    ctx.fill();

    // Highlight strip
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x + 8, cy, 10, ch);

    // Cap
    const capY = capBottom ? cy - 18 : cy + ch;
    const capR: [number, number, number, number] = capBottom
      ? [8, 8, 0, 0]
      : [0, 0, 8, 8];
    const capCol = ctx.createLinearGradient(x - 6, capY, x + GATE_WIDTH + 12, capY);
    capCol.addColorStop(0,   '#5b21b6');
    capCol.addColorStop(0.5, '#7c3aed');
    capCol.addColorStop(1,   '#a78bfa');
    ctx.fillStyle = capCol;
    ctx.beginPath();
    (ctx as any).roundRect(x - 8, capY, GATE_WIDTH + 16, 18, capR);
    ctx.fill();

    // Cap neon border
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#a78bfa';
    ctx.strokeStyle = '#c4b5fd';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    (ctx as any).roundRect(x - 8, capY, GATE_WIDTH + 16, 18, capR);
    ctx.stroke();
    ctx.restore();
  };

  drawColumn(0, topH, false);
  drawColumn(botY, botH, true);

  // Portal energy glow in gap
  const glow = ctx.createLinearGradient(x, topH, x, botY);
  glow.addColorStop(0,   'rgba(139,92,246,0.3)');
  glow.addColorStop(0.5, 'rgba(139,92,246,0)');
  glow.addColorStop(1,   'rgba(139,92,246,0.3)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, topH, GATE_WIDTH, GATE_GAP);

  // Horizontal energy beams in gap
  ctx.save();
  ctx.shadowBlur = 6;
  ctx.shadowColor = '#7c3aed';
  ctx.strokeStyle = 'rgba(167,139,250,0.55)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  const mid = topH + GATE_GAP / 2;
  ctx.beginPath();
  ctx.moveTo(x, mid - 12);
  ctx.lineTo(x + GATE_WIDTH, mid - 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, mid + 12);
  ctx.lineTo(x + GATE_WIDTH, mid + 12);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawBird(
  ctx: CanvasRenderingContext2D,
  y: number,
  vel: number,
  tick: number,
  isDead: boolean,
) {
  const tilt = Math.min(Math.max(vel * 0.052, -0.45), 1.0);
  const wingBeat = Math.sin(tick * 0.22) * 6;

  ctx.save();
  ctx.translate(BIRD_X, y);
  ctx.rotate(isDead ? 0.4 : tilt);

  // Outer glow aura
  const aura = ctx.createRadialGradient(0, 0, BIRD_R, 0, 0, BIRD_R + 14);
  aura.addColorStop(0, isDead ? 'rgba(239,68,68,0.3)' : 'rgba(139,92,246,0.4)');
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(0, 0, BIRD_R + 14, 0, Math.PI * 2);
  ctx.fillStyle = aura;
  ctx.fill();

  // Wing (back)
  ctx.save();
  ctx.rotate(-0.2);
  ctx.beginPath();
  ctx.ellipse(-5, wingBeat * 0.8, 14, 6, -0.35, 0, Math.PI * 2);
  ctx.fillStyle = isDead ? 'rgba(252,165,165,0.6)' : 'rgba(196,181,253,0.65)';
  ctx.fill();
  ctx.restore();

  // Body
  const bodyG = ctx.createRadialGradient(-5, -5, 2, 0, 0, BIRD_R);
  bodyG.addColorStop(0,   isDead ? '#fca5a5' : '#ddd6fe');
  bodyG.addColorStop(0.45, isDead ? '#ef4444' : '#8b5cf6');
  bodyG.addColorStop(1,   isDead ? '#7f1d1d' : '#3b0764');
  ctx.beginPath();
  ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2);
  ctx.fillStyle = bodyG;
  ctx.fill();

  // Wing (front)
  ctx.save();
  ctx.rotate(-0.15);
  ctx.beginPath();
  ctx.ellipse(-4, wingBeat, 11, 5, -0.25, 0, Math.PI * 2);
  ctx.fillStyle = isDead ? 'rgba(254,202,202,0.55)' : 'rgba(221,214,254,0.6)';
  ctx.fill();
  ctx.restore();

  // Eye white
  ctx.beginPath();
  ctx.arc(7, -5, 5.5, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  // Pupil
  ctx.beginPath();
  ctx.arc(8, -4, isDead ? 2 : 2.8, 0, Math.PI * 2);
  ctx.fillStyle = '#1e0333';
  ctx.fill();

  // Eye shine
  ctx.beginPath();
  ctx.arc(9.5, -5.5, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  // X eyes when dead
  if (isDead) {
    ctx.strokeStyle = '#1e0333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(5, -7); ctx.lineTo(9, -3);
    ctx.moveTo(9, -7); ctx.lineTo(5, -3);
    ctx.stroke();
  }

  // Beak
  ctx.beginPath();
  ctx.moveTo(13, -2);
  ctx.lineTo(22, 1);
  ctx.lineTo(13, 5);
  ctx.closePath();
  ctx.fillStyle = isDead ? '#fb923c' : '#fbbf24';
  ctx.fill();

  ctx.restore();
}

function drawScore(ctx: CanvasRenderingContext2D, score: number) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 700 44px "Segoe UI", system-ui, sans-serif';
  // Shadow
  ctx.shadowBlur = 20;
  ctx.shadowColor = 'rgba(139,92,246,0.9)';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(score), W / 2, 70);
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  }
}

// ─── Main component ──────────────────────────────────────────────────────────
interface FloppyBirdProps { onBack: () => void; }

const FloppyBird: React.FC<FloppyBirdProps> = ({ onBack }) => {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const stageRef    = useRef<HTMLDivElement>(null);
  const phaseRef    = useRef<Phase>('idle');
  const birdYRef    = useRef(H / 2);
  const birdVelRef  = useRef(0);
  const gatesRef    = useRef<Gate[]>([]);
  const scoreRef    = useRef(0);
  const tickRef     = useRef(0);
  const scrollRef   = useRef(0);
  const starsRef    = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastGateRef = useRef(0);
  const rafRef      = useRef(0);
  const bestRef     = useRef(0);
  const lastTouchRef = useRef(0);

  const [ui, setUi] = useState<{ phase: Phase; score: number; best: number }>({
    phase: 'idle', score: 0, best: 0,
  });

  // Build star field once
  useEffect(() => {
    starsRef.current = Array.from({ length: 90 }, () => ({
      x:   Math.random() * W,
      y:   Math.random() * GROUND_Y,
      r:   Math.random() * 1.6 + 0.2,
      spd: Math.random() * 0.5 + 0.05,
      a:   Math.random() * 0.75 + 0.15,
    }));
  }, []);

  const spawnParticles = useCallback((x: number, y: number) => {
    const colors = ['#a78bfa', '#c4b5fd', '#fbbf24', '#f9a8d4', '#7c3aed'];
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }, []);

  const reset = useCallback(() => {
    birdYRef.current   = H / 2;
    birdVelRef.current = 0;
    gatesRef.current   = [];
    scoreRef.current   = 0;
    tickRef.current    = 0;
    lastGateRef.current = 0;
    particlesRef.current = [];
  }, []);

  const flap = useCallback(() => {
    if (phaseRef.current === 'idle') {
      phaseRef.current = 'playing';
      lastGateRef.current = performance.now();
      setUi(u => ({ ...u, phase: 'playing' }));
    }
    if (phaseRef.current === 'playing') {
      birdVelRef.current = FLAP_FORCE;
    }
    if (phaseRef.current === 'dead') {
      reset();
      phaseRef.current = 'idle';
      setUi(u => ({ ...u, phase: 'idle', score: 0 }));
    }
  }, [reset]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flap]);

  // Keep a stable ref to flap so touch listeners never need to re-register.
  // This avoids any gap between removeEventListener / addEventListener
  // where a quick tap could be silently dropped.
  const flapRef = useRef(flap);
  useEffect(() => { flapRef.current = flap; }, [flap]);

  // Native touch handling — must be passive:false to call preventDefault.
  // React 17+ delegates all events to the root, so JSX onTouchStart is
  // always passive and cannot block scroll/bounce.
  //
  //  touchstart — flap + record time to suppress ghost click
  //  touchmove  — preventDefault stops Android Chrome pull-to-refresh
  //  touchend   — preventDefault stops iOS Safari's 300 ms ghost click
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      lastTouchRef.current = Date.now();
      flapRef.current();
    };
    const onTouchMove  = (e: TouchEvent) => { e.preventDefault(); };
    const onTouchEnd   = (e: TouchEvent) => { e.preventDefault(); };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd,   { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, []); // empty — flapRef keeps it current without re-registering

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;

    const loop = (now: number) => {
      tickRef.current++;
      scrollRef.current += 0.55;

      const phase = phaseRef.current;

      if (phase === 'playing') {
        // Spawn gates
        if (now - lastGateRef.current > GATE_EVERY) {
          const minH = 55;
          const maxH = GROUND_Y - GATE_GAP - 55;
          gatesRef.current.push({
            x:     W + 10,
            topH:  Math.floor(Math.random() * (maxH - minH) + minH),
            passed: false,
          });
          lastGateRef.current = now;
        }

        // Physics
        birdVelRef.current += GRAVITY;
        birdYRef.current   += birdVelRef.current;

        // Move gates
        for (const g of gatesRef.current) g.x -= GATE_SPEED;
        gatesRef.current = gatesRef.current.filter(g => g.x > -GATE_WIDTH - 20);

        // Update particles
        particlesRef.current = particlesRef.current
          .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.12, life: p.life - 0.035 }))
          .filter(p => p.life > 0);

        // Collision & score
        let crashed = false;

        if (birdYRef.current + BIRD_R >= GROUND_Y || birdYRef.current - BIRD_R <= 0) {
          crashed = true;
        }

        for (const g of gatesRef.current) {
          if (!g.passed && g.x + GATE_WIDTH < BIRD_X - BIRD_R) {
            g.passed = true;
            scoreRef.current++;
            setUi(u => ({ ...u, score: scoreRef.current }));
          }
          const hit = BIRD_R - 4;
          if (BIRD_X + hit > g.x + 5 && BIRD_X - hit < g.x + GATE_WIDTH - 5) {
            if (birdYRef.current - hit < g.topH || birdYRef.current + hit > g.topH + GATE_GAP) {
              crashed = true;
            }
          }
        }

        if (crashed) {
          spawnParticles(BIRD_X, birdYRef.current);
          phaseRef.current = 'dead';
          const best = Math.max(bestRef.current, scoreRef.current);
          bestRef.current = best;
          setUi({ phase: 'dead', score: scoreRef.current, best });
        }
      }

      // Idle: gentle bob
      if (phase === 'idle') {
        birdYRef.current = H / 2 + Math.sin(tickRef.current * 0.045) * 14;
      }

      // Dead: clamp to ground
      if (phase === 'dead') {
        birdVelRef.current += GRAVITY;
        birdYRef.current = Math.min(birdYRef.current + birdVelRef.current, GROUND_Y - BIRD_R);
        particlesRef.current = particlesRef.current
          .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.12, life: p.life - 0.035 }))
          .filter(p => p.life > 0);
      }

      // ── Render ───────────────────────────────────────────────────────────
      drawSky(ctx, starsRef.current, scrollRef.current);
      for (const g of gatesRef.current) drawGate(ctx, g);
      drawParticles(ctx, particlesRef.current);
      drawGround(ctx, scrollRef.current);
      drawBird(ctx, birdYRef.current, birdVelRef.current, tickRef.current, phase === 'dead');
      if (phase === 'playing' || phase === 'dead') drawScore(ctx, scoreRef.current);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [spawnParticles]);

  return (
    <div className="fb-wrap">
      {/* Header */}
      <div className="fb-header">
        <button className="fb-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
          </svg>
          Game Zone
        </button>
        <div className="fb-title-row">
          <span className="fb-title">Floppy Bird</span>
          <span className="fb-badge">Original</span>
        </div>
        <div className="fb-best">🏆 {ui.best}</div>
      </div>

      {/* Canvas + overlays */}
      <div
        ref={stageRef}
        className="fb-stage"
        onClick={() => {
          // Suppress ghost click fired by browser ~300ms after a touch event
          if (Date.now() - lastTouchRef.current < 500) return;
          flap();
        }}
      >
        <canvas ref={canvasRef} width={W} height={H} className="fb-canvas" />

        {ui.phase === 'idle' && (
          <div className="fb-overlay">
            <div className="fb-splash-icon">🪽</div>
            <h2 className="fb-overlay-title">Floppy Bird</h2>
            <p className="fb-overlay-sub">Dodge the neon gates, beat your score.</p>
            <div className="fb-tap-pill">Tap / Space to flap</div>
          </div>
        )}

        {ui.phase === 'dead' && (
          <div className="fb-overlay">
            <div className="fb-splash-icon">💫</div>
            <h2 className="fb-overlay-title">Crashed!</h2>
            <div className="fb-scoreboard">
              <div className="fb-sb-row">
                <span className="fb-sb-label">Score</span>
                <span className="fb-sb-val">{ui.score}</span>
              </div>
              <div className="fb-sb-divider" />
              <div className="fb-sb-row">
                <span className="fb-sb-label">Best</span>
                <span className="fb-sb-val fb-sb-gold">{ui.best}</span>
              </div>
            </div>
            <div className="fb-tap-pill">Tap to retry</div>
          </div>
        )}
      </div>

      <p className="fb-hint">Space · ↑ arrow · Tap to flap</p>
    </div>
  );
};

export default FloppyBird;
