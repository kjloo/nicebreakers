import logger from './logger';

import { GameState } from './enums';
import { GameController } from './gameController';
import { Game, Player, Selection } from './structs';
import { updateState, revealAnswer, updatePlayers, sendError } from './emitter';
import { Server, Socket } from 'socket.io';
import { getRandom } from './filters';

export class EqualMatchController extends GameController {

    charactersHistory: Set<string>;
    charactersQueue: Array<string>;
    contestQueue: Array<string>;
    opponent: string;
    answers: Map<string, number>;
    playersQueue: Array<string>;

    public constructor(game: Game) {
        super(game);
        // ready flag set by default
        this.ready = true;
        this.charactersHistory = new Set<string>();
        this.charactersQueue = [];
        this.contestQueue = [];
        this.opponent = '';
        this.answers = new Map<string, number>();
        this.playersQueue = [];
    }

    private sendState(io: Server, game: Game) {
        // Update sockets
        updatePlayers(io, game);
    }

    private newRound(game: Game): void {
        this.charactersQueue = [];
        this.contestQueue = [];
        this.opponent = '';
    }

    /**
     * Execute logic to proceed to next turn in the game.
     * @param io Server connection
     * @param socket SocketIO connected to client
     * @param game current game context
     */
    private nextTurn(io: Server, socket: Socket, game: Game) {
        // Set players active
        this.setPlayersIdle(game, false)
        // Check if there are characters left in the round
        if (this.charactersQueue.length === 0) {
            // Current round is over. Start a new round.
            this.newRound(game);
            updateState(io, game, GameState.ENTRY, { opponent: '' });
        } else {
            updateState(io, game, GameState.HINT, { player: this.setPlayerTurn(io, game), opponent: '' });
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

    /**
     * Set submitted character from player
     * @param io Server connection
     * @param socket SocketIO connected to client
     * @param game current game context
     * @param character character data to store
     * @param contest contest data to store
     */
    private handleCharacters(io: Server, socket: Socket, game: Game, character: string, contest: string): void {
        if (this.charactersHistory.has(character.toUpperCase())) {
            sendError(socket, character + " has already been used.");
            return;
        }
        const player = this.getGamePlayer(socket, game);
        this.charactersHistory.add(character.toUpperCase());

        this.charactersQueue.push(character);
        this.contestQueue.push(contest)

        this.markPlayerReady(io, socket, game, true);
        if (this.allPlayersReady(game)) {
            this.playersQueue = this.initializePlayersQueue(game);
            this.nextTurn(io, socket, game);
        }
    }

    /**
     * Set submitted opponent from player
     * @param io Server connection
     * @param socket SocketIO connected to client
     * @param game current game context
     * @param opponent data to store
     */
    private handleOpponent(io: Server, socket: Socket, game: Game, opponent: string): void {
        this.opponent = opponent;
        this.answers.set(opponent, 0);
        updateState(io, game, GameState.GUESS, { opponent: this.opponent });
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
        const character: string = getRandom(this.charactersQueue);
        const contest: string = getRandom(this.contestQueue);
        this.answers.clear();
        this.answers.set(character, 0);
        game.question = { question: contest, category: character };
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
                const character: string = args.character;
                const submittedContest: string = args.contest;
                if (character === null || submittedContest === null) {
                    logger.error("EqualMatchController::Invalid data received");
                    break;
                }
                this.handleCharacters(io, socket, game, character, submittedContest);
                break;
            case GameState.HINT:
                const opponent: string = args.opponent;
                if (opponent === null) {
                    logger.error("EqualMatchController::Invalid data received");
                    break;
                }
                this.handleOpponent(io, socket, game, opponent);
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