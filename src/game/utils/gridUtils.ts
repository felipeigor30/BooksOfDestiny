import { GridPosition } from "../data/arena";

export interface GridSize {
    rows: number;
    columns: number;
}

export interface CalculateSquareAreaParams {
    center: GridPosition;
    radius: number;
    gridSize: GridSize;
    isBlocked?: (position: GridPosition) => boolean;
}

export function getPositionKey(row: number, column: number): string {
    return `${row}:${column}`;
}

export function getGridPositionKey(position: GridPosition): string {
    return getPositionKey(position.row, position.column);
}

export function getManhattanDistance(
    origin: GridPosition,
    target: GridPosition,
): number {
    return (
        Math.abs(origin.row - target.row) +
        Math.abs(origin.column - target.column)
    );
}

export function isWithinGrid(
    position: GridPosition,
    gridSize: GridSize,
): boolean {
    return (
        position.row >= 0 &&
        position.row < gridSize.rows &&
        position.column >= 0 &&
        position.column < gridSize.columns
    );
}

export function calculateSquareAreaKeys(
    params: CalculateSquareAreaParams,
): Set<string> {
    const areaTiles = new Set<string>();

    const { center, radius, gridSize, isBlocked } = params;

    for (let row = center.row - radius; row <= center.row + radius; row++) {
        for (
            let column = center.column - radius;
            column <= center.column + radius;
            column++
        ) {
            const position: GridPosition = {
                row,
                column,
            };

            if (!isWithinGrid(position, gridSize)) {
                continue;
            }

            if (isBlocked?.(position)) {
                continue;
            }

            areaTiles.add(getGridPositionKey(position));
        }
    }

    return areaTiles;
}
