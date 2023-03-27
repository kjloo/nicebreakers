import logger from './logger';
import { GameState } from './enums';
import { getRandom } from './filters';
import { GameController } from './gameController';
import { Game } from './structs';
import { revealAnswer, updatePlayers, updatePlayerState, updateState } from './emitter';
import { Server, Socket } from 'socket.io';

interface confessionSelection {
    confession: string;
    selection: string;
}

export class HotTakeController extends GameController {

    confessionMap: Map<string, string>;
    confessionQueue: Array<string>;
    currentConfession: string;
    playerSelections: Map<string, Map<string, string>>;

    public constructor(game: Game) {
        super(game);
        // ready flag set by default
        this.ready = true;
        this.confessionMap = new Map<string, string>();
        this.confessionQueue = new Array<string>();
        this.playerSelections = new Map<string, Map<string, string>>();
    }

    private sendState(io: Server, game: Game) {
        // Update sockets
        updatePlayers(io, game);
    }

    private newRound(io: Server, game: Game): void {
        this.setPlayersIdle(game, false);
        this.confessionMap.clear();
        this.confessionQueue = [];
        this.playerSelections.clear();
        updateState(io, game, GameState.ENTRY);
        this.sendState(io, game);
    }

    /**
     * Execute logic to proceed to next turn in the game.
     * @param io Server connection
     * @param socket SocketIO connected to client
     * @param game current game context
     */
    private nextTurn(io: Server, socket: Socket, game: Game) {
        // Set players active
        this.setPlayersIdle(game, false);
        // Check if there are characters left in the round

        interface indexedList {
            id: string;
            name: string;
        }
        const players: Array<indexedList> = Array.from(game.players, (player) => {
            return { id: player[0], name: player[1].name }
        });

        if (this.confessionQueue.length === 0) {
            // No more confessions go to final
            game.players.forEach(player => {
                const guesses = this.playerSelections.get(player.id);
                const confessionList: Array<confessionSelection> = Array.from(guesses, (guess) => {
                    return { confession: guess[0], selection: guess[1] };
                })
                const socket = io.sockets.sockets.get(player.id);
                updatePlayerState(socket, game, GameState.GUESS, { answers: confessionList, players: players });
            });
        } else {
            this.currentConfession = getRandom(this.confessionQueue);
            game.question = { question: this.currentConfession }
            revealAnswer(io, game);
            updateState(io, game, GameState.HINT, { players: players });
        }
        this.sendState(io, game);
    }

    /**
     * Update score and start next round
     * @param io Server connection
     * @param socket SocketIO connected to client
     * @param game current game context
     */
    private endRound(io: Server, socket: Socket, game: Game) {
        this.newRound(io, game);
    }

    /**
     * Set confessions
     * @param io Server connection
     * @param socket SocketIO connected to client
     * @param game current game context
     * @param confession confession data to store
     */
    private handleConfessions(io: Server, socket: Socket, game: Game, confession: string): void {
        const player = this.getGamePlayer(socket, game);
        this.confessionMap.set(player.id, confession);
        // Initialize selection map
        this.playerSelections.set(player.id, new Map<string, string>);

        this.markPlayerReady(io, socket, game, true);
        if (this.allPlayersReady(game)) {
            this.confessionQueue = Array.from(this.confessionMap.values());
            this.nextTurn(io, socket, game);
        }
    }

    /**
     * Set player selection
     * @param io Server connection
     * @param socket SocketIO connected to client
     * @param game current game context
     * @param selection selection data to store
     */
    private handleSelection(io: Server, socket: Socket, game: Game, selection: string): void {
        const player = this.getGamePlayer(socket, game);
        this.playerSelections.get(player.id).set(this.currentConfession, selection);

        this.markPlayerReady(io, socket, game, true);
        if (this.allPlayersReady(game)) {
            this.nextTurn(io, socket, game);
        }
    }

    /**
  * Set player selection
  * @param io Server connection
  * @param socket SocketIO connected to client
  * @param game current game context
  * @param finalAnswers finalized map of selections
  */
    private handleFinalSelection(io: Server, socket: Socket, game: Game, finalAnswers: Array<confessionSelection>): void {
        const player = this.getGamePlayer(socket, game);
        this.playerSelections.set(player.id, new Map<string, string>(finalAnswers.map(answer => [answer.confession, answer.selection])));

        this.markPlayerReady(io, socket, game, true);
        if (this.allPlayersReady(game)) {
            interface confessionMap {
                confession: string;
                name: string;
            }
            // Calculate score and update players
            game.players.forEach(player => {
                const answerMap = this.playerSelections.get(player.id);
                answerMap.forEach((playerId, confession) => {
                    // Get actual answers
                    const expected = this.confessionMap.get(playerId);
                    if (confession === expected) {
                        player.score++;
                    }
                });
            });
            const confessionList: Array<confessionMap> = Array.from(this.confessionMap, (confession) => {
                const name = game.players.get(confession[0]).name;
                return { confession: confession[1], name: name };
            });
            updateState(io, game, GameState.REVEAL, { results: confessionList });
            this.sendState(io, game);
        }
    }



    public override gameStateMachine(io: Server, socket: Socket, game: Game, state: GameState, args: any = {}): void {
        switch (state) {
            case GameState.SETUP:
                this.newRound(io, game);
                break;
            case GameState.ENTRY:
                const confession: string = args.confession;
                if (confession === null) {
                    logger.error("HotTakeController::Invalid data received");
                    break;
                }
                this.handleConfessions(io, socket, game, confession);
                break;
            case GameState.HINT:
                const selection: string = args.selection;
                if (selection === null) {
                    logger.error("HotTakeController::Invalid data received");
                    break;
                }
                this.handleSelection(io, socket, game, selection);
                break;
            case GameState.GUESS:
                const finalAnswers: Array<confessionSelection> = args.answers;
                if (finalAnswers === null) {
                    logger.error("HotTakeController::Invalid selection");
                    break;
                }
                this.handleFinalSelection(io, socket, game, finalAnswers);
                break;
            case GameState.REVEAL:
                this.endRound(io, socket, game);
                break;
            case GameState.END:
                this.endGame(io, game);
                break;
        }
    }
};