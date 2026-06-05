import type { TileType } from "./arena";
import type {
    ColoredRectLayout,
    LegendLayout,
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
export const P0_SCENE_TEXT_LAYOUT = {
    title: {
        x: 512,
        y: 34,
        text: "BOOKS OF DESTINY",
        fontSize: "34px",
    },
    subtitle: {
        x: 512,
        y: 76,
        text: "P0 — ARENA DE COMBATE",
        fontSize: "16px",
    },
    instruction: {
        x: 512,
        y: 132,
        initialText:
            "Escolha uma habilidade, movimente o Cavaleiro ou passe o turno",
        fontSize: "14px",
    },
    prototypeLabel: {
        x: 36,
        y: 730,
        text: "PROTÓTIPO DE COMBATE TÁTICO",
        fontSize: "12px",
    },
    footerBox: {
        x: 512,
        y: 636,
        width: 570,
        height: 48,
    },
    coordinateText: {
        x: 512,
        y: 636,
        initialText: "Nenhuma casa selecionada",
        fontSize: "16px",
    },
    statusText: {
        x: 512,
        y: 679,
        initialText: "Turno do Jogador — Selecione uma ação",
        fontSize: "16px",
    },
} as const;
export const P0_LEGEND_LAYOUT: LegendLayout = {
    box: {
        x: 512,
        y: 706,
        width: 650,
        height: 30,
    },
    y: 706,
    items: [
        {
            x: 280,
            label: "◆ Chão",
            color: "#96705b",
        },
        {
            x: 410,
            label: "✦ Corrupção",
            color: "#bd4d51",
        },
        {
            x: 563,
            label: "▲ Rocha",
            color: "#968981",
        },
        {
            x: 680,
            label: "F Cavaleiro",
            color: "#e4aa52",
        },
        {
            x: 785,
            label: "L Lobo",
            color: "#e6817d",
        },
    ],
};

export const P0_BACKGROUND_LAYOUT: {
    screen: ColoredRectLayout;
    battleFrame: ColoredRectLayout;
} = {
    screen: {
        x: 512,
        y: 384,
        width: 1024,
        height: 768,
        fillColor: 0x09070b,
        alpha: 1,
        depth: -10,
    },
    battleFrame: {
        x: 512,
        y: 400,
        width: 930,
        height: 590,
        fillColor: 0x120d11,
        alpha: 0.92,
        strokeColor: 0x3c261c,
        strokeWidth: 2,
        depth: -5,
    },
};
export const P0_UNIT_MARKER_CONFIG = {
    player: {
        shadow: {
            x: 0,
            y: 1,
            width: 48,
            height: 18,
            fillColor: 0x000000,
            alpha: 0.5,
        },
        body: {
            x: 0,
            y: -24,
            radius: 19,
            fillColor: 0x9f3820,
            strokeWidth: 3,
            strokeColor: 0xf2b34b,
        },
        symbol: {
            x: 0,
            y: -25,
            fontSize: "21px",
            color: "#ffe6a8",
        },
        label: {
            x: 0,
            y: -55,
            fontSize: "11px",
            color: "#f0c586",
            backgroundColor: "#211410",
            paddingX: 6,
            paddingY: 3,
        },
        depthOffset: 50,
    },
    enemy: {
        shadow: {
            x: 0,
            y: 1,
            width: 46,
            height: 16,
            fillColor: 0x000000,
            alpha: 0.55,
        },
        body: {
            x: 0,
            y: -22,
            radius: 18,
            fillColor: 0x231823,
            strokeWidth: 3,
            strokeColor: 0xc94439,
        },
        symbol: {
            x: 0,
            y: -23,
            fontSize: "20px",
            color: "#f1a0a0",
        },
        label: {
            x: 0,
            y: -57,
            fontSize: "11px",
            color: "#e6b4a6",
            backgroundColor: "#201014",
            paddingX: 6,
            paddingY: 3,
        },
        healthBackground: {
            x: 0,
            y: -42,
            width: 48,
            height: 5,
            fillColor: 0x241215,
            strokeWidth: 1,
            strokeColor: 0x4a292c,
        },
        healthBar: {
            x: -23,
            y: -42,
            width: 46,
            height: 3,
            fillColor: 0xb43a39,
        },
        depthOffset: 50,
    },
} as const;
export const P0_TERRAIN_DECORATION_CONFIG = {
    rock: {
        shadow: {
            x: 0,
            y: 3,
            width: 46,
            height: 15,
            fillColor: 0x09080b,
            alpha: 0.65,
        },
        body: {
            x: 0,
            y: -14,
            points: [2, 32, 8, 15, 18, 4, 30, 0, 42, 14, 45, 32],
            fillColor: 0x514850,
            strokeWidth: 2,
            strokeColor: 0x28232a,
            originX: 0.5,
            originY: 1,
        },
        light: {
            x: -5,
            y: -19,
            points: [0, 18, 5, 6, 14, 0, 21, 8, 12, 12],
            fillColor: 0x766b67,
            alpha: 0.9,
            originX: 0.5,
            originY: 1,
        },
        depthOffset: 36,
    },
    corruption: {
        symbol: "✦",
        yOffset: 0,
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: "#b53e45",
        stroke: "#251018",
        strokeThickness: 3,
        depthOffset: 1,
    },
} as const;
export const P0_EFFECTS_CONFIG = {
    burnMarker: {
        x: 22,
        y: -24,
        symbol: "🔥",
        fontSize: "16px",
    },
    burningGround: {
        symbol: "♨",
        fontFamily: "Georgia, serif",
        fontSize: "22px",
        fontStyle: "bold",
        color: "#ff6527",
        stroke: "#3b130d",
        strokeThickness: 3,
        depthOffset: 3,
    },
    floatingDamage: {
        yOffset: -78,
        moveY: -24,
        duration: 650,
        fontFamily: "Georgia, serif",
        fontSize: "17px",
        fontStyle: "bold",
        stroke: "#32130d",
        strokeThickness: 3,
        depth: 4000,
    },
    burnFloatingDamage: {
        yOffset: -78,
        moveY: -24,
        duration: 620,
        fontFamily: "Georgia, serif",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#ff8533",
        stroke: "#34120d",
        strokeThickness: 3,
        depth: 2000,
    },
    shieldAura: {
        yOffset: -23,
        radius: 29,
        fillColor: 0xf57c20,
        alpha: 0.12,
        strokeWidth: 3,
        strokeColor: 0xffa43c,
        strokeAlpha: 0.9,
        depthOffset: 1,
        tweenAlphaFrom: 0.55,
        tweenAlphaTo: 1,
        tweenScaleFrom: 0.95,
        tweenScaleTo: 1.08,
        duration: 540,
    },
    fireballProjectile: {
        yOffset: -25,
        destinationYOffset: -23,
        glowRadius: 11,
        glowColor: 0xff4e16,
        glowAlpha: 0.25,
        projectileRadius: 7,
        projectileColor: 0xffa329,
        projectileStrokeWidth: 2,
        projectileStrokeColor: 0xffe08b,
        glowDepth: 1000,
        projectileDepth: 1001,
        duration: 340,
    },
    explosionImpact: {
        radius: 10,
        fillColor: 0xff731c,
        alpha: 0.75,
        strokeWidth: 3,
        strokeColor: 0xffc34d,
        depth: 3000,
        scale: 5,
        duration: 430,
    },
    flameInvocationMarker: {
        yOffset: -42,
        symbol: "☄",
        fontFamily: "Georgia, serif",
        fontSize: "34px",
        fontStyle: "bold",
        color: "#ffb347",
        stroke: "#3b130d",
        strokeThickness: 4,
        depth: 5000,
        tweenYOffset: -10,
        tweenAlphaFrom: 0.65,
        tweenAlphaTo: 1,
        duration: 650,
    },
    flameInvocationImpact: {
        radius: 12,
        fillColor: 0xff8a1c,
        alpha: 0.85,
        strokeWidth: 4,
        strokeColor: 0xffdc73,
        depth: 6000,
        scale: 7,
        duration: 620,
    },
} as const;
