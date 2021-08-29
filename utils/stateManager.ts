import { GameType } from './enums';
import { GameController } from './gameController';
import { MovieController } from './movieController';
import { TriviaController } from './triviaController';
import { getPlayers } from './filters';
import { Game } from './structs';
import { Server } from 'socket.io';

// const assets
export let globalGames: Map<string, Game> = new Map();

// Garbage collection
export function garbageCollection(games): void {
    // remove any inactive game ids
    games.forEach((game, key, map) => {
        if (getPlayers(game).length === 0) {
            map.delete(key);
            console.log("Removed inactive game: " + key);
        }
    });
}

// Factory
export function gameControllerFactory(io: Server, game: Game): GameController {
    if (game.type == GameType.MOVIE) {
        return new MovieController(io, game);
    } else if (game.type == GameType.TRIVIA) {
        return new TriviaController(io, game);
    }
    return null;
}