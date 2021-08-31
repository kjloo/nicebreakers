import logger from './logger';

import { GameState } from './enums';
import { GameController } from './gameController';
import { Card, Game, Player, Question, Team } from './structs';
import { updateState, revealAnswer, updateTeams, setWinner, setReady, sendError, updatePlayers } from './emitter';
import { Server } from 'socket.io';

export class TriviaController extends GameController {

    questions: Array<Card>
    category: Array<Question>

    public constructor(s: Server, game: Game) {
        super(s, game);
        this.questions = []
        this.category = []
    }

    private getNextQuestion(): Question {
        // Check if there is a question left in the category
        if (this.category.length === 0) {
            // Load the next category
            if (this.questions.length === 0) {
                // No more questions left
                return undefined;
            }
            // store category
            const questions = this.questions.pop();
            this.category = questions.questions.reverse().map((question: Question): Question => {
                return { ...question, category: questions.category }
            });
        }
        return this.category.pop()
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
     * Set game context based on which team buzzes in. 
     * @param s SocketIO connected to client
     * @param game current game context
     * @param player player object that is current
     */
    private buzzIn(s: Server, game: Game, player: Player): void {
        // Prevent race condition. Make sure only 1 team is set
        if (game.teams.some((team: Team) => team.turn)) {
            return;
        }
        // Set team turn
        game.teams = game.teams.map((team: Team) => {
            if (team.id !== player.teamID) {
                return team;
            }
            game.teamIndex = game.teams.indexOf(team);
            // Set player turn
            team.players = team.players.map((p: Player) => {
                if (p.id !== player.id) {
                    return player;
                }
                return { ...player, turn: true };
            });
            return { ...team, turn: true };
        });
        this.sendState(s, game)
    }

    /**
     * Set game state for each round.
     * @param s SocketIO connected to client
     * @param game current game context
     */
    private entryState(s: Server, game: Game): void {
        // Clear turns
        game.teams = game.teams.map((team: Team) => {
            team.players = team.players.map((player: Player) => {
                return { ...player, turn: false };
            })
            return { ...team, turn: false };
        });
        this.sendState(s, game)
        // Update question
        const question = this.getNextQuestion();
        // If question is null, game is over
        if (question === undefined) {
            this.endGame(s, game);
        } else {
            game.question = question;
            revealAnswer(s, game);
            updateState(s, game, GameState.ENTRY);
        }
    }

    /**
     * Responsible for handling transition to next game state
     * @param s SocketIO server object connected to client
     * @param game Game context object
     * @param state The current game state
     * @param args Additional arguments
     */
    public override gameStateMachine(s: Server, game: Game, state: GameState, args): void {
        switch (state) {
            case GameState.SETUP:
                this.entryState(s, game);
                break;
            case GameState.ENTRY:
                updateState(s, game, GameState.HINT);
                break;
            case GameState.HINT:
                const player: Player = args.player;
                // Skip if teamID is -1
                if (player === undefined) {
                    updateState(s, game, GameState.REVEAL);
                } else {
                    this.buzzIn(s, game, player);
                    updateState(s, game, GameState.GUESS);
                }
                break;
            case GameState.STEAL:
            case GameState.GUESS:
                this.handleAnswer(s, game, state, args.correct)
                break;
            case GameState.REVEAL:
                this.entryState(s, game);
                break;
            case GameState.END:
                this.endGame(s, game);
                break;
        }
    }

    /**
     * Receives JSON file from client and loads it as game context
     * @param s SocketIO connected to client
     * @param gameID Game ID to send data to
     * @param data Data receieved from client. Should be a JSON file
     * @returns success/failure
     */
    public override loadData(s: Server, gameID: string, data: Buffer): boolean {
        try {
            this.questions = JSON.parse(data.toString()).sort(() => Math.random() - 0.5);
            setReady(s, gameID, true)
        } catch (err) {
            logger.error("Invalid JSON file: " + err)
            return false;
        }
        return true;
    }
};