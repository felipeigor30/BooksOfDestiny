import type { TileType } from "./arena";
import type {
    PanelButtonLayout,
    PanelButtonStyle,
    RectLayout,
    TextLayout,
    TileStyle,
} from "../types/battle";

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
export const P0_ABILITY_PANEL_LAYOUT: {
    panel: RectLayout;
    title: TextLayout;
    buttons: {
        fireball: PanelButtonLayout;
        shield: PanelButtonLayout;
        explosion: PanelButtonLayout;
        flameInvocation: PanelButtonLayout;
        passTurn: PanelButtonLayout;
    };
    concentrationText: TextLayout;
} = {
    panel: {
        x: 835,
        y: 590,
        width: 292,
        height: 190,
    },
    title: {
        x: 700,
        y: 502,
        fontSize: "13px",
    },
    buttons: {
        fireball: {
            x: 765,
            y: 535,
            width: 126,
            height: 35,
            label: "🔥 Bola de Fogo",
            fontSize: "11px",
        },
        shield: {
            x: 905,
            y: 535,
            width: 126,
            height: 35,
            label: "🛡 Escudo",
            fontSize: "11px",
        },
        explosion: {
            x: 765,
            y: 576,
            width: 126,
            height: 35,
            label: "💥 Explosão",
            fontSize: "11px",
        },
        flameInvocation: {
            x: 905,
            y: 576,
            width: 126,
            height: 35,
            label: "☄ Invocação",
            fontSize: "11px",
        },
        passTurn: {
            x: 835,
            y: 617,
            width: 266,
            height: 34,
            label: "⏭ Passar Turno",
            fontSize: "12px",
        },
    },
    concentrationText: {
        x: 700,
        y: 648,
        fontSize: "12px",
    },
};
export const P0_COMBAT_HUD_LAYOUT = {
    hpLabel: {
        x: 82,
        y: 114,
        fontSize: "13px",
    },
    hpBarBackground: {
        x: 123,
        y: 121,
        width: 142,
        height: 14,
    },
    hpBar: {
        x: 126,
        y: 121,
        width: 136,
        height: 8,
    },
    hpText: {
        x: 274,
        y: 114,
        fontSize: "13px",
    },
    shieldLabel: {
        x: 82,
        y: 137,
        fontSize: "12px",
    },
    shieldText: {
        x: 123,
        y: 137,
        fontSize: "12px",
    },
    roundText: {
        x: 932,
        y: 114,
        fontSize: "14px",
    },
} as const;
