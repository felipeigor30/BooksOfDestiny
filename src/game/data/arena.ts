export type TileType = 'ground' | 'corrupted' | 'rock';

export interface GridPosition {
    row: number;
    column: number;
}

/**
 * Mapa inicial do P0.
 *
 * G = Chão comum
 * C = Terreno corrompido
 * R = Rocha bloqueadora
 */
export const P0_ARENA_MAP: TileType[][] = [
    ['ground', 'ground', 'rock', 'ground', 'ground', 'corrupted', 'ground', 'ground'],
    ['ground', 'corrupted', 'ground', 'ground', 'rock', 'ground', 'ground', 'corrupted'],
    ['ground', 'ground', 'ground', 'corrupted', 'ground', 'ground', 'rock', 'ground'],
    ['corrupted', 'rock', 'ground', 'ground', 'ground', 'corrupted', 'ground', 'ground'],
    ['ground', 'ground', 'corrupted', 'rock', 'ground', 'ground', 'ground', 'corrupted'],
    ['ground', 'rock', 'ground', 'ground', 'corrupted', 'ground', 'rock', 'ground'],
    ['ground', 'ground', 'ground', 'corrupted', 'ground', 'ground', 'ground', 'ground'],
    ['ground', 'corrupted', 'ground', 'ground', 'ground', 'rock', 'corrupted', 'ground']
];

export const INITIAL_PLAYER_POSITION: GridPosition = {
    row: 6,
    column: 1
};

export const PLAYER_MOVEMENT_RANGE = 4;