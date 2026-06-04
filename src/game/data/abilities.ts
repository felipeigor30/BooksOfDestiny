export interface AbilityDefinition {
    id: string;
    name: string;
    damage: number;
    range: number;
    concentrationGain: number;
    description: string;

    burnChance?: number;
    burnDamage?: number;
    burnDuration?: number;
}

export const FIREBALL: AbilityDefinition = {
    id: "fireball",
    name: "Bola de Fogo",
    damage: 20,
    range: 4,
    concentrationGain: 20,
    description: "Lança uma esfera flamejante contra um inimigo.",

    /**
     * Durante o desenvolvimento, utilize 1 para testar facilmente.
     * Após validar a mecânica, altere para 0.3.
     */
    burnChance: 0.1,
    burnDamage: 10,
    burnDuration: 2,
};
