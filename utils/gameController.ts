import { GameState, PlayerType } from './enums';
import logger from './logger';
import { Game, Player, Team } from './structs';
import { setReady, setWinner, updatePlayers, updateState, updateTeams } from './emitter';
import { Server, Socket } from 'socket.io';

export class GameController {
    public id: string;
    public ready: boolean;

    public constructor(game: Game) {
        this.id = game.id;
        this.ready = false;
    }

    // Read/Write Game State
    public isGameStarted(game: Game): boolean {
        return game.state !== GameState.SETUP;
    }

    public resetGameState(s: Server, game: Game): void {
        logger.info('Resetting game state');
        // Delete cached players
        game.cachedPlayers = [];
        // Reset scores
        game.teams = game.teams.map((team: Team) => {
            return {
                ...team, score: 0, turn: false, players: team.players.map((player: Player) => {
                    return { ...player, turn: false }
                }), playerIndex: 0
            };
        });
        game.teamIndex = 0;
        game.players.forEach((player: Player) => player.score = 0);

        updateTeams(s, game);
        updatePlayers(s, game);
    }

    public gameStateMachine(io: Server, socket: Socket, game: Game, state: GameState, args): void { }

    public loadData(io: Server, gameID: string, data: Buffer): boolean { return true; }

    public createPlayer(id: string, name: string): Player {
        return new Player(id, PlayerType.PLAYER, name);
    }

    protected setReady(s: Server, gameID: string, ready: boolean): boolean {
        this.ready = ready;
        return setReady(s, gameID, ready);
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
     * @param io SocketIO connected to client
     * @param game current game context
     */
    protected endGame(io: Server, game: Game): void {
        // Reset game
        updateState(io, game, GameState.SETUP);
        // Set winner
        setWinner(io, game);
        // Reset to beginning
        this.resetGameState(io, game);
    }

    private incrementTeamIndex(game: Game) {
        game.teamIndex++;
        // Check if valid
        if (game.teamIndex >= game.teams.length) {
            game.teamIndex = 0;
        }
    }
};