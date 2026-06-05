import type { TileType } from "./arena";
import type { TileStyle } from "../types/battle";

export const P0_GRID_CONFIG = {
    rows: 8,
    columns: 8,
} as const;

export const P0_ISOMETRIC_CONFIG = {
    tileWidth: 96,
    tileHeight: 48,
    arenaOriginX: 512,
    arenaOriginY: 184,
    entityFootOffsetY: 6,
    rockFootOffsetY: 2,
} as const;

export const P0_TILE_COLORS = {
    stroke: 0x6b4730,
    hover: 0x80503a,
    selected: 0xc45725,
    movement: 0x315b55,
    attackRange: 0x71302a,
    attackTarget: 0xb54427,
    explosionRange: 0x67311f,
    explosionArea: 0xb34820,
    burningGround: 0x6e2619,
} as const;

export const P0_TILE_STYLES: Record<TileType, TileStyle> = {
    ground: {
        color: 0x3b2923,
        label: "Chão comum",
    },
    corrupted: {
        color: 0x401d2b,
        label: "Terreno corrompido",
    },
    rock: {
        color: 0x26232a,
        label: "Rocha — movimento bloqueado",
    },
};
