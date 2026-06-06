import { GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";
import {
    FIREBALL,
    FLAME_INVOCATION,
    IGNEOUS_SHIELD,
    IGNEOUS_EXPLOSION,
} from "../data/abilities";
import { FIRE_KNIGHT_INITIAL_STATS } from "../data/player";
import {
    GridPosition,
    INITIAL_ENEMIES,
    INITIAL_PLAYER_POSITION,
    P0_ARENA_MAP,
    PLAYER_MOVEMENT_RANGE,
    TileType,
} from "../data/arena";
import {
    P0_ABILITY_PANEL_LAYOUT,
    P0_BACKGROUND_LAYOUT,
    P0_BOSS_HUD_LAYOUT,
    P0_COMBAT_HUD_LAYOUT,
    P0_EFFECTS_CONFIG,
    P0_GRID_CONFIG,
    P0_ISOMETRIC_CONFIG,
    P0_LEGEND_LAYOUT,
    P0_PANEL_BUTTON_STYLES,
    P0_SCENE_TEXT_LAYOUT,
    P0_TERRAIN_DECORATION_CONFIG,
    P0_TILE_COLORS,
    P0_TILE_STYLES,
    P0_UNIT_MARKER_CONFIG,
} from "../data/battleConfig";
import {
    ActiveFlameInvocation,
    ArenaTile,
    BurningGroundEffect,
    ColoredRectLayout,
    EnemyUnit,
    PanelButtonStyle,
    TileStyle,
} from "../types/battle";
import {
    calculateSquareAreaKeys,
    getManhattanDistance,
    getPositionKey,
    isWithinGrid,
} from "../utils/gridUtils";

interface PanelButton {
    background: GameObjects.Rectangle;
    label: GameObjects.Text;
}

export class BattleScene extends Scene {
    private readonly rows = P0_GRID_CONFIG.rows;
    private readonly columns = P0_GRID_CONFIG.columns;

    private readonly tileWidth = P0_ISOMETRIC_CONFIG.tileWidth;
    private readonly tileHeight = P0_ISOMETRIC_CONFIG.tileHeight;

    private readonly arenaOriginX = P0_ISOMETRIC_CONFIG.arenaOriginX;
    private readonly arenaOriginY = P0_ISOMETRIC_CONFIG.arenaOriginY;

    private readonly tileStrokeColor = P0_TILE_COLORS.stroke;
    private readonly hoverColor = P0_TILE_COLORS.hover;
    private readonly selectedColor = P0_TILE_COLORS.selected;
    private readonly movementColor = P0_TILE_COLORS.movement;

    private readonly attackRangeColor = P0_TILE_COLORS.attackRange;
    private readonly attackTargetColor = P0_TILE_COLORS.attackTarget;
    private readonly explosionRangeColor = P0_TILE_COLORS.explosionRange;
    private readonly explosionAreaColor = P0_TILE_COLORS.explosionArea;
    private readonly burningGroundColor = P0_TILE_COLORS.burningGround;

    private readonly entityFootOffsetY = P0_ISOMETRIC_CONFIG.entityFootOffsetY;
    private readonly rockFootOffsetY = P0_ISOMETRIC_CONFIG.rockFootOffsetY;
    private readonly showDebugTileCoordinates = false;

    private readonly tileStyles: Record<TileType, TileStyle> = P0_TILE_STYLES;

    private tiles: ArenaTile[] = [];
    private selectedTile?: ArenaTile;

    private playerPosition: GridPosition = { ...INITIAL_PLAYER_POSITION };
    private playerMarker?: GameObjects.Container;

    private readonly playerName = FIRE_KNIGHT_INITIAL_STATS.name;
    private readonly playerSymbol = FIRE_KNIGHT_INITIAL_STATS.symbol;
    private readonly playerMaxHp = FIRE_KNIGHT_INITIAL_STATS.maxHp;

    private playerCurrentHp = FIRE_KNIGHT_INITIAL_STATS.maxHp;
    private playerHealthBar!: GameObjects.Rectangle;
    private playerHpText!: GameObjects.Text;

    private playerShield = FIRE_KNIGHT_INITIAL_STATS.initialShield;
    private playerShieldText!: GameObjects.Text;
    private playerShieldAura?: GameObjects.Arc;

    private enemies: EnemyUnit[] = [];

    private bossEnemy?: EnemyUnit;
    private bossHealthBarBackground?: GameObjects.Rectangle;
    private bossHealthBar?: GameObjects.Rectangle;
    private bossHealthText?: GameObjects.Text;
    private bossNameText?: GameObjects.Text;

    private round = 1;
    private roundText!: GameObjects.Text;

    private enemyTurnInProgress = false;
    private battleEnded = false;

    private movementMode = false;
    private movementAvailable = true;
    private canChooseAbility = true;
    private fireballTargetingMode = false;

    private reachableTileKeys = new Set<string>();
    private attackTileKeys = new Set<string>();

    private explosionTargetingMode = false;
    private explosionTargetTileKeys = new Set<string>();
    private explosionAreaPreviewTileKeys = new Set<string>();

    private flameInvocationTargetingMode = false;
    private flameInvocationTargetTileKeys = new Set<string>();
    private flameInvocationAreaPreviewTileKeys = new Set<string>();
    private activeFlameInvocation?: ActiveFlameInvocation;

    private burningGroundEffects = new Map<string, BurningGroundEffect>();

    private concentration = FIRE_KNIGHT_INITIAL_STATS.initialConcentration;

    private coordinateText!: GameObjects.Text;
    private instructionText!: GameObjects.Text;
    private statusText!: GameObjects.Text;

    private concentrationText!: GameObjects.Text;

    private fireballButton!: PanelButton;
    private shieldButton!: PanelButton;
    private explosionButton!: PanelButton;
    private flameInvocationButton!: PanelButton;
    private passTurnButton!: PanelButton;

    constructor() {
        super("BattleScene");
    }

    create(): void {
        this.cameras.main.setBackgroundColor("#09070b");

        this.createBackground();
        this.createHeader();
        this.createCombatHud();
        this.createArena();
        this.createPlayerMarker();
        this.createEnemies();
        this.createBossHud();
        this.createFooter();
        this.createAbilityPanel();
        this.createLegend();
        this.refreshAllTiles();

        EventBus.emit("current-scene-ready", this);
    }
    private createConfiguredRectangle(
        config: ColoredRectLayout,
    ): GameObjects.Rectangle {
        const rectangle = this.add.rectangle(
            config.x,
            config.y,
            config.width,
            config.height,
            config.fillColor,
            config.alpha ?? 1,
        );

        if (config.strokeColor !== undefined) {
            rectangle.setStrokeStyle(
                config.strokeWidth ?? 1,
                config.strokeColor,
                1,
            );
        }

        if (config.depth !== undefined) {
            rectangle.setDepth(config.depth);
        }

        return rectangle;
    }

    private createBackground(): void {
        const background = P0_BACKGROUND_LAYOUT;
        const textLayout = P0_SCENE_TEXT_LAYOUT;

        this.createConfiguredRectangle(background.screen);
        this.createConfiguredRectangle(background.battleFrame);

        this.add.text(
            textLayout.prototypeLabel.x,
            textLayout.prototypeLabel.y,
            textLayout.prototypeLabel.text,
            {
                fontFamily: "Georgia, serif",
                fontSize: textLayout.prototypeLabel.fontSize,
                color: "#7c5a42",
            },
        );
    }

    private createHeader(): void {
        const layout = P0_SCENE_TEXT_LAYOUT;

        this.add
            .text(layout.title.x, layout.title.y, layout.title.text, {
                fontFamily: "Georgia, serif",
                fontSize: layout.title.fontSize,
                fontStyle: "bold",
                color: "#e9c27c",
                stroke: "#32150d",
                strokeThickness: 5,
            })
            .setOrigin(0.5);

        this.add
            .text(layout.subtitle.x, layout.subtitle.y, layout.subtitle.text, {
                fontFamily: "Georgia, serif",
                fontSize: layout.subtitle.fontSize,
                color: "#c16432",
            })
            .setOrigin(0.5);

        this.instructionText = this.add
            .text(
                layout.instruction.x,
                layout.instruction.y,
                layout.instruction.initialText,
                {
                    fontFamily: "Arial",
                    fontSize: layout.instruction.fontSize,
                    color: "#9d8977",
                },
            )
            .setOrigin(0.5);
    }

    private createCombatHud(): void {
        const layout = P0_COMBAT_HUD_LAYOUT;

        this.add.text(layout.hpLabel.x, layout.hpLabel.y, "HP", {
            fontFamily: "Georgia, serif",
            fontSize: layout.hpLabel.fontSize,
            fontStyle: "bold",
            color: "#dfb276",
        });

        this.add
            .rectangle(
                layout.hpBarBackground.x,
                layout.hpBarBackground.y,
                layout.hpBarBackground.width,
                layout.hpBarBackground.height,
                0x251619,
                1,
            )
            .setOrigin(0, 0.5)
            .setStrokeStyle(1, 0x71402e, 1);

        this.playerHealthBar = this.add
            .rectangle(
                layout.hpBar.x,
                layout.hpBar.y,
                layout.hpBar.width,
                layout.hpBar.height,
                0xb63d32,
                1,
            )
            .setOrigin(0, 0.5);

        this.playerHpText = this.add.text(
            layout.hpText.x,
            layout.hpText.y,
            `${this.playerCurrentHp} / ${this.playerMaxHp}`,
            {
                fontFamily: "Georgia, serif",
                fontSize: layout.hpText.fontSize,
                color: "#e5c79b",
            },
        );

        this.add.text(layout.shieldLabel.x, layout.shieldLabel.y, "ESC", {
            fontFamily: "Georgia, serif",
            fontSize: layout.shieldLabel.fontSize,
            fontStyle: "bold",
            color: "#db9357",
        });

        this.playerShieldText = this.add.text(
            layout.shieldText.x,
            layout.shieldText.y,
            `${this.playerShield} / ${IGNEOUS_SHIELD.shieldAbsorption ?? 0}`,
            {
                fontFamily: "Georgia, serif",
                fontSize: layout.shieldText.fontSize,
                color: "#816a5b",
            },
        );

        this.roundText = this.add
            .text(
                layout.roundText.x,
                layout.roundText.y,
                `RODADA ${this.round}`,
                {
                    fontFamily: "Georgia, serif",
                    fontSize: layout.roundText.fontSize,
                    fontStyle: "bold",
                    color: "#d2753e",
                },
            )
            .setOrigin(1, 0);
    }

    private createArena(): void {
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                const position = this.gridToIsometric(row, column);
                const type = P0_ARENA_MAP[row][column];
                const style = this.tileStyles[type];

                const tilePolygon = this.add
                    .polygon(
                        position.x,
                        position.y,
                        [
                            this.tileWidth / 2,
                            0,
                            this.tileWidth,
                            this.tileHeight / 2,
                            this.tileWidth / 2,
                            this.tileHeight,
                            0,
                            this.tileHeight / 2,
                        ],
                        style.color,
                        1,
                    )
                    .setOrigin(0.5, 0.5)
                    .setStrokeStyle(2, this.tileStrokeColor, 1)
                    .setDepth(position.y)
                    .setInteractive({ useHandCursor: true });
                const tile: ArenaTile = {
                    row,
                    column,
                    type,
                    baseColor: style.color,
                    polygon: tilePolygon,
                };

                tilePolygon.on("pointerover", () => {
                    if (
                        this.flameInvocationTargetingMode &&
                        this.isFlameInvocationTargetTile(tile)
                    ) {
                        this.previewFlameInvocationArea(tile);
                        return;
                    }

                    if (
                        this.explosionTargetingMode &&
                        this.isExplosionTargetTile(tile)
                    ) {
                        this.previewExplosionArea(tile);
                        return;
                    }

                    if (!this.isSelected(tile) && !this.isReachable(tile)) {
                        tilePolygon.setFillStyle(this.hoverColor, 1);
                    }
                });

                tilePolygon.on("pointerout", () => {
                    if (this.flameInvocationTargetingMode) {
                        this.flameInvocationAreaPreviewTileKeys.clear();
                        this.refreshAllTiles();
                        return;
                    }

                    if (this.explosionTargetingMode) {
                        this.explosionAreaPreviewTileKeys.clear();
                        this.refreshAllTiles();
                        return;
                    }

                    this.refreshTileAppearance(tile);
                });

                tilePolygon.on("pointerdown", () => {
                    this.handleTileClick(tile);
                });

                this.tiles.push(tile);
                this.createTerrainDecoration(tile);
                this.createTileDebugCoordinate(tile, position.x, position.y);
            }
        }
    }

    private previewExplosionArea(centerTile: ArenaTile): void {
        const radius = IGNEOUS_EXPLOSION.areaRadius ?? 1;

        this.explosionAreaPreviewTileKeys = this.calculateAreaTiles(
            centerTile.row,
            centerTile.column,
            radius,
        );

        this.refreshAllTiles();
    }

    private previewFlameInvocationArea(centerTile: ArenaTile): void {
        const radius = FLAME_INVOCATION.areaRadius ?? 1;

        this.flameInvocationAreaPreviewTileKeys = this.calculateAreaTiles(
            centerTile.row,
            centerTile.column,
            radius,
        );

        this.refreshAllTiles();
    }

    private isFlameInvocationTargetTile(tile: ArenaTile): boolean {
        return this.flameInvocationTargetTileKeys.has(
            this.getPositionKey(tile.row, tile.column),
        );
    }

    private isInFlameInvocationPreview(tile: ArenaTile): boolean {
        return this.flameInvocationAreaPreviewTileKeys.has(
            this.getPositionKey(tile.row, tile.column),
        );
    }

    private calculateAreaTiles(
        centerRow: number,
        centerColumn: number,
        radius: number,
    ): Set<string> {
        return calculateSquareAreaKeys({
            center: {
                row: centerRow,
                column: centerColumn,
            },
            radius,
            gridSize: {
                rows: this.rows,
                columns: this.columns,
            },
            isBlocked: (position) =>
                P0_ARENA_MAP[position.row][position.column] === "rock",
        });
    }

    private isInExplosionPreview(tile: ArenaTile): boolean {
        return this.explosionAreaPreviewTileKeys.has(
            this.getPositionKey(tile.row, tile.column),
        );
    }

    private createTerrainDecoration(tile: ArenaTile): void {
        const center = this.getTileCenter(tile.row, tile.column);
        const foot = this.getTileFootPosition(
            tile.row,
            tile.column,
            this.rockFootOffsetY,
        );

        if (tile.type === "rock") {
            tile.decoration = this.createRockDecoration(foot.x, foot.y);
            return;
        }

        if (tile.type === "corrupted") {
            tile.decoration = this.createCorruptionDecoration(
                center.x,
                center.y,
            );
        }
    }

    private createRockDecoration(x: number, y: number): GameObjects.Container {
        const config = P0_TERRAIN_DECORATION_CONFIG.rock;

        const rockShadow = this.add.ellipse(
            config.shadow.x,
            config.shadow.y,
            config.shadow.width,
            config.shadow.height,
            config.shadow.fillColor,
            config.shadow.alpha,
        );

        const rockBody = this.add
            .polygon(
                config.body.x,
                config.body.y,
                [...config.body.points],
                config.body.fillColor,
                1,
            )
            .setOrigin(config.body.originX, config.body.originY)
            .setStrokeStyle(
                config.body.strokeWidth,
                config.body.strokeColor,
                1,
            );

        const rockLight = this.add
            .polygon(
                config.light.x,
                config.light.y,
                [...config.light.points],
                config.light.fillColor,
                config.light.alpha,
            )
            .setOrigin(config.light.originX, config.light.originY);

        return this.add
            .container(x, y, [rockShadow, rockBody, rockLight])
            .setDepth(y + config.depthOffset);
    }
    private createCorruptionDecoration(x: number, y: number): GameObjects.Text {
        const config = P0_TERRAIN_DECORATION_CONFIG.corruption;

        return this.add
            .text(x, y + config.yOffset, config.symbol, {
                fontFamily: config.fontFamily,
                fontSize: config.fontSize,
                color: config.color,
                stroke: config.stroke,
                strokeThickness: config.strokeThickness,
            })
            .setOrigin(0.5)
            .setDepth(y + config.depthOffset);
    }
    private createTileDebugCoordinate(
        tile: ArenaTile,
        x: number,
        y: number,
    ): void {
        if (!this.showDebugTileCoordinates) {
            return;
        }

        this.add
            .text(x, y + 11, `${tile.row + 1},${tile.column + 1}`, {
                fontFamily: "Arial",
                fontSize: "8px",
                color: "#ccb29a",
            })
            .setOrigin(0.5)
            .setDepth(1000)
            .setAlpha(0.85);
    }

    private createPlayerMarker(): void {
        const config = P0_UNIT_MARKER_CONFIG.player;

        const position = this.getTileFootPosition(
            this.playerPosition.row,
            this.playerPosition.column,
        );

        const shadow = this.add.ellipse(
            config.shadow.x,
            config.shadow.y,
            config.shadow.width,
            config.shadow.height,
            config.shadow.fillColor,
            config.shadow.alpha,
        );

        const body = this.add
            .circle(
                config.body.x,
                config.body.y,
                config.body.radius,
                config.body.fillColor,
                1,
            )
            .setStrokeStyle(
                config.body.strokeWidth,
                config.body.strokeColor,
                1,
            );

        const initial = this.add
            .text(config.symbol.x, config.symbol.y, this.playerSymbol, {
                fontFamily: "Georgia, serif",
                fontSize: config.symbol.fontSize,
                fontStyle: "bold",
                color: config.symbol.color,
            })
            .setOrigin(0.5);

        this.playerMarker = this.add
            .container(position.x, position.y, [shadow, body, initial])
            .setDepth(position.y + config.depthOffset);
    }

    private createEnemies(): void {
        const config = P0_UNIT_MARKER_CONFIG.enemy;

        for (const initialEnemy of INITIAL_ENEMIES) {
            const position = this.getTileFootPosition(
                initialEnemy.position.row,
                initialEnemy.position.column,
            );

            const shadow = this.add.ellipse(
                config.shadow.x,
                config.shadow.y,
                config.shadow.width,
                config.shadow.height,
                config.shadow.fillColor,
                config.shadow.alpha,
            );

            const body = this.add
                .circle(
                    config.body.x,
                    config.body.y,
                    config.body.radius,
                    config.body.fillColor,
                    1,
                )
                .setStrokeStyle(
                    config.body.strokeWidth,
                    config.body.strokeColor,
                    1,
                );

            const symbol = this.add
                .text(config.symbol.x, config.symbol.y, initialEnemy.symbol, {
                    fontFamily: "Georgia, serif",
                    fontSize: config.symbol.fontSize,
                    fontStyle: "bold",
                    color: config.symbol.color,
                })
                .setOrigin(0.5);

            const healthBackground = this.add
                .rectangle(
                    config.healthBackground.x,
                    config.healthBackground.y,
                    config.healthBackground.width,
                    config.healthBackground.height,
                    config.healthBackground.fillColor,
                    1,
                )
                .setStrokeStyle(
                    config.healthBackground.strokeWidth,
                    config.healthBackground.strokeColor,
                    1,
                );

            const healthBar = this.add
                .rectangle(
                    config.healthBar.x,
                    config.healthBar.y,
                    config.healthBar.width,
                    config.healthBar.height,
                    config.healthBar.fillColor,
                    1,
                )
                .setOrigin(0, 0.5);

            const marker = this.add
                .container(position.x, position.y, [
                    shadow,
                    body,
                    symbol,
                    healthBackground,
                    healthBar,
                ])
                .setDepth(position.y + config.depthOffset);

            const enemyUnit: EnemyUnit = {
                ...initialEnemy,
                currentHp: initialEnemy.maxHp,
                marker,
                healthBar,
                defeated: false,
                specialCooldownRemaining:
                    initialEnemy.initialSpecialCooldown ?? 0,
                burningRounds: 0,
                burnDamage: 0,
            };

            this.enemies.push(enemyUnit);

            if (enemyUnit.id === "alpha-corrupted") {
                this.bossEnemy = enemyUnit;
            }
        }
    }

    private createBossHud(): void {
        if (!this.bossEnemy) {
            return;
        }

        const layout = P0_BOSS_HUD_LAYOUT;

        this.add
            .rectangle(
                layout.panel.x,
                layout.panel.y,
                layout.panel.width,
                layout.panel.height,
                layout.panel.fillColor,
                layout.panel.alpha,
            )
            .setStrokeStyle(
                layout.panel.strokeWidth,
                layout.panel.strokeColor,
                1,
            );

        this.bossNameText = this.add.text(
            layout.nameText.x,
            layout.nameText.y,
            this.bossEnemy.name.toUpperCase(),
            {
                fontFamily: "Georgia, serif",
                fontSize: layout.nameText.fontSize,
                fontStyle: "bold",
                color: "#df8a7b",
            },
        );

        this.bossHealthText = this.add
            .text(
                layout.hpText.x,
                layout.hpText.y,
                `HP ${this.bossEnemy.currentHp} / ${this.bossEnemy.maxHp}`,
                {
                    fontFamily: "Georgia, serif",
                    fontSize: layout.hpText.fontSize,
                    color: "#e7c0ad",
                },
            )
            .setOrigin(1, 0);

        this.bossHealthBarBackground = this.add
            .rectangle(
                layout.healthBarBackground.x,
                layout.healthBarBackground.y,
                layout.healthBarBackground.width,
                layout.healthBarBackground.height,
                layout.healthBarBackground.fillColor,
                1,
            )
            .setOrigin(0, 0.5)
            .setStrokeStyle(
                layout.healthBarBackground.strokeWidth,
                layout.healthBarBackground.strokeColor,
                1,
            );

        this.bossHealthBar = this.add
            .rectangle(
                layout.healthBar.x,
                layout.healthBar.y,
                layout.healthBar.width,
                layout.healthBar.height,
                layout.healthBar.fillColor,
                1,
            )
            .setOrigin(0, 0.5);
    }
    private createFooter(): void {
        const layout = P0_SCENE_TEXT_LAYOUT;

        this.add
            .rectangle(
                layout.footerBox.x,
                layout.footerBox.y,
                layout.footerBox.width,
                layout.footerBox.height,
                0x160f10,
                1,
            )
            .setStrokeStyle(2, 0x6b4730, 1);

        this.coordinateText = this.add
            .text(
                layout.coordinateText.x,
                layout.coordinateText.y,
                layout.coordinateText.initialText,
                {
                    fontFamily: "Georgia, serif",
                    fontSize: layout.coordinateText.fontSize,
                    color: "#dbc095",
                },
            )
            .setOrigin(0.5);

        this.statusText = this.add
            .text(
                layout.statusText.x,
                layout.statusText.y,
                layout.statusText.initialText,
                {
                    fontFamily: "Georgia, serif",
                    fontSize: layout.statusText.fontSize,
                    color: "#b76b3d",
                },
            )
            .setOrigin(0.5);
    }

    private createPanelButton(
        x: number,
        y: number,
        width: number,
        height: number,
        text: string,
        fontSize: string,
        onClick: () => void,
    ): PanelButton {
        const background = this.add
            .rectangle(x, y, width, height, 0x22181a, 1)
            .setStrokeStyle(2, 0x4e352a, 1);

        const label = this.add
            .text(x, y, text, {
                fontFamily: "Georgia, serif",
                fontSize,
                fontStyle: "bold",
                color: "#7e6c60",
            })
            .setOrigin(0.5);

        const clickableArea = this.add
            .container(x, y, [])
            .setSize(width, height)
            .setInteractive({ useHandCursor: true });

        clickableArea.on("pointerdown", () => {
            onClick();
        });

        return {
            background,
            label,
        };
    }

    private createAbilityPanel(): void {
        const layout = P0_ABILITY_PANEL_LAYOUT;

        this.add
            .rectangle(
                layout.panel.x,
                layout.panel.y,
                layout.panel.width,
                layout.panel.height,
                0x130d0f,
                1,
            )
            .setStrokeStyle(2, 0x5c3826, 1);

        this.add.text(layout.title.x, layout.title.y, "GRIMÓRIO", {
            fontFamily: "Georgia, serif",
            fontSize: layout.title.fontSize,
            color: "#d4a45f",
        });

        this.fireballButton = this.createPanelButton(
            layout.buttons.fireball.x,
            layout.buttons.fireball.y,
            layout.buttons.fireball.width,
            layout.buttons.fireball.height,
            layout.buttons.fireball.label,
            layout.buttons.fireball.fontSize,
            () => this.selectFireball(),
        );

        this.shieldButton = this.createPanelButton(
            layout.buttons.shield.x,
            layout.buttons.shield.y,
            layout.buttons.shield.width,
            layout.buttons.shield.height,
            layout.buttons.shield.label,
            layout.buttons.shield.fontSize,
            () => this.castIgneousShield(),
        );

        this.explosionButton = this.createPanelButton(
            layout.buttons.explosion.x,
            layout.buttons.explosion.y,
            layout.buttons.explosion.width,
            layout.buttons.explosion.height,
            layout.buttons.explosion.label,
            layout.buttons.explosion.fontSize,
            () => this.selectIgneousExplosion(),
        );

        this.flameInvocationButton = this.createPanelButton(
            layout.buttons.flameInvocation.x,
            layout.buttons.flameInvocation.y,
            layout.buttons.flameInvocation.width,
            layout.buttons.flameInvocation.height,
            layout.buttons.flameInvocation.label,
            layout.buttons.flameInvocation.fontSize,
            () => this.selectFlameInvocation(),
        );

        this.passTurnButton = this.createPanelButton(
            layout.buttons.passTurn.x,
            layout.buttons.passTurn.y,
            layout.buttons.passTurn.width,
            layout.buttons.passTurn.height,
            layout.buttons.passTurn.label,
            layout.buttons.passTurn.fontSize,
            () => this.passPlayerTurn(),
        );

        this.concentrationText = this.add.text(
            layout.concentrationText.x,
            layout.concentrationText.y,
            `Concentração: ${this.concentration} / 100`,
            {
                fontFamily: "Georgia, serif",
                fontSize: layout.concentrationText.fontSize,
                color: "#bd8560",
            },
        );

        this.setFireballButtonEnabled(true);
        this.setShieldButtonEnabled(true);
        this.setExplosionButtonEnabled(false);
        this.setFlameInvocationButtonEnabled(true);
        this.setPassTurnButtonEnabled(true);
    }

    private createLegend(): void {
        const layout = P0_LEGEND_LAYOUT;

        this.add
            .rectangle(
                layout.box.x,
                layout.box.y,
                layout.box.width,
                layout.box.height,
                0x100c0d,
                0.85,
            )
            .setStrokeStyle(1, 0x35231c, 1);

        for (const item of layout.items) {
            this.add
                .text(item.x, layout.y, item.label, {
                    fontFamily: "Arial",
                    fontSize: "18px",
                    color: item.color,
                })
                .setOrigin(0, 0.5);
        }
    }

    private startPlayerMovement(): void {
        if (
            !this.movementAvailable ||
            this.enemyTurnInProgress ||
            this.battleEnded
        ) {
            return;
        }

        this.fireballTargetingMode = false;
        this.attackTileKeys.clear();
        this.movementMode = true;
        this.selectedTile = undefined;

        this.explosionTargetingMode = false;
        this.flameInvocationTargetingMode = false;
        this.flameInvocationTargetTileKeys.clear();
        this.flameInvocationAreaPreviewTileKeys.clear();
        this.explosionTargetTileKeys.clear();
        this.explosionAreaPreviewTileKeys.clear();

        this.reachableTileKeys = this.calculateReachableTiles(
            this.playerPosition,
            PLAYER_MOVEMENT_RANGE,
        );

        this.refreshAllTiles();

        this.instructionText.setText(
            "Escolha uma casa destacada para movimentar o Cavaleiro",
        );

        this.statusText.setText(
            `Movimento disponível: até ${PLAYER_MOVEMENT_RANGE} casas`,
        );

        this.coordinateText.setText(
            `Posição atual — Linha: ${this.playerPosition.row + 1} | Coluna: ${this.playerPosition.column + 1}`,
        );
    }

    private handleTileClick(tile: ArenaTile): void {
        if (this.enemyTurnInProgress || this.battleEnded) {
            return;
        }

        if (this.flameInvocationTargetingMode) {
            this.tryStartFlameInvocationOnTile(tile);
            return;
        }

        if (this.explosionTargetingMode) {
            this.tryCastIgneousExplosionOnTile(tile);
            return;
        }

        if (this.fireballTargetingMode) {
            if (this.isPlayerOnTile(tile)) {
                this.cancelAbilitySelection();
                return;
            }

            this.tryCastFireballOnTile(tile);
            return;
        }

        if (this.isPlayerOnTile(tile)) {
            if (this.movementMode) {
                this.cancelPlayerMovement();
                return;
            }

            if (!this.movementAvailable) {
                this.coordinateText.setText(
                    "O Cavaleiro já realizou seu movimento nesta rodada",
                );
                return;
            }

            this.startPlayerMovement();
            return;
        }

        const enemy = this.getEnemyAt(tile.row, tile.column);

        if (enemy) {
            const burnStatus =
                enemy.burningRounds > 0
                    ? ` | 🔥 Queimadura: ${enemy.burningRounds} rodada(s)`
                    : "";

            this.coordinateText.setText(
                `${enemy.name} — HP: ${enemy.currentHp}/${enemy.maxHp}${burnStatus}`,
            );

            this.statusText.setText(
                `Linha: ${tile.row + 1} | Coluna: ${tile.column + 1}`,
            );

            return;
        }

        if (tile.type === "rock") {
            this.coordinateText.setText(
                `Linha: ${tile.row + 1} | Coluna: ${tile.column + 1} — Rocha bloqueia o movimento`,
            );
            return;
        }

        if (this.movementMode) {
            if (this.isReachable(tile)) {
                this.movePlayerTo(tile);
                return;
            }

            this.coordinateText.setText(
                `Linha: ${tile.row + 1} | Coluna: ${tile.column + 1} — Fora do alcance`,
            );
            return;
        }

        this.selectTile(tile);
    }

    private confirmPlayerWithoutMovement(): void {
        this.movementMode = false;
        this.canChooseAbility = true;

        this.reachableTileKeys.clear();
        this.selectedTile = undefined;

        this.setFireballButtonEnabled(true);
        this.setShieldButtonEnabled(true);
        this.refreshAllTiles();

        this.instructionText.setText(
            "Posição mantida. Use uma magia ou passe o turno.",
        );

        this.coordinateText.setText(
            `Cavaleiro aguardando na posição — Linha: ${this.playerPosition.row + 1} | Coluna: ${this.playerPosition.column + 1}`,
        );

        this.statusText.setText("Movimento não utilizado — escolha sua ação");
    }

    private isPlayerOnTile(tile: ArenaTile): boolean {
        return (
            tile.row === this.playerPosition.row &&
            tile.column === this.playerPosition.column
        );
    }

    private hasActiveEnemyAt(
        row: number,
        column: number,
        ignoredEnemyId?: string,
    ): boolean {
        return this.enemies.some(
            (enemy) =>
                !enemy.defeated &&
                enemy.id !== ignoredEnemyId &&
                enemy.position.row === row &&
                enemy.position.column === column,
        );
    }

    private getEnemyAt(row: number, column: number): EnemyUnit | undefined {
        return this.enemies.find(
            (enemy) =>
                !enemy.defeated &&
                enemy.position.row === row &&
                enemy.position.column === column,
        );
    }

    private isEnemyOnTile(tile: ArenaTile): boolean {
        return this.getEnemyAt(tile.row, tile.column) !== undefined;
    }

    private cancelPlayerMovement(): void {
        this.movementMode = false;
        this.reachableTileKeys.clear();
        this.selectedTile = undefined;

        this.refreshAllTiles();

        this.instructionText.setText(
            "Movimento cancelado. Escolha uma habilidade, movimente o Cavaleiro ou passe o turno.",
        );

        this.statusText.setText("Turno do Jogador — nenhuma ação executada");

        this.coordinateText.setText(
            `Posição atual — Linha: ${this.playerPosition.row + 1} | Coluna: ${this.playerPosition.column + 1}`,
        );
    }

    private setPanelButtonEnabled(
        button: PanelButton,
        enabled: boolean,
        style: PanelButtonStyle,
    ): void {
        if (enabled) {
            button.background
                .setFillStyle(style.enabledFillColor, 1)
                .setStrokeStyle(2, style.enabledStrokeColor, 1);

            button.label.setColor(style.enabledTextColor);
            return;
        }

        button.background
            .setFillStyle(style.disabledFillColor, 1)
            .setStrokeStyle(2, style.disabledStrokeColor, 1);

        button.label.setColor(style.disabledTextColor);
    }

    private setFireballButtonEnabled(enabled: boolean): void {
        this.setPanelButtonEnabled(
            this.fireballButton,
            enabled,
            P0_PANEL_BUTTON_STYLES.fireball,
        );
    }

    private setShieldButtonEnabled(enabled: boolean): void {
        this.setPanelButtonEnabled(
            this.shieldButton,
            enabled,
            P0_PANEL_BUTTON_STYLES.defaultAbility,
        );
    }

    private setExplosionButtonEnabled(enabled: boolean): void {
        this.setPanelButtonEnabled(
            this.explosionButton,
            enabled,
            P0_PANEL_BUTTON_STYLES.explosion,
        );
    }

    private setFlameInvocationButtonEnabled(enabled: boolean): void {
        this.setPanelButtonEnabled(
            this.flameInvocationButton,
            enabled,
            P0_PANEL_BUTTON_STYLES.defaultAbility,
        );
    }

    private updateExplosionAvailability(): void {
        const cost = IGNEOUS_EXPLOSION.concentrationCost ?? 100;

        const canUseExplosion =
            this.canChooseAbility &&
            !this.enemyTurnInProgress &&
            !this.battleEnded &&
            this.concentration >= cost;

        this.setExplosionButtonEnabled(canUseExplosion);
    }

    private setPassTurnButtonEnabled(enabled: boolean): void {
        this.setPanelButtonEnabled(
            this.passTurnButton,
            enabled,
            P0_PANEL_BUTTON_STYLES.passTurn,
        );
    }

    private selectFireball(): void {
        if (this.enemyTurnInProgress || this.battleEnded) {
            return;
        }

        if (this.fireballTargetingMode) {
            this.cancelAbilitySelection();
            return;
        }

        if (!this.canChooseAbility) {
            this.statusText.setText(
                "Movimente o Cavaleiro ou permaneça na posição antes de utilizar uma magia",
            );
            return;
        }

        this.movementMode = false;
        this.reachableTileKeys.clear();
        this.fireballTargetingMode = true;
        this.attackTileKeys = this.calculateAttackRange(
            this.playerPosition,
            FIREBALL.range,
        );

        this.refreshAllTiles();

        const availableTarget = this.enemies.some((enemy) => {
            if (enemy.defeated) {
                return false;
            }

            return this.attackTileKeys.has(
                this.getPositionKey(enemy.position.row, enemy.position.column),
            );
        });

        if (!availableTarget) {
            this.fireballTargetingMode = false;
            this.attackTileKeys.clear();

            this.refreshAllTiles();

            this.instructionText.setText(
                "Nenhum inimigo no alcance da Bola de Fogo.",
            );

            this.statusText.setText(
                "Você ainda pode se movimentar, usar Escudo Ígneo ou passar o turno",
            );

            return;
        }

        this.instructionText.setText(
            "Bola de Fogo selecionada — escolha um inimigo dentro do alcance",
        );

        this.statusText.setText(
            `${FIREBALL.name} — Alcance: ${FIREBALL.range} casas | Dano: ${FIREBALL.damage ?? 0}`,
        );
    }

    private selectIgneousExplosion(): void {
        if (this.enemyTurnInProgress || this.battleEnded) {
            return;
        }

        if (this.explosionTargetingMode) {
            this.cancelAbilitySelection();
            return;
        }

        const cost = IGNEOUS_EXPLOSION.concentrationCost ?? 100;

        if (!this.canChooseAbility) {
            this.statusText.setText("Você já realizou sua ação nesta rodada");
            return;
        }

        if (this.concentration < cost) {
            this.statusText.setText(
                `Concentração insuficiente — necessário: ${cost}/100`,
            );
            return;
        }

        this.movementMode = false;
        this.fireballTargetingMode = false;

        this.reachableTileKeys.clear();
        this.attackTileKeys.clear();

        this.explosionTargetingMode = true;
        this.explosionTargetTileKeys = this.calculateExplosionTargetRange(
            this.playerPosition,
            IGNEOUS_EXPLOSION.range,
        );

        this.refreshAllTiles();

        this.instructionText.setText(
            "Explosão Ígnea selecionada — escolha o centro da área de impacto",
        );

        this.statusText.setText(
            "Área: 3x3 | Dano: 40 | Terreno incendiado: 2 rodadas",
        );
    }

    private selectFlameInvocation(): void {
        if (this.enemyTurnInProgress || this.battleEnded) {
            return;
        }

        if (this.activeFlameInvocation) {
            this.statusText.setText(
                "O Cavaleiro já está canalizando Invocação Flamejante",
            );
            return;
        }

        if (this.flameInvocationTargetingMode) {
            this.cancelAbilitySelection();
            return;
        }

        if (!this.canChooseAbility) {
            this.statusText.setText("Você já realizou sua ação nesta rodada");
            return;
        }

        this.movementMode = false;
        this.fireballTargetingMode = false;
        this.explosionTargetingMode = false;

        this.reachableTileKeys.clear();
        this.attackTileKeys.clear();
        this.explosionTargetTileKeys.clear();
        this.explosionAreaPreviewTileKeys.clear();

        this.flameInvocationTargetingMode = true;
        this.flameInvocationTargetTileKeys = this.calculateExplosionTargetRange(
            this.playerPosition,
            FLAME_INVOCATION.range,
        );

        this.refreshAllTiles();

        this.instructionText.setText(
            "Invocação Flamejante selecionada — escolha a área onde o meteoro cairá",
        );

        this.statusText.setText(
            `Canalização: ${FLAME_INVOCATION.channelTurns} turnos | Dano: ${FLAME_INVOCATION.damage}`,
        );
    }

    private tryStartFlameInvocationOnTile(tile: ArenaTile): void {
        if (!this.isFlameInvocationTargetTile(tile)) {
            this.coordinateText.setText(
                "Essa casa está fora do alcance da Invocação Flamejante",
            );
            return;
        }

        this.startFlameInvocation(tile);
    }

    private startFlameInvocation(centerTile: ArenaTile): void {
        const radius = FLAME_INVOCATION.areaRadius ?? 1;
        const channelTurns = FLAME_INVOCATION.channelTurns ?? 2;

        const areaTileKeys = this.calculateAreaTiles(
            centerTile.row,
            centerTile.column,
            radius,
        );

        const centerPosition = this.getTileCenter(
            centerTile.row,
            centerTile.column,
        );

        const markerConfig = P0_EFFECTS_CONFIG.flameInvocationMarker;

        const marker = this.add
            .text(
                centerPosition.x,
                centerPosition.y + markerConfig.yOffset,
                markerConfig.symbol,
                {
                    fontFamily: markerConfig.fontFamily,
                    fontSize: markerConfig.fontSize,
                    fontStyle: markerConfig.fontStyle,
                    color: markerConfig.color,
                    stroke: markerConfig.stroke,
                    strokeThickness: markerConfig.strokeThickness,
                },
            )
            .setOrigin(0.5)
            .setDepth(markerConfig.depth);

        this.tweens.add({
            targets: marker,
            y: marker.y + markerConfig.tweenYOffset,
            alpha: {
                from: markerConfig.tweenAlphaFrom,
                to: markerConfig.tweenAlphaTo,
            },
            duration: markerConfig.duration,
            yoyo: true,
            repeat: -1,
        });

        this.activeFlameInvocation = {
            center: {
                row: centerTile.row,
                column: centerTile.column,
            },
            remainingTurns: channelTurns,
            areaTileKeys,
            marker,
        };

        this.flameInvocationTargetingMode = false;
        this.flameInvocationTargetTileKeys.clear();
        this.flameInvocationAreaPreviewTileKeys.clear();

        this.canChooseAbility = false;
        this.movementAvailable = false;

        this.refreshAllTiles();

        this.coordinateText.setText(
            `${FLAME_INVOCATION.name} iniciada — ${channelTurns} turnos de canalização`,
        );

        this.instructionText.setText(
            "O Cavaleiro começou a canalizar um meteoro flamejante!",
        );

        this.statusText.setText(
            "Se o Cavaleiro sofrer dano real no HP, a canalização será interrompida",
        );

        this.time.delayedCall(550, () => {
            this.finishPlayerTurn();
        });
    }
    private calculateExplosionTargetRange(
        start: GridPosition,
        range: number,
    ): Set<string> {
        const targetTiles = new Set<string>();

        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                const distance = getManhattanDistance(start, {
                    row,
                    column,
                });

                if (distance > range) {
                    continue;
                }

                if (P0_ARENA_MAP[row][column] === "rock") {
                    continue;
                }

                targetTiles.add(this.getPositionKey(row, column));
            }
        }

        return targetTiles;
    }

    private isExplosionTargetTile(tile: ArenaTile): boolean {
        return this.explosionTargetTileKeys.has(
            this.getPositionKey(tile.row, tile.column),
        );
    }
    private castIgneousShield(): void {
        if (this.enemyTurnInProgress || this.battleEnded) {
            return;
        }

        if (!this.canChooseAbility) {
            this.statusText.setText("Você já realizou sua ação nesta rodada");
            return;
        }

        this.movementMode = false;
        this.fireballTargetingMode = false;

        this.reachableTileKeys.clear();
        this.attackTileKeys.clear();

        const absorption = IGNEOUS_SHIELD.shieldAbsorption ?? 0;

        this.fireballTargetingMode = false;
        this.attackTileKeys.clear();

        this.explosionTargetingMode = false;

        this.flameInvocationTargetingMode = false;
        this.flameInvocationTargetTileKeys.clear();
        this.flameInvocationAreaPreviewTileKeys.clear();
        this.explosionTargetTileKeys.clear();
        this.explosionAreaPreviewTileKeys.clear();

        this.playerShield = absorption;

        this.playerShieldText
            .setText(`${this.playerShield} / ${absorption}`)
            .setColor("#f0bb66");

        this.concentration = Math.min(
            100,
            this.concentration + IGNEOUS_SHIELD.concentrationGain,
        );

        this.concentrationText.setText(
            `Concentração: ${this.concentration} / 100`,
        );

        this.createPlayerShieldAura();

        this.refreshAllTiles();

        this.coordinateText.setText(
            `${IGNEOUS_SHIELD.name} ativado — ${this.playerShield} pontos de proteção`,
        );

        this.instructionText.setText(
            "Uma barreira flamejante envolve o Cavaleiro!",
        );

        this.statusText.setText(
            `${IGNEOUS_SHIELD.name} — absorção: ${this.playerShield}`,
        );

        this.time.delayedCall(450, () => {
            this.finishPlayerTurn();
        });
    }

    private createPlayerShieldAura(): void {
        if (!this.playerMarker) {
            return;
        }

        if (this.playerShieldAura) {
            this.playerShieldAura.destroy();
        }

        const config = P0_EFFECTS_CONFIG.shieldAura;

        this.playerShieldAura = this.add
            .circle(
                this.playerMarker.x,
                this.playerMarker.y + config.yOffset,
                config.radius,
                config.fillColor,
                config.alpha,
            )
            .setStrokeStyle(
                config.strokeWidth,
                config.strokeColor,
                config.strokeAlpha,
            )
            .setDepth(this.playerMarker.depth + config.depthOffset);

        this.tweens.add({
            targets: this.playerShieldAura,
            alpha: {
                from: config.tweenAlphaFrom,
                to: config.tweenAlphaTo,
            },
            scale: {
                from: config.tweenScaleFrom,
                to: config.tweenScaleTo,
            },
            duration: config.duration,
            yoyo: true,
            repeat: -1,
        });
    }

    private cancelAbilitySelection(): void {
        this.fireballTargetingMode = false;
        this.explosionTargetingMode = false;
        this.flameInvocationTargetingMode = false;

        this.attackTileKeys.clear();
        this.explosionTargetTileKeys.clear();
        this.explosionAreaPreviewTileKeys.clear();
        this.flameInvocationTargetTileKeys.clear();
        this.flameInvocationAreaPreviewTileKeys.clear();

        this.refreshAllTiles();

        this.instructionText.setText(
            "Ação cancelada. Escolha uma habilidade, movimente o Cavaleiro ou passe o turno.",
        );

        this.statusText.setText("Turno do Jogador — nenhuma ação executada");

        this.coordinateText.setText(
            `Posição atual — Linha: ${this.playerPosition.row + 1} | Coluna: ${this.playerPosition.column + 1}`,
        );
    }

    private removePlayerShield(): void {
        this.playerShield = 0;

        this.playerShieldText
            .setText(`0 / ${IGNEOUS_SHIELD.shieldAbsorption ?? 0}`)
            .setColor("#816a5b");

        if (this.playerShieldAura) {
            this.playerShieldAura.destroy();
            this.playerShieldAura = undefined;
        }
    }

    private passPlayerTurn(): void {
        if (this.enemyTurnInProgress || this.battleEnded) {
            return;
        }

        this.movementMode = false;
        this.movementAvailable = false;
        this.canChooseAbility = false;
        this.fireballTargetingMode = false;

        this.explosionTargetingMode = false;
        this.flameInvocationTargetingMode = false;
        this.flameInvocationTargetTileKeys.clear();
        this.flameInvocationAreaPreviewTileKeys.clear();
        this.explosionTargetTileKeys.clear();
        this.explosionAreaPreviewTileKeys.clear();

        this.reachableTileKeys.clear();
        this.attackTileKeys.clear();

        this.refreshAllTiles();

        this.coordinateText.setText(
            "O Cavaleiro decidiu encerrar sua rodada sem realizar uma habilidade",
        );

        this.instructionText.setText("Turno passado. Os inimigos irão agir.");

        this.finishPlayerTurn();
    }

    private calculateAttackRange(
        start: GridPosition,
        range: number,
    ): Set<string> {
        const attackableTiles = new Set<string>();

        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                const distance = getManhattanDistance(start, {
                    row,
                    column,
                });

                if (distance === 0 || distance > range) {
                    continue;
                }

                if (P0_ARENA_MAP[row][column] === "rock") {
                    continue;
                }

                attackableTiles.add(this.getPositionKey(row, column));
            }
        }

        return attackableTiles;
    }

    private isWithinAttackRange(tile: ArenaTile): boolean {
        return this.attackTileKeys.has(
            this.getPositionKey(tile.row, tile.column),
        );
    }

    private tryCastFireballOnTile(tile: ArenaTile): void {
        if (!this.isWithinAttackRange(tile)) {
            this.coordinateText.setText(
                `Linha: ${tile.row + 1} | Coluna: ${tile.column + 1} — Fora do alcance da Bola de Fogo`,
            );
            return;
        }

        const enemy = this.getEnemyAt(tile.row, tile.column);

        if (!enemy) {
            this.coordinateText.setText(
                "Bola de Fogo precisa ser direcionada a um inimigo",
            );
            return;
        }

        this.castFireball(enemy);
    }

    private castFireball(enemy: EnemyUnit): void {
        const origin = this.getTileFootPosition(
            this.playerPosition.row,
            this.playerPosition.column,
        );

        const destination = this.getTileFootPosition(
            enemy.position.row,
            enemy.position.column,
        );

        this.fireballTargetingMode = false;
        this.attackTileKeys.clear();
        this.refreshAllTiles();

        const projectileConfig = P0_EFFECTS_CONFIG.fireballProjectile;

        const projectileGlow = this.add
            .circle(
                origin.x,
                origin.y + projectileConfig.yOffset,
                projectileConfig.glowRadius,
                projectileConfig.glowColor,
                projectileConfig.glowAlpha,
            )
            .setDepth(projectileConfig.glowDepth);

        const projectile = this.add
            .circle(
                origin.x,
                origin.y + projectileConfig.yOffset,
                projectileConfig.projectileRadius,
                projectileConfig.projectileColor,
                1,
            )
            .setStrokeStyle(
                projectileConfig.projectileStrokeWidth,
                projectileConfig.projectileStrokeColor,
                1,
            )
            .setDepth(projectileConfig.projectileDepth);

        this.tweens.add({
            targets: [projectileGlow, projectile],
            x: destination.x,
            y: destination.y + projectileConfig.destinationYOffset,
            duration: projectileConfig.duration,
            ease: "Power2",
            onComplete: () => {
                projectileGlow.destroy();
                projectile.destroy();

                this.applyFireballDamage(enemy);
            },
        });

        this.instructionText.setText(`O Cavaleiro lançou ${FIREBALL.name}!`);
    }

    private damageEnemy(enemy: EnemyUnit, damage: number): void {
        enemy.currentHp = Math.max(0, enemy.currentHp - damage);

        const remainingLifeRatio = enemy.currentHp / enemy.maxHp;

        enemy.healthBar.setScale(remainingLifeRatio, 1);

        this.updateBossHud(enemy);

        if (enemy.currentHp === 0) {
            this.defeatEnemy(enemy);
        }
    }

    private updateBossHud(enemy: EnemyUnit): void {
        if (!this.bossEnemy || enemy.id !== this.bossEnemy.id) {
            return;
        }

        if (!this.bossHealthBar || !this.bossHealthText) {
            return;
        }

        const remainingLifeRatio = enemy.currentHp / enemy.maxHp;

        this.bossHealthBar.setScale(remainingLifeRatio, 1);

        this.bossHealthText.setText(`HP ${enemy.currentHp} / ${enemy.maxHp}`);
    }

    private defeatEnemy(enemy: EnemyUnit): void {
        enemy.defeated = true;
        enemy.marker.setAlpha(0.3);

        if (this.bossEnemy && enemy.id === this.bossEnemy.id) {
            this.setBossHudDefeated();
        }

        if (enemy.burnMarker) {
            enemy.burnMarker.destroy();
            enemy.burnMarker = undefined;
        }

        enemy.burningRounds = 0;
        enemy.burnDamage = 0;

        this.refreshAllTiles();
    }

    private setBossHudDefeated(): void {
        this.bossHealthBar?.setAlpha(0.25);
        this.bossHealthBarBackground?.setAlpha(0.35);
        this.bossNameText?.setAlpha(0.45);
        this.bossHealthText?.setText("DERROTADO").setAlpha(0.6);
    }

    private areAllEnemiesDefeated(): boolean {
        return this.enemies.every((enemy) => enemy.defeated);
    }

    private applyFireballDamage(enemy: EnemyUnit): void {
        const damage = FIREBALL.damage ?? 0;

        this.damageEnemy(enemy, damage);

        this.concentration = Math.min(
            100,
            this.concentration + FIREBALL.concentrationGain,
        );

        this.concentrationText.setText(
            `Concentração: ${this.concentration} / 100`,
        );

        this.updateExplosionAvailability();

        if (enemy.defeated) {
            this.coordinateText.setText(
                `${enemy.name} foi derrotado por ${FIREBALL.name}!`,
            );

            if (this.areAllEnemiesDefeated()) {
                this.finishBattle(true);
                return;
            }

            this.finishPlayerTurn();
            return;
        }

        const burnApplied = this.tryApplyBurn(enemy);

        if (burnApplied) {
            this.coordinateText.setText(
                `${FIREBALL.name} causou ${damage} de dano e aplicou Queimadura — ${enemy.name}: ${enemy.currentHp}/${enemy.maxHp} HP`,
            );
        } else {
            this.coordinateText.setText(
                `${FIREBALL.name} causou ${damage} de dano — ${enemy.name}: ${enemy.currentHp}/${enemy.maxHp} HP`,
            );
        }

        this.finishPlayerTurn();
    }

    private tryApplyBurn(enemy: EnemyUnit): boolean {
        const burnChance = FIREBALL.burnChance ?? 0;
        const burnDamage = FIREBALL.burnDamage ?? 0;
        const burnDuration = FIREBALL.burnDuration ?? 0;

        const burnRoll = Math.random();

        if (burnRoll > burnChance) {
            return false;
        }

        enemy.burningRounds = burnDuration;
        enemy.burnDamage = burnDamage;

        if (!enemy.burnMarker) {
            const burnMarkerConfig = P0_EFFECTS_CONFIG.burnMarker;

            enemy.burnMarker = this.add
                .text(
                    burnMarkerConfig.x,
                    burnMarkerConfig.y,
                    burnMarkerConfig.symbol,
                    {
                        fontSize: burnMarkerConfig.fontSize,
                    },
                )
                .setOrigin(0.5);

            enemy.marker.add(enemy.burnMarker);
        }

        return true;
    }

    private finishBattle(playerWon: boolean): void {
        this.battleEnded = true;
        this.enemyTurnInProgress = false;
        this.canChooseAbility = false;
        this.movementMode = false;
        this.fireballTargetingMode = false;
        this.explosionTargetingMode = false;
        this.flameInvocationTargetingMode = false;

        this.flameInvocationTargetTileKeys.clear();
        this.flameInvocationAreaPreviewTileKeys.clear();
        this.explosionTargetTileKeys.clear();
        this.explosionAreaPreviewTileKeys.clear();
        this.reachableTileKeys.clear();
        this.attackTileKeys.clear();

        this.setFireballButtonEnabled(false);
        this.setShieldButtonEnabled(false);
        this.setExplosionButtonEnabled(false);
        this.setPassTurnButtonEnabled(false);
        this.setFlameInvocationButtonEnabled(false);
        if (this.activeFlameInvocation) {
            this.activeFlameInvocation.marker.destroy();
            this.activeFlameInvocation = undefined;
        }

        this.refreshAllTiles();

        if (playerWon) {
            this.instructionText.setText(
                "Vitória! Os Lobos Maculados foram derrotados.",
            );

            this.statusText.setText(
                "Batalha concluída — Recompensas serão implementadas futuramente",
            );

            return;
        }

        this.instructionText.setText("Derrota! O Cavaleiro caiu em batalha.");

        this.statusText.setText(
            "Fim da batalha — recarregue a página para tentar novamente",
        );

        if (this.playerMarker) {
            this.playerMarker.setAlpha(0.35);
        }
    }

    private finishPlayerTurn(): void {
        this.movementMode = false;
        this.movementAvailable = false;
        this.canChooseAbility = false;
        this.fireballTargetingMode = false;
        this.enemyTurnInProgress = true;
        this.explosionTargetingMode = false;
        this.flameInvocationTargetingMode = false;

        this.flameInvocationTargetTileKeys.clear();
        this.flameInvocationAreaPreviewTileKeys.clear();
        this.explosionTargetTileKeys.clear();
        this.explosionAreaPreviewTileKeys.clear();
        this.reachableTileKeys.clear();
        this.attackTileKeys.clear();

        this.setFireballButtonEnabled(false);
        this.setShieldButtonEnabled(false);
        this.setExplosionButtonEnabled(false);
        this.setPassTurnButtonEnabled(false);
        this.refreshAllTiles();

        this.instructionText.setText("Turno concluído. Os inimigos irão agir.");

        this.statusText.setText("Turno dos Lobos Maculados");

        this.time.delayedCall(650, () => {
            this.startEnemyTurn();
        });
    }

    private startEnemyTurn(): void {
        const activeEnemies = this.enemies.filter((enemy) => !enemy.defeated);

        this.executeEnemyAction(activeEnemies, 0);
    }

    private executeEnemyAction(
        activeEnemies: EnemyUnit[],
        index: number,
    ): void {
        if (this.battleEnded) {
            return;
        }

        if (index >= activeEnemies.length) {
            this.startNewPlayerTurn();
            return;
        }

        const enemy = activeEnemies[index];

        if (enemy.defeated) {
            this.executeEnemyAction(activeEnemies, index + 1);
            return;
        }

        this.applyBurningGroundDamage(enemy, () => {
            if (this.battleEnded) {
                return;
            }

            if (enemy.defeated) {
                this.time.delayedCall(350, () => {
                    this.executeEnemyAction(activeEnemies, index + 1);
                });

                return;
            }

            this.applyBurnAtStartOfEnemyTurn(enemy, () => {
                if (this.battleEnded) {
                    return;
                }

                if (enemy.defeated) {
                    this.time.delayedCall(350, () => {
                        this.executeEnemyAction(activeEnemies, index + 1);
                    });

                    return;
                }

                this.performEnemyAction(enemy, activeEnemies, index);
            });
        });
    }

    private applyBurningGroundDamage(
        enemy: EnemyUnit,
        onComplete: () => void,
    ): void {
        const key = this.getPositionKey(
            enemy.position.row,
            enemy.position.column,
        );

        const burningGround = this.burningGroundEffects.get(key);

        if (!burningGround || enemy.defeated) {
            onComplete();
            return;
        }

        this.damageEnemy(enemy, burningGround.damage);

        this.showFloatingDamage(enemy, `-${burningGround.damage} ♨`, "#ff6329");

        if (enemy.defeated) {
            this.coordinateText.setText(
                `${enemy.name} foi derrotado pelas chamas do terreno!`,
            );

            if (this.areAllEnemiesDefeated()) {
                this.time.delayedCall(500, () => {
                    this.finishBattle(true);
                });

                return;
            }

            this.time.delayedCall(500, () => {
                onComplete();
            });

            return;
        }

        this.coordinateText.setText(
            `${enemy.name} sofreu ${burningGround.damage} de dano pelo terreno incendiado`,
        );

        this.statusText.setText(
            `Chamas do terreno atingiram ${enemy.name}: ${enemy.currentHp}/${enemy.maxHp} HP`,
        );

        this.time.delayedCall(500, () => {
            onComplete();
        });
    }

    private performEnemyAction(
        enemy: EnemyUnit,
        activeEnemies: EnemyUnit[],
        index: number,
    ): void {
        if (this.isAdjacentToPlayer(enemy.position)) {
            this.enemyAttackPlayer(enemy, () => {
                this.finishEnemyAction(activeEnemies, index);
            });

            return;
        }

        if (this.canUseCorruptedHowl(enemy)) {
            this.alphaUseCorruptedHowl(enemy, () => {
                this.finishEnemyAction(activeEnemies, index);
            });

            return;
        }

        this.moveEnemyTowardPlayer(enemy, () => {
            if (this.battleEnded) {
                return;
            }

            if (this.isAdjacentToPlayer(enemy.position)) {
                this.enemyAttackPlayer(enemy, () => {
                    this.finishEnemyAction(activeEnemies, index);
                });

                return;
            }

            this.finishEnemyAction(activeEnemies, index);
        });
    }

    private finishEnemyAction(activeEnemies: EnemyUnit[], index: number): void {
        this.advanceEnemySpecialCooldown(activeEnemies[index]);

        this.time.delayedCall(350, () => {
            this.executeEnemyAction(activeEnemies, index + 1);
        });
    }

    private advanceEnemySpecialCooldown(enemy: EnemyUnit): void {
        if (!enemy.specialAbility || enemy.defeated) {
            return;
        }

        if (enemy.specialCooldownRemaining > 0) {
            enemy.specialCooldownRemaining -= 1;
        }
    }

    private resetEnemySpecialCooldown(enemy: EnemyUnit): void {
        enemy.specialCooldownRemaining = enemy.specialCooldown ?? 0;
    }

    private canUseCorruptedHowl(enemy: EnemyUnit): boolean {
        if (enemy.specialAbility !== "corrupted-howl") {
            return false;
        }

        if (enemy.specialCooldownRemaining > 0) {
            return false;
        }

        const range = enemy.specialRange ?? 0;

        const distance = getManhattanDistance(
            enemy.position,
            this.playerPosition,
        );

        return distance <= range;
    }
    private alphaUseCorruptedHowl(
        enemy: EnemyUnit,
        onComplete: () => void,
    ): void {
        const damage = enemy.specialDamage ?? 0;

        this.resetEnemySpecialCooldown(enemy);

        this.instructionText.setText(`${enemy.name} usou Uivo Corrompido!`);

        this.statusText.setText(
            `Ondas sombrias atingem o Cavaleiro à distância`,
        );

        const playerPosition = this.getTileFootPosition(
            this.playerPosition.row,
            this.playerPosition.column,
        );

        const howlEffect = this.add
            .circle(playerPosition.x, playerPosition.y - 24, 10, 0x5b254f, 0.45)
            .setStrokeStyle(3, 0xc75bb7, 0.9)
            .setDepth(5000);

        this.tweens.add({
            targets: howlEffect,
            scale: 3.4,
            alpha: 0,
            duration: 520,
            ease: "Power2",
            onComplete: () => {
                howlEffect.destroy();

                this.applyDamageToPlayer(
                    damage,
                    `${enemy.name} causou ${damage} de dano com Uivo Corrompido`,
                    onComplete,
                );
            },
        });
    }
    private applyBurnAtStartOfEnemyTurn(
        enemy: EnemyUnit,
        onComplete: () => void,
    ): void {
        if (enemy.burningRounds <= 0 || enemy.defeated) {
            onComplete();
            return;
        }

        this.damageEnemy(enemy, enemy.burnDamage);

        enemy.burningRounds -= 1;

        this.showBurnFloatingDamage(enemy, `-${enemy.burnDamage} 🔥`);

        if (enemy.defeated) {
            this.coordinateText.setText(
                `${enemy.name} sofreu ${enemy.burnDamage} de dano de Queimadura e foi derrotado!`,
            );

            this.statusText.setText(`${enemy.name} foi consumido pelas chamas`);

            if (this.areAllEnemiesDefeated()) {
                this.time.delayedCall(650, () => {
                    this.finishBattle(true);
                });

                return;
            }

            this.time.delayedCall(650, () => {
                onComplete();
            });

            return;
        }

        if (enemy.burningRounds === 0) {
            if (enemy.burnMarker) {
                enemy.burnMarker.destroy();
                enemy.burnMarker = undefined;
            }

            this.coordinateText.setText(
                `${enemy.name} sofreu ${enemy.burnDamage} de dano de Queimadura — efeito encerrado`,
            );
        } else {
            this.coordinateText.setText(
                `${enemy.name} sofreu ${enemy.burnDamage} de dano de Queimadura — ${enemy.burningRounds} rodada(s) restante(s)`,
            );
        }

        this.statusText.setText(
            `Queimadura atingiu ${enemy.name}: ${enemy.currentHp}/${enemy.maxHp} HP`,
        );

        this.time.delayedCall(650, () => {
            onComplete();
        });
    }

    private showBurnFloatingDamage(enemy: EnemyUnit, text: string): void {
        const config = P0_EFFECTS_CONFIG.burnFloatingDamage;

        const burnDamageText = this.add
            .text(enemy.marker.x, enemy.marker.y + config.yOffset, text, {
                fontFamily: config.fontFamily,
                fontSize: config.fontSize,
                fontStyle: config.fontStyle,
                color: config.color,
                stroke: config.stroke,
                strokeThickness: config.strokeThickness,
            })
            .setOrigin(0.5)
            .setDepth(config.depth);

        this.tweens.add({
            targets: burnDamageText,
            y: burnDamageText.y + config.moveY,
            alpha: 0,
            duration: config.duration,
            ease: "Power2",
            onComplete: () => {
                burnDamageText.destroy();
            },
        });
    }

    private moveEnemyTowardPlayer(
        enemy: EnemyUnit,
        onComplete: () => void,
    ): void {
        const path = this.findPathToPlayer(enemy);

        if (!path || path.length <= 1) {
            onComplete();
            return;
        }

        const maximumStepsBeforePlayer = path.length - 1;

        const stepsToWalk = Math.min(
            enemy.movementRange,
            maximumStepsBeforePlayer,
        );

        if (stepsToWalk <= 0) {
            onComplete();
            return;
        }

        const destination = path[stepsToWalk - 1];

        enemy.position = {
            row: destination.row,
            column: destination.column,
        };

        const destinationPosition = this.getTileFootPosition(
            destination.row,
            destination.column,
        );

        this.statusText.setText(
            `${enemy.name} está se aproximando do Cavaleiro`,
        );

        this.tweens.add({
            targets: enemy.marker,
            x: destinationPosition.x,
            y: destinationPosition.y,
            duration: 430,
            ease: "Power2",
            onUpdate: () => {
                enemy.marker.setDepth(enemy.marker.y + 50);
            },
            onComplete: () => {
                this.refreshAllTiles();

                this.applyBurningGroundDamage(enemy, () => {
                    onComplete();
                });
            },
        });

        this.refreshAllTiles();
    }

    private findPathToPlayer(enemy: EnemyUnit): GridPosition[] | null {
        const start = enemy.position;

        const queue: Array<{
            position: GridPosition;
            path: GridPosition[];
        }> = [
            {
                position: start,
                path: [],
            },
        ];

        const visited = new Set<string>([
            this.getPositionKey(start.row, start.column),
        ]);

        const directions: GridPosition[] = [
            { row: -1, column: 0 },
            { row: 1, column: 0 },
            { row: 0, column: -1 },
            { row: 0, column: 1 },
        ];

        while (queue.length > 0) {
            const current = queue.shift();

            if (!current) {
                continue;
            }

            for (const direction of directions) {
                const nextRow = current.position.row + direction.row;
                const nextColumn = current.position.column + direction.column;

                if (!this.isWithinArena(nextRow, nextColumn)) {
                    continue;
                }

                const nextPosition: GridPosition = {
                    row: nextRow,
                    column: nextColumn,
                };

                const key = this.getPositionKey(nextRow, nextColumn);

                if (visited.has(key)) {
                    continue;
                }

                if (
                    nextRow === this.playerPosition.row &&
                    nextColumn === this.playerPosition.column
                ) {
                    return [...current.path, nextPosition];
                }

                if (
                    P0_ARENA_MAP[nextRow][nextColumn] === "rock" ||
                    this.hasActiveEnemyAt(nextRow, nextColumn, enemy.id)
                ) {
                    continue;
                }

                visited.add(key);

                queue.push({
                    position: nextPosition,
                    path: [...current.path, nextPosition],
                });
            }
        }

        return null;
    }

    private isAdjacentToPlayer(position: GridPosition): boolean {
        const distance = getManhattanDistance(position, this.playerPosition);

        return distance === 1;
    }

    private applyDamageToPlayer(
        originalDamage: number,
        damageMessage: string,
        onComplete: () => void,
    ): void {
        const absorbedDamage = Math.min(this.playerShield, originalDamage);
        const healthDamage = originalDamage - absorbedDamage;

        if (absorbedDamage > 0) {
            this.playerShield -= absorbedDamage;

            this.playerShieldText.setText(
                `${this.playerShield} / ${IGNEOUS_SHIELD.shieldAbsorption ?? 0}`,
            );

            if (this.playerShield === 0) {
                this.removePlayerShield();

                this.statusText.setText("O Escudo Ígneo foi quebrado!");
            } else {
                this.statusText.setText(
                    `Escudo Ígneo absorveu ${absorbedDamage} de dano — proteção restante: ${this.playerShield}`,
                );
            }
        }

        if (healthDamage > 0) {
            this.cancelActiveFlameInvocation(
                "A canalização foi interrompida por dano real no Cavaleiro",
            );

            this.playerCurrentHp = Math.max(
                0,
                this.playerCurrentHp - healthDamage,
            );

            const remainingLifeRatio = this.playerCurrentHp / this.playerMaxHp;

            this.playerHealthBar.setScale(remainingLifeRatio, 1);

            this.playerHpText.setText(
                `${this.playerCurrentHp} / ${this.playerMaxHp}`,
            );

            this.statusText.setText(damageMessage);
        }

        if (this.playerMarker) {
            this.tweens.add({
                targets: this.playerMarker,
                alpha: 0.35,
                duration: 90,
                yoyo: true,
                repeat: 2,
                onComplete: () => {
                    if (this.playerMarker) {
                        this.playerMarker.setAlpha(1);
                    }

                    if (this.playerCurrentHp === 0) {
                        this.finishBattle(false);
                        return;
                    }

                    onComplete();
                },
            });

            return;
        }

        if (this.playerCurrentHp === 0) {
            this.finishBattle(false);
            return;
        }

        onComplete();
    }

    private enemyAttackPlayer(enemy: EnemyUnit, onComplete: () => void): void {
        this.applyDamageToPlayer(
            enemy.damage,
            `${enemy.name} causou ${enemy.damage} de dano ao Cavaleiro`,
            onComplete,
        );
    }

    private cancelActiveFlameInvocation(reason: string): void {
        if (!this.activeFlameInvocation) {
            return;
        }

        this.activeFlameInvocation.marker.destroy();
        this.activeFlameInvocation = undefined;

        this.statusText.setText(reason);

        this.coordinateText.setText("Invocação Flamejante foi interrompida!");
    }

    private startNewPlayerTurn(): void {
        if (this.battleEnded) {
            return;
        }

        if (this.playerShield > 0) {
            this.removePlayerShield();
        }

        this.advanceBurningGroundEffects();

        if (this.activeFlameInvocation) {
            this.round += 1;
            this.roundText.setText(`RODADA ${this.round}`);

            this.processFlameInvocationChanneling();
            return;
        }

        this.round += 1;
        this.roundText.setText(`RODADA ${this.round}`);

        this.enemyTurnInProgress = false;
        this.movementMode = false;
        this.movementAvailable = true;
        this.canChooseAbility = true;
        this.fireballTargetingMode = false;

        this.reachableTileKeys.clear();
        this.attackTileKeys.clear();

        this.setFireballButtonEnabled(true);
        this.setShieldButtonEnabled(true);
        this.updateExplosionAvailability();
        this.setPassTurnButtonEnabled(true);
        this.refreshAllTiles();

        this.instructionText.setText(
            "Escolha uma habilidade, movimente o Cavaleiro ou passe o turno",
        );

        this.coordinateText.setText(
            `Nova rodada iniciada — HP do Cavaleiro: ${this.playerCurrentHp}/${this.playerMaxHp}`,
        );

        this.statusText.setText(`Rodada ${this.round} — Turno do Jogador`);
    }

    private advanceBurningGroundEffects(): void {
        for (const [key, effect] of this.burningGroundEffects.entries()) {
            effect.remainingRounds -= 1;

            if (effect.remainingRounds > 0) {
                continue;
            }

            effect.marker.destroy();
            this.burningGroundEffects.delete(key);
        }

        this.refreshAllTiles();
    }

    private processFlameInvocationChanneling(): void {
        if (!this.activeFlameInvocation) {
            return;
        }

        this.enemyTurnInProgress = false;
        this.movementMode = false;
        this.movementAvailable = false;
        this.canChooseAbility = false;
        this.fireballTargetingMode = false;
        this.explosionTargetingMode = false;
        this.flameInvocationTargetingMode = false;

        this.reachableTileKeys.clear();
        this.attackTileKeys.clear();
        this.explosionTargetTileKeys.clear();
        this.explosionAreaPreviewTileKeys.clear();
        this.flameInvocationTargetTileKeys.clear();
        this.flameInvocationAreaPreviewTileKeys.clear();

        this.setFireballButtonEnabled(false);
        this.setShieldButtonEnabled(false);
        this.setExplosionButtonEnabled(false);
        this.setFlameInvocationButtonEnabled(false);
        this.setPassTurnButtonEnabled(false);

        this.activeFlameInvocation.remainingTurns -= 1;

        if (this.activeFlameInvocation.remainingTurns > 0) {
            this.instructionText.setText(
                "O Cavaleiro continua canalizando Invocação Flamejante...",
            );

            this.coordinateText.setText(
                `${this.activeFlameInvocation.remainingTurns} turno(s) restante(s) para o impacto`,
            );

            this.statusText.setText(
                "O turno do jogador será consumido pela canalização",
            );

            this.time.delayedCall(900, () => {
                this.finishPlayerTurn();
            });

            return;
        }

        this.resolveFlameInvocation();
    }

    private resolveFlameInvocation(): void {
        const activeInvocation = this.activeFlameInvocation;

        if (!activeInvocation) {
            return;
        }

        const centerPosition = this.getTileCenter(
            activeInvocation.center.row,
            activeInvocation.center.column,
        );

        activeInvocation.marker.destroy();

        const impactConfig = P0_EFFECTS_CONFIG.flameInvocationImpact;

        const impact = this.add
            .circle(
                centerPosition.x,
                centerPosition.y,
                impactConfig.radius,
                impactConfig.fillColor,
                impactConfig.alpha,
            )
            .setStrokeStyle(
                impactConfig.strokeWidth,
                impactConfig.strokeColor,
                1,
            )
            .setDepth(impactConfig.depth);

        this.tweens.add({
            targets: impact,
            scale: impactConfig.scale,
            alpha: 0,
            duration: impactConfig.duration,
            ease: "Power2",
            onComplete: () => {
                impact.destroy();
                this.applyFlameInvocationImpact(activeInvocation.areaTileKeys);
            },
        });

        this.instructionText.setText("Invocação Flamejante foi liberada!");

        this.statusText.setText("O meteoro flamejante atingiu a área marcada");
    }

    private applyFlameInvocationImpact(areaTileKeys: Set<string>): void {
        const damage = FLAME_INVOCATION.damage ?? 0;

        let enemiesHit = 0;

        for (const enemy of this.enemies) {
            if (enemy.defeated) {
                continue;
            }

            const enemyKey = this.getPositionKey(
                enemy.position.row,
                enemy.position.column,
            );

            if (!areaTileKeys.has(enemyKey)) {
                continue;
            }

            this.damageEnemy(enemy, damage);
            this.showFloatingDamage(enemy, `-${damage}`, "#ffc766");

            enemiesHit += 1;
        }

        for (const key of areaTileKeys) {
            const tile = this.getTileByKey(key);

            if (!tile || tile.type === "rock") {
                continue;
            }

            this.igniteGroundTile(tile);
        }

        this.activeFlameInvocation = undefined;

        this.refreshAllTiles();

        if (this.areAllEnemiesDefeated()) {
            this.coordinateText.setText(
                "Invocação Flamejante derrotou todos os inimigos!",
            );

            this.finishBattle(true);
            return;
        }

        if (enemiesHit > 0) {
            this.coordinateText.setText(
                `Invocação Flamejante atingiu ${enemiesHit} inimigo(s) e incendiou a área`,
            );
        } else {
            this.coordinateText.setText(
                "Invocação Flamejante caiu na área marcada, mas nenhum inimigo foi atingido",
            );
        }

        this.openPlayerTurnAfterInvocation();
    }

    private openPlayerTurnAfterInvocation(): void {
        this.enemyTurnInProgress = false;
        this.movementMode = false;
        this.movementAvailable = true;
        this.canChooseAbility = true;
        this.fireballTargetingMode = false;
        this.explosionTargetingMode = false;
        this.flameInvocationTargetingMode = false;

        this.reachableTileKeys.clear();
        this.attackTileKeys.clear();
        this.explosionTargetTileKeys.clear();
        this.explosionAreaPreviewTileKeys.clear();
        this.flameInvocationTargetTileKeys.clear();
        this.flameInvocationAreaPreviewTileKeys.clear();

        this.setFireballButtonEnabled(true);
        this.setShieldButtonEnabled(true);
        this.updateExplosionAvailability();
        this.setFlameInvocationButtonEnabled(true);
        this.setPassTurnButtonEnabled(true);

        this.refreshAllTiles();

        this.instructionText.setText(
            "Escolha uma habilidade, movimente o Cavaleiro ou passe o turno",
        );

        this.statusText.setText(`Rodada ${this.round} — Turno do Jogador`);
    }

    private selectTile(tile: ArenaTile): void {
        this.selectedTile = tile;
        this.refreshAllTiles();

        this.coordinateText.setText(
            `Casa selecionada — Linha: ${tile.row + 1} | Coluna: ${tile.column + 1} — ${this.tileStyles[tile.type].label}`,
        );
    }

    private movePlayerTo(tile: ArenaTile): void {
        if (!this.playerMarker) {
            return;
        }

        this.playerPosition = {
            row: tile.row,
            column: tile.column,
        };

        const destination = this.getTileFootPosition(tile.row, tile.column);

        this.tweens.add({
            targets: this.playerMarker,
            x: destination.x,
            y: destination.y,
            duration: 260,
            ease: "Power2",
            onUpdate: () => {
                if (this.playerMarker) {
                    this.playerMarker.setDepth(this.playerMarker.y + 50);
                }
            },
        });

        this.movementMode = false;
        this.movementAvailable = false;
        this.canChooseAbility = true;

        this.reachableTileKeys.clear();
        this.attackTileKeys.clear();
        this.selectedTile = undefined;

        this.setFireballButtonEnabled(true);
        this.setShieldButtonEnabled(true);
        this.updateExplosionAvailability();
        this.refreshAllTiles();

        this.coordinateText.setText(
            `Cavaleiro movido — Linha: ${tile.row + 1} | Coluna: ${tile.column + 1}`,
        );

        this.instructionText.setText(
            "Movimento realizado. Use uma magia ou passe o turno.",
        );

        this.statusText.setText(
            "Ação de movimento concluída — escolha sua ação",
        );
    }

    private calculateReachableTiles(
        start: GridPosition,
        movementRange: number,
    ): Set<string> {
        const reachable = new Set<string>();
        const visited = new Map<string, number>();

        const queue: Array<{ position: GridPosition; distance: number }> = [
            {
                position: start,
                distance: 0,
            },
        ];

        visited.set(this.getPositionKey(start.row, start.column), 0);

        const directions: GridPosition[] = [
            { row: -1, column: 0 },
            { row: 1, column: 0 },
            { row: 0, column: -1 },
            { row: 0, column: 1 },
        ];

        while (queue.length > 0) {
            const current = queue.shift();

            if (!current || current.distance >= movementRange) {
                continue;
            }

            for (const direction of directions) {
                const nextRow = current.position.row + direction.row;
                const nextColumn = current.position.column + direction.column;

                if (!this.isWithinArena(nextRow, nextColumn)) {
                    continue;
                }

                if (P0_ARENA_MAP[nextRow][nextColumn] === "rock") {
                    continue;
                }

                if (this.getEnemyAt(nextRow, nextColumn)) {
                    continue;
                }

                const nextDistance = current.distance + 1;
                const key = this.getPositionKey(nextRow, nextColumn);
                const knownDistance = visited.get(key);

                if (
                    knownDistance !== undefined &&
                    knownDistance <= nextDistance
                ) {
                    continue;
                }

                visited.set(key, nextDistance);

                if (nextRow !== start.row || nextColumn !== start.column) {
                    reachable.add(key);
                }

                queue.push({
                    position: {
                        row: nextRow,
                        column: nextColumn,
                    },
                    distance: nextDistance,
                });
            }
        }

        return reachable;
    }

    private refreshAllTiles(): void {
        for (const tile of this.tiles) {
            this.refreshTileAppearance(tile);
        }
    }

    private refreshTileAppearance(tile: ArenaTile): void {
        if (this.isEnemyOnTile(tile)) {
            tile.polygon.setStrokeStyle(3, 0xc94439, 1);
        } else if (this.isPlayerOnTile(tile)) {
            tile.polygon.setStrokeStyle(3, 0xe4aa52, 1);
        } else {
            tile.polygon.setStrokeStyle(2, this.tileStrokeColor, 1);
        }

        if (this.isSelected(tile)) {
            tile.polygon.setFillStyle(this.selectedColor, 1);
            return;
        }

        if (this.isInFlameInvocationPreview(tile)) {
            tile.polygon.setFillStyle(0xd25a1f, 1);
            return;
        }

        if (
            this.flameInvocationTargetingMode &&
            this.isFlameInvocationTargetTile(tile)
        ) {
            tile.polygon.setFillStyle(0x7b351f, 1);
            return;
        }

        if (this.isInExplosionPreview(tile)) {
            tile.polygon.setFillStyle(this.explosionAreaColor, 1);
            return;
        }

        if (this.explosionTargetingMode && this.isExplosionTargetTile(tile)) {
            tile.polygon.setFillStyle(this.explosionRangeColor, 1);
            return;
        }

        if (this.isWithinAttackRange(tile)) {
            if (this.isEnemyOnTile(tile)) {
                tile.polygon.setFillStyle(this.attackTargetColor, 1);
                return;
            }

            tile.polygon.setFillStyle(this.attackRangeColor, 1);
            return;
        }

        if (this.isReachable(tile)) {
            tile.polygon.setFillStyle(this.movementColor, 1);
            return;
        }

        if (this.isBurningGroundTile(tile)) {
            tile.polygon.setFillStyle(this.burningGroundColor, 1);
            return;
        }

        tile.polygon.setFillStyle(tile.baseColor, 1);
    }

    private tryCastIgneousExplosionOnTile(tile: ArenaTile): void {
        if (!this.isExplosionTargetTile(tile)) {
            this.coordinateText.setText(
                "Essa casa está fora do alcance da Explosão Ígnea",
            );
            return;
        }

        this.castIgneousExplosion(tile);
    }

    private castIgneousExplosion(centerTile: ArenaTile): void {
        const cost = IGNEOUS_EXPLOSION.concentrationCost ?? 100;
        const radius = IGNEOUS_EXPLOSION.areaRadius ?? 1;

        this.concentration = Math.max(0, this.concentration - cost);

        this.concentrationText.setText(
            `Concentração: ${this.concentration} / 100`,
        );

        this.explosionTargetingMode = false;
        this.explosionTargetTileKeys.clear();
        this.explosionAreaPreviewTileKeys.clear();

        const affectedTileKeys = this.calculateAreaTiles(
            centerTile.row,
            centerTile.column,
            radius,
        );

        const position = this.getTileCenter(centerTile.row, centerTile.column);

        const impactConfig = P0_EFFECTS_CONFIG.explosionImpact;

        const impact = this.add
            .circle(
                position.x,
                position.y,
                impactConfig.radius,
                impactConfig.fillColor,
                impactConfig.alpha,
            )
            .setStrokeStyle(
                impactConfig.strokeWidth,
                impactConfig.strokeColor,
                1,
            )
            .setDepth(impactConfig.depth);

        this.tweens.add({
            targets: impact,
            scale: impactConfig.scale,
            alpha: 0,
            duration: impactConfig.duration,
            ease: "Power2",
            onComplete: () => {
                impact.destroy();
                this.resolveIgneousExplosion(affectedTileKeys);
            },
        });

        this.instructionText.setText("O Cavaleiro conjurou Explosão Ígnea!");

        this.statusText.setText(
            "As chamas estão consumindo a área selecionada",
        );
    }

    private resolveIgneousExplosion(affectedTileKeys: Set<string>): void {
        const damage = IGNEOUS_EXPLOSION.damage ?? 0;

        let enemiesHit = 0;

        for (const enemy of this.enemies) {
            if (enemy.defeated) {
                continue;
            }

            const enemyKey = this.getPositionKey(
                enemy.position.row,
                enemy.position.column,
            );

            if (!affectedTileKeys.has(enemyKey)) {
                continue;
            }

            this.damageEnemy(enemy, damage);
            this.showFloatingDamage(enemy, `-${damage}`, "#ffb03d");

            enemiesHit += 1;
        }

        for (const key of affectedTileKeys) {
            const tile = this.getTileByKey(key);

            if (!tile || tile.type === "rock") {
                continue;
            }

            this.igniteGroundTile(tile);
        }

        this.refreshAllTiles();

        if (this.areAllEnemiesDefeated()) {
            this.coordinateText.setText(
                "Explosão Ígnea derrotou todos os inimigos!",
            );

            this.finishBattle(true);
            return;
        }

        if (enemiesHit > 0) {
            this.coordinateText.setText(
                `Explosão Ígnea atingiu ${enemiesHit} inimigo(s) e incendiou o terreno`,
            );
        } else {
            this.coordinateText.setText(
                "Explosão Ígnea incendiou o terreno, mas não atingiu inimigos",
            );
        }

        this.finishPlayerTurn();
    }

    private showFloatingDamage(
        enemy: EnemyUnit,
        text: string,
        color: string,
    ): void {
        const config = P0_EFFECTS_CONFIG.floatingDamage;

        const damageText = this.add
            .text(enemy.marker.x, enemy.marker.y + config.yOffset, text, {
                fontFamily: config.fontFamily,
                fontSize: config.fontSize,
                fontStyle: config.fontStyle,
                color,
                stroke: config.stroke,
                strokeThickness: config.strokeThickness,
            })
            .setOrigin(0.5)
            .setDepth(config.depth);

        this.tweens.add({
            targets: damageText,
            y: damageText.y + config.moveY,
            alpha: 0,
            duration: config.duration,
            ease: "Power2",
            onComplete: () => {
                damageText.destroy();
            },
        });
    }

    private igniteGroundTile(tile: ArenaTile): void {
        const key = this.getPositionKey(tile.row, tile.column);
        const duration = IGNEOUS_EXPLOSION.burningGroundDuration ?? 2;
        const damage = IGNEOUS_EXPLOSION.burningGroundDamage ?? 6;

        const existingEffect = this.burningGroundEffects.get(key);

        if (existingEffect) {
            existingEffect.remainingRounds = duration;
            existingEffect.damage = damage;
            return;
        }

        const position = this.getTileCenter(tile.row, tile.column);

        const burningGroundConfig = P0_EFFECTS_CONFIG.burningGround;

        const marker = this.add
            .text(position.x, position.y, burningGroundConfig.symbol, {
                fontFamily: burningGroundConfig.fontFamily,
                fontSize: burningGroundConfig.fontSize,
                fontStyle: burningGroundConfig.fontStyle,
                color: burningGroundConfig.color,
                stroke: burningGroundConfig.stroke,
                strokeThickness: burningGroundConfig.strokeThickness,
            })
            .setOrigin(0.5)
            .setDepth(position.y + burningGroundConfig.depthOffset);

        this.burningGroundEffects.set(key, {
            key,
            remainingRounds: duration,
            damage,
            marker,
        });
    }

    private getTileByKey(key: string): ArenaTile | undefined {
        return this.tiles.find(
            (tile) => this.getPositionKey(tile.row, tile.column) === key,
        );
    }

    private isBurningGroundTile(tile: ArenaTile): boolean {
        return this.burningGroundEffects.has(
            this.getPositionKey(tile.row, tile.column),
        );
    }

    private isSelected(tile: ArenaTile): boolean {
        return this.selectedTile === tile;
    }

    private isReachable(tile: ArenaTile): boolean {
        return this.reachableTileKeys.has(
            this.getPositionKey(tile.row, tile.column),
        );
    }

    private getPositionKey(row: number, column: number): string {
        return getPositionKey(row, column);
    }

    private isWithinArena(row: number, column: number): boolean {
        return isWithinGrid(
            {
                row,
                column,
            },
            {
                rows: this.rows,
                columns: this.columns,
            },
        );
    }

    private gridToIsometric(
        row: number,
        column: number,
    ): { x: number; y: number } {
        return {
            x: this.arenaOriginX + (column - row) * (this.tileWidth / 2),
            y: this.arenaOriginY + (column + row) * (this.tileHeight / 2),
        };
    }
    private getTileCenter(
        row: number,
        column: number,
    ): { x: number; y: number } {
        return this.gridToIsometric(row, column);
    }

    private getTileFootPosition(
        row: number,
        column: number,
        extraYOffset = 0,
    ): { x: number; y: number } {
        const center = this.gridToIsometric(row, column);

        return {
            x: center.x,
            y: center.y + this.entityFootOffsetY + extraYOffset,
        };
    }
}
