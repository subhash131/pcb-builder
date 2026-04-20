import { create } from 'zustand';
import { Board, Component } from '@workspace/core';
import { temporal } from 'zundo';
import { immer } from 'zustand/middleware/immer';

interface BoardState {
  board: Board;
  addComponent: (component: Component) => void;
  connectPins: (compA: string, pinA: string, compB: string, pinB: string, netId: string) => void;
}

export const useBoardStore = create<BoardState>()(
  temporal(
    immer((set) => ({
      board: new Board(),
      addComponent: (component) => 
        set((state) => {
          state.board.addComponent(component);
        }),
      connectPins: (compA, pinA, compB, pinB, netId) =>
        set((state) => {
          state.board.connectPins(compA, pinA, compB, pinB, netId);
        }),
    }))
  )
);
