import { Server, Socket } from "socket.io";
import { GameState } from "./enums";
import { Game, Player, Team } from "./structs";

const enums = require('./enums');
const filters = require('./filters');

// Socket functions
export function updatePlayer(s: Socket, player: Player) {
    console.log('Update player ' + player.name + ' on ' + s.id);
    s.emit('update player', player);
}

export function updatePlayers(io: Server, game: Game) {
    const players = filters.getPlayers(game);
    io.in(game.id).emit('update players', players);
}

export function updateTeams(io: Server, game: Game) {
    const teams = filters.getTeams(game);
    io.in(game.id).emit('update teams', teams);
}

export function addTeam(io: Server, gameID: string, team: Team) {
    // need to tell everyone changes in teams
    io.in(gameID).emit('add team', team);
}

export function deleteTeam(io: Server, gameID: string, id: number) {
    // need to tell everyone changes in teams
    io.in(gameID).emit('delete team', id);
}

export function updateChat(io: Server, team: Team) {
    // should only go to members of team
    io.in(team.id.toString()).emit('team chat', { teamID: team.id, data: team.chat });
}

export function revealAnswer(io: Server, game: Game) {
    io.in(game.id).emit('reveal answer', game.question);
}

export function updateState(io: Server, game: Game, state: GameState) {
    game.state = state;
    console.log("Game " + game.id + " State: " + game.state);
    io.in(game.id).emit('set state', state);
}

export function setReady(io: Server, gameID: string, ready: boolean): boolean {
    io.in(gameID).emit('ready', ready);
    return true;
}

export function sendError(s: Socket, message: string) {
    s.emit('exception', message);
}

export function setWinner(io: Server, game: Game) {
    // Get winner
    let winner = game.teams.reduce((pre, next) => {
        return pre.score > next.score ? pre : next;
    });
    // There might have been more than one team with the same score
    const tie = game.teams.filter((team) => team.score === winner.score);
    if (tie.length > 1) {
        winner = undefined;
    }
    io.in(game.id).emit('set winner', winner);
}