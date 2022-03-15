import logger from './logger';

import { GameRound, GameState } from './enums';
import { GameController } from './gameController';
import { Game, Player, Selection } from './structs';
import { updateState, revealAnswer, updatePlayers, sendError } from './emitter';
import { Server, Socket } from 'socket.io';
import { getByFilter } from './filters';

const MAXIMUM: number = 5;
const GAME_ROUNDS: Array<GameRound> = [GameRound.RANDOM, GameRound.SELF, GameRound.PLAYER];

export class TopFiveController extends GameController {

    categoriesHistory: Set<string>;
    categories: Map<string, string>;
    categoriesQueue: Array<string>;
    categoriesRemap: Map<string, string>;
    lists: Map<string, Array<string>>;
    playersQueue: Array<string>;
    gameRound: GameRound;

    public constructor(game: Game) {
        super(game);
        // ready flag set by default
        this.ready = true;
        this.categoriesHistory = new Set<string>();
        this.categories = new Map<string, string>();
        this.categoriesQueue = [];
        this.categoriesRemap = new Map<string, string>();
        this.lists = new Map<string, Array<string>>();
        this.playersQueue = [];
        this.gameRound = GameRound.SELF;
    }

    private sendState(io: Server, game: Game) {
        // Update sockets
        updatePlayers(io, game);
    }

    /**
     * Return the player associated with the socket
     * @param socket SocketIO connected to the client
     * @param game The current game context
     * @returns The player associated with the socket
     */
    private getGamePlayer(socket: Socket, game: Game) {
        return game.players.get(socket.id)
    }

