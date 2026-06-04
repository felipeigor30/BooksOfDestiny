import { GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";
import { FIREBALL } from "../data/abilities";
import {
    GridPosition,
    INITIAL_ENEMIES,
    INITIAL_PLAYER_POSITION,
    P0_ARENA_MAP,
    PLAYER_MOVEMENT_RANGE,
    TileType,
} from "../data/arena";

interface ArenaTile {
    row: number;
    column: number;
    type: TileType;
    baseColor: number;
    polygon: GameObjects.Polygon;
    decoration?: GameObjects.GameObject;
}

interface EnemyUnit {
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

interface TileStyle {
    color: number;
    label: string;
}

export class BattleScene extends Scene {
    private readonly rows = 8;
    private readonly columns = 8;

    private readonly tileWidth = 96;
    private readonly tileHeight = 48;

    private readonly arenaOriginX = 512;
    private readonly arenaOriginY = 184;

    private readonly tileStrokeColor = 0x6b4730;
    private readonly hoverColor = 0x80503a;
    private readonly selectedColor = 0xc45725;
    private readonly movementColor = 0x315b55;

    private readonly attackRangeColor = 0x71302a;
    private readonly attackTargetColor = 0xb54427;

    private readonly entityFootOffsetY = 6;
    private readonly rockFootOffsetY = 2;
    private readonly showDebugTileCoordinates = false;

    private readonly tileStyles: Record<TileType, TileStyle> = {
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

    private tiles: ArenaTile[] = [];
    private selectedTile?: ArenaTile;

    private playerPosition: GridPosition = { ...INITIAL_PLAYER_POSITION };
    private playerMarker?: GameObjects.Container;

    private readonly playerMaxHp = 100;
    private playerCurrentHp = 100;
    private playerHealthBar!: GameObjects.Rectangle;
    private playerHpText!: GameObjects.Text;

    private enemies: EnemyUnit[] = [];

    private round = 1;
    private roundText!: GameObjects.Text;

    private enemyTurnInProgress = false;
    private battleEnded = false;

    private movementMode = false;
    private canChooseAbility = false;
    private fireballTargetingMode = false;

    private reachableTileKeys = new Set<string>();
    private attackTileKeys = new Set<string>();

    private concentration = 0;

    private coordinateText!: GameObjects.Text;
    private instructionText!: GameObjects.Text;
    private statusText!: GameObjects.Text;

    private concentrationText!: GameObjects.Text;

    private fireballButtonBackground!: GameObjects.Rectangle;
    private fireballButtonLabel!: GameObjects.Text;

    private passTurnButtonBackground!: GameObjects.Rectangle;
    private passTurnButtonLabel!: GameObjects.Text;

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
        this.createFooter();
        this.createAbilityPanel();
        this.createLegend();
        this.refreshAllTiles();

        EventBus.emit("current-scene-ready", this);
    }

    private createBackground(): void {
        this.add.rectangle(512, 384, 1024, 768, 0x09070b).setDepth(-10);

        this.add
            .rectangle(512, 400, 930, 590, 0x120d11, 0.92)
            .setStrokeStyle(2, 0x3c261c, 1)
            .setDepth(-5);

        this.add.text(36, 730, "PROTÓTIPO DE COMBATE TÁTICO", {
            fontFamily: "Georgia, serif",
            fontSize: "12px",
            color: "#7c5a42",
        });
    }

    private createHeader(): void {
        this.add
            .text(512, 34, "BOOKS OF DESTINY", {
                fontFamily: "Georgia, serif",
                fontSize: "34px",
                fontStyle: "bold",
                color: "#e9c27c",
                stroke: "#32150d",
                strokeThickness: 5,
            })
            .setOrigin(0.5);

        this.add
            .text(512, 76, "P0 — ARENA DE COMBATE", {
                fontFamily: "Georgia, serif",
                fontSize: "16px",
                color: "#c16432",
            })
            .setOrigin(0.5);

        this.instructionText = this.add
            .text(512, 132, "Clique no Cavaleiro para iniciar a movimentação", {
                fontFamily: "Arial",
                fontSize: "14px",
                color: "#9d8977",
            })
            .setOrigin(0.5);
    }

    private createCombatHud(): void {
        this.add.text(82, 114, "HP", {
            fontFamily: "Georgia, serif",
            fontSize: "13px",
            fontStyle: "bold",
            color: "#dfb276",
        });

        this.add
            .rectangle(123, 121, 142, 14, 0x251619, 1)
            .setOrigin(0, 0.5)
            .setStrokeStyle(1, 0x71402e, 1);

        this.playerHealthBar = this.add
            .rectangle(126, 121, 136, 8, 0xb63d32, 1)
            .setOrigin(0, 0.5);

        this.playerHpText = this.add.text(
            274,
            114,
            `${this.playerCurrentHp} / ${this.playerMaxHp}`,
            {
                fontFamily: "Georgia, serif",
                fontSize: "13px",
                color: "#e5c79b",
            },
        );

        this.roundText = this.add
            .text(932, 114, `RODADA ${this.round}`, {
                fontFamily: "Georgia, serif",
                fontSize: "14px",
                fontStyle: "bold",
                color: "#d2753e",
            })
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
                    if (!this.isSelected(tile) && !this.isReachable(tile)) {
                        tilePolygon.setFillStyle(this.hoverColor, 1);
                    }
                });

                tilePolygon.on("pointerout", () => {
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

    private createTerrainDecoration(tile: ArenaTile): void {
        const center = this.getTileCenter(tile.row, tile.column);
        const foot = this.getTileFootPosition(
            tile.row,
            tile.column,
            this.rockFootOffsetY,
        );
        if (tile.type === "rock") {
            const rockShadow = this.add.ellipse(0, 3, 46, 15, 0x09080b, 0.65);

            const rockBody = this.add
                .polygon(
                    0,
                    -14,
                    [2, 32, 8, 15, 18, 4, 30, 0, 42, 14, 45, 32],
                    0x514850,
                    1,
                )
                .setOrigin(0.5, 1)
                .setStrokeStyle(2, 0x28232a, 1);

            const rockLight = this.add
                .polygon(
                    -5,
                    -19,
                    [0, 18, 5, 6, 14, 0, 21, 8, 12, 12],
                    0x766b67,
                    0.9,
                )
                .setOrigin(0.5, 1);

            const rock = this.add
                .container(foot.x, foot.y, [rockShadow, rockBody, rockLight])
                .setDepth(foot.y + 36);

            tile.decoration = rock;
        }

        if (tile.type === "corrupted") {
            const corruption = this.add
                .text(center.x, center.y, "✦", {
                    fontFamily: "Georgia, serif",
                    fontSize: "20px",
                    color: "#b53e45",
                    stroke: "#251018",
                    strokeThickness: 3,
                })
                .setOrigin(0.5)
                .setDepth(center.y + 1);

            tile.decoration = corruption;
        }
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
        const position = this.getTileFootPosition(
            this.playerPosition.row,
            this.playerPosition.column,
        );

        const shadow = this.add.ellipse(0, 1, 48, 18, 0x000000, 0.5);

        const body = this.add
            .circle(0, -24, 19, 0x9f3820, 1)
            .setStrokeStyle(3, 0xf2b34b, 1);

        const initial = this.add
            .text(0, -25, "F", {
                fontFamily: "Georgia, serif",
                fontSize: "21px",
                fontStyle: "bold",
                color: "#ffe6a8",
            })
            .setOrigin(0.5);

        const label = this.add
            .text(0, -55, "Cavaleiro de Fogo", {
                fontFamily: "Georgia, serif",
                fontSize: "11px",
                color: "#f0c586",
                backgroundColor: "#211410",
                padding: {
                    x: 6,
                    y: 3,
                },
            })
            .setOrigin(0.5);

        this.playerMarker = this.add
            .container(position.x, position.y, [shadow, body, initial, label])
            .setDepth(position.y + 50);

        this.playerMarker.on("pointerdown", () => {
            this.startPlayerMovement();
        });
    }

    private createEnemies(): void {
        for (const initialEnemy of INITIAL_ENEMIES) {
            const position = this.getTileFootPosition(
                initialEnemy.position.row,
                initialEnemy.position.column,
            );

            const shadow = this.add.ellipse(0, 1, 46, 16, 0x000000, 0.55);

            const body = this.add
                .circle(0, -22, 18, 0x231823, 1)
                .setStrokeStyle(3, 0xc94439, 1);

            const symbol = this.add
                .text(0, -23, initialEnemy.symbol, {
                    fontFamily: "Georgia, serif",
                    fontSize: "20px",
                    fontStyle: "bold",
                    color: "#f1a0a0",
                })
                .setOrigin(0.5);

            const label = this.add
                .text(0, -57, initialEnemy.name, {
                    fontFamily: "Georgia, serif",
                    fontSize: "11px",
                    color: "#e6b4a6",
                    backgroundColor: "#201014",
                    padding: {
                        x: 6,
                        y: 3,
                    },
                })
                .setOrigin(0.5);

            const healthBackground = this.add
                .rectangle(0, -42, 48, 5, 0x241215, 1)
                .setStrokeStyle(1, 0x4a292c, 1);

            const healthBar = this.add
                .rectangle(-23, -42, 46, 3, 0xb43a39, 1)
                .setOrigin(0, 0.5);

            const marker = this.add
                .container(position.x, position.y, [
                    shadow,
                    body,
                    symbol,
                    label,
                    healthBackground,
                    healthBar,
                ])
                .setDepth(position.y + 50);

            this.enemies.push({
                ...initialEnemy,
                currentHp: initialEnemy.maxHp,
                marker,
                healthBar,
                defeated: false,
                burningRounds: 0,
                burnDamage: 0,
            });
        }
    }
    private createFooter(): void {
        this.add
            .rectangle(512, 636, 570, 48, 0x160f10, 1)
            .setStrokeStyle(2, 0x6b4730, 1);

        this.coordinateText = this.add
            .text(512, 636, "Nenhuma casa selecionada", {
                fontFamily: "Georgia, serif",
                fontSize: "16px",
                color: "#dbc095",
            })
            .setOrigin(0.5);

        this.statusText = this.add
            .text(512, 679, "Turno do Jogador — Selecione o Cavaleiro", {
                fontFamily: "Georgia, serif",
                fontSize: "16px",
                color: "#d06c36",
            })
            .setOrigin(0.5);
    }

    private createAbilityPanel(): void {
        this.add
            .rectangle(835, 594, 240, 142, 0x130d0f, 1)
            .setStrokeStyle(2, 0x5c3826, 1);

        this.add.text(735, 536, "GRIMÓRIO", {
            fontFamily: "Georgia, serif",
            fontSize: "13px",
            color: "#d4a45f",
        });

        // Botão Bola de Fogo
        this.fireballButtonBackground = this.add
            .rectangle(790, 570, 122, 40, 0x22181a, 1)
            .setStrokeStyle(2, 0x4e352a, 1);

        this.fireballButtonLabel = this.add
            .text(790, 570, "🔥 Bola de Fogo", {
                fontFamily: "Georgia, serif",
                fontSize: "13px",
                color: "#7e6c60",
            })
            .setOrigin(0.5);

        const fireballButton = this.add
            .container(790, 570, [])
            .setSize(122, 40)
            .setInteractive({ useHandCursor: true });

        fireballButton.on("pointerdown", () => {
            this.selectFireball();
        });

        // Botão Passar Turno
        this.passTurnButtonBackground = this.add
            .rectangle(790, 614, 122, 36, 0x302119, 1)
            .setStrokeStyle(2, 0x8c5b31, 1);

        this.passTurnButtonLabel = this.add
            .text(790, 614, "⏭ Passar Turno", {
                fontFamily: "Georgia, serif",
                fontSize: "12px",
                color: "#e5bd78",
            })
            .setOrigin(0.5);

        const passTurnButton = this.add
            .container(790, 614, [])
            .setSize(122, 36)
            .setInteractive({ useHandCursor: true });

        passTurnButton.on("pointerdown", () => {
            this.passPlayerTurn();
        });

        this.concentrationText = this.add.text(
            735,
            646,
            "Concentração: 0 / 100",
            {
                fontFamily: "Georgia, serif",
                fontSize: "12px",
                color: "#bd8560",
            },
        );

        this.setFireballButtonEnabled(false);
        this.setPassTurnButtonEnabled(true);
    }

    private createLegend(): void {
        const legendY = 706;

        this.add
            .rectangle(512, legendY, 650, 30, 0x100c0d, 0.85)
            .setStrokeStyle(1, 0x35231c, 1);

        this.add
            .text(280, legendY, "◆ Chão", {
                fontFamily: "Arial",
                fontSize: "12px",
                color: "#96705b",
            })
            .setOrigin(0, 0.5);

        this.add
            .text(410, legendY, "✦ Corrupção", {
                fontFamily: "Arial",
                fontSize: "12px",
                color: "#bd4d51",
            })
            .setOrigin(0, 0.5);

        this.add
            .text(563, legendY, "▲ Rocha", {
                fontFamily: "Arial",
                fontSize: "12px",
                color: "#968981",
            })
            .setOrigin(0, 0.5);

        this.add
            .text(680, legendY, "F Cavaleiro", {
                fontFamily: "Arial",
                fontSize: "12px",
                color: "#e4aa52",
            })
            .setOrigin(0, 0.5);

        this.add
            .text(785, legendY, "L Lobo", {
                fontFamily: "Arial",
                fontSize: "12px",
                color: "#e6817d",
            })
            .setOrigin(0, 0.5);
    }

    private startPlayerMovement(): void {
        this.movementMode = true;
        this.selectedTile = undefined;

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

        if (this.fireballTargetingMode) {
            this.tryCastFireballOnTile(tile);
            return;
        }

        if (this.isPlayerOnTile(tile)) {
            if (this.canChooseAbility) {
                this.coordinateText.setText(
                    "O Cavaleiro já está pronto — escolha uma magia",
                );
                return;
            }

            if (!this.movementMode) {
                this.startPlayerMovement();
                return;
            }

            this.confirmPlayerWithoutMovement();
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
            "Clique no Cavaleiro para iniciar a movimentação",
        );

        this.statusText.setText("Turno do Jogador — Selecione o Cavaleiro");

        this.coordinateText.setText(
            `Movimento cancelado — Linha: ${this.playerPosition.row + 1} | Coluna: ${this.playerPosition.column + 1}`,
        );
    }

    private setFireballButtonEnabled(enabled: boolean): void {
        if (enabled) {
            this.fireballButtonBackground
                .setFillStyle(0x502017, 1)
                .setStrokeStyle(2, 0xd06a2b, 1);

            this.fireballButtonLabel.setColor("#ffd08a");
            return;
        }

        this.fireballButtonBackground
            .setFillStyle(0x22181a, 1)
            .setStrokeStyle(2, 0x4e352a, 1);

        this.fireballButtonLabel.setColor("#7e6c60");
    }

    private setPassTurnButtonEnabled(enabled: boolean): void {
        if (enabled) {
            this.passTurnButtonBackground
                .setFillStyle(0x302119, 1)
                .setStrokeStyle(2, 0xb67b39, 1);

            this.passTurnButtonLabel.setColor("#f0ca83");
            return;
        }

        this.passTurnButtonBackground
            .setFillStyle(0x21181a, 1)
            .setStrokeStyle(2, 0x4e352a, 1);

        this.passTurnButtonLabel.setColor("#71655b");
    }

    private selectFireball(): void {
        if (this.enemyTurnInProgress || this.battleEnded) {
            return;
        }

        if (!this.canChooseAbility) {
            this.statusText.setText(
                "Movimente o Cavaleiro ou permaneça na posição antes de utilizar uma magia",
            );
            return;
        }

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
            this.instructionText.setText(
                "Nenhum inimigo no alcance da Bola de Fogo.",
            );

            this.statusText.setText(
                "Escolha Passar Turno para encerrar sua rodada",
            );

            return;
        }

        this.instructionText.setText(
            "Bola de Fogo selecionada — escolha um inimigo dentro do alcance",
        );

        this.statusText.setText(
            `${FIREBALL.name} — Alcance: ${FIREBALL.range} casas | Dano: ${FIREBALL.damage}`,
        );
    }

    private passPlayerTurn(): void {
        if (this.enemyTurnInProgress || this.battleEnded) {
            return;
        }

        this.movementMode = false;
        this.canChooseAbility = false;
        this.fireballTargetingMode = false;

        this.reachableTileKeys.clear();
        this.attackTileKeys.clear();

        this.refreshAllTiles();

        this.coordinateText.setText(
            "O Cavaleiro decidiu não realizar nenhum ataque nesta rodada",
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
                const distance =
                    Math.abs(start.row - row) + Math.abs(start.column - column);

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

        const projectileGlow = this.add
            .circle(origin.x, origin.y - 25, 11, 0xff4e16, 0.25)
            .setDepth(1000);

        const projectile = this.add
            .circle(origin.x, origin.y - 25, 7, 0xffa329, 1)
            .setStrokeStyle(2, 0xffe08b, 1)
            .setDepth(1001);

        this.tweens.add({
            targets: [projectileGlow, projectile],
            x: destination.x,
            y: destination.y - 23,
            duration: 340,
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

        if (enemy.currentHp === 0) {
            this.defeatEnemy(enemy);
        }
    }

    private defeatEnemy(enemy: EnemyUnit): void {
        enemy.defeated = true;
        enemy.marker.setAlpha(0.3);

        if (enemy.burnMarker) {
            enemy.burnMarker.destroy();
            enemy.burnMarker = undefined;
        }

        enemy.burningRounds = 0;
        enemy.burnDamage = 0;

        this.refreshAllTiles();
    }

    private areAllEnemiesDefeated(): boolean {
        return this.enemies.every((enemy) => enemy.defeated);
    }

    private applyFireballDamage(enemy: EnemyUnit): void {
        this.damageEnemy(enemy, FIREBALL.damage);

        this.concentration = Math.min(
            100,
            this.concentration + FIREBALL.concentrationGain,
        );

        this.concentrationText.setText(
            `Concentração: ${this.concentration} / 100`,
        );

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
                `${FIREBALL.name} causou ${FIREBALL.damage} de dano e aplicou Queimadura — ${enemy.name}: ${enemy.currentHp}/${enemy.maxHp} HP`,
            );
        } else {
            this.coordinateText.setText(
                `${FIREBALL.name} causou ${FIREBALL.damage} de dano — ${enemy.name}: ${enemy.currentHp}/${enemy.maxHp} HP`,
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
            enemy.burnMarker = this.add
                .text(22, -24, "🔥", {
                    fontSize: "16px",
                })
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

        this.reachableTileKeys.clear();
        this.attackTileKeys.clear();

        this.setFireballButtonEnabled(false);
        this.setPassTurnButtonEnabled(false);
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
        this.canChooseAbility = false;
        this.fireballTargetingMode = false;
        this.enemyTurnInProgress = true;

        this.reachableTileKeys.clear();
        this.attackTileKeys.clear();

        this.setFireballButtonEnabled(false);
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
    }
    private performEnemyAction(
        enemy: EnemyUnit,
        activeEnemies: EnemyUnit[],
        index: number,
    ): void {
        if (this.isAdjacentToPlayer(enemy.position)) {
            this.enemyAttackPlayer(enemy, () => {
                this.time.delayedCall(350, () => {
                    this.executeEnemyAction(activeEnemies, index + 1);
                });
            });

            return;
        }

        this.moveEnemyTowardPlayer(enemy, () => {
            if (this.battleEnded) {
                return;
            }

            if (this.isAdjacentToPlayer(enemy.position)) {
                this.enemyAttackPlayer(enemy, () => {
                    this.time.delayedCall(350, () => {
                        this.executeEnemyAction(activeEnemies, index + 1);
                    });
                });

                return;
            }

            this.time.delayedCall(350, () => {
                this.executeEnemyAction(activeEnemies, index + 1);
            });
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

        const burnDamageText = this.add
            .text(
                enemy.marker.x,
                enemy.marker.y - 78,
                `-${enemy.burnDamage} 🔥`,
                {
                    fontFamily: "Georgia, serif",
                    fontSize: "16px",
                    fontStyle: "bold",
                    color: "#ff8533",
                    stroke: "#34120d",
                    strokeThickness: 3,
                },
            )
            .setOrigin(0.5)
            .setDepth(2000);

        this.tweens.add({
            targets: burnDamageText,
            y: burnDamageText.y - 24,
            alpha: 0,
            duration: 620,
            ease: "Power2",
            onComplete: () => {
                burnDamageText.destroy();
            },
        });

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
                onComplete();
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
        const distance =
            Math.abs(position.row - this.playerPosition.row) +
            Math.abs(position.column - this.playerPosition.column);

        return distance === 1;
    }

    private enemyAttackPlayer(enemy: EnemyUnit, onComplete: () => void): void {
        this.playerCurrentHp = Math.max(0, this.playerCurrentHp - enemy.damage);

        const remainingLifeRatio = this.playerCurrentHp / this.playerMaxHp;

        this.playerHealthBar.setScale(remainingLifeRatio, 1);

        this.playerHpText.setText(
            `${this.playerCurrentHp} / ${this.playerMaxHp}`,
        );

        this.statusText.setText(
            `${enemy.name} atacou o Cavaleiro e causou ${enemy.damage} de dano`,
        );

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

    private startNewPlayerTurn(): void {
        if (this.battleEnded) {
            return;
        }

        this.round += 1;
        this.roundText.setText(`RODADA ${this.round}`);

        this.enemyTurnInProgress = false;
        this.movementMode = false;
        this.canChooseAbility = false;
        this.fireballTargetingMode = false;

        this.reachableTileKeys.clear();
        this.attackTileKeys.clear();

        this.setFireballButtonEnabled(false);
        this.setPassTurnButtonEnabled(true);
        this.refreshAllTiles();

        this.instructionText.setText(
            "Clique no Cavaleiro para iniciar a movimentação",
        );

        this.coordinateText.setText(
            `Nova rodada iniciada — HP do Cavaleiro: ${this.playerCurrentHp}/${this.playerMaxHp}`,
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
        this.canChooseAbility = true;
        this.reachableTileKeys.clear();
        this.selectedTile = undefined;

        this.setFireballButtonEnabled(true);
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

        tile.polygon.setFillStyle(tile.baseColor, 1);
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
        return `${row}:${column}`;
    }

    private isWithinArena(row: number, column: number): boolean {
        return (
            row >= 0 && row < this.rows && column >= 0 && column < this.columns
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
