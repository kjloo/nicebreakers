import logger from './logger';

import { GameState } from './enums';
import { GameController } from './gameController';
import { Game, Player } from './structs';
import { updateState, revealAnswer, updatePlayer, updatePlayers, sendError } from './emitter';
import { Server, Socket } from 'socket.io';
import { getByIndex } from './filters';

const MAXIMUM: number = 5;

export class TopFiveController extends GameController {

    categoriesHistory: Set<string>;
    categories: Map<string, string>;
    categoriesQueue: Array<string>;
    lists: Map<string, Array<string>>;
    turnIndex: number;

    public constructor(game: Game) {
        super(game);
        // ready flag set by default
        this.ready = true;
        this.categoriesHistory = new Set<string>();
        this.categories = new Map<string, string>();
        this.categoriesQueue = [];
        this.lists = new Map<string, Array<string>>();
        this.turnIndex = game.players.size;
    }

    private sendState(io: Server, game: Game) {
        // Update sockets
        updatePlayers(io, game);
    }

    /**
     * Execute logic to proceed to next turn in the game.
     * @param io Server connection
     * @param socket SocketIO connected to client
     * @param game current game context
     */
    private nextTurn(io: Server, socket: Socket, game: Game) {
        // Clear lists
        this.lists.clear();
        // Set players active
        game.players.forEach((player: Player) => {
            player.idle = false;
        });
        // Check if there are categories left in the round
        if (this.categoriesQueue.length === 0) {
            // Current round is over. Start a new round.
            this.categories.clear();
            updateState(io, game, GameState.ENTRY);
        } else {
            updateState(io, game, GameState.HINT, { player: this.setPlayerTurn(io, game) });
        }
        this.sendState(io, game);
    }

    /**
     * Create a new list of teams with updated score. This is done in place as Maps are mutable.
     * @param game current game context
     * @param selection the player selected
     * @returns array of teams
     */
    private updateScore(game: Game, selection: number): void {
        // update score
        if (selection >= game.players.size) {
            return;
        }
        const player: Player = getByIndex(game.players, selection);
        if (player === undefined) {
            logger.error("TopFiveController::updateScore player is undefined");
        }
        player.score++;
        return;
    }

    /**
     * Execute logic when an answer is received
     * @param io Server connection
     * @param socket SocketIO connected to client
     * @param game current game context
     * @param selection selection given
     */
    private handleAnswer(io: Server, socket: Socket, game: Game, selection: number): void {
        // update score
        this.updateScore(game, selection);
        // switch turns
        this.nextTurn(io, socket, game);
    }

    private markPlayerReady(io: Server, socket: Socket, game: Game, ready: boolean): void {
        const player = game.players.get(socket.id)
        player.idle = ready;
        updatePlayer(socket, player);
    }

    /**
     * Set submitted category from player
     * @param io Server connection
     * @param socket SocketIO connected to client
     * @param game current game context
     * @param content data to store
     */
    private handleCategories(io: Server, socket: Socket, game: Game, content: string): void {
        if (this.categoriesHistory.has(content)) {
            sendError(socket, content + " has already been used.");
            return;
        }
        this.categoriesHistory.add(content);
        this.categories.set(socket.id, content);
        this.markPlayerReady(io, socket, game, true);
        if (this.categories.size === game.players.size) {
            this.categoriesQueue = Array.from(this.categories.values());
            this.nextTurn(io, socket, game);
        }
    }

    /**
     * Set player turn
     * @param io Server connection
     * @param game current game context
     */
    private setPlayerTurn(io: Server, game: Game): Player {
        // Set previous player's turn to false
        const prevPlayer: Player = getByIndex(game.players, this.turnIndex);
        prevPlayer.turn = false;

        // Increment the player's turn index
        this.turnIndex++;
        if (this.turnIndex >= game.players.size) {
            this.turnIndex = 0;
        }

        // Start next player's turn
        const player: Player = getByIndex(game.players, this.turnIndex);
        player.turn = true;
        if (this.categoriesQueue.length === 0) {
            // Should never happen
            return player;
        }

        // Select a random category
        const random: number = Math.random() * this.categoriesQueue.length;
        const category: string = this.categoriesQueue.splice(random, 1)[0];
        game.question = { category: category };
        this.sendState(io, game);
        revealAnswer(io, game);
        return player;
    }

    /**
     * Set submitted lists from player
     * @param s SocketIO connected to client
     * @param game current game context
     * @param list list answers to store
     */
    private handleLists(io: Server, socket: Socket, game: Game, list: Array<string>): void {
        interface indexedList {
            index: number;
            data: string[];
            checked: boolean;
        }
        if (list.length !== MAXIMUM) {
            return;
        }
        this.lists.set(socket.id, list);
        this.markPlayerReady(io, socket, game, true);
        if (this.lists.size === (game.players.size - 1)) {
            const indexedLists: Array<indexedList> = [];
            this.lists.forEach((list: string[], playerKey: string) => {
                const index = Array.from(game.players.keys()).indexOf(playerKey);
                const indexedList: indexedList = { index: index, data: list, checked: false };
                indexedLists.push(indexedList);
            });
            // const lists = Array.from(this.lists.entries(), (item: [string, string[]]) => {
            //     return { checked: false, data: item[1] }
            // });
            // Because of javascript handles Map, this list of lists is a tuple where the first index is the key
            updateState(io, game, GameState.GUESS, {
                lists: indexedLists
            });
        }
    }

    /**
     * Responsible for handling transition to next game state
     * @param s SocketIO server object connected to client
     * @param game Game context object
     * @param state The current game state
     * @param args Additional arguments
     */
    public override gameStateMachine(io: Server, socket: Socket, game: Game, state: GameState, args: any = {}): void {
        switch (state) {
            case GameState.SETUP:
                this.nextTurn(io, socket, game);
                break;
            case GameState.ENTRY:
                const content: string = args.category;
                if (content === null) {
                    logger.error("topFiveController::Invalid data received");
                    break;
                }
                this.handleCategories(io, socket, game, content);
                break;
            case GameState.HINT:
                const list: Array<string> = args.list;
                if (list === null || list.length !== MAXIMUM) {
                    logger.error("TopFiveController::Invalid list data");
                    break;
                }
                this.handleLists(io, socket, game, list);
                break;
            case GameState.GUESS:
                const selection: number = parseInt(args.selection);
                if (selection === null) {
                    logger.error("TopFiveController::Invalid selection");
                    break;
                }
                this.handleAnswer(io, socket, game, selection);
                break;
            case GameState.END:
                this.endGame(io, game);
                break;
        }
    }
};