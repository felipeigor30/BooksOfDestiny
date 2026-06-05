import type { TileType } from "./arena";
import type { PanelButtonStyle, TileStyle } from "../types/battle";

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

export const P0_PANEL_BUTTON_STYLES: Record<
    "defaultAbility" | "fireball" | "explosion" | "passTurn",
    PanelButtonStyle
> = {
    defaultAbility: {
        enabledFillColor: 0x4b2918,
        enabledStrokeColor: 0xdc8732,
        enabledTextColor: "#ffd493",
        disabledFillColor: 0x22181a,
        disabledStrokeColor: 0x4e352a,
        disabledTextColor: "#7e6c60",
    },
    fireball: {
        enabledFillColor: 0x502017,
        enabledStrokeColor: 0xd06a2b,
        enabledTextColor: "#ffd08a",
        disabledFillColor: 0x22181a,
        disabledStrokeColor: 0x4e352a,
        disabledTextColor: "#7e6c60",
    },
    explosion: {
        enabledFillColor: 0x65241a,
        enabledStrokeColor: 0xf08a35,
        enabledTextColor: "#ffd07d",
        disabledFillColor: 0x22181a,
        disabledStrokeColor: 0x4e352a,
        disabledTextColor: "#71655b",
    },
    passTurn: {
        enabledFillColor: 0x302119,
        enabledStrokeColor: 0xb67b39,
        enabledTextColor: "#f0ca83",
        disabledFillColor: 0x21181a,
        disabledStrokeColor: 0x4e352a,
        disabledTextColor: "#71655b",
    },
};
