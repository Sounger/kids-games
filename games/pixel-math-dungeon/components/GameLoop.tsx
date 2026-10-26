
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DifficultyRange, MathOperation, Tile, Entity, MathProblem, SessionStats } from '../types';
import { generateProblem } from '../services/mathService';
import { saveSession } from '../services/storageService';
import { playSound } from '../services/soundService';
import { Heart, Sword, DoorOpen, Lock, Smile, User, Ghost, Bug, Bot, Crown } from 'lucide-react';
import MathModal from './MathModal';

interface Props {
  playerName: string;
  difficulty: DifficultyRange;
  operation: MathOperation;
  isQuickMode: boolean;
  onEnd: (stats: SessionStats) => void;
}

const TILE_SIZE = 64; 

const VIEWPORT_W_TILES = 13;
const VIEWPORT_H_TILES = 9;

const BOSS_MAX_HP = 3;

// Monster AI Settings (ticks, where 1 tick = 100ms)
const MONSTER_SPEEDS = {
  GHOST: 15, // 1.5s
  BUG: 8,    // 0.8s
  BOT: 20,   // 2.0s
  BOSS: 15   // Variable based on phase
};

const GameLoop: React.FC<Props> = ({ playerName, difficulty, operation, isQuickMode, onEnd }) => {
  // Dynamic Map Settings based on Mode
  const GRID_W = isQuickMode ? 14 : 22;
  const GRID_H = isQuickMode ? 14 : 22;
  const BOSS_SPAWN_DOORS = isQuickMode ? 2 : 3;
  const MIN_EXIT_DIST = isQuickMode ? 10 : 15;

  const [grid, setGrid] = useState<Tile[][]>([]);
  const [player, setPlayer] = useState<Entity>({ id: 'p1', type: 'PLAYER', x: 1, y: 1 });
  const [exitPos, setExitPos] = useState<{x: number, y: number}>({ x: GRID_W - 2, y: GRID_H - 2 });
  const [monsters, setMonsters] = useState<Entity[]>([]);
  const [lives, setLives] = useState(3);
  const [weaponCount, setWeaponCount] = useState(0);
  const [score, setScore] = useState(0); 
  const [doorsOpened, setDoorsOpened] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState<number>(Date.now());
  const [monstersDefeated, setMonstersDefeated] = useState(0);
  const [bossSpawned, setBossSpawned] = useState(false);
  
  const [activeProblem, setActiveProblem] = useState<{ problem: MathProblem, tileX: number, tileY: number } | null>(null);

  const monsterInterval = useRef<number | null>(null);

  // --- Initialization ---
  useEffect(() => {
    const initialGrid: Tile[][] = [];

    // 1. Base Grid (Walls & Floors)
    for (let y = 0; y < GRID_H; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < GRID_W; x++) {
        const isBorder = x === 0 || y === 0 || x === GRID_W - 1 || y === GRID_H - 1;
        const isInternalWall = x % 2 === 0 && y % 2 === 0;
        
        let type: Tile['type'] = 'FLOOR';
        if (isBorder || isInternalWall) type = 'WALL';
        
        row.push({ x, y, type });
      }
      initialGrid.push(row);
    }

    // 2. Random Door Placement
    for (let y = 1; y < GRID_H - 1; y++) {
      for (let x = 1; x < GRID_W - 1; x++) {
        if (initialGrid[y][x].type === 'FLOOR') {
          // 30% chance for a door
          if (Math.random() > 0.7) {
             initialGrid[y][x].type = 'DOOR_CLOSED';
          }
        }
      }
    }

    // 3. Enforce Density (Horizontal - Odd Rows)
    for (let y = 1; y < GRID_H - 1; y += 2) {
      let gap = 0;
      for (let x = 1; x < GRID_W - 1; x++) {
        if (initialGrid[y][x].type === 'FLOOR') {
          gap++;
          if (gap >= 5) {
             initialGrid[y][x].type = 'DOOR_CLOSED';
             gap = 0;
          }
        } else {
          // Reset gap on Wall or existing Door
          gap = 0;
        }
      }
    }

    // 4. Enforce Density (Vertical - Odd Cols)
    for (let x = 1; x < GRID_W - 1; x += 2) {
      let gap = 0;
      for (let y = 1; y < GRID_H - 1; y++) {
        if (initialGrid[y][x].type === 'FLOOR') {
          gap++;
          if (gap >= 5) {
             initialGrid[y][x].type = 'DOOR_CLOSED';
             gap = 0;
          }
        } else {
          gap = 0;
        }
      }
    }

    // 5. Clear Safe Zone (Start)
    const clearZone = (x1: number, y1: number, x2: number, y2: number) => {
        for(let y=y1; y<=y2; y++) {
            for(let x=x1; x<=x2; x++) {
                if(initialGrid[y][x].type !== 'WALL') {
                    initialGrid[y][x].type = 'FLOOR';
                    initialGrid[y][x].mathProblem = undefined; // Clear any accidental problem
                }
            }
        }
    };
    clearZone(1, 1, 2, 2); // Start

    // 6. Ensure Start Accessibility (Force doors nearby)
    if (initialGrid[1][3].type === 'FLOOR') initialGrid[1][3].type = 'DOOR_CLOSED';
    if (initialGrid[3][1].type === 'FLOOR') initialGrid[3][1].type = 'DOOR_CLOSED';

    // 7. Determine Random Exit Location
    let placedExit = false;
    let exitX = GRID_W - 2;
    let exitY = GRID_H - 2;
    
    while (!placedExit) {
        // Try random coordinates
        const attemptX = Math.floor(Math.random() * (GRID_W - 2)) + 1;
        const attemptY = Math.floor(Math.random() * (GRID_H - 2)) + 1;
        
        // Check distance from start (1,1)
        const dist = Math.abs(attemptX - 1) + Math.abs(attemptY - 1);
        
        // Must be far away and currently a floor (or can be made one)
        if (dist > MIN_EXIT_DIST && initialGrid[attemptY][attemptX].type !== 'WALL') {
            initialGrid[attemptY][attemptX].type = 'FLOOR'; // Ensure it's clear
            initialGrid[attemptY][attemptX].mathProblem = undefined;
            exitX = attemptX;
            exitY = attemptY;
            placedExit = true;
        }
    }
    setExitPos({ x: exitX, y: exitY });

    // 8. Assign Math Problems to all Doors
    for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
            if (initialGrid[y][x].type === 'DOOR_CLOSED') {
                initialGrid[y][x].mathProblem = generateProblem(operation, difficulty);
            }
        }
    }
    
    // 9. Place Items
    for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
            // Do not spawn items on start or exit
            const isStart = (x >= 1 && x <= 2 && y >= 1 && y <= 2);
            const isExit = (x === exitX && y === exitY);
            
            if (initialGrid[y][x].type === 'FLOOR' && !isStart && !isExit) {
                const rand = Math.random();
                if (rand > 0.96) {
                     initialGrid[y][x].item = { type: 'WEAPON' };
                } else if (rand > 0.94) {
                     initialGrid[y][x].item = { type: 'HEART' };
                } else if (rand > 0.85) {
                     initialGrid[y][x].item = { type: 'EMOJI', value: 10 };
                }
            }
        }
    }

    setGrid(initialGrid);

    // 10. Place Monsters
    // Scale monsters with grid area roughly
    const area = GRID_W * GRID_H;
    const monsterCount = Math.max(3, Math.floor(area / 60)); // ~8 for 22x22, ~3-4 for 14x14

    const initialMonsters: Entity[] = [];
    for(let i=0; i < monsterCount; i++) {
        let placed = false;
        let attempts = 0;
        while(!placed && attempts < 50) {
            const mx = Math.floor(Math.random() * (GRID_W - 4)) + 4;
            const my = Math.floor(Math.random() * (GRID_H - 4)) + 4;
            // Don't spawn on exit
            if (initialGrid[my] && initialGrid[my][mx] && initialGrid[my][mx].type === 'FLOOR' && !(mx === exitX && my === exitY)) {
                const rand = Math.random();
                let mType: 'GHOST' | 'BUG' | 'BOT' = 'GHOST';
                if (rand > 0.7) mType = 'BUG';
                else if (rand > 0.4) mType = 'BOT';

                initialMonsters.push({ 
                  id: `m_${i}`, 
                  type: 'MONSTER', 
                  monsterType: mType, 
                  ticksUntilMove: MONSTER_SPEEDS[mType] + Math.floor(Math.random() * 5), // Randomize start phase
                  x: mx, 
                  y: my 
                });
                placed = true;
            }
            attempts++;
        }
    }
    setMonsters(initialMonsters);

  }, [difficulty, operation, isQuickMode, GRID_H, GRID_W, MIN_EXIT_DIST]);

  // --- Boss Spawning ---
  useEffect(() => {
    if (!bossSpawned && doorsOpened >= BOSS_SPAWN_DOORS) {
      // Find a spot far from player
      let placed = false;
      let attempts = 0;
      let bx = 1, by = 1;

      while(!placed && attempts < 100) {
        bx = Math.floor(Math.random() * (GRID_W - 2)) + 1;
        by = Math.floor(Math.random() * (GRID_H - 2)) + 1;
        const dist = Math.abs(bx - player.x) + Math.abs(by - player.y);
        
        // Spawn on Floor, far away, not on exit
        if (grid[by] && grid[by][bx] && grid[by][bx].type === 'FLOOR' && dist > 8 && !(bx === exitPos.x && by === exitPos.y)) {
           placed = true;
        }
        attempts++;
      }

      if (placed) {
        setBossSpawned(true);
        const bossMonster: Entity = {
          id: 'BOSS_LICH',
          type: 'MONSTER',
          monsterType: 'BOSS',
          x: bx, 
          y: by,
          health: BOSS_MAX_HP,
          maxHealth: BOSS_MAX_HP,
          ticksUntilMove: 10
        };
        setMonsters(prev => [...prev, bossMonster]);
        playSound('boss_spawn');
      }
    }
  }, [doorsOpened, bossSpawned, grid, player, exitPos, BOSS_SPAWN_DOORS, GRID_H, GRID_W]);


  // --- Game Loop Logic ---

  const handleMove = useCallback((dx: number, dy: number) => {
    if (activeProblem) return;

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (newX < 0 || newX >= GRID_W || newY < 0 || newY >= GRID_H) return;

    const targetTile = grid[newY][newX];

    if (targetTile.type === 'WALL' || targetTile.type === 'DOOR_LOCKED') {
        if (targetTile.type === 'DOOR_LOCKED') playSound('door_locked');
        return;
    }

    if (targetTile.type === 'DOOR_CLOSED') {
      if (targetTile.mathProblem) {
        setActiveProblem({ problem: targetTile.mathProblem, tileX: newX, tileY: newY });
      }
      return; 
    }

    setPlayer(prev => ({ ...prev, x: newX, y: newY }));
    playSound('step');

    if (targetTile.item) {
      if (targetTile.item.type === 'HEART') {
        setLives(l => Math.min(l + 0.5, 5));
        playSound('heal');
      } else if (targetTile.item.type === 'WEAPON') {
        setWeaponCount(w => Math.min(w + 1, 5)); // Stack weapons, max 5
        playSound('powerup');
      } else if (targetTile.item.type === 'EMOJI') {
        setScore(s => s + 10);
        playSound('coin');
      }
      const newGrid = [...grid];
      newGrid[newY][newX] = { ...targetTile, item: undefined };
      setGrid(newGrid);
    }

    // Check Win Condition (Dynamic Exit)
    if (newX === exitPos.x && newY === exitPos.y && doorsOpened > 0) {
       endGame(true);
    }

  }, [grid, player, activeProblem, doorsOpened, exitPos, GRID_W, GRID_H]);


  // --- Monster AI ---
  useEffect(() => {
    if (activeProblem) return;

    monsterInterval.current = window.setInterval(() => {
      setMonsters(prevMonsters => {
        return prevMonsters.map(m => {
           // Decrement cooldown
           if (m.ticksUntilMove && m.ticksUntilMove > 0) {
             return { ...m, ticksUntilMove: m.ticksUntilMove - 1 };
           }

           const mType = m.monsterType || 'GHOST';
           let targetX = m.x;
           let targetY = m.y;
           let speed = MONSTER_SPEEDS[mType];

           // Specific Boss Logic
           if (mType === 'BOSS') {
             // Phase Logic: Less health = Faster speed
             const hp = m.health || 3;
             if (hp === 3) speed = 15; // Slow
             else if (hp === 2) speed = 10; // Medium
             else speed = 5; // Fast

             // Behavior Logic: Only chase if player has weapon
             if (weaponCount > 0) {
                // Aggressive Chase
                const dx = player.x - m.x;
                const dy = player.y - m.y;
                let moveX = 0, moveY = 0;
                
                // Prioritize the larger gap to close distance
                if (Math.abs(dx) > Math.abs(dy)) {
                    moveX = dx > 0 ? 1 : -1;
                } else {
                    moveY = dy > 0 ? 1 : -1;
                }
                
                // If aligned on one axis, check if move is blocked, if so, try other axis
                let nextX = m.x + moveX;
                let nextY = m.y + moveY;
                
                // Check bounds
                if (nextY >= 0 && nextY < GRID_H && nextX >= 0 && nextX < GRID_W) {
                    const t = grid[nextY][nextX];
                    // Boss collision logic: Boss can move through doors, but not walls
                    const isBlocked = t.type === 'WALL'; // Boss ignores DOORS
                    
                    if (isBlocked) {
                       // Try diagonal/alternate
                       if (moveX !== 0) moveY = dy > 0 ? 1 : -1;
                       else moveX = dx > 0 ? 1 : -1;
                    }
                }

                targetX = m.x + moveX;
                targetY = m.y + moveY;
             } else {
                // Passive / Random Wander (Boss doesn't care about unarmed player)
                const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                const dir = directions[Math.floor(Math.random() * directions.length)];
                targetX = m.x + dir[0];
                targetY = m.y + dir[1];
             }

           } else if (mType === 'BOT') {
             // Wanderer: Random moves
             const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
             const dir = directions[Math.floor(Math.random() * directions.length)];
             targetX = m.x + dir[0];
             targetY = m.y + dir[1];
           } else {
             // Ghost & Bug: Chase Logic
             const dx = player.x - m.x;
             const dy = player.y - m.y;
             
             // Range check
             const detectionRange = mType === 'BUG' ? 15 : 10;
             const dist = Math.abs(dx) + Math.abs(dy);
             
             if (dist <= detectionRange) {
               let moveX = 0;
               let moveY = 0;
               if (Math.abs(dx) > Math.abs(dy)) {
                 moveX = dx > 0 ? 1 : -1;
               } else {
                 moveY = dy > 0 ? 1 : -1;
               }
               targetX = m.x + moveX;
               targetY = m.y + moveY;
             }
           }

           // Valid Move Check
           if (targetX < 0 || targetX >= GRID_W || targetY < 0 || targetY >= GRID_H) {
             return { ...m, ticksUntilMove: speed };
           }

           const tile = grid[targetY][targetX];
           
           // Collision Rules
           let isWalkable = true;
           
           if (mType === 'BOSS') {
               // Boss walks through everything except WALLs
               if (tile.type === 'WALL') isWalkable = false;
           } else {
               // Normal monsters blocked by Walls and Doors
               if (tile.type === 'WALL' || tile.type === 'DOOR_CLOSED' || tile.type === 'DOOR_LOCKED') {
                   isWalkable = false;
               }
           }

           if (!isWalkable) {
             return { ...m, ticksUntilMove: speed };
           }

           // Reset Timer
           return { ...m, x: targetX, y: targetY, ticksUntilMove: speed };
        });
      });
    }, 100); // 100ms Game Tick

    return () => {
      if (monsterInterval.current) clearInterval(monsterInterval.current);
    };
  }, [player, grid, activeProblem, weaponCount, GRID_H, GRID_W]);


  // --- Combat Logic ---
  const teleportEntity = (entityId: string) => {
    // Find random safe spot
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 50) {
        const tx = Math.floor(Math.random() * (GRID_W - 2)) + 1;
        const ty = Math.floor(Math.random() * (GRID_H - 2)) + 1;
        // Don't teleport too close to player or on Exit
        const isExit = (tx === exitPos.x && ty === exitPos.y);
        
        if (grid[ty][tx].type === 'FLOOR' && !isExit && (Math.abs(tx - player.x) + Math.abs(ty - player.y) > 5)) {
             setMonsters(prev => prev.map(m => m.id === entityId ? { ...m, x: tx, y: ty, ticksUntilMove: 20 } : m));
             placed = true;
        }
        attempts++;
    }
  }

  useEffect(() => {
    const handleCollision = () => {
        let hitPlayer = false;
        let monsterDiedIds: string[] = [];
        let bossHit = false;

        monsters.forEach((m) => {
            if (m.x === player.x && m.y === player.y) {
                if (m.monsterType === 'BOSS') {
                   // Boss Combat Logic
                   if (weaponCount > 0) {
                      // Player hits Boss
                      bossHit = true;
                      playSound('boss_hit');
                      setWeaponCount(w => w - 1); // Weapon breaks on boss
                      setScore(s => s + 50); // Points for hitting boss

                      // Reduce Health or Kill
                      const newHealth = (m.health || 0) - 1;
                      if (newHealth <= 0) {
                          monsterDiedIds.push(m.id);
                          setMonstersDefeated(p => p + 1);
                          playSound('kill'); // Big kill sound
                          setScore(s => s + 50 + 500); // 50 (last hit) + 50 (Bonus for kill requested) + 500 (Base Kill reward)
                      } else {
                          // Update Boss Health and Teleport Away
                           setMonsters(prev => prev.map(monster => 
                                monster.id === m.id ? { ...monster, health: newHealth } : monster
                           ));
                           teleportEntity(m.id);
                      }
                   } else {
                      // Boss hits Player
                      hitPlayer = true;
                      playSound('damage');
                      // Teleport Boss away to prevent stunlocking
                      teleportEntity(m.id);
                   }
                } else {
                    // Normal Monster Logic
                    if (weaponCount > 0) {
                        setWeaponCount(w => w - 1);
                        monsterDiedIds.push(m.id);
                        setMonstersDefeated(p => p + 1);
                        playSound('kill');
                    } else {
                        hitPlayer = true;
                        monsterDiedIds.push(m.id); // Normal monsters die on impact too (suicide attack)
                        playSound('damage');
                    }
                }
            }
        });

        if (monsterDiedIds.length > 0) {
             setMonsters(prev => prev.filter(m => !monsterDiedIds.includes(m.id)));
        }

        if (hitPlayer) {
            setLives(prev => {
                const newLives = prev - 0.5;
                if (newLives <= 0) {
                    endGame(false);
                }
                return newLives;
            });
        }
    };
    handleCollision();
  }, [player, monsters, weaponCount, grid, exitPos, GRID_W, GRID_H]);


  // --- Input Handling ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          handleMove(0, -1);
          break;
        case 'ArrowDown':
        case 's':
          handleMove(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
          handleMove(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
          handleMove(1, 0);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);


  // --- Math Result Handling ---
  const handleMathAnswer = (correct: boolean) => {
    if (!activeProblem) return;
    const { tileX, tileY } = activeProblem;

    const newGrid = [...grid];
    if (correct) {
      newGrid[tileY][tileX] = { ...newGrid[tileY][tileX], type: 'DOOR_OPEN' };
      setDoorsOpened(d => d + 1);
      setScore(s => s + 5); // BONUS POINTS FOR OPENING DOOR
      setPlayer({ ...player, x: tileX, y: tileY }); 
      playSound('door_open');
    } else {
      newGrid[tileY][tileX] = { ...newGrid[tileY][tileX], type: 'DOOR_LOCKED' };
      setMistakes(m => m + 1);
      playSound('door_locked');
    }
    setGrid(newGrid);
    setActiveProblem(null);
  };

  const endGame = (won: boolean) => {
    const duration = (Date.now() - startTime) / 1000;
    const stats: SessionStats = {
        difficulty,
        operation,
        durationSeconds: duration,
        doorsOpened,
        mistakes,
        accuracy: (doorsOpened + mistakes) > 0 ? (doorsOpened / (doorsOpened + mistakes)) * 100 : 0,
        livesRemaining: lives,
        bonusEmojis: score,
        won
    };
    
    saveSession(playerName, stats, monstersDefeated);
    onEnd(stats);
  };

  // --- Rendering ---
  
  const VIEWPORT_W_PX = VIEWPORT_W_TILES * TILE_SIZE;
  const VIEWPORT_H_PX = VIEWPORT_H_TILES * TILE_SIZE;
  
  let camX = (VIEWPORT_W_PX / 2) - (player.x * TILE_SIZE) - (TILE_SIZE / 2);
  let camY = (VIEWPORT_H_PX / 2) - (player.y * TILE_SIZE) - (TILE_SIZE / 2);

  const minCamX = VIEWPORT_W_PX - (GRID_W * TILE_SIZE);
  const minCamY = VIEWPORT_H_PX - (GRID_H * TILE_SIZE);
  
  // If the grid is smaller than the viewport (Quick Mode), center it or lock to 0
  if (minCamX > 0) {
      camX = Math.max(0, camX); // Simplified for small maps, prevents weird negative scrolling
      // Actually if minCamX > 0, we have extra space.
      // Let's just center the whole grid in the viewport if it's smaller
      camX = (VIEWPORT_W_PX - (GRID_W * TILE_SIZE)) / 2;
  } else {
      camX = Math.max(minCamX, Math.min(0, camX));
  }
  
  if (minCamY > 0) {
      camY = (VIEWPORT_H_PX - (GRID_H * TILE_SIZE)) / 2;
  } else {
      camY = Math.max(minCamY, Math.min(0, camY));
  }

  // Find Boss for UI
  const bossEntity = monsters.find(m => m.monsterType === 'BOSS');

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-900">
      
      {/* HUD */}
      <div className="absolute top-4 w-full max-w-2xl flex flex-col gap-2 px-4 z-20 pointer-events-none">
        <div className="flex justify-between w-full">
            <div className="flex items-center gap-4 pointer-events-auto">
                <div className="flex items-center text-red-500 gap-1 bg-black/70 border-2 border-red-900 p-2 rounded">
                    <Heart className="fill-current" /> {lives}
                </div>
                {weaponCount > 0 && (
                    <div className="flex items-center text-blue-300 gap-1 bg-black/70 border-2 border-blue-900 p-2 rounded animate-pulse">
                        <Sword className="fill-current" /> {weaponCount}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-4 pointer-events-auto">
                <div className="flex items-center text-yellow-400 gap-1 bg-black/70 border-2 border-yellow-900 p-2 rounded">
                    <Smile className="fill-current" /> {score}
                </div>
            </div>
        </div>
        
        {/* Boss Health Bar */}
        {bossEntity && (
            <div className="self-center animate-bounce-slow">
                 <div className="bg-black/80 border-2 border-purple-500 p-2 rounded-lg flex flex-col items-center">
                    <span className="text-purple-300 text-xs font-bold uppercase tracking-widest mb-1">Logic Lich</span>
                    <div className="flex gap-1">
                        {[...Array(bossEntity.maxHealth || 3)].map((_, i) => (
                            <div 
                                key={i} 
                                className={`w-8 h-4 rounded-sm border border-purple-900 ${
                                    i < (bossEntity.health || 0) ? 'bg-purple-500' : 'bg-gray-800'
                                }`}
                            ></div>
                        ))}
                    </div>
                 </div>
            </div>
        )}
      </div>

      <div 
        className="relative bg-black border-8 border-gray-700 shadow-2xl overflow-hidden"
        style={{ width: VIEWPORT_W_PX, height: VIEWPORT_H_PX }}
      >
        <div 
            className="absolute transition-transform duration-300 ease-out"
            style={{ 
                width: GRID_W * TILE_SIZE, 
                height: GRID_H * TILE_SIZE,
                transform: `translate(${camX}px, ${camY}px)`
            }}
        >
            {grid.map((row, y) => row.map((tile, x) => (
                <div 
                    key={`${x}-${y}`}
                    className="absolute flex items-center justify-center transition-all duration-300"
                    style={{
                        width: TILE_SIZE,
                        height: TILE_SIZE,
                        left: x * TILE_SIZE,
                        top: y * TILE_SIZE,
                        backgroundColor: tile.type === 'WALL' ? '#4a5568' : '#1a202c', 
                    }}
                >
                    {tile.type !== 'WALL' && <div className="absolute inset-1 border border-gray-800 opacity-20"></div>}

                    {tile.type === 'WALL' && (
                        <div className="w-full h-full bg-gray-600 border-t-4 border-l-4 border-gray-500 border-b-8 border-r-8 border-gray-800"></div>
                    )}

                    {tile.type === 'DOOR_CLOSED' && (
                        <div className="w-full h-full bg-yellow-700 border-4 border-yellow-900 flex items-center justify-center cursor-pointer hover:bg-yellow-600 transition-colors">
                            <span className="text-yellow-200 text-2xl font-bold">?</span>
                        </div>
                    )}
                    {tile.type === 'DOOR_LOCKED' && (
                        <div className="w-full h-full bg-gray-800 border-4 border-black flex items-center justify-center grayscale">
                            <Lock size={24} className="text-gray-500" />
                        </div>
                    )}
                    {tile.type === 'DOOR_OPEN' && (
                        <div className="w-full h-full bg-black/50 border-4 border-dashed border-gray-600 flex items-center justify-center">
                            <DoorOpen size={24} className="text-gray-500" />
                        </div>
                    )}

                    {x === exitPos.x && y === exitPos.y && (
                        <div className="absolute inset-0 flex items-center justify-center animate-spin-slow text-purple-500">
                            <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
                        </div>
                    )}

                    {tile.item?.type === 'HEART' && <Heart className="text-red-500 fill-red-500 animate-bounce" size={20} />}
                    {tile.item?.type === 'WEAPON' && <Sword className="text-blue-400 fill-blue-400 animate-pulse" size={24} />}
                    {tile.item?.type === 'EMOJI' && <Smile className="text-yellow-400 fill-yellow-400 animate-bounce" size={20} />}
                </div>
            )))}

            {/* Player */}
            <div 
                className="absolute transition-all duration-200 z-10"
                style={{ 
                    width: TILE_SIZE, 
                    height: TILE_SIZE, 
                    left: player.x * TILE_SIZE, 
                    top: player.y * TILE_SIZE 
                }}
            >
                <div className="w-full h-full flex items-center justify-center animate-bounce-slow">
                    <User className="text-green-400 fill-green-900 drop-shadow-lg" size={40} strokeWidth={2.5} />
                </div>
            </div>

            {/* Monsters */}
            {monsters.map(m => {
               const mType = m.monsterType || 'GHOST';
               return (
                <div 
                    key={m.id}
                    className="absolute transition-all duration-300 ease-linear z-10"
                    style={{ 
                        width: TILE_SIZE, 
                        height: TILE_SIZE, 
                        left: m.x * TILE_SIZE, 
                        top: m.y * TILE_SIZE 
                    }}
                >
                    <div className="w-full h-full flex items-center justify-center">
                        {mType === 'GHOST' && <Ghost className="text-red-600 fill-red-900 drop-shadow-lg" size={40} />}
                        {mType === 'BUG' && <Bug className="text-orange-500 fill-orange-900 drop-shadow-lg" size={36} />}
                        {mType === 'BOT' && <Bot className="text-lime-500 fill-lime-900 drop-shadow-lg" size={38} />}
                        {mType === 'BOSS' && (
                            <div className="relative">
                                <Crown className="text-purple-400 fill-yellow-400 drop-shadow-lg animate-pulse" size={56} strokeWidth={2} />
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black px-1 rounded text-[10px] text-red-500 font-bold border border-red-900">
                                    LICH
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )})}
        </div>
      </div>

      <div className="mt-4 text-gray-500 text-sm">
        Use Arrow Keys or WASD to Move. {isQuickMode ? 'Quick Mode: Map is smaller.' : 'Open 3 Doors to summon the Lich!'}
      </div>

      {activeProblem && (
        <MathModal 
            problem={activeProblem.problem} 
            onAnswer={handleMathAnswer} 
        />
      )}

    </div>
  );
};

export default GameLoop;
