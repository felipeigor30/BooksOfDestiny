import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import {
    GridPosition,
    INITIAL_PLAYER_POSITION,
    P0_ARENA_MAP,
    PLAYER_MOVEMENT_RANGE,
    TileType
} from '../data/arena';

interface ArenaTile {
    row: number;
    column: number;
    type: TileType;
    baseColor: number;
    polygon: GameObjects.Polygon;
    decoration?: GameObjects.GameObject;
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
    private readonly arenaOriginY = 170;

    private readonly tileStrokeColor = 0x6b4730;
    private readonly hoverColor = 0x80503a;
    private readonly selectedColor = 0xc45725;
    private readonly movementColor = 0x315b55;

    private readonly tileStyles: Record<TileType, TileStyle> = {
        ground: {
            color: 0x3b2923,
            label: 'Chão comum'
        },
        corrupted: {
            color: 0x401d2b,
            label: 'Terreno corrompido'
        },
        rock: {
            color: 0x26232a,
            label: 'Rocha — movimento bloqueado'
        }
    };

    private tiles: ArenaTile[] = [];
    private selectedTile?: ArenaTile;

    private playerPosition: GridPosition = { ...INITIAL_PLAYER_POSITION };
    private playerMarker?: GameObjects.Container;

    private movementMode = false;
    private reachableTileKeys = new Set<string>();

    private coordinateText!: GameObjects.Text;
    private instructionText!: GameObjects.Text;
    private statusText!: GameObjects.Text;

    constructor() {
        super('BattleScene');
    }

    create(): void {
        this.cameras.main.setBackgroundColor('#09070b');

        this.createBackground();
        this.createHeader();
        this.createArena();
        this.createPlayerMarker();
        this.createFooter();
        this.createLegend();
        this.refreshAllTiles();

        EventBus.emit('current-scene-ready', this);
    }

    private createBackground(): void {
        this.add
            .rectangle(512, 384, 1024, 768, 0x09070b)
            .setDepth(-10);

        this.add
            .rectangle(512, 400, 930, 590, 0x120d11, 0.92)
            .setStrokeStyle(2, 0x3c261c, 1)
            .setDepth(-5);

        this.add
            .text(36, 730, 'PROTÓTIPO DE COMBATE TÁTICO', {
                fontFamily: 'Georgia, serif',
                fontSize: '12px',
                color: '#7c5a42'
            });
    }

