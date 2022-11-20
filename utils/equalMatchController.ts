import logger from './logger';

import { GameState } from './enums';
import { GameController } from './gameController';
import { Game, Player, Selection } from './structs';
import { updateState, revealAnswer, updatePlayers, sendError } from './emitter';
import { Server, Socket } from 'socket.io';

const ENTRIES_PER_ROUND = 2;

export class EqualMatchController extends GameController {

    charactersHistory: Set<string>;
    characters: Map<string, Array<string>>;
    charactersQueue: Array<string>;
    situation: string;
    answers: Map<string, number>;
    playersQueue: Array<string>;

    public constructor(game: Game) {
        super(game);
        // ready flag set by default
        this.ready = true;
        this.charactersHistory = new Set<string>();
        this.characters = new Map<string, Array<string>>();
        this.charactersQueue = [];
        this.situation = '';
        this.answers = new Map<string, number>();
        this.playersQueue = [];
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
        return game.players.get(socket.id);
    }

    private newRound(game: Game, characterMap: Map<string, Array<string>>): void {
        game.players.forEach((player: Player) => {
            characterMap.set(player.name, Array<string>());
        });
        this.situation = '';
    }

    /**
     * Execute logic to proceed to next turn in the game.
     * @param io Server connection
     * @param socket SocketIO connected to client
     * @param game current game context
     */
    private nextTurn(io: Server, socket: Socket, game: Game) {
        // Set players active
        game.players.forEach((player: Player) => {
            player.idle = false;
        });
        // Check if there are characters left in the round
        if (this.charactersQueue.length === 0) {
            // Current round is over. Start a new round.
            this.newRound(game, this.characters);
            updateState(io, game, GameState.ENTRY, { count: ENTRIES_PER_ROUND, situation: '' });
        } else {
            updateState(io, game, GameState.HINT, { player: this.setPlayerTurn(io, game), situation: '' });
        }
        this.sendState(io, game);
    }

    /**
     * Update scores of players with updated score. This is done in place as Maps are mutable.
     * @param io Server connection
     * @param game current game context
     * @param answers the answers submitted by the players
     * @returns array of teams
     */
    private updateScore(io: Server, game: Game, answers: Map<string, number>): boolean {
        // update score
        const player = this.getCurrentPlayer(game);
        const selectionCount = Array.from(answers.values());
        const doUpdate = Math.max(...selectionCount) - Math.min(...selectionCount) < 2;
        console.log("Update score for " + player.name);
        if (doUpdate) {
            player.score++;
        }
        // game.players.forEach((p: Player) => {
        //     if (p.name === player.name) {
        //         p.score++;
        //     }
        // });
        this.sendState(io, game);
        return doUpdate;
    }

    /**
     * Execute logic when an answer is received
     * @param io Server connection
     * @param socket SocketIO connected to client
     * @param game current game context
     * @param selection selection given
     */
    private handleAnswer(io: Server, socket: Socket, game: Game, selection: Selection): void {
        this.markPlayerReady(io, socket, game, true);
        this.answers.set(selection.name, this.answers.get(selection.name) + 1);
        // check to see if all answers were submitted
        if (this.allPlayersReady(game)) {
            // update score
            const success = this.updateScore(io, game, this.answers);
            // reveal selection
            updateState(io, game, GameState.REVEAL, {
                answers: Array.from(this.answers.entries()).map(row => {
                    return { "name": row[0], "value": row[1] };
                }), scored: success
            });
        }
    }

    private markPlayerReady(io: Server, socket: Socket, game: Game, ready: boolean): void {
        const player = this.getGamePlayer(socket, game);
        player.idle = ready;
        updatePlayers(io, game);
    }

    /**
     * Set submitted character from player
     * @param io Server connection
     * @param socket SocketIO connected to client
     * @param game current game context
     * @param content data to store
     */
    private handleCharacters(io: Server, socket: Socket, game: Game, content: string): void {
        if (this.charactersHistory.has(content.toUpperCase())) {
            sendError(socket, content + " has already been used.");
            return;
        }
        const player = this.getGamePlayer(socket, game);
        this.charactersHistory.add(content.toUpperCase());

        // assign to another player
        const currentList: Array<string> = this.characters.get(player.name);
        currentList.push(content);

        if (currentList.length == ENTRIES_PER_ROUND) {
            this.markPlayerReady(io, socket, game, true);
            if (this.allPlayersReady(game)) {
                this.playersQueue = this.initializePlayersQueue(game);
                this.charactersQueue = Array.from(this.characters.values()).flat();
                this.nextTurn(io, socket, game);
            }
        } else {
            updateState(io, game, GameState.ENTRY, { count: ENTRIES_PER_ROUND - currentList.length });
        }
    }

    /**
     * Set submitted situation from player
     * @param io Server connection
     * @param socket SocketIO connected to client
     * @param game current game context
     * @param situation data to store
     */
    private handleSituation(io: Server, socket: Socket, game: Game, situation: string): void {
        this.situation = situation;
        updateState(io, game, GameState.GUESS, { situation: this.situation });
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
     * Return random character from list and remove from list
     * @param characterList List of characters
     * @returns 
     */
    private getRandomCharacter(characterList: Array<string>): string {
        const randomCharacter: number = Math.floor(Math.random() * characterList.length);
        return characterList.splice(randomCharacter, 1)[0];
    }

    /**
     * Set player turn
     * @param io Server connection
     * @param game current game context
     */
    private setPlayerTurn(io: Server, game: Game): Player {
        if (this.charactersQueue.length === 0 || this.playersQueue.length === 0) {
            // Should never happen
            return null;
        }

        const playerName: string = this.getRandomPlayer(this.playersQueue);
        // Start next player's turn
        game.players.forEach((player: Player) => {
            const isTurn = player.name === playerName;
            player.turn = isTurn;
            player.idle = isTurn;
        });
        const player: Player = this.getCurrentPlayer(game);

        // Select a category based on round
        const character1: string = this.getRandomCharacter(this.charactersQueue);
        const character2: string = this.getRandomCharacter(this.charactersQueue);
        this.answers.clear();
        this.answers.set(character1, 0);
        this.answers.set(character2, 0);
        game.question = { question: character1, category: character2 };
        this.sendState(io, game);
        revealAnswer(io, game);
        return player;
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
                const content: string = args.character;
                if (content === null) {
                    logger.error("EqualMatchController::Invalid data received");
                    break;
                }
                this.handleCharacters(io, socket, game, content);
                break;
            case GameState.HINT:
                const situation: string = args.situation;
                if (situation === null) {
                    logger.error("EqualMatchController::Invalid data received");
                    break;
                }
                this.handleSituation(io, socket, game, situation);
                break;
            case GameState.GUESS:
                const selection: Selection = args.selection;
                if (selection === null) {
                    logger.error("EqualMatchController::Invalid selection");
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