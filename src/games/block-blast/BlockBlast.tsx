import React, { useEffect, useRef, useState, useCallback } from 'react';
import './BlockBlast.css';

// ─── Board dimensions ───────────────────────────────────────────────────────
const COLS = 10;
const ROWS = 20;
const CELL = 28;           // px per cell
const W = COLS * CELL;     // 280
const H = ROWS * CELL;     // 560
const PREVIEW_CELLS = 4;
const PREVIEW_SIZE = PREVIEW_CELLS * CELL; // 112

// ─── Speeds (ms per drop tick) ──────────────────────────────────────────────
const BASE_SPEED = 800;
const MIN_SPEED = 80;
const SPEED_DECREASE = 40;     // faster per level

// ─── Scoring ────────────────────────────────────────────────────────────────
const LINE_POINTS = [0, 100, 300, 500, 800]; // 0,1,2,3,4 lines

// ─── Tetromino definitions ──────────────────────────────────────────────────
type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

const SHAPES: Record<TetrominoType, number[][][]> = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  ],
  O: [
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]],
  ],
  T: [
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]],
  ],
  S: [
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]],
    [[0,0,0],[0,1,1],[1,1,0]],
    [[1,0,0],[1,1,0],[0,1,0]],
  ],
  Z: [
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,0],[0,1,1]],
    [[0,1,0],[1,1,0],[1,0,0]],
  ],
  J: [
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]],
  ],
  L: [
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]],
  ],
};

const TETRO_COLORS: Record<TetrominoType, string> = {
  I: '#00f2fe',
  O: '#fbbf24',
  T: '#a78bfa',
  S: '#4ade80',
  Z: '#f87171',
  J: '#4facfe',
  L: '#fb923c',
};

const TETRO_GLOW: Record<TetrominoType, string> = {
  I: 'rgba(0,242,254,0.5)',
  O: 'rgba(251,191,36,0.5)',
  T: 'rgba(167,139,250,0.5)',
  S: 'rgba(74,222,128,0.5)',
  Z: 'rgba(248,113,113,0.5)',
  J: 'rgba(79,172,254,0.5)',
  L: 'rgba(251,146,60,0.5)',
};

const TETRO_TYPES: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

type Phase = 'idle' | 'playing' | 'paused' | 'dead';

interface Piece {
  type: TetrominoType;
  rotation: number; // 0-3
  x: number;        // column offset (can be negative)
  y: number;        // row offset (can be negative for spawning above board)
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function randomBag(): TetrominoType[] {
  const bag = [...TETRO_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function getShape(piece: Piece): number[][] {
  return SHAPES[piece.type][piece.rotation];
}

function collides(board: (TetrominoType | null)[][], piece: Piece): boolean {
  const shape = getShape(piece);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nr = piece.y + r;
      const nc = piece.x + c;
      if (nc < 0 || nc >= COLS || nr >= ROWS) return true;
      if (nr >= 0 && board[nr][nc] !== null) return true;
    }
  }
  return false;
}

function getDropSpeed(level: number): number {
  return Math.max(MIN_SPEED, BASE_SPEED - level * SPEED_DECREASE);
}

// ─── Drawing helpers ────────────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#06020f');
  bg.addColorStop(0.5, '#0d0825');
  bg.addColorStop(1, '#120a30');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(124,58,237,0.08)';
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL, 0);
    ctx.lineTo(c * CELL, H);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL);
    ctx.lineTo(W, r * CELL);
    ctx.stroke();
  }
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  color: string,
  glow: string,
  ghost?: boolean,
  cellSize: number = CELL,
) {
  const x = col * cellSize;
  const y = row * cellSize;
  const pad = 1;

  if (ghost) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.3;
    ctx.strokeRect(x + pad + 1, y + pad + 1, cellSize - pad * 2 - 2, cellSize - pad * 2 - 2);
    ctx.globalAlpha = 1;
    return;
  }

  // Glow
  ctx.save();
  ctx.shadowBlur = 8;
  ctx.shadowColor = glow;
  ctx.fillStyle = color;
  // Rounded rect
  const rx = x + pad;
  const ry = y + pad;
  const rw = cellSize - pad * 2;
  const rh = cellSize - pad * 2;
  const r = 4;
  ctx.beginPath();
  ctx.moveTo(rx + r, ry);
  ctx.lineTo(rx + rw - r, ry);
  ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + r);
  ctx.lineTo(rx + rw, ry + rh - r);
  ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - r, ry + rh);
  ctx.lineTo(rx + r, ry + rh);
  ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - r);
  ctx.lineTo(rx, ry + r);
  ctx.quadraticCurveTo(rx, ry, rx + r, ry);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Inner highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(rx + 2, ry + 2, rw - 4, 3);
}

