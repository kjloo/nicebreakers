import logger from './logger';

import { GameState } from './enums';
import { GameController } from './gameController';
import { Game, Player, Team, Question } from './structs';
import { updateState, revealAnswer, updateTeams, setWinner, setReady, sendError, updatePlayers } from './emitter';
import { Server, Socket } from 'socket.io';
import { getByIndex } from './filters';

const MAXIMUM: number = 5;

export class TopFiveController extends GameController {

    categories: Map<string, string>;
    categoriesQueue: Array<string>;
    lists: Map<string, Array<string>>;
    turnIndex: number;

    public constructor(game: Game) {
        super(game);
        // ready flag set by default
        this.ready = true;
        this.categories = new Map<string, string>();
        this.categoriesQueue = [];
        this.lists = new Map<string, Array<string>>();
        this.turnIndex = 0;
    }

    private sendState(s: Server, game: Game) {
        // Update sockets
        updatePlayers(s, game);
        updateTeams(s, game);
    }

    private nextRound(s: Server, game: Game) {
        this.sendState(s, game)
        // back to beginning
        revealAnswer(s, game);
        updateState(s, game, GameState.REVEAL);
    }

    /**
     * Create a new list of teams with updated score.
     * @param game current game context
     * @param delta change to the score
     * @returns array of teams
     */
    private updateScore(game: Game, delta: number): Array<Team> {
        // update score
        return game.teams.map((team: Team): Team => {
            if (team.turn) {
                return { ...team, score: team.score + delta }
            } else {
                return team;
            }
        });
    }

    /**
     * Execute logic when an answer is received
     * @param s SocketIO connected to client
     * @param game current game context
     * @param state current game state
     * @param correct whether a correct answer was provided
     */
    private handleAnswer(s: Server, game: Game, state: GameState, correct: boolean): void {
        // check if correct answer given
        if (correct) {
            // update score
            game.teams = this.updateScore(game, game.question.points);
            this.nextRound(s, game);
        } else {
            if (state === GameState.GUESS) {
                // deduct points
                game.teams = this.updateScore(game, -game.question.points);
                // switch turns
                this.changeTeamTurns(game)
                this.sendState(s, game);
                updateState(s, game, GameState.STEAL);
            } else {
                this.nextRound(s, game);
            }
        }
    }

    /**
     * Set submitted category from player
     * @param s SocketIO connected to client
     * @param game current game context
     * @param content data to store
     */
    private handleCategories(io: Server, socket: Socket, game: Game, content: string): void {
        this.categories.set(socket.id, content);
        if (this.categories.size === game.players.size) {
            this.categoriesQueue = Array.from(this.categories.values());
            updateState(io, game, GameState.HINT, { player: this.setPlayerTurn(io, game) });
        }
    }

    private setPlayerTurn(io: Server, game: Game): Player {
        if (this.turnIndex > game.players.size) {
            this.turnIndex = 0;
        }
        const player: Player = getByIndex(game.players, this.turnIndex);
        player.turn = true;
        if (this.categoriesQueue.length === 0) {
            // Should never happen
            return player;
        }
        const random: number = Math.random() * this.categoriesQueue.length;
        const category: string = this.categoriesQueue.splice(random, 1)[0];
        game.question = { category: category };
        updatePlayers(io, game);
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
        if (list.length !== MAXIMUM) {
            return;
        }
        this.lists.set(socket.id, list);
        if (this.lists.size === (game.players.size - 1)) {
            // Because of javascript handles Map, this list of lists is a tuple where the first index is the key
            updateState(io, game, GameState.GUESS, {
                lists: Array.from(this.lists.entries(), (item: [string, string[]]) => {
                    return { checked: false, data: item[1] }
                })
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
                updateState(io, game, GameState.ENTRY);
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
            case GameState.END:
                this.endGame(io, game);
                break;
        }
    }
};