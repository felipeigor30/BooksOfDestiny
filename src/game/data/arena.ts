export type TileType = "ground" | "corrupted" | "rock";

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
    [
        "ground",
        "ground",
        "rock",
        "ground",
        "ground",
        "corrupted",
        "ground",
        "ground",
    ],
    [
        "ground",
        "corrupted",
        "ground",
        "ground",
        "rock",
        "ground",
        "ground",
        "corrupted",
    ],
    [
        "ground",
        "ground",
        "ground",
        "corrupted",
        "ground",
        "ground",
        "rock",
        "ground",
    ],
    [
        "corrupted",
        "rock",
        "ground",
        "ground",
        "ground",
        "corrupted",
        "ground",
        "ground",
    ],
    [
        "ground",
        "ground",
        "corrupted",
        "rock",
        "ground",
        "ground",
        "ground",
        "corrupted",
    ],
    [
        "ground",
        "rock",
        "ground",
        "ground",
        "corrupted",
        "ground",
        "rock",
        "ground",
    ],
    [
        "ground",
        "ground",
        "ground",
        "corrupted",
        "ground",
        "ground",
        "ground",
        "ground",
    ],
    [
        "ground",
        "corrupted",
        "ground",
        "ground",
        "ground",
        "rock",
        "corrupted",
        "ground",
    ],
];

export const INITIAL_PLAYER_POSITION: GridPosition = {
    row: 6,
    column: 1,
};

export const PLAYER_MOVEMENT_RANGE = 4;

export interface InitialEnemy {
    id: string;
    name: string;
    symbol: string;
    maxHp: number;
    damage: number;
    movementRange: number;
    position: GridPosition;
}

export const INITIAL_ENEMIES: InitialEnemy[] = [
    {
        id: "wolf-1",
        name: "Lobo Maculado",
        symbol: "L",
        maxHp: 45,
        damage: 12,
        movementRange: 3,
        position: {
            row: 2,
            column: 4,
        },
    },
    {
        id: "wolf-2",
        name: "Lobo Maculado",
        symbol: "L",
        maxHp: 45,
        damage: 12,
        movementRange: 3,
        position: {
            row: 1,
            column: 6,
        },
    },
    {
        id: "alpha-corrupted",
        name: "Alpha Corrompido",
        symbol: "A",
        maxHp: 160,
        damage: 18,
        movementRange: 2,
        position: {
            row: 0,
            column: 7,
        },
    },
];
