import logger from './logger';
import { GameState } from './enums';
import { getRandom } from './filters';
import { GameController } from './gameController';
import { Game } from './structs';
import { revealAnswer, updatePlayers, updatePlayerState, updateState } from './emitter';
import { Server, Socket } from 'socket.io';

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

    private newRound(game: Game): void {
        this.setPlayersIdle(game, false);
        this.confessionMap.clear();
        this.confessionQueue = [];
        this.playerSelections.clear();
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
        const players = Array<indexedList>();
        game.players.forEach(
            (player, key) => {
                const indexedList: indexedList = { id: key, name: player.name };
                players.push(indexedList);
            });

        if (this.confessionQueue.length === 0) {
            // No more confessions go to final
            interface confessionMap {
                confession: string;
                selection: string;
            }
            game.players.forEach(player => {
                const guesses = this.playerSelections.get(player.id);
                const confessionList = Array<confessionMap>();
                guesses.forEach((selection, confession) => {
                    // const name = game.players.get(selection).name;
                    const confessionMap: confessionMap = { confession: confession, selection: selection };
                    confessionList.push(confessionMap);
                });
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
        this.newRound(game);
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
  * @param selections finalized map of selections
  */
    private handleFinalSelection(io: Server, socket: Socket, game: Game, selections: Map<string, string>): void {
        const player = this.getGamePlayer(socket, game);
        this.playerSelections.set(player.id, selections);
        console.log(selections);

        this.markPlayerReady(io, socket, game, true);
        if (this.allPlayersReady(game)) {
            this.endRound(io, socket, game);
        }
    }



    public override gameStateMachine(io: Server, socket: Socket, game: Game, state: GameState, args: any = {}): void {
        switch (state) {
            case GameState.SETUP:
                this.newRound(game);
                updateState(io, game, GameState.ENTRY);
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
                const finalSelection: Map<string, string> = args.selections;
                if (finalSelection === null) {
                    logger.error("HotTakeController::Invalid selection");
                    break;
                }
                this.handleFinalSelection(io, socket, game, finalSelection);
                break;
            case GameState.REVEAL:
                this.nextTurn(io, socket, game);
                break;
            case GameState.END:
                this.endGame(io, game);
                break;
        }
    }
};