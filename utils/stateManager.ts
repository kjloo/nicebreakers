import { GameType } from './enums';
import { GameController } from './gameController';
import { MovieController } from './movieController';
import { TriviaController } from './triviaController';
import { TopFiveController } from './topFiveController';
import { getPlayers } from './filters';
import { Game } from './structs';
import { EqualMatchController } from './equalMatchController';
import { HotTakeController } from './hotTakeController';

// const assets
export let globalGames: Map<string, Game> = new Map();

// Garbage collection
export function garbageCollection(games: Map<string, Game>): void {
    // remove any inactive game ids
    games.forEach((game: Game, key: string, map: Map<string, Game>) => {
        if (getPlayers(game).length === 0) {
            map.delete(key);
            console.log("Removed inactive game: " + key);
        }
    });
}

// Factory
export function gameControllerFactory(game: Game): GameController {
    if (game.type == GameType.MOVIE) {
        return new MovieController(game);
    } else if (game.type == GameType.TRIVIA) {
        return new TriviaController(game);
    } else if (game.type === GameType.TOPFIVE) {
        return new TopFiveController(game);
    } else if (game.type === GameType.EQUALMATCH) {
        return new EqualMatchController(game);
    } else if (game.type === GameType.HOTTAKE) {
        return new HotTakeController(game);
    }
    return null;
}