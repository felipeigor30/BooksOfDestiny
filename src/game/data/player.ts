export interface PlayerInitialStats {
    id: string;
    name: string;
    symbol: string;
    maxHp: number;
    initialShield: number;
    initialConcentration: number;
}

export const FIRE_KNIGHT_INITIAL_STATS: PlayerInitialStats = {
    id: "fire-knight",
    name: "Cavaleiro de Fogo",
    symbol: "F",
    maxHp: 100,
    initialShield: 0,
    initialConcentration: 0,
};
