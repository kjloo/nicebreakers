import { GameController } from './gameController';
import { MovieController } from './movieController';
const filters = require('./filters');

// const assets
export let globalGames = new Map();

// Garbage collection
export function garbageCollection(games): void {
    // remove any inactive game ids
    games.forEach((game, key, map) => {
        if (filters.getPlayers(game).length === 0) {
            map.delete(key);
            console.log("Removed inactive game: " + key);
        }
    });
}

// Factory
export function gameControllerFactory(game): GameController {
    return new MovieController(game);
}