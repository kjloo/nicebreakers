import { GameState, PlayerType } from './enums';
import logger from './logger';
import { Player } from './structs';
const emitter = require('./emitter');

export class GameController {
    public id: string;

    public constructor(game) {
        this.id = game.id;
    }

    // Read/Write Game State
    public isGameStarted(game): boolean {
        return game.state !== GameState.SETUP;
    }

    public resetGameState(s, game): void {
        logger.info('Resetting game state');
        // Delete cached players
        game.cachedPlayers = [];
        game.teams = game.teams.map((team) => {
            return {
                ...team, score: 0, turn: false, players: team.players.map((player) => {
                    return { ...player, turn: false }
                }), playerIndex: 0
            };
        });
        game.teamIndex = 0;

        emitter.updateTeams(s, game);
        emitter.updatePlayers(s, game);
    }

    public gameStateMachine(s, game, state, args): void {

    }

    public createPlayer(id: string, name: string): Player {
        return new Player(id, PlayerType.PLAYER, name, false, -1);
    }

    protected changeTeamTurns(game) {
        // Set old team to false
        let team = this.getCurrentTeam(game);
        team.turn = false;

        // Increment
        this.incrementTeamIndex(game);
        // Set new team to true
        team = this.getCurrentTeam(game);
        team.turn = true;
    }

    protected getCurrentTeam(game) {
        return game.teams[game.teamIndex];
    }

    private incrementTeamIndex(game) {
        game.teamIndex++;
        // Check if valid
        if (game.teamIndex >= game.teams.length) {
            game.teamIndex = 0;
        }
    }
};