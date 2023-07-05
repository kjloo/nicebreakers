import logger from './logger';
import { GameState } from './enums';
import { getRandom } from './filters';
import { GameController } from './gameController';
import { Game, Player } from './structs';
import { revealAnswer, updatePlayers, updatePlayerState, updateState } from './emitter';
import { Server, Socket } from 'socket.io';

interface confessionSelection {
    confession: string;
    selection: string;
}

export class HotTakeController extends GameController {

    categories: Array<string>;
    categoryChoices: Array<string>;
    confessionMap: Map<string, string>;
    confessionQueue: Array<string>;
    currentConfession: string;
    playerSelections: Map<string, Map<string, string>>;
    playersQueue: Array<string>;

    public constructor(game: Game) {
        super(game);
        // ready flag set by default
        this.ready = false;
        this.categories = new Array<string>();
        this.categoryChoices = new Array<string>();
        this.confessionMap = new Map<string, string>();
        this.confessionQueue = new Array<string>();
        this.playerSelections = new Map<string, Map<string, string>>();
        this.playersQueue = new Array<string>();
    }

    /**
     * Receives JSON file from client and loads it as game context
     * @param s SocketIO connected to client
     * @param gameID Game ID to send data to
     * @param data Data receieved from client. Should be a JSON file
     * @returns success/failure
     */
    public override loadData(s: Server, gameID: string, data: Buffer): boolean {
        console.log("Load hot take categories json file");
        var rc: boolean = false;
        try {
            this.categories = JSON.parse(data.toString()).sort(() => Math.random() - 0.5);
            rc = this.setReady(s, gameID, true);
        } catch (err) {
            logger.error("Invalid JSON file: " + err);
            console.error("Invalid JSON file: " + err);
            return false;
        }
        return rc;
    }

    private sendState(io: Server, game: Game) {
        // Update sockets
        updatePlayers(io, game);
    }

    /**
     * Start next round
     * @param io Server connection
     * @param game current game context
     */
    private newRound(io: Server, game: Game): void {
        this.confessionMap.clear();
        this.confessionQueue = [];
        this.playerSelections.clear();
        this.setPlayerTurn(game);
        this.setPlayersIdle(game, false);
        this.categoryChoices = Array.from(Array(5)).map(n => getRandom(this.categories));
        revealAnswer(io, game);
        updateState(io, game, GameState.ENTRY, { categories: this.categoryChoices });
        this.sendState(io, game);
    }

    /**
     * Set a random player
     * @param game The current game context
     */
    private setPlayerTurn(game: Game): void {
        if (this.playersQueue.length === 0) {
            this.playersQueue = this.initializePlayersQueue(game);
        }
        const playerName = getRandom(this.playersQueue);
        game.players.forEach((player: Player) => {
            const isTurn = player.name === playerName;
            player.turn = isTurn;
        });
    }

    /**
     * Set the category for the round
     * @param io Server connection
     * @param game current game context
     * @param game current game context
     */
    private handleCategory(io: Server, game: Game, category: string): void {
        // put categories back into memory
        this.categoryChoices = this.categoryChoices.filter(c => c !== category);
        this.categories.push(...this.categoryChoices);
        game.question = { ...game.question, category: category };
        revealAnswer(io, game);
        updateState(io, game, GameState.HINT);
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
            return { id: player[1].name, name: player[1].name };
        });

        if (this.confessionQueue.length === 0) {
            // No more confessions go to final
            game.players.forEach(player => {
                const guesses = this.playerSelections.get(player.name);
                const confessionList: Array<confessionSelection> = Array.from(guesses, (guess) => {
                    return { confession: guess[0], selection: guess[1] };
                });
                const socket = io.sockets.sockets.get(player.id);
                updatePlayerState(socket, game, GameState.STEAL, { answers: confessionList, players: players });
            });
        } else {
            this.currentConfession = getRandom(this.confessionQueue);
            game.question = { ...game.question, question: this.currentConfession };
            revealAnswer(io, game);
            updateState(io, game, GameState.GUESS, { players: players });
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
        this.confessionMap.set(player.name, confession);
        // Initialize selection map
        this.playerSelections.set(player.name, new Map<string, string>);

        this.markPlayerReady(io, socket, game, true);
        if (this.allPlayersReady(game)) {
            this.confessionQueue = Array.from(this.confessionMap.values());
            this.nextTurn(io, socket, game);
        }
    }

    /**
     * Set player selection for a confession
     * @param io Server connection
     * @param socket SocketIO connected to client
     * @param game current game context
     * @param selection selection data to store
     */
    private handleSelection(io: Server, socket: Socket, game: Game, selection: string): void {
        const player = this.getGamePlayer(socket, game);
        if (!this.playerSelections.has(player.name)) {
            this.playerSelections.set(player.name, new Map<string, string>());
        }
        this.playerSelections.get(player.name).set(this.currentConfession, selection);

        this.markPlayerReady(io, socket, game, true);
        if (this.allPlayersReady(game)) {
            this.nextTurn(io, socket, game);
        }
    }

    /**
     * Set player's final selections
     * @param io Server connection
     * @param socket SocketIO connected to client
     * @param game current game context
     * @param finalAnswers finalized map of selections
     */
    private handleFinalSelection(io: Server, socket: Socket, game: Game, finalAnswers: Array<confessionSelection>): void {
        const player = this.getGamePlayer(socket, game);
        this.playerSelections.set(player.name, new Map<string, string>(finalAnswers.map(answer => [answer.confession, answer.selection])));

        this.markPlayerReady(io, socket, game, true);
        if (this.allPlayersReady(game)) {
            interface confessionMap {
                confession: string;
                name: string;
            }
            // Calculate score and update players
            game.players.forEach(player => {
                const answerMap = this.playerSelections.get(player.name);
                answerMap.forEach((playerName, confession) => {
                    // Get actual answers
                    const expected = this.confessionMap.get(playerName);
                    if (confession === expected) {
                        player.score++;
                    }
                });
            });
            const confessionList: Array<confessionMap> = Array.from(this.confessionMap, (confession) => {
                return { confession: confession[1], name: confession[0] };
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
                const category = args.category;
                if (category === null) {
                    logger.error("HotTakeController::Invalid data received");
                    break;
                }
                this.handleCategory(io, game, category);
                break;
            case GameState.HINT:
                const confession: string = args.confession;
                if (confession === null) {
                    logger.error("HotTakeController::Invalid data received");
                    break;
                }
                this.handleConfessions(io, socket, game, confession);
                break;
            case GameState.GUESS:
                const selection: string = args.selection;
                if (selection === null) {
                    logger.error("HotTakeController::Invalid data received");
                    break;
                }
                this.handleSelection(io, socket, game, selection);
                break;
            case GameState.STEAL:
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