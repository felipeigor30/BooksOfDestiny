export type AbilityCategory =
    | "basic"
    | "tactical"
    | "concentration"
    | "channeled";

export interface AbilityDefinition {
    id: string;
    name: string;
    category: AbilityCategory;
    range: number;
    concentrationGain: number;
    description: string;

    damage?: number;

    burnChance?: number;
    burnDamage?: number;
    burnDuration?: number;

    shieldAbsorption?: number;
}

export const FIREBALL: AbilityDefinition = {
    id: "fireball",
    name: "Bola de Fogo",
    category: "basic",
    damage: 20,
    range: 4,
    concentrationGain: 20,
    description: "Lança uma esfera flamejante contra um inimigo.",
    burnChance: 0.3,
    burnDamage: 5,
    burnDuration: 2,
};

export const IGNEOUS_SHIELD: AbilityDefinition = {
    id: "igneous-shield",
    name: "Escudo Ígneo",
    category: "tactical",
    range: 0,
    concentrationGain: 10,
    description: "Cria uma barreira flamejante que absorve dano recebido.",
    shieldAbsorption: 25,
};
