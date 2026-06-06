import { AUTO, Game, Scale } from "phaser";

import { Boot } from "./scenes/Boot";
import { Preloader } from "./scenes/Preloader";
import { MainMenu } from "./scenes/MainMenu";
import { Game as MainGame } from "./scenes/Game";
import { GameOver } from "./scenes/GameOver";
import { BattleScene } from "./scenes/BattleScene";

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    parent: "game-container",
    backgroundColor: "#09070b",

    pixelArt: true,
    roundPixels: true,

    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
    },

    scene: [Boot, Preloader, BattleScene, MainMenu, MainGame, GameOver],
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;
