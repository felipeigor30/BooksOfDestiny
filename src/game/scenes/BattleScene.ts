import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';

interface ArenaTile {
    row: number;
    column: number;
    baseColor: number;
    polygon: GameObjects.Polygon;
}

export class BattleScene extends Scene {
    private readonly rows = 8;
    private readonly columns = 8;

    private readonly tileWidth = 96;
    private readonly tileHeight = 48;

    private readonly arenaOriginX = 512;
    private readonly arenaOriginY = 170;

    private readonly tileStrokeColor = 0x6b4730;
    private readonly hoverColor = 0x815033;
    private readonly selectedColor = 0xc45725;

    private tiles: ArenaTile[] = [];
    private selectedTile?: ArenaTile;
    private coordinateText!: GameObjects.Text;

    constructor() {
        super('BattleScene');
    }

    create(): void {
        this.cameras.main.setBackgroundColor('#09070b');

        this.createBackground();
        this.createHeader();
        this.createArena();
        this.createFooter();

        EventBus.emit('current-scene-ready', this);
    }

    private createBackground(): void {
        this.add
            .rectangle(512, 384, 1024, 768, 0x09070b)
            .setDepth(-10);

        this.add
            .rectangle(512, 415, 930, 560, 0x120d11, 0.92)
            .setStrokeStyle(2, 0x3c261c, 1)
            .setDepth(-5);

        this.add
            .text(36, 730, 'PROTÓTIPO DE COMBATE TÁTICO', {
                fontFamily: 'Georgia, serif',
                fontSize: '12px',
                color: '#7c5a42',
                letterSpacing: 2
            });
    }

    private createHeader(): void {
        this.add
            .text(512, 36, 'BOOKS OF DESTINY', {
                fontFamily: 'Georgia, serif',
                fontSize: '34px',
                fontStyle: 'bold',
                color: '#e9c27c',
                stroke: '#32150d',
                strokeThickness: 5
            })
            .setOrigin(0.5);

        this.add
            .text(512, 78, 'P0 — ARENA DE COMBATE', {
                fontFamily: 'Georgia, serif',
                fontSize: '16px',
                color: '#c16432',
                letterSpacing: 3
            })
            .setOrigin(0.5);

        this.add
            .text(512, 106, 'Selecione uma casa do campo tático', {
                fontFamily: 'Arial',
                fontSize: '13px',
                color: '#887465'
            })
            .setOrigin(0.5);
    }

    private createArena(): void {
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                const position = this.gridToIsometric(row, column);
                const baseColor = this.getTileBaseColor(row, column);

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
                        baseColor,
                        1
                    )
                    .setStrokeStyle(2, this.tileStrokeColor, 1)
                    .setInteractive({ useHandCursor: true });

                const tile: ArenaTile = {
                    row,
                    column,
                    baseColor,
                    polygon: tilePolygon
                };

                tilePolygon.on('pointerover', () => {
                    if (this.selectedTile !== tile) {
                        tilePolygon.setFillStyle(this.hoverColor, 1);
                    }
                });

                tilePolygon.on('pointerout', () => {
                    if (this.selectedTile !== tile) {
                        tilePolygon.setFillStyle(tile.baseColor, 1);
                    }
                });

                tilePolygon.on('pointerdown', () => {
                    this.selectTile(tile);
                });

                this.tiles.push(tile);
            }
        }
    }

    private createFooter(): void {
        this.add
            .rectangle(512, 670, 520, 54, 0x160f10, 1)
            .setStrokeStyle(2, 0x6b4730, 1);

        this.coordinateText = this.add
            .text(512, 670, 'Nenhuma casa selecionada', {
                fontFamily: 'Georgia, serif',
                fontSize: '18px',
                color: '#dbc095'
            })
            .setOrigin(0.5);
    }

    private selectTile(tile: ArenaTile): void {
        if (this.selectedTile) {
            this.selectedTile.polygon.setFillStyle(
                this.selectedTile.baseColor,
                1
            );
        }

        this.selectedTile = tile;

        tile.polygon.setFillStyle(this.selectedColor, 1);

        this.coordinateText.setText(
            `Casa selecionada — Linha: ${tile.row + 1} | Coluna: ${tile.column + 1}`
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

    private getTileBaseColor(row: number, column: number): number {
        return (row + column) % 2 === 0 ? 0x3b2923 : 0x463129;
    }
}