    /**
     * Updates the type of round being played in the game. Cannot exceed max of enum.
     */
    private updateRound(game: Game) {
        this.gameRound++;
        if (this.gameRound >= GAME_ROUNDS.length) {
            this.gameRound = GAME_ROUNDS[0];
        }
        if (this.gameRound === GameRound.PLAYER) {
            // create reassign map
            const playersList = this.initializePlayersQueue(game);
            // need in case need to do a last minute swap
            const backupList = [...playersList];
            game.players.forEach((player: Player) => {
                let mappedPlayer: string = this.getRandomPlayer(playersList, player.name);
                // it is possible that a player was given their own name. If that is the case swap it.
                if (mappedPlayer === player.name) {
                    let swapPlayer: string = this.getRandomPlayer(backupList.filter((name: string) => name !== player.name));
                    mappedPlayer = this.categoriesRemap.get(swapPlayer);
                    this.categoriesRemap.set(swapPlayer, player.name);
                }
                this.categoriesRemap.set(player.name, mappedPlayer);
            });
            console.log(this.categoriesRemap);
        }
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
            this.categoriesRemap.clear();
            this.updateRound(game);
            const remapObject = {}
            this.categoriesRemap.forEach((value: string, key: string) => {
                remapObject[key] = value;
            });
            updateState(io, game, GameState.ENTRY, { round: this.gameRound, remap: remapObject });
        } else {
            updateState(io, game, GameState.HINT, { player: this.setPlayerTurn(io, game) });
        }
        this.sendState(io, game);
    }

    /**
     * Update scores of players with updated score. This is done in place as Maps are mutable.
     * @param io Server connection
     * @param game current game context
     * @param selection the player selected
     * @returns array of teams
     */
    private updateScore(io: Server, game: Game, selection: Selection): void {
        // update score
        console.log("Update score for " + selection.name);
        game.players.forEach((player: Player) => {
            if (player.name === selection.name) {
                player.score++;
            }
        });
        this.sendState(io, game);
    }

    /**
     * Execute logic when an answer is received
     * @param io Server connection
     * @param socket SocketIO connected to client
     * @param game current game context
     * @param selection selection given
     */
    private handleAnswer(io: Server, socket: Socket, game: Game, selection: Selection): void {
        // update score
        this.updateScore(io, game, selection);
        // reveal selection
        updateState(io, game, GameState.REVEAL, { selection: selection });
    }

    private markPlayerReady(io: Server, socket: Socket, game: Game, ready: boolean): void {
        const player = this.getGamePlayer(socket, game);
        player.idle = ready;
        updatePlayers(io, game);
    }

    /**
     * Set submitted category from player
     * @param io Server connection
     * @param socket SocketIO connected to client
     * @param game current game context
     * @param content data to store
     */
    private handleCategories(io: Server, socket: Socket, game: Game, content: string): void {
        if (this.categoriesHistory.has(content.toUpperCase())) {
            sendError(socket, content + " has already been used.");
            return;
        }
        const player = this.getGamePlayer(socket, game);
        this.categoriesHistory.add(content.toUpperCase());

        if (this.gameRound === GameRound.PLAYER) {
            // assign to another player
            this.categories.set(this.categoriesRemap.get(player.name), content);
        } else {
            this.categories.set(player.name, content);
        }
        this.markPlayerReady(io, socket, game, true);
        if (this.categories.size === game.players.size) {
            this.playersQueue = this.initializePlayersQueue(game);
            this.categoriesQueue = Array.from(this.categories.values());
            this.nextTurn(io, socket, game);
        }
    }

    private initializePlayersQueue(game: Game): Array<string> {
        return Array.from(game.players.values()).map((player: Player) => player.name);
    }

    private getRandomPlayer(playerList: Array<string>, playerName?: string): string {
        let randomPlayer: number = 0;
        let done: boolean = false;
        while (!done) {
            randomPlayer = Math.floor(Math.random() * playerList.length);
            if (playerName === undefined || playerList.length === 1) {
                break;
            }
            done = playerList[randomPlayer] !== playerName;
        }
        return playerList.splice(randomPlayer, 1)[0];
    }

    /**
     * Set player turn
     * @param io Server connection
     * @param game current game context
     */
    private setPlayerTurn(io: Server, game: Game): Player {
        if (this.categoriesQueue.length === 0 || this.playersQueue.length === 0) {
            // Should never happen
            return null;
        }

        const playerName: string = this.getRandomPlayer(this.playersQueue);
        // Start next player's turn
        game.players.forEach((player: Player) => {
            const isTurn = player.name === playerName
            player.turn = isTurn;
            player.idle = isTurn;
        });
        const player: Player = getByFilter(game.players, (player: Player) => player.turn);

        // Select a category based on round
        let category: string = "";
        if (this.gameRound === GameRound.RANDOM) {
            console.log("Random Round");
            const randomCategory: number = Math.random() * this.categoriesQueue.length;
            category = this.categoriesQueue.splice(randomCategory, 1)[0];
        } else if (this.gameRound === GameRound.SELF) {
            console.log("Self Round");
            category = this.categories.get(playerName);
            this.categoriesQueue = this.categoriesQueue.filter((cat: string) => cat !== category);
        } else {
            console.log("Player Round");
            category = this.categories.get(playerName);
            this.categoriesQueue = this.categoriesQueue.filter((cat: string) => cat !== category);
        }
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
            key: string;
            data: string[];
            checked: boolean;
        }
        if (list.length !== MAXIMUM) {
            return;
        }
        const player = this.getGamePlayer(socket, game);
        this.lists.set(player.name, list);
        this.markPlayerReady(io, socket, game, true);
        if (this.lists.size === (game.players.size - 1)) {
            const indexedLists: Array<indexedList> = [];
            this.lists.forEach((list: string[], playerKey: string) => {
                const indexedList: indexedList = { key: playerKey, data: list, checked: false };
                indexedLists.push(indexedList);
            });
            // Because of javascript handles Map, this list of lists is a tuple where the first index is the key
            updateState(io, game, GameState.GUESS, {
                lists: indexedLists.sort(() => Math.random() - 0.5)
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
                const selection: Selection = args.selection;
                if (selection === null) {
                    logger.error("TopFiveController::Invalid selection");
                    break;
                }
                this.handleAnswer(io, socket, game, selection);
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