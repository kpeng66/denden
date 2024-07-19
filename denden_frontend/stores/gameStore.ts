import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameState {
  timer: number;
  gameOver: boolean;
  gameActive: boolean;
  equation: string;
  score: number;
  setTimer: (time: number) => void;
  startGame: () => void;
  endGame: () => void;
  setEquation: (equation: string) => void;
  updateScore: (score: number) => void;
}

const gameStateCreator: StateCreator<GameState> = (set) => ({
  timer: 0,
  gameOver: false,
  gameActive: false,
  equation: '',
  score: 0,
  setTimer: (time) => set({ timer: time }),
  startGame: () => set({ gameActive: true, gameOver: false }),
  endGame: () => set({ gameActive: false, gameOver: true }),
  setEquation: (equation) => set({ equation }),
  updateScore: (score) => set((state) => ({ score: state.score + score })),
});

const useGameStore = create<GameState>()(
  persist(gameStateCreator, {
    name: 'game-storage',
  })
);

export default useGameStore;
