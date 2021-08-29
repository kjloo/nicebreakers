import { GameState, PlayerType } from './enums';
import logger from './logger';
import { Game, Player, Team } from './structs';
import { setWinner, updatePlayers, updateState, updateTeams } from './emitter';
import { Server } from 'socket.io';

export class GameController {
    public id: string;

    public constructor(s: Server, game: Game) {
        this.id = game.id;
    }

    // Read/Write Game State
    public isGameStarted(game: Game): boolean {
        return game.state !== GameState.SETUP;
    }

    public resetGameState(s: Server, game: Game): void {
        //console.log('Resetting game state');
        // Delete cached players
        game.cachedPlayers = [];
        game.teams = game.teams.map((team: Team) => {
            return {
                ...team, score: 0, turn: false, players: team.players.map((player: Player) => {
                    return { ...player, turn: false }
                }), playerIndex: 0
            };
        });
        game.teamIndex = 0;

        updateTeams(s, game);
        updatePlayers(s, game);
    }

    public gameStateMachine(s: Server, game: Game, state: GameState, args): void { }

    public loadData(s: Server, gameID: string, data: Buffer): boolean { return true; }

    public createPlayer(id: string, name: string): Player {
        return new Player(id, PlayerType.PLAYER, name, false, -1);
    }

    protected changeTeamTurns(game: Game) {
        // Set old team to false
        let team = this.getCurrentTeam(game);
        team.turn = false;

        // Increment
        this.incrementTeamIndex(game);
        // Set new team to true
        team = this.getCurrentTeam(game);
        team.turn = true;
    }

    protected getCurrentTeam(game: Game) {
        return game.teams[game.teamIndex];
    }

    /**
     * Resets the game state and ends game.
     * @param s SocketIO connected to client
     * @param game current game context
     */
    protected endGame(s: Server, game: Game): void {
        // Reset game
        updateState(s, game, GameState.SETUP);
        // Set winner
        setWinner(s, game);
        // Reset to beginning
        this.resetGameState(s, game);
    }

    private incrementTeamIndex(game: Game) {
        game.teamIndex++;
        // Check if valid
        if (game.teamIndex >= game.teams.length) {
            game.teamIndex = 0;
        }
    }
};