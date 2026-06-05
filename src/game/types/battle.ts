import { GameObjects } from "phaser";
import { GridPosition, TileType } from "../data/arena";

export interface ArenaTile {
    row: number;
    column: number;
    type: TileType;
    baseColor: number;
    polygon: GameObjects.Polygon;
    decoration?: GameObjects.GameObject;
}

export interface TileStyle {
    color: number;
    label: string;
}

export interface EnemyUnit {
    id: string;
    name: string;
    symbol: string;
    maxHp: number;
    currentHp: number;
    damage: number;
    movementRange: number;
    position: GridPosition;
    marker: GameObjects.Container;
    healthBar: GameObjects.Rectangle;
    defeated: boolean;

    burningRounds: number;
    burnDamage: number;
    burnMarker?: GameObjects.Text;
}

export interface BurningGroundEffect {
    key: string;
    remainingRounds: number;
    damage: number;
    marker: GameObjects.Text;
}

export interface ActiveFlameInvocation {
    center: GridPosition;
    remainingTurns: number;
    areaTileKeys: Set<string>;
    marker: GameObjects.Text;
}

export interface PanelButtonStyle {
    enabledFillColor: number;
    enabledStrokeColor: number;
    enabledTextColor: string;
    disabledFillColor: number;
    disabledStrokeColor: number;
    disabledTextColor: string;
}

export interface RectLayout {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface TextLayout {
    x: number;
    y: number;
    fontSize: string;
}

export interface PanelButtonLayout extends RectLayout {
    label: string;
    fontSize: string;
}
