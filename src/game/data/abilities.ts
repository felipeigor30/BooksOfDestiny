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

    concentrationCost?: number;
    areaRadius?: number;
    burningGroundDamage?: number;
    burningGroundDuration?: number;

    channelTurns?: number;
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

export const IGNEOUS_EXPLOSION: AbilityDefinition = {
    id: "igneous-explosion",
    name: "Explosão Ígnea",
    category: "concentration",
    range: 3,
    concentrationGain: 0,
    concentrationCost: 100,
    damage: 40,
    areaRadius: 1,
    burningGroundDamage: 6,
    burningGroundDuration: 2,
    description:
        "Provoca uma explosão flamejante em uma área 3x3 e incendeia o terreno.",
};

export const FLAME_INVOCATION: AbilityDefinition = {
    id: "flame-invocation",
    name: "Invocação Flamejante",
    category: "channeled",
    range: 5,
    concentrationGain: 0,
    damage: 65,
    areaRadius: 1,
    burningGroundDamage: 6,
    burningGroundDuration: 2,
    channelTurns: 2,
    description:
        "Canaliza um meteoro flamejante que atinge uma área 3x3 após algumas rodadas.",
};
