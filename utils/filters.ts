import { Game, Player, Team } from "./structs";

export function getByID(list: Array<any>, id: any) {
    if (!list || !(list instanceof Array)) {
        return undefined;
    }
    return list.find((item) => item.id === id);
}

export function getByIndex(map: Map<any, any>, index: number) {
    return map.get((Array.from(map.keys())[index]));
}

export function findByFilter(list: Array<any>, filter) {
    if (!list || !(list instanceof Array)) {
        return undefined;
    }
    return list.find(filter);
}

export function getByTeamID(list: Array<any>, teamID: number) {
    if (!list || !(list instanceof Array)) {
        return undefined;
    }
    return list.filter((item) => item.teamID === teamID);
}

// Get Player
export function getPlayer(game: Game, id: string): Player {
    const players = getPlayers(game);
    const player = getByID(players, id);
    return player;
}
// Get Players
export function getPlayers(game: Game): Array<Player> {
    let players: Array<Player> = [];
    if (game !== undefined) {
        players = players.concat(Array.from(game.players.values()));
        // iterate through teams in game
        if (game.teams.length !== 0) {
            players = players.concat(game.teams.reduce((pre, next) => {
                return pre.concat(next.players);
            }, []));
        }
    } else {
        console.log("Game not defined!");
    }
    return players;
}

export function getTeams(game: Game): Array<Team> {
    if (game === undefined) {
        return undefined;
    }
    return game.teams;
}