function drawBoard(ctx: CanvasRenderingContext2D, board: (TetrominoType | null)[][]) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = board[r][c];
      if (t) {
        drawCell(ctx, c, r, TETRO_COLORS[t], TETRO_GLOW[t]);
      }
    }
  }
}

function drawPiece(ctx: CanvasRenderingContext2D, piece: Piece, ghost?: boolean) {
  const shape = getShape(piece);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const dr = piece.y + r;
      const dc = piece.x + c;
      if (dr < 0) continue; // above board
      drawCell(ctx, dc, dr, TETRO_COLORS[piece.type], TETRO_GLOW[piece.type], ghost);
    }
  }
}

function ghostY(board: (TetrominoType | null)[][], piece: Piece): number {
  let gy = piece.y;
  while (!collides(board, { ...piece, y: gy + 1 })) gy++;
  return gy;
}

function drawPreview(ctx: CanvasRenderingContext2D, type: TetrominoType) {
  // dark bg
  ctx.fillStyle = '#0a0618';
  ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

  // subtle border
  ctx.strokeStyle = 'rgba(124,58,237,0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, PREVIEW_SIZE - 1, PREVIEW_SIZE - 1);

  const shape = SHAPES[type][0];
  const rows = shape.length;
  const cols = shape[0].length;
  const cs = 22; // cell size for preview
  const ox = Math.floor((PREVIEW_SIZE - cols * cs) / 2);
  const oy = Math.floor((PREVIEW_SIZE - rows * cs) / 2);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!shape[r][c]) continue;
      const x = ox + c * cs;
      const y = oy + r * cs;
      ctx.save();
      ctx.shadowBlur = 6;
      ctx.shadowColor = TETRO_GLOW[type];
      ctx.fillStyle = TETRO_COLORS[type];
      const pad = 1;
      ctx.beginPath();
      ctx.moveTo(x + pad + 3, y + pad);
      ctx.lineTo(x + cs - pad - 3, y + pad);
      ctx.quadraticCurveTo(x + cs - pad, y + pad, x + cs - pad, y + pad + 3);
      ctx.lineTo(x + cs - pad, y + cs - pad - 3);
      ctx.quadraticCurveTo(x + cs - pad, y + cs - pad, x + cs - pad - 3, y + cs - pad);
      ctx.lineTo(x + pad + 3, y + cs - pad);
      ctx.quadraticCurveTo(x + pad, y + cs - pad, x + pad, y + cs - pad - 3);
      ctx.lineTo(x + pad, y + pad + 3);
      ctx.quadraticCurveTo(x + pad, y + pad, x + pad + 3, y + pad);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x + pad + 2, y + pad + 2, cs - pad * 2 - 4, 2);
    }
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5 * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