    private createHeader(): void {
        this.add
            .text(512, 34, 'BOOKS OF DESTINY', {
                fontFamily: 'Georgia, serif',
                fontSize: '34px',
                fontStyle: 'bold',
                color: '#e9c27c',
                stroke: '#32150d',
                strokeThickness: 5
            })
            .setOrigin(0.5);

        this.add
            .text(512, 76, 'P0 — ARENA DE COMBATE', {
                fontFamily: 'Georgia, serif',
                fontSize: '16px',
                color: '#c16432'
            })
            .setOrigin(0.5);

        this.instructionText = this.add
            .text(512, 105, 'Clique no Cavaleiro para iniciar a movimentação', {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#9d8977'
            })
            .setOrigin(0.5);
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
                            0,
                            -this.tileHeight / 2,
                            this.tileWidth / 2,
                            0,
                            0,
                            this.tileHeight / 2,
                            -this.tileWidth / 2,
                            0
                        ],
                        style.color,
                        1
                    )
                    .setStrokeStyle(2, this.tileStrokeColor, 1)
                    .setDepth(position.y)
                    .setInteractive({ useHandCursor: true });

                const tile: ArenaTile = {
                    row,
                    column,
                    type,
                    baseColor: style.color,
                    polygon: tilePolygon
                };

                tilePolygon.on('pointerover', () => {
                    if (!this.isSelected(tile) && !this.isReachable(tile)) {
                        tilePolygon.setFillStyle(this.hoverColor, 1);
                    }
                });

                tilePolygon.on('pointerout', () => {
                    this.refreshTileAppearance(tile);
                });

                tilePolygon.on('pointerdown', () => {
                    this.handleTileClick(tile);
                });

                this.tiles.push(tile);
                this.createTerrainDecoration(tile, position.x, position.y);
            }
        }
    }

    private createTerrainDecoration(
        tile: ArenaTile,
        x: number,
        y: number
    ): void {
        if (tile.type === 'rock') {
            const rock = this.add
                .text(x, y - 12, '▲', {
                    fontFamily: 'Arial',
                    fontSize: '27px',
                    fontStyle: 'bold',
                    color: '#71645f',
                    stroke: '#17151a',
                    strokeThickness: 4
                })
                .setOrigin(0.5)
                .setDepth(y + 1);

            tile.decoration = rock;
        }

        if (tile.type === 'corrupted') {
            const corruption = this.add
                .text(x, y - 1, '✦', {
                    fontFamily: 'Georgia, serif',
                    fontSize: '20px',
                    color: '#b53e45',
                    stroke: '#251018',
                    strokeThickness: 3
                })
                .setOrigin(0.5)
                .setDepth(y + 1);

            tile.decoration = corruption;
        }
    }

    private createPlayerMarker(): void {
        const position = this.gridToIsometric(
            this.playerPosition.row,
            this.playerPosition.column
        );

        const shadow = this.add.ellipse(0, 1, 48, 18, 0x000000, 0.5);

        const body = this.add
            .circle(0, -24, 19, 0x9f3820, 1)
            .setStrokeStyle(3, 0xf2b34b, 1);

        const initial = this.add
            .text(0, -25, 'F', {
                fontFamily: 'Georgia, serif',
                fontSize: '21px',
                fontStyle: 'bold',
                color: '#ffe6a8'
            })
            .setOrigin(0.5);

        const label = this.add
            .text(0, -55, 'Cavaleiro de Fogo', {
                fontFamily: 'Georgia, serif',
                fontSize: '11px',
                color: '#f0c586',
                backgroundColor: '#211410',
                padding: {
                    x: 6,
                    y: 3
                }
            })
            .setOrigin(0.5);

        this.playerMarker = this.add
            .container(position.x, position.y, [shadow, body, initial, label])
            .setDepth(position.y + 50);

        this.playerMarker.on('pointerdown', () => {
            this.startPlayerMovement();
        });
    }

    private createFooter(): void {
        this.add
            .rectangle(512, 636, 570, 48, 0x160f10, 1)
            .setStrokeStyle(2, 0x6b4730, 1);

        this.coordinateText = this.add
            .text(512, 636, 'Nenhuma casa selecionada', {
                fontFamily: 'Georgia, serif',
                fontSize: '16px',
                color: '#dbc095'
            })
            .setOrigin(0.5);

        this.statusText = this.add
            .text(512, 679, 'Turno do Jogador — Selecione o Cavaleiro', {
                fontFamily: 'Georgia, serif',
                fontSize: '16px',
                color: '#d06c36'
            })
            .setOrigin(0.5);
    }

    private createLegend(): void {
        const legendY = 706;

        this.add
            .rectangle(512, legendY, 540, 30, 0x100c0d, 0.85)
            .setStrokeStyle(1, 0x35231c, 1);

        this.add
            .text(280, legendY, '◆ Chão', {
                fontFamily: 'Arial',
                fontSize: '12px',
                color: '#96705b'
            })
            .setOrigin(0, 0.5);

        this.add
            .text(410, legendY, '✦ Corrupção', {
                fontFamily: 'Arial',
                fontSize: '12px',
                color: '#bd4d51'
            })
            .setOrigin(0, 0.5);

        this.add
            .text(563, legendY, '▲ Rocha', {
                fontFamily: 'Arial',
                fontSize: '12px',
                color: '#968981'
            })
            .setOrigin(0, 0.5);

        this.add
            .text(680, legendY, 'F Cavaleiro', {
                fontFamily: 'Arial',
                fontSize: '12px',
                color: '#e4aa52'
            })
            .setOrigin(0, 0.5);
    }

    private startPlayerMovement(): void {
        this.movementMode = true;
        this.selectedTile = undefined;

        this.reachableTileKeys = this.calculateReachableTiles(
            this.playerPosition,
            PLAYER_MOVEMENT_RANGE
        );

        this.refreshAllTiles();

        this.instructionText.setText(
            'Escolha uma casa destacada para movimentar o Cavaleiro'
        );

        this.statusText.setText(
            `Movimento disponível: até ${PLAYER_MOVEMENT_RANGE} casas`
        );

        this.coordinateText.setText(
            `Posição atual — Linha: ${this.playerPosition.row + 1} | Coluna: ${this.playerPosition.column + 1}`
        );
    }

   private handleTileClick(tile: ArenaTile): void {
    if (this.isPlayerOnTile(tile)) {
        if (!this.movementMode) {
            this.startPlayerMovement();
            return;
        }

        this.cancelPlayerMovement();
        return;
    }

    if (tile.type === 'rock') {
        this.coordinateText.setText(
            `Linha: ${tile.row + 1} | Coluna: ${tile.column + 1} — Rocha bloqueia o movimento`
        );
        return;
    }

    if (this.movementMode) {
        if (this.isReachable(tile)) {
            this.movePlayerTo(tile);
            return;
        }

        this.coordinateText.setText(
            `Linha: ${tile.row + 1} | Coluna: ${tile.column + 1} — Fora do alcance`
        );
        return;
    }

    this.selectTile(tile);
}

