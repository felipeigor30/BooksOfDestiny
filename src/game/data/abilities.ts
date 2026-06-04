export interface AbilityDefinition {
    id: string;
    name: string;
    damage: number;
    range: number;
    concentrationGain: number;
    description: string;
}

export const FIREBALL: AbilityDefinition = {
    id: "fireball",
    name: "Bola de Fogo",
    damage: 20,
    range: 4,
    concentrationGain: 20,
    description: "Lança uma esfera flamejante contra um inimigo.",
};