// Danger-line glow when stack is high
function drawDangerLine(ctx: CanvasRenderingContext2D, board: (TetrominoType | null)[][], tick: number) {
  // Find highest occupied row
  let topRow = ROWS;
  for (let r = 0; r < ROWS; r++) {
    if (board[r].some(c => c !== null)) { topRow = r; break; }
  }
  if (topRow > 4) return; // no danger

  const intensity = Math.max(0, (5 - topRow) / 5);
  const pulse = 0.5 + 0.5 * Math.sin(tick * 0.08);
  const alpha = intensity * (0.15 + 0.2 * pulse);

  ctx.fillStyle = `rgba(248,113,113,${alpha})`;
  ctx.fillRect(0, 0, W, (topRow + 1) * CELL);

  ctx.save();
  ctx.shadowBlur = 12;
  ctx.shadowColor = `rgba(248,113,113,${intensity * (0.4 + 0.3 * pulse)})`;
  ctx.strokeStyle = `rgba(248,113,113,${intensity * (0.5 + 0.3 * pulse)})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(0, 3 * CELL);
  ctx.lineTo(W, 3 * CELL);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ─── Component ──────────────────────────────────────────────────────────────

interface BlockBlastProps {
  onBack: () => void;
}

const BlockBlast: React.FC<BlockBlastProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const tickRef = useRef(0);

  // Game state refs (mutated in rAF loop)
  const phaseRef = useRef<Phase>('idle');
  const boardRef = useRef<(TetrominoType | null)[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  const currentRef = useRef<Piece | null>(null);
  const bagRef = useRef<TetrominoType[]>([]);
  const nextTypeRef = useRef<TetrominoType>('T');
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const linesRef = useRef(0);
  const lastDropRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const flashRowsRef = useRef<number[]>([]);
  const flashTickRef = useRef(0);

  // React state for overlay rendering
  const [phase, setPhase] = useState<Phase>('idle');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try { return Number(localStorage.getItem('bb-best')) || 0; } catch { return 0; }
  });
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);

  // ── Bag helpers ─────────────────────────────────────────────────────────
  const pullFromBag = useCallback((): TetrominoType => {
    if (bagRef.current.length === 0) bagRef.current = randomBag();
    return bagRef.current.pop()!;
  }, []);

  // ── Spawn piece ─────────────────────────────────────────────────────────
  const spawnPiece = useCallback(() => {
    const type = nextTypeRef.current;
    nextTypeRef.current = pullFromBag();
    const shape = SHAPES[type][0];
    const piece: Piece = {
      type,
      rotation: 0,
      x: Math.floor((COLS - shape[0].length) / 2),
      y: -shape.length,
    };
    // bring it down just enough so at least one row visible
    while (!getShape(piece).some((row, ri) => piece.y + ri >= 0 && row.some(c => c))) {
      piece.y++;
    }

    if (collides(boardRef.current, piece)) {
      // game over
      phaseRef.current = 'dead';
      setPhase('dead');
      const s = scoreRef.current;
      if (s > bestScore) {
        setBestScore(s);
        try { localStorage.setItem('bb-best', String(s)); } catch { /* */ }
      }
      return;
    }
    currentRef.current = piece;
  }, [pullFromBag, bestScore]);

  // ── Lock piece on board ─────────────────────────────────────────────────
  const lockPiece = useCallback(() => {
    const piece = currentRef.current;
    if (!piece) return;
    const shape = getShape(piece);
    const board = boardRef.current;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nr = piece.y + r;
        const nc = piece.x + c;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          board[nr][nc] = piece.type;
        }
      }
    }
    currentRef.current = null;

    // check for completed lines
    const fullRows: number[] = [];
    for (let r = 0; r < ROWS; r++) {
      if (board[r].every(c => c !== null)) fullRows.push(r);
    }

    if (fullRows.length > 0) {
      // spawn particles for cleared rows
      for (const row of fullRows) {
        for (let c = 0; c < COLS; c++) {
          const color = TETRO_COLORS[board[row][c]!];
          for (let i = 0; i < 3; i++) {
            particlesRef.current.push({
              x: c * CELL + CELL / 2,
              y: row * CELL + CELL / 2,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6 - 2,
              life: 30 + Math.random() * 20,
              maxLife: 50,
              color,
            });
          }
        }
      }

      // Flash rows then clear
      flashRowsRef.current = fullRows;
      flashTickRef.current = 12;

      // Clear rows after brief flash delay handled in render loop
      setTimeout(() => {
        for (const row of fullRows) {
          board.splice(row, 1);
          board.unshift(Array(COLS).fill(null));
        }
        flashRowsRef.current = [];
        const cleared = fullRows.length;
        const lvl = levelRef.current;
        scoreRef.current += LINE_POINTS[cleared] * lvl;
        linesRef.current += cleared;
        const newLevel = Math.floor(linesRef.current / 10) + 1;
        levelRef.current = newLevel;

        setScore(scoreRef.current);
        setLines(linesRef.current);
        setLevel(newLevel);

        spawnPiece();
      }, 200);
    } else {
      spawnPiece();
    }
  }, [spawnPiece]);

  // ── Move / rotate helpers ───────────────────────────────────────────────
  const tryMove = useCallback((dx: number, dy: number): boolean => {
    const piece = currentRef.current;
    if (!piece) return false;
    const moved = { ...piece, x: piece.x + dx, y: piece.y + dy };
    if (!collides(boardRef.current, moved)) {
      currentRef.current = moved;
      return true;
    }
    return false;
  }, []);

  const tryRotate = useCallback(() => {
    const piece = currentRef.current;
    if (!piece) return;
    const newRot = (piece.rotation + 1) % 4;
    const rotated = { ...piece, rotation: newRot };
    // Try basic rotation
    if (!collides(boardRef.current, rotated)) {
      currentRef.current = rotated;
      return;
    }
    // Wall kick offsets
    for (const dx of [-1, 1, -2, 2]) {
      const kicked = { ...rotated, x: rotated.x + dx };
      if (!collides(boardRef.current, kicked)) {
        currentRef.current = kicked;
        return;
      }
    }
  }, []);

  const hardDrop = useCallback(() => {
    const piece = currentRef.current;
    if (!piece) return;
    const gy = ghostY(boardRef.current, piece);
    // Add bonus score for hard drop distance
    scoreRef.current += (gy - piece.y) * 2;
    setScore(scoreRef.current);
    currentRef.current = { ...piece, y: gy };
    lockPiece();
  }, [lockPiece]);

  // ── Start game ──────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    boardRef.current = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    bagRef.current = randomBag();
    nextTypeRef.current = bagRef.current.pop()!;
    scoreRef.current = 0;
    levelRef.current = 1;
    linesRef.current = 0;
    lastDropRef.current = performance.now();
    particlesRef.current = [];
    flashRowsRef.current = [];

    setScore(0);
    setLevel(1);
    setLines(0);

    phaseRef.current = 'playing';
    setPhase('playing');
    spawnPiece();
  }, [spawnPiece]);

  // ── Keyboard input ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phaseRef.current === 'idle' || phaseRef.current === 'dead') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          startGame();
        }
        return;
      }
      if (phaseRef.current !== 'playing') return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          tryMove(-1, 0);
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          tryMove(1, 0);
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          if (tryMove(0, 1)) {
            lastDropRef.current = performance.now();
          }
          break;
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          tryRotate();
          break;
        case 'Space':
          e.preventDefault();
          hardDrop();
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startGame, tryMove, tryRotate, hardDrop]);

  // ── Touch controls on canvas (tap rotate, swipe down hard-drop) ───────
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);

  const handleCanvasTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (phaseRef.current === 'idle' || phaseRef.current === 'dead') {
      startGame();
      return;
    }
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
  }, [startGame]);

  const handleCanvasTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const start = touchStartRef.current;
    if (!start || phaseRef.current !== 'playing') return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const dt = Date.now() - start.t;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < 12 && absDy < 12 && dt < 250) {
      // Tap → rotate
      tryRotate();
    } else if (absDy > 40 && absDy > absDx * 1.5 && dy > 0) {
      // Swipe down → hard drop
      hardDrop();
    } else if (absDx > 20 && absDx > absDy) {
      // Horizontal swipe → move (1 step per ~30px)
      const steps = Math.max(1, Math.min(Math.floor(absDx / 30), 5));
      const dir = dx > 0 ? 1 : -1;
      for (let i = 0; i < steps; i++) tryMove(dir, 0);
    }
    touchStartRef.current = null;
  }, [tryRotate, hardDrop, tryMove]);

  // ── Game loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const preview = previewRef.current;
    if (!canvas || !preview) return;
    const ctx = canvas.getContext('2d')!;
    const pctx = preview.getContext('2d')!;

    const loop = (now: number) => {
      tickRef.current++;
      const tick = tickRef.current;

      // ── Update particles ────────────────────────
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life--;
        return p.life > 0;
      });

      // ── Game logic ─────────────────────────────
      if (phaseRef.current === 'playing' && currentRef.current && flashRowsRef.current.length === 0) {
        const elapsed = now - lastDropRef.current;
        const speed = getDropSpeed(levelRef.current);
        if (elapsed >= speed) {
          lastDropRef.current = now;
          if (!tryMove(0, 1)) {
            lockPiece();
          }
        }
      }

      // ── Draw board canvas ──────────────────────
      drawBackground(ctx);

      // Danger-line overlay
      if (phaseRef.current === 'playing') {
        drawDangerLine(ctx, boardRef.current, tick);
      }

      drawBoard(ctx, boardRef.current);

      // Flash clearing rows
      if (flashRowsRef.current.length > 0) {
        flashTickRef.current--;
        const flash = Math.sin(flashTickRef.current * 1.2) > 0;
        if (flash) {
          for (const row of flashRowsRef.current) {
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.fillRect(0, row * CELL, W, CELL);
          }
        }
      }

      // Draw ghost + current piece
      if (phaseRef.current === 'playing' && currentRef.current) {
        const gy = ghostY(boardRef.current, currentRef.current);
        drawPiece(ctx, { ...currentRef.current, y: gy }, true);
        drawPiece(ctx, currentRef.current);
      }

      drawParticles(ctx, particlesRef.current);

      // ── Draw preview canvas ────────────────────
      drawPreview(pctx, nextTypeRef.current);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tryMove, lockPiece]);

  // ── Overlay click ───────────────────────────────────────────────────────
  const handleOverlayClick = useCallback(() => {
    if (phaseRef.current === 'idle' || phaseRef.current === 'dead') {
      startGame();
    }
  }, [startGame]);

  const isOverlay = phase === 'idle' || phase === 'dead';

  return (
    <div className="bb-wrap">
      {/* Header */}
      <div className="bb-header">
        <div className="bb-header-left">
          <button className="bb-back-btn" onClick={onBack}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
            </svg>
            Back
          </button>
          <button className="bb-back-btn bb-restart-btn" onClick={startGame}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M17.65 6.35A7.96 7.96 0 0 0 12 4C7.58 4 4.01 7.58 4.01 12S7.58 20 12 20c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
            Restart
          </button>
        </div>
        <div className="bb-title-row">
          <span className="bb-title">Block Blast</span>
          <span className="bb-badge">NEON</span>
        </div>
        <span className="bb-best">🏆 {bestScore}</span>
      </div>

      {/* Main game area */}
      <div className="bb-game-area">
        {/* Board */}
        <div
          className="bb-stage"
          onTouchStart={handleCanvasTouchStart}
          onTouchEnd={handleCanvasTouchEnd}
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="bb-canvas"
          />

          {/* Overlay */}
          {isOverlay && (
            <div className="bb-overlay" onClick={handleOverlayClick}>
              {phase === 'idle' ? (
                <>
                  <div className="bb-splash-icon">🧱</div>
                  <div className="bb-overlay-title">Block Blast</div>
                  <div className="bb-overlay-sub">
                    Stack & Clear — the classic block puzzle
                  </div>
                  <div className="bb-tap-pill">Tap or press Space to play</div>
                </>
              ) : (
                <>
                  <div className="bb-splash-icon">💥</div>
                  <div className="bb-overlay-title">Game Over</div>
                  <div className="bb-scoreboard">
                    <div className="bb-sb-row">
                      <span className="bb-sb-label">Score</span>
                      <span className="bb-sb-val">{score}</span>
                    </div>
                    <div className="bb-sb-divider" />
                    <div className="bb-sb-row">
                      <span className="bb-sb-label">Lines</span>
                      <span className="bb-sb-val">{lines}</span>
                    </div>
                    <div className="bb-sb-divider" />
                    <div className="bb-sb-row">
                      <span className="bb-sb-label">Level</span>
                      <span className="bb-sb-val">{level}</span>
                    </div>
                    <div className="bb-sb-divider" />
                    <div className="bb-sb-row">
                      <span className="bb-sb-label">Best</span>
                      <span className="bb-sb-val bb-sb-gold">{bestScore}</span>
                    </div>
                  </div>
                  <div className="bb-tap-pill">Tap or press Space to retry</div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="bb-side">
          <div className="bb-info-card">
            <span className="bb-info-label">Next</span>
            <canvas
              ref={previewRef}
              width={PREVIEW_SIZE}
              height={PREVIEW_SIZE}
              className="bb-preview-canvas"
            />
          </div>
          <div className="bb-info-card">
            <span className="bb-info-label">Score</span>
            <span className="bb-info-value">{score}</span>
          </div>
          <div className="bb-info-card">
            <span className="bb-info-label">Level</span>
            <span className="bb-info-value">{level}</span>
          </div>
          <div className="bb-info-card">
            <span className="bb-info-label">Lines</span>
            <span className="bb-info-value">{lines}</span>
          </div>
        </div>
      </div>

      <p className="bb-hint">
        Swipe ↔ move · Tap rotate · Swipe ↓ drop · Keyboard: ← → ↑ ↓ Space
      </p>
    </div>
  );
};

export default BlockBlast;