private isPlayerOnTile(tile: ArenaTile): boolean {
    return (
        tile.row === this.playerPosition.row &&
        tile.column === this.playerPosition.column
    );
}
private cancelPlayerMovement(): void {
    this.movementMode = false;
    this.reachableTileKeys.clear();
    this.selectedTile = undefined;

    this.refreshAllTiles();

    this.instructionText.setText(
        'Clique no Cavaleiro para iniciar a movimentação'
    );

    this.statusText.setText(
        'Turno do Jogador — Selecione o Cavaleiro'
    );

    this.coordinateText.setText(
        `Movimento cancelado — Linha: ${this.playerPosition.row + 1} | Coluna: ${this.playerPosition.column + 1}`
    );
}
    private selectTile(tile: ArenaTile): void {
        this.selectedTile = tile;
        this.refreshAllTiles();

        this.coordinateText.setText(
            `Casa selecionada — Linha: ${tile.row + 1} | Coluna: ${tile.column + 1} — ${this.tileStyles[tile.type].label}`
        );
    }

    private movePlayerTo(tile: ArenaTile): void {
        if (!this.playerMarker) {
            return;
        }

        this.playerPosition = {
            row: tile.row,
            column: tile.column
        };

        const destination = this.gridToIsometric(tile.row, tile.column);

        this.tweens.add({
            targets: this.playerMarker,
            x: destination.x,
            y: destination.y,
            duration: 260,
            ease: 'Power2',
            onUpdate: () => {
                if (this.playerMarker) {
                    this.playerMarker.setDepth(this.playerMarker.y + 50);
                }
            }
        });

        this.movementMode = false;
        this.reachableTileKeys.clear();
        this.selectedTile = undefined;

        this.refreshAllTiles();

        this.coordinateText.setText(
            `Cavaleiro movido — Linha: ${tile.row + 1} | Coluna: ${tile.column + 1}`
        );

        this.instructionText.setText(
            'Movimento realizado. A próxima etapa será selecionar uma magia.'
        );

        this.statusText.setText(
            'Ação de movimento concluída — ataque ainda não implementado'
        );
    }

    private calculateReachableTiles(
        start: GridPosition,
        movementRange: number
    ): Set<string> {
        const reachable = new Set<string>();
        const visited = new Map<string, number>();

        const queue: Array<{ position: GridPosition; distance: number }> = [
            {
                position: start,
                distance: 0
            }
        ];

        visited.set(this.getPositionKey(start.row, start.column), 0);

        const directions: GridPosition[] = [
            { row: -1, column: 0 },
            { row: 1, column: 0 },
            { row: 0, column: -1 },
            { row: 0, column: 1 }
        ];

        while (queue.length > 0) {
            const current = queue.shift();

            if (!current || current.distance >= movementRange) {
                continue;
            }

            for (const direction of directions) {
                const nextRow = current.position.row + direction.row;
                const nextColumn =
                    current.position.column + direction.column;

                if (!this.isWithinArena(nextRow, nextColumn)) {
                    continue;
                }

                if (P0_ARENA_MAP[nextRow][nextColumn] === 'rock') {
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

                if (
                    nextRow !== start.row ||
                    nextColumn !== start.column
                ) {
                    reachable.add(key);
                }

                queue.push({
                    position: {
                        row: nextRow,
                        column: nextColumn
                    },
                    distance: nextDistance
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
    if (this.isPlayerOnTile(tile)) {
        tile.polygon.setStrokeStyle(3, 0xe4aa52, 1);
    } else {
        tile.polygon.setStrokeStyle(2, this.tileStrokeColor, 1);
    }

    if (this.isSelected(tile)) {
        tile.polygon.setFillStyle(this.selectedColor, 1);
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
            this.getPositionKey(tile.row, tile.column)
        );
    }

    private getPositionKey(row: number, column: number): string {
        return `${row}:${column}`;
    }

    private isWithinArena(row: number, column: number): boolean {
        return (
            row >= 0 &&
            row < this.rows &&
            column >= 0 &&
            column < this.columns
        );
    }

    private gridToIsometric(
        row: number,
        column: number
    ): { x: number; y: number } {
        return {
            x:
                this.arenaOriginX +
                (column - row) * (this.tileWidth / 2),
            y:
                this.arenaOriginY +
                (column + row) * (this.tileHeight / 2)
        };
    }